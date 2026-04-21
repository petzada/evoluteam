import { createServerSupabaseClient } from '@/lib/supabase/server';
import { STALLED_THRESHOLD_DAYS } from '../schema';

export interface MetricsFilter {
  companyId: string;
  from: Date | null;
  to: Date | null;
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

  // Ativos
  const { data: active } = await supabase
    .from('job_applications')
    .select('job_opening_id')
    .eq('company_id', f.companyId)
    .eq('status', 'in_progress');
  const activeJobs = new Set((active ?? []).map((a) => a.job_opening_id));

  // Contratados no período
  let hiredQuery = supabase
    .from('job_applications')
    .select('created_at, updated_at', { count: 'exact', head: false })
    .eq('company_id', f.companyId)
    .eq('status', 'hired');
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

  // Tarefas atrasadas
  const nowISO = new Date().toISOString();
  const { count: overdue } = await supabase
    .from('candidate_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', f.companyId)
    .is('deleted_at', null)
    .is('completed_at', null)
    .not('due_date', 'is', null)
    .lt('due_date', nowISO);

  return {
    activeCandidates: (active ?? []).length,
    activeCandidatesJobCount: activeJobs.size,
    hiredInPeriod: hiredCount ?? 0,
    medianTimeToHireDays: median !== null ? Math.round(median) : null,
    overdueTasks: overdue ?? 0,
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

  // Filtra pelo company via application (só as da company do filter)
  const { data: appsOfCompany } = await supabase
    .from('job_applications')
    .select('id')
    .eq('company_id', f.companyId);
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

  // Total de candidatos por origem (na company; período opcional em created_at)
  let candQuery = supabase
    .from('candidates')
    .select('source, source_other')
    .eq('company_id', f.companyId);
  if (f.from) candQuery = candQuery.gte('created_at', f.from.toISOString());
  if (f.to) candQuery = candQuery.lte('created_at', f.to.toISOString());
  const { data: cands } = await candQuery;

  // Candidatos contratados por origem (via candidates.hired_employee_id != null + aplicação hired no período)
  let hiredAppsQuery = supabase
    .from('job_applications')
    .select('candidate_id, updated_at')
    .eq('company_id', f.companyId)
    .eq('status', 'hired');
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
  const { data: stages } = await supabase
    .from('recruitment_stages')
    .select('id, name, position')
    .eq('company_id', f.companyId)
    .is('archived_at', null)
    .order('position', { ascending: true });
  if (!stages?.length) return [];

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
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - STALLED_THRESHOLD_DAYS);
  const { data } = await supabase
    .from('job_applications')
    .select(`
      id, candidate_id, stage_entered_at,
      candidate:candidates(id, name),
      job_opening:job_openings(title),
      current_stage:recruitment_stages!current_stage_id(name)
    `)
    .eq('company_id', f.companyId)
    .eq('status', 'in_progress')
    .lt('stage_entered_at', threshold.toISOString())
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
  const now = new Date();
  const { data } = await supabase
    .from('candidate_tasks')
    .select(`
      id, application_id, title, due_date,
      responsible:employees!responsible_id(full_name),
      application:job_applications(candidate_id,
        candidate:candidates(name),
        job_opening:job_openings(title))
    `)
    .eq('company_id', f.companyId)
    .is('deleted_at', null)
    .is('completed_at', null)
    .not('due_date', 'is', null)
    .lt('due_date', now.toISOString())
    .order('due_date', { ascending: true })
    .limit(limit);
  return (data ?? []).map((row) => {
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
