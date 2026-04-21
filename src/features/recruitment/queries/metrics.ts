import { createServerSupabaseClient } from '@/lib/supabase/server';
import { STALLED_THRESHOLD_DAYS } from '../schema';

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
};

export async function getFunnel(f: MetricsFilter): Promise<FunnelStageRow[]> {
  const supabase = await createServerSupabaseClient();
  const jobIds = await resolveJobIds(f);
  const candidateIds = await resolveCandidateIds(f);
  if (jobIds !== null && jobIds.length === 0) return [];
  if (candidateIds !== null && candidateIds.length === 0) return [];

  const { data: stages } = await supabase
    .from('recruitment_stages')
    .select('id, name, position')
    .eq('company_id', f.companyId)
    .is('archived_at', null)
    .order('position', { ascending: true });
  if (!stages?.length) return [];

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
    .select('id')
    .eq('company_id', f.companyId);
  if (jobIds) appsQ = appsQ.in('job_opening_id', jobIds);
  if (candidateIds) appsQ = appsQ.in('candidate_id', candidateIds);
  const { data: appsOfCompany } = await appsQ;
  const appSet = new Set((appsOfCompany ?? []).map((a) => a.id));

  const perStage = new Map<string, Set<string>>();
  for (const h of hist ?? []) {
    if (!h.to_stage_id || !h.application_id) continue;
    if (!appSet.has(h.application_id)) continue;
    const set = perStage.get(h.to_stage_id) ?? new Set<string>();
    set.add(h.application_id);
    perStage.set(h.to_stage_id, set);
  }

  const firstCount = perStage.get(stages[0].id)?.size ?? 0;
  return stages.map((s) => {
    const count = perStage.get(s.id)?.size ?? 0;
    return {
      stageId: s.id,
      stageName: s.name,
      position: s.position,
      count,
      conversionFromFirst: firstCount > 0 ? Math.round((count / firstCount) * 100) : null,
    };
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

  // Total de candidatos por origem (na company; período opcional em created_at)
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

  // Candidatos contratados por origem (via candidates.hired_employee_id != null + aplicação hired no período)
  let hiredAppsQuery = supabase
    .from('job_applications')
    .select('candidate_id, updated_at')
    .eq('company_id', f.companyId)
    .eq('status', 'hired');
  if (jobIds) hiredAppsQuery = hiredAppsQuery.in('job_opening_id', jobIds);
  if (candidateIds) hiredAppsQuery = hiredAppsQuery.in('candidate_id', candidateIds);
  if (f.from) hiredAppsQuery = hiredAppsQuery.gte('updated_at', f.from.toISOString());
  if (f.to) hiredAppsQuery = hiredAppsQuery.lte('updated_at', f.to.toISOString());
  const { data: hiredApps } = await hiredAppsQuery;
  const hiredIds = new Set((hiredApps ?? []).map((a) => a.candidate_id));

  // Nome da origem (label humano)
  function labelFor(source: string, sourceOther: string | null): string {
    if (source === 'outro' && sourceOther) return sourceOther;
    return source;
  }

  const map = new Map<string, OriginBreakdown>();
  for (const c of cands ?? []) {
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

  // Anexa hired aos seus source
  const { data: candsAll } = await supabase
    .from('candidates')
    .select('id, source')
    .eq('company_id', f.companyId);
  for (const c of candsAll ?? []) {
    if (!hiredIds.has(c.id)) continue;
    const key = c.source ?? 'manual';
    const entry = map.get(key);
    if (entry) entry.hired += 1;
  }

  return Array.from(map.values()).sort((a, b) => b.candidates - a.candidates);
}

export type StageDuration = {
  stageId: string;
  stageName: string;
  position: number;
  medianDays: number | null;
};

export async function getStageDurations(f: MetricsFilter): Promise<StageDuration[]> {
  const supabase = await createServerSupabaseClient();
  const jobIds = await resolveJobIds(f);
  const candidateIds = await resolveCandidateIds(f);
  if (jobIds !== null && jobIds.length === 0) return [];
  if (candidateIds !== null && candidateIds.length === 0) return [];

  const { data: stages } = await supabase
    .from('recruitment_stages')
    .select('id, name, position')
    .eq('company_id', f.companyId)
    .is('archived_at', null)
    .order('position', { ascending: true });
  if (!stages?.length) return [];

  // Restringe applications pelo escopo atual
  let appsQ = supabase
    .from('job_applications')
    .select('id')
    .eq('company_id', f.companyId);
  if (jobIds) appsQ = appsQ.in('job_opening_id', jobIds);
  if (candidateIds) appsQ = appsQ.in('candidate_id', candidateIds);
  const { data: apps } = await appsQ;
  const appSet = new Set((apps ?? []).map((a) => a.id));

  // Só calcula de quem JÁ SAIU da etapa (duração real).
  // Precisamos calcular, por aplicação, quanto tempo ficou em cada etapa.
  // Algoritmo: para cada application, construir a sequência por (stage, tempo) e
  // calcular o delta de cada stage até a próxima entrada.
  let histQuery = supabase
    .from('candidate_stage_history')
    .select('application_id, to_stage_id, changed_at');
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

  const durationsPerStage = new Map<string, number[]>();
  for (const arr of perApp.values()) {
    for (let i = 0; i < arr.length - 1; i += 1) {
      const curr = arr[i];
      const next = arr[i + 1];
      if (!curr.stageId) continue;
      const days = (next.ts - curr.ts) / (1000 * 60 * 60 * 24);
      const list = durationsPerStage.get(curr.stageId) ?? [];
      list.push(days);
      durationsPerStage.set(curr.stageId, list);
    }
  }

  return stages.map((s) => {
    const durations = durationsPerStage.get(s.id) ?? [];
    let median: number | null = null;
    if (durations.length > 0) {
      const sorted = [...durations].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    }
    return {
      stageId: s.id,
      stageName: s.name,
      position: s.position,
      medianDays: median !== null ? Math.round(median * 10) / 10 : null,
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
