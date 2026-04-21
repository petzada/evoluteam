import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  STALLED_THRESHOLD_DAYS,
  CANDIDATE_SOURCE_LABELS,
  type CandidateSource,
} from '../schema';
import type { PipelineSnapshotStage } from '../pipeline-snapshot';

type ReportStage = { id: string; name: string; position: number };

/**
 * Resolve as etapas usadas como eixo do funil/duração no relatório:
 *
 * - Filtro por uma única vaga → usa o snapshot daquela vaga, na ordem
 *   original (entry → intermediárias → hired_terminal por position).
 * - Sem filtro de vaga, ou várias selecionadas → usa o funil global
 *   atual da empresa (recruitment_stages ativas).
 *
 * Decisão consciente: no agregado não tentamos compor "super-funil"
 * com etapas legadas só-em-snapshot — isso virava buracos e conversão
 * enganosa. Candidatos em etapas arquivadas globalmente ficam fora do
 * agregado, mas reaparecem ao filtrar a vaga deles.
 */
async function resolveStagesForReport(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  companyId: string,
  jobIds: string[] | null,
): Promise<ReportStage[]> {
  if (jobIds && jobIds.length === 1) {
    const { data: job } = await supabase
      .from('job_openings')
      .select('pipeline_snapshot')
      .eq('id', jobIds[0])
      .maybeSingle();
    const snap = ((job?.pipeline_snapshot ?? []) as PipelineSnapshotStage[])
      .slice()
      .sort((a, b) => a.position - b.position);
    return snap.map((s) => ({ id: s.id, name: s.name, position: s.position }));
  }

  const { data } = await supabase
    .from('recruitment_stages')
    .select('id, name, position')
    .eq('company_id', companyId)
    .is('archived_at', null)
    .order('position', { ascending: true });
  return data ?? [];
}

export type ViewerRole = 'admin_rh' | 'director' | 'gestor';

export interface MetricsFilter {
  companyId: string;
  from: Date | null;
  to: Date | null;
  /** IDs de vagas explicitamente selecionadas no MultiSelect; null = todas visíveis. */
  jobIds?: string[] | null;
  /** IDs de hiring_managers no MultiSelect; null = todos. */
  ownerIds?: string[] | null;
  /** Busca por nome/email do candidato (substring, case-insensitive). */
  candidateQuery?: string | null;
  /** Identifica o usuário logado para aplicar escopo por role. */
  viewerRole?: ViewerRole;
  viewerEmployeeId?: string | null;
}

/**
 * Resolve a lista final de job_opening_ids permitidos pelo filtro,
 * combinando: escopo do role (gestor só vê suas vagas) + ownerIds
 * (vagas cujo hiring_manager_id esteja na lista) + jobIds (filtro
 * explícito). Retorna null quando não há restrição (admin/director
 * sem filtros específicos).
 */
export async function resolveJobIds(f: MetricsFilter): Promise<string[] | null> {
  const needsDerivation = f.viewerRole === 'gestor'
    || (f.ownerIds && f.ownerIds.length > 0);
  const explicit = f.jobIds && f.jobIds.length > 0 ? f.jobIds : null;

  if (!needsDerivation) return explicit;

  const supabase = await createServerSupabaseClient();
  let q = supabase
    .from('job_openings')
    .select('id')
    .eq('company_id', f.companyId);
  if (f.viewerRole === 'gestor' && f.viewerEmployeeId) {
    q = q.eq('hiring_manager_id', f.viewerEmployeeId);
  }
  if (f.ownerIds && f.ownerIds.length > 0) {
    q = q.in('hiring_manager_id', f.ownerIds);
  }
  const { data } = await q;
  const derived = (data ?? []).map((r) => r.id);
  if (!explicit) return derived;
  // Intersecção: apenas vagas que o user pode ver E foram explicitamente escolhidas
  const explicitSet = new Set(explicit);
  return derived.filter((id) => explicitSet.has(id));
}

/** Resolve IDs de candidatos que casam com a query de busca (null = sem filtro). */
export async function resolveCandidateIds(f: MetricsFilter): Promise<string[] | null> {
  if (!f.candidateQuery || !f.candidateQuery.trim()) return null;
  const supabase = await createServerSupabaseClient();
  const q = `%${f.candidateQuery.trim()}%`;
  const { data } = await supabase
    .from('candidates')
    .select('id')
    .eq('company_id', f.companyId)
    .or(`name.ilike.${q},email.ilike.${q}`);
  return (data ?? []).map((r) => r.id);
}

export type MetricsKpis = {
  activeCandidates: number;
  activeCandidatesJobCount: number;
  hiredInPeriod: number;
  medianTimeToHireDays: number | null;
  overdueTasks: number;
};

export async function getMetricsKpis(f: MetricsFilter): Promise<MetricsKpis> {
  const supabase = await createServerSupabaseClient();
  const jobIds = await resolveJobIds(f);
  const candidateIds = await resolveCandidateIds(f);
  // Se o filtro exigia escopo e resultou vazio, retorna zeros
  if (jobIds !== null && jobIds.length === 0) {
    return { activeCandidates: 0, activeCandidatesJobCount: 0, hiredInPeriod: 0, medianTimeToHireDays: null, overdueTasks: 0 };
  }
  if (candidateIds !== null && candidateIds.length === 0) {
    return { activeCandidates: 0, activeCandidatesJobCount: 0, hiredInPeriod: 0, medianTimeToHireDays: null, overdueTasks: 0 };
  }

  // Ativos
  let activeQ = supabase
    .from('job_applications')
    .select('job_opening_id')
    .eq('company_id', f.companyId)
    .eq('status', 'in_progress');
  if (jobIds) activeQ = activeQ.in('job_opening_id', jobIds);
  if (candidateIds) activeQ = activeQ.in('candidate_id', candidateIds);
  const { data: active } = await activeQ;
  const activeJobs = new Set((active ?? []).map((a) => a.job_opening_id));

  // Contratados no período
  let hiredQuery = supabase
    .from('job_applications')
    .select('created_at, updated_at', { count: 'exact', head: false })
    .eq('company_id', f.companyId)
    .eq('status', 'hired');
  if (jobIds) hiredQuery = hiredQuery.in('job_opening_id', jobIds);
  if (candidateIds) hiredQuery = hiredQuery.in('candidate_id', candidateIds);
  if (f.from) hiredQuery = hiredQuery.gte('updated_at', f.from.toISOString());
  if (f.to) hiredQuery = hiredQuery.lte('updated_at', f.to.toISOString());
  const { data: hired, count: hiredCount } = await hiredQuery;

  // Mediana tempo até contratação em dias (aplica sobre hired)
  let median: number | null = null;
  if (hired && hired.length > 0) {
    const days = hired.map((h) => {
      const t0 = new Date(h.created_at as string).getTime();
      const t1 = new Date(h.updated_at as string).getTime();
      return (t1 - t0) / (1000 * 60 * 60 * 24);
    }).sort((a, b) => a - b);
    const mid = Math.floor(days.length / 2);
    median = days.length % 2 === 0
      ? (days[mid - 1] + days[mid]) / 2
      : days[mid];
  }

  // Tarefas atrasadas (respeitando escopo de vagas do viewer)
  const nowISO = new Date().toISOString();
  const overdueQ = supabase
    .from('candidate_tasks')
    .select('application:job_applications(job_opening_id, candidate_id)', { count: 'exact', head: false })
    .eq('company_id', f.companyId)
    .is('deleted_at', null)
    .is('completed_at', null)
    .not('due_date', 'is', null)
    .lt('due_date', nowISO);
  const { data: overdueRows } = await overdueQ;
  let overdue = (overdueRows ?? []).length;
  if (jobIds || candidateIds) {
    const jobSet = jobIds ? new Set(jobIds) : null;
    const candSet = candidateIds ? new Set(candidateIds) : null;
    overdue = (overdueRows ?? []).filter((r) => {
      const app = r.application as unknown as { job_opening_id: string; candidate_id: string } | null;
      if (!app) return false;
      if (jobSet && !jobSet.has(app.job_opening_id)) return false;
      if (candSet && !candSet.has(app.candidate_id)) return false;
      return true;
    }).length;
  }

  return {
    activeCandidates: (active ?? []).length,
    activeCandidatesJobCount: activeJobs.size,
    hiredInPeriod: hiredCount ?? 0,
    medianTimeToHireDays: median !== null ? Math.round(median) : null,
    overdueTasks: overdue,
  };
}

export type FunnelStageRow = {
  stageId: string;
  stageName: string;
  position: number;
  count: number;
  conversionFromFirst: number | null; // %
  conversionFromPrev: number | null;  // % em relação à etapa anterior
  advancedCount: number;              // passou desta etapa para outra posterior
  rejectedCount: number;              // saiu como rejected a partir desta etapa
  withdrawnCount: number;             // saiu como withdrawn a partir desta etapa
  frozenCount: number;                // saiu como frozen a partir desta etapa
  rejectedOrWithdrawnCount: number;   // soma (mantido por compatibilidade)
  rejectionRate: number | null;       // % rejected sobre count (null se count=0)
  withdrawalRate: number | null;      // % withdrawn sobre count (null se count=0)
  medianDaysInStage: number | null;   // mediana de dias que ficaram nessa etapa
};

export async function getFunnel(f: MetricsFilter): Promise<FunnelStageRow[]> {
  const supabase = await createServerSupabaseClient();
  const jobIds = await resolveJobIds(f);
  const candidateIds = await resolveCandidateIds(f);
  if (jobIds !== null && jobIds.length === 0) return [];
  if (candidateIds !== null && candidateIds.length === 0) return [];

  const stages = await resolveStagesForReport(supabase, f.companyId, jobIds);
  if (!stages.length) return [];

  // Contagem de visitas (histórico) — quantas applications já passaram por cada etapa
  // no período.
  let histQuery = supabase
    .from('candidate_stage_history')
    .select('to_stage_id, application_id, changed_at')
    .not('to_stage_id', 'is', null);
  if (f.from) histQuery = histQuery.gte('changed_at', f.from.toISOString());
  if (f.to) histQuery = histQuery.lte('changed_at', f.to.toISOString());
  const { data: hist } = await histQuery;

  // Filtra pelo company + escopo de vaga/candidato (applications permitidas)
  let appsQ = supabase
    .from('job_applications')
    .select('id, status')
    .eq('company_id', f.companyId);
  if (jobIds) appsQ = appsQ.in('job_opening_id', jobIds);
  if (candidateIds) appsQ = appsQ.in('candidate_id', candidateIds);
  const { data: appsOfCompany } = await appsQ;
  const appSet = new Set((appsOfCompany ?? []).map((a) => a.id));
  const appStatus = new Map<string, string>();
  for (const a of appsOfCompany ?? []) appStatus.set(a.id, a.status as string);

  const perStage = new Map<string, Set<string>>();
  for (const h of hist ?? []) {
    if (!h.to_stage_id || !h.application_id) continue;
    if (!appSet.has(h.application_id)) continue;
    const set = perStage.get(h.to_stage_id) ?? new Set<string>();
    set.add(h.application_id);
    perStage.set(h.to_stage_id, set);
  }

  // Cria mapa stageId -> position pra comparar "avanços"
  const stagePosition = new Map<string, number>();
  stages.forEach((s) => stagePosition.set(s.id, s.position));

  // Sequência temporal por application para calcular duração de estadia
  const perApp = new Map<string, { stageId: string; ts: number }[]>();
  for (const h of hist ?? []) {
    if (!h.to_stage_id || !h.application_id) continue;
    if (!appSet.has(h.application_id)) continue;
    const arr = perApp.get(h.application_id) ?? [];
    arr.push({ stageId: h.to_stage_id, ts: new Date(h.changed_at as string).getTime() });
    perApp.set(h.application_id, arr);
  }
  for (const arr of perApp.values()) arr.sort((a, b) => a.ts - b.ts);

  // Pra cada etapa, calcular durações a partir dos tempos de entrada/saída
  const durationsPerStage = new Map<string, number[]>();
  for (const arr of perApp.values()) {
    for (let i = 0; i < arr.length - 1; i += 1) {
      const curr = arr[i];
      const next = arr[i + 1];
      const days = (next.ts - curr.ts) / (1000 * 60 * 60 * 24);
      const list = durationsPerStage.get(curr.stageId) ?? [];
      list.push(days);
      durationsPerStage.set(curr.stageId, list);
    }
  }

  // advanced/terminal per stage — baseado na sequência por app
  // P3 decisão B: "avançou" conta só se a ÚLTIMA etapa visitada pela application
  // tem position > esta etapa. Avanço desfeito por retorno não conta.
  const advancedPerStage = new Map<string, number>();
  const rejectedPerStage = new Map<string, number>();
  const withdrawnPerStage = new Map<string, number>();
  const frozenPerStage = new Map<string, number>();
  for (const [appId, arr] of perApp.entries()) {
    const last = arr[arr.length - 1];
    if (!last) continue;
    const lastPos = stagePosition.get(last.stageId) ?? -1;
    const visited = new Set<string>();
    for (let i = 0; i < arr.length; i += 1) {
      const { stageId } = arr[i];
      if (visited.has(stageId)) continue;
      visited.add(stageId);
      const pos = stagePosition.get(stageId) ?? -1;
      if (lastPos > pos) {
        advancedPerStage.set(stageId, (advancedPerStage.get(stageId) ?? 0) + 1);
      }
    }
    // Status terminal conta na última etapa que o app visitou (separado por tipo)
    const status = appStatus.get(appId);
    if (status === 'rejected') {
      rejectedPerStage.set(last.stageId, (rejectedPerStage.get(last.stageId) ?? 0) + 1);
    } else if (status === 'withdrawn') {
      withdrawnPerStage.set(last.stageId, (withdrawnPerStage.get(last.stageId) ?? 0) + 1);
    } else if (status === 'frozen') {
      frozenPerStage.set(last.stageId, (frozenPerStage.get(last.stageId) ?? 0) + 1);
    }
  }

  const firstCount = perStage.get(stages[0].id)?.size ?? 0;
  let prevCount = firstCount;
  return stages.map((s, i) => {
    const count = perStage.get(s.id)?.size ?? 0;
    const durations = durationsPerStage.get(s.id) ?? [];
    let median: number | null = null;
    if (durations.length > 0) {
      const sorted = [...durations].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    }
    const rejectedCount = rejectedPerStage.get(s.id) ?? 0;
    const withdrawnCount = withdrawnPerStage.get(s.id) ?? 0;
    const frozenCount = frozenPerStage.get(s.id) ?? 0;
    const row: FunnelStageRow = {
      stageId: s.id,
      stageName: s.name,
      position: s.position,
      count,
      conversionFromFirst: firstCount > 0 ? Math.round((count / firstCount) * 100) : null,
      conversionFromPrev: i === 0 ? null : prevCount > 0 ? Math.round((count / prevCount) * 100) : null,
      advancedCount: advancedPerStage.get(s.id) ?? 0,
      rejectedCount,
      withdrawnCount,
      frozenCount,
      rejectedOrWithdrawnCount: rejectedCount + withdrawnCount + frozenCount,
      rejectionRate: count > 0 ? Math.round((rejectedCount / count) * 100) : null,
      withdrawalRate: count > 0 ? Math.round((withdrawnCount / count) * 100) : null,
      medianDaysInStage: median !== null ? Math.round(median * 10) / 10 : null,
    };
    prevCount = count;
    return row;
  });
}

export type OriginBreakdown = {
  source: string;
  label: string;
  candidates: number;
  hired: number;
};

export async function getOriginsBreakdown(f: MetricsFilter): Promise<OriginBreakdown[]> {
  const supabase = await createServerSupabaseClient();
  const jobIds = await resolveJobIds(f);
  const candidateIds = await resolveCandidateIds(f);
  if (jobIds !== null && jobIds.length === 0) return [];
  if (candidateIds !== null && candidateIds.length === 0) return [];

  // Se há filtro de vaga, restringe candidatos aos que têm aplicação em vaga filtrada
  let candidateIdsFromJobs: Set<string> | null = null;
  if (jobIds) {
    const { data: apps } = await supabase
      .from('job_applications')
      .select('candidate_id')
      .eq('company_id', f.companyId)
      .in('job_opening_id', jobIds);
    candidateIdsFromJobs = new Set((apps ?? []).map((a) => a.candidate_id));
  }

  function labelFor(source: string, sourceOther: string | null): string {
    if (source === 'outro' && sourceOther) return sourceOther;
    return CANDIDATE_SOURCE_LABELS[source as CandidateSource] ?? source;
  }

  // P4 decisão C: dois recortes independentes no mesmo período.
  // Donut "Candidatos" — criados no período (+ filtros de vaga/candidato).
  let candQuery = supabase
    .from('candidates')
    .select('id, source, source_other')
    .eq('company_id', f.companyId);
  if (f.from) candQuery = candQuery.gte('created_at', f.from.toISOString());
  if (f.to) candQuery = candQuery.lte('created_at', f.to.toISOString());
  if (candidateIds) candQuery = candQuery.in('id', candidateIds);
  const { data: candsRaw } = await candQuery;
  const cands = (candsRaw ?? []).filter((c) =>
    !candidateIdsFromJobs || candidateIdsFromJobs.has(c.id),
  );

  // Donut "Contratados" — hired no período (qualquer created_at do candidato).
  // Source via join — não depende mais de candsAll.
  let hiredAppsQuery = supabase
    .from('job_applications')
    .select('candidate_id, updated_at, candidate:candidates(source, source_other)')
    .eq('company_id', f.companyId)
    .eq('status', 'hired');
  if (jobIds) hiredAppsQuery = hiredAppsQuery.in('job_opening_id', jobIds);
  if (candidateIds) hiredAppsQuery = hiredAppsQuery.in('candidate_id', candidateIds);
  if (f.from) hiredAppsQuery = hiredAppsQuery.gte('updated_at', f.from.toISOString());
  if (f.to) hiredAppsQuery = hiredAppsQuery.lte('updated_at', f.to.toISOString());
  const { data: hiredApps } = await hiredAppsQuery;

  const map = new Map<string, OriginBreakdown>();
  for (const c of cands) {
    const key = c.source ?? 'manual';
    const entry = map.get(key) ?? {
      source: key,
      label: labelFor(key, c.source_other ?? null),
      candidates: 0,
      hired: 0,
    };
    entry.candidates += 1;
    map.set(key, entry);
  }

  for (const h of hiredApps ?? []) {
    const cand = h.candidate as unknown as { source: string; source_other: string | null } | null;
    if (!cand) continue;
    const key = cand.source ?? 'manual';
    const entry = map.get(key) ?? {
      source: key,
      label: labelFor(key, cand.source_other ?? null),
      candidates: 0,
      hired: 0,
    };
    entry.hired += 1;
    map.set(key, entry);
  }

  return Array.from(map.values())
    .sort((a, b) => (b.candidates + b.hired) - (a.candidates + a.hired));
}

export type StageDuration = {
  stageId: string;
  stageName: string;
  position: number;
  medianDays: number | null;
  meanDays: number | null;
  minDays: number | null;
  maxDays: number | null;
  activeCount: number;       // aplicações atualmente nessa etapa com status='in_progress'
  returnCount: number;       // nº de applications que visitaram essa etapa 2+ vezes (P2)
  isBottleneck: boolean;     // mediana > STALLED_THRESHOLD_DAYS
};

export async function getStageDurations(f: MetricsFilter): Promise<StageDuration[]> {
  const supabase = await createServerSupabaseClient();
  const jobIds = await resolveJobIds(f);
  const candidateIds = await resolveCandidateIds(f);
  if (jobIds !== null && jobIds.length === 0) return [];
  if (candidateIds !== null && candidateIds.length === 0) return [];

  const stages = await resolveStagesForReport(supabase, f.companyId, jobIds);
  if (!stages.length) return [];

  // Restringe applications pelo escopo atual; traz também current_stage_id
  // + status para contabilizar activeCount por etapa.
  let appsQ = supabase
    .from('job_applications')
    .select('id, current_stage_id, status')
    .eq('company_id', f.companyId);
  if (jobIds) appsQ = appsQ.in('job_opening_id', jobIds);
  if (candidateIds) appsQ = appsQ.in('candidate_id', candidateIds);
  const { data: apps } = await appsQ;
  const appSet = new Set((apps ?? []).map((a) => a.id));

  // Contagem ativa por etapa
  const activeByStage = new Map<string, number>();
  for (const a of apps ?? []) {
    if (a.status !== 'in_progress') continue;
    activeByStage.set(a.current_stage_id, (activeByStage.get(a.current_stage_id) ?? 0) + 1);
  }

  // Só calcula de quem JÁ SAIU da etapa (duração real).
  // Precisamos calcular, por aplicação, quanto tempo ficou em cada etapa.
  // Algoritmo: para cada application, construir a sequência por (stage, tempo) e
  // calcular o delta de cada stage até a próxima entrada.
  //
  // Entradas sintéticas (pulos de etapa) ficam de fora: elas têm delta ~0 e
  // distorcem a mediana. O funil em getFunnel conta inclusive sintéticas.
  let histQuery = supabase
    .from('candidate_stage_history')
    .select('application_id, to_stage_id, changed_at')
    .eq('synthetic', false);
  if (f.from) histQuery = histQuery.gte('changed_at', f.from.toISOString());
  if (f.to) histQuery = histQuery.lte('changed_at', f.to.toISOString());
  const { data: hist } = await histQuery
    .order('changed_at', { ascending: true });

  const perApp = new Map<string, { stageId: string | null; ts: number }[]>();
  for (const h of hist ?? []) {
    if (!appSet.has(h.application_id)) continue;
    const arr = perApp.get(h.application_id) ?? [];
    arr.push({ stageId: h.to_stage_id ?? null, ts: new Date(h.changed_at as string).getTime() });
    perApp.set(h.application_id, arr);
  }

  // P2 decisão D: somar passagens por application por etapa — cada application
  // contribui com UM valor (a soma de todas as suas estadias) na distribuição
  // daquela etapa. Retornos são contabilizados separadamente em returnsPerStage.
  const durationsPerStage = new Map<string, number[]>();
  const returnsPerStage = new Map<string, number>();
  for (const arr of perApp.values()) {
    const sumByStage = new Map<string, number>();
    const visitsByStage = new Map<string, number>();
    for (let i = 0; i < arr.length - 1; i += 1) {
      const curr = arr[i];
      const next = arr[i + 1];
      if (!curr.stageId) continue;
      const days = (next.ts - curr.ts) / (1000 * 60 * 60 * 24);
      sumByStage.set(curr.stageId, (sumByStage.get(curr.stageId) ?? 0) + days);
      visitsByStage.set(curr.stageId, (visitsByStage.get(curr.stageId) ?? 0) + 1);
    }
    for (const [stageId, sum] of sumByStage) {
      const list = durationsPerStage.get(stageId) ?? [];
      list.push(sum);
      durationsPerStage.set(stageId, list);
      if ((visitsByStage.get(stageId) ?? 0) >= 2) {
        returnsPerStage.set(stageId, (returnsPerStage.get(stageId) ?? 0) + 1);
      }
    }
  }

  return stages.map((s) => {
    const durations = durationsPerStage.get(s.id) ?? [];
    let median: number | null = null;
    let mean: number | null = null;
    let minV: number | null = null;
    let maxV: number | null = null;
    if (durations.length > 0) {
      const sorted = [...durations].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
      mean = sorted.reduce((acc, v) => acc + v, 0) / sorted.length;
      minV = sorted[0];
      maxV = sorted[sorted.length - 1];
    }
    const round1 = (v: number | null) => v !== null ? Math.round(v * 10) / 10 : null;
    const medianRounded = round1(median);
    return {
      stageId: s.id,
      stageName: s.name,
      position: s.position,
      medianDays: medianRounded,
      meanDays: round1(mean),
      minDays: round1(minV),
      maxDays: round1(maxV),
      activeCount: activeByStage.get(s.id) ?? 0,
      returnCount: returnsPerStage.get(s.id) ?? 0,
      isBottleneck: medianRounded !== null && medianRounded > STALLED_THRESHOLD_DAYS,
    };
  });
}

export type StalledCandidate = {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  stageName: string;
  daysStalled: number;
};

export async function getStalledCandidates(f: MetricsFilter, limit = 10): Promise<StalledCandidate[]> {
  const supabase = await createServerSupabaseClient();
  const jobIds = await resolveJobIds(f);
  const candidateIds = await resolveCandidateIds(f);
  if (jobIds !== null && jobIds.length === 0) return [];
  if (candidateIds !== null && candidateIds.length === 0) return [];

  const threshold = new Date();
  threshold.setDate(threshold.getDate() - STALLED_THRESHOLD_DAYS);
  let q = supabase
    .from('job_applications')
    .select(`
      id, candidate_id, stage_entered_at,
      candidate:candidates(id, name),
      job_opening:job_openings(title),
      current_stage:recruitment_stages!current_stage_id(name)
    `)
    .eq('company_id', f.companyId)
    .eq('status', 'in_progress')
    .lt('stage_entered_at', threshold.toISOString());
  if (jobIds) q = q.in('job_opening_id', jobIds);
  if (candidateIds) q = q.in('candidate_id', candidateIds);
  const { data } = await q
    .order('stage_entered_at', { ascending: true })
    .limit(limit);
  const now = Date.now();
  return (data ?? []).map((row) => {
    const days = Math.floor((now - new Date(row.stage_entered_at).getTime()) / (1000 * 60 * 60 * 24));
    return {
      applicationId: row.id,
      candidateId: (row.candidate as unknown as { id: string } | null)?.id ?? row.candidate_id,
      candidateName: (row.candidate as unknown as { name: string } | null)?.name ?? '—',
      jobTitle: (row.job_opening as unknown as { title: string } | null)?.title ?? '—',
      stageName: (row.current_stage as unknown as { name: string } | null)?.name ?? '—',
      daysStalled: days,
    };
  });
}

export type OverdueTask = {
  taskId: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  title: string;
  responsibleName: string;
  daysOverdue: number;
};

export async function getOverdueTasks(f: MetricsFilter, limit = 10): Promise<OverdueTask[]> {
  const supabase = await createServerSupabaseClient();
  const jobIds = await resolveJobIds(f);
  const candidateIds = await resolveCandidateIds(f);
  if (jobIds !== null && jobIds.length === 0) return [];
  if (candidateIds !== null && candidateIds.length === 0) return [];

  const now = new Date();
  const { data } = await supabase
    .from('candidate_tasks')
    .select(`
      id, application_id, title, due_date,
      responsible:employees!responsible_id(full_name),
      application:job_applications(candidate_id, job_opening_id,
        candidate:candidates(name),
        job_opening:job_openings(title))
    `)
    .eq('company_id', f.companyId)
    .is('deleted_at', null)
    .is('completed_at', null)
    .not('due_date', 'is', null)
    .lt('due_date', now.toISOString())
    .order('due_date', { ascending: true })
    .limit(limit * 3); // busca mais pra compensar possível filtragem em JS
  const jobSet = jobIds ? new Set(jobIds) : null;
  const candSet = candidateIds ? new Set(candidateIds) : null;
  const filtered = (data ?? []).filter((row) => {
    if (!jobSet && !candSet) return true;
    const app = row.application as unknown as { job_opening_id: string; candidate_id: string } | null;
    if (!app) return false;
    if (jobSet && !jobSet.has(app.job_opening_id)) return false;
    if (candSet && !candSet.has(app.candidate_id)) return false;
    return true;
  }).slice(0, limit);
  return filtered.map((row) => {
    const due = new Date((row.due_date as string) + 'T00:00:00');
    const days = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    const app = row.application as unknown as {
      candidate_id: string;
      candidate: { name: string } | null;
      job_opening: { title: string } | null;
    } | null;
    return {
      taskId: row.id,
      applicationId: row.application_id,
      candidateId: app?.candidate_id ?? '',
      candidateName: app?.candidate?.name ?? '—',
      jobTitle: app?.job_opening?.title ?? '—',
      title: row.title,
      responsibleName: (row.responsible as unknown as { full_name: string } | null)?.full_name ?? '—',
      daysOverdue: days,
    };
  });
}

// ============================================================
// Queries auxiliares para os MultiSelects do DashboardFilters
// ============================================================

export type JobOption = { id: string; title: string };
export type EmployeeOption = { id: string; name: string };

/**
 * Lista de vagas disponíveis no MultiSelect de filtro.
 * Admin/director veem todas; gestor vê apenas as suas.
 */
export async function getJobsForFilter(
  companyId: string,
  viewer: { role: ViewerRole; employeeId: string | null },
): Promise<JobOption[]> {
  const supabase = await createServerSupabaseClient();
  let q = supabase
    .from('job_openings')
    .select('id, title')
    .eq('company_id', companyId)
    .order('title', { ascending: true });
  if (viewer.role === 'gestor' && viewer.employeeId) {
    q = q.eq('hiring_manager_id', viewer.employeeId);
  }
  const { data } = await q;
  return (data ?? []).map((r) => ({ id: r.id, title: r.title }));
}

/**
 * Lista de employees que são hiring_manager de ao menos uma vaga na company.
 * Admin/director veem todos; gestor vê apenas a si mesmo (irrelevante na prática
 * porque o MultiSelect de Responsável fica oculto pra gestor — mas deixamos a
 * consulta coerente).
 */
export async function getManagersForFilter(
  companyId: string,
  viewer: { role: ViewerRole; employeeId: string | null },
): Promise<EmployeeOption[]> {
  const supabase = await createServerSupabaseClient();
  let q = supabase
    .from('job_openings')
    .select('hiring_manager_id, manager:employees!hiring_manager_id(id, full_name)')
    .eq('company_id', companyId)
    .not('hiring_manager_id', 'is', null);
  if (viewer.role === 'gestor' && viewer.employeeId) {
    q = q.eq('hiring_manager_id', viewer.employeeId);
  }
  const { data } = await q;
  const dedup = new Map<string, EmployeeOption>();
  for (const row of data ?? []) {
    const mgr = row.manager as unknown as { id: string; full_name: string } | null;
    if (!mgr) continue;
    if (!dedup.has(mgr.id)) dedup.set(mgr.id, { id: mgr.id, name: mgr.full_name });
  }
  return Array.from(dedup.values()).sort((a, b) => a.name.localeCompare(b.name));
}
