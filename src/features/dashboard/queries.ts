import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getEmployeeDescendants } from '@/features/employees/queries';
import { canDo } from '@/features/permissions/permissions';
import type { ScreenPermissions } from '@/features/permissions/types';

export type ScopeRole = 'admin_rh' | 'director' | 'global' | 'gestor';

export type DashboardScope = {
  companyId: string;
  role: ScopeRole;
  employeeIds: 'all' | string[];
  departmentId: string | null;
  cycleId: string | null;
};

export type ScopeInput = {
  companyId: string;
  role: 'admin_rh' | 'director' | 'user' | string;
  actorEmployeeId: string | null;
  screenPermissions?: ScreenPermissions | null;
  departmentId?: string | null;
  cycleId?: string | null;
};

export function resolveScopeRole(
  input: Pick<ScopeInput, 'role' | 'actorEmployeeId' | 'screenPermissions'>,
): ScopeRole | null {
  if (input.role === 'admin_rh') return 'admin_rh';
  if (input.role === 'director') return 'director';
  if (canDo(
    { role: input.role, screenPermissions: input.screenPermissions ?? null },
    'dashboard',
    'view',
  )) {
    return 'global';
  }
  return 'gestor';
}

export async function buildScope(input: ScopeInput): Promise<DashboardScope | null> {
  const role = resolveScopeRole(input);
  if (!role) return null;

  if (role === 'gestor') {
    if (!input.actorEmployeeId) return null;
    const descendants = await getEmployeeDescendants(input.actorEmployeeId);
    const ids = Array.from(new Set([input.actorEmployeeId, ...descendants.filter((id) => id !== input.actorEmployeeId)]));
    return {
      companyId: input.companyId,
      role: 'gestor',
      employeeIds: ids,
      departmentId: null,
      cycleId: input.cycleId ?? null,
    };
  }

  return {
    companyId: input.companyId,
    role,
    employeeIds: 'all',
    departmentId: input.departmentId ?? null,
    cycleId: input.cycleId ?? null,
  };
}

async function resolveCycleIds(scope: DashboardScope): Promise<string[] | null> {
  if (!scope.cycleId) return null;
  if (scope.cycleId !== 'all') return [scope.cycleId];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('review_cycles')
    .select('id')
    .eq('company_id', scope.companyId)
    .in('status', ['published', 'closed']);
  return (data ?? []).map((r) => r.id);
}

async function resolveScopedEmployeeIds(scope: DashboardScope): Promise<string[] | null> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('employees')
    .select('id')
    .eq('company_id', scope.companyId);

  if (scope.employeeIds !== 'all') {
    if (scope.employeeIds.length === 0) return [];
    query = query.in('id', scope.employeeIds);
  }
  if (scope.departmentId) {
    query = query.eq('department_id', scope.departmentId);
  }

  const { data } = await query;
  if (!data) return [];
  return data.map((r) => r.id);
}

async function resolveActiveScopedEmployeeIds(scope: DashboardScope): Promise<string[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('employees')
    .select('id')
    .eq('company_id', scope.companyId)
    .eq('status', 'active');

  if (scope.employeeIds !== 'all') {
    if (scope.employeeIds.length === 0) return [];
    query = query.in('id', scope.employeeIds);
  }
  if (scope.departmentId) {
    query = query.eq('department_id', scope.departmentId);
  }

  const { data } = await query;
  return (data ?? []).map((r) => r.id);
}

export type CycleOption = {
  id: string;
  name: string;
  status: 'published' | 'closed' | 'archived';
  published_at: string | null;
  closed_at: string | null;
  archived_at: string | null;
};

export async function listCycleOptions(companyId: string): Promise<CycleOption[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('review_cycles')
    .select('id, name, status, published_at, closed_at, archived_at')
    .eq('company_id', companyId)
    .in('status', ['published', 'closed', 'archived'])
    .order('published_at', { ascending: false, nullsFirst: false });
  return (data ?? []) as CycleOption[];
}

export async function getLastActiveCycleId(companyId: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data: published } = await supabase
    .from('review_cycles')
    .select('id, published_at')
    .eq('company_id', companyId)
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(1);
  if (published && published.length) return published[0].id;

  const { data: closed } = await supabase
    .from('review_cycles')
    .select('id, closed_at')
    .eq('company_id', companyId)
    .eq('status', 'closed')
    .order('closed_at', { ascending: false, nullsFirst: false })
    .limit(1);
  if (closed && closed.length) return closed[0].id;

  return null;
}

// ---------- KPI 1: Colaboradores ativos ----------
export async function countActiveEmployees(scope: DashboardScope): Promise<number> {
  const ids = await resolveActiveScopedEmployeeIds(scope);
  return ids.length;
}

// ---------- KPI 2: Ciclos ativos ----------
export async function countActiveCycles(scope: DashboardScope): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const base = supabase
    .from('review_cycles')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', scope.companyId)
    .eq('status', 'published');

  if (scope.employeeIds === 'all' && !scope.departmentId) {
    const { count } = await base;
    return count ?? 0;
  }

  const revieweeIds = await resolveScopedEmployeeIds(scope);
  if (!revieweeIds || revieweeIds.length === 0) return 0;

  const { data: cycles } = await supabase
    .from('review_cycles')
    .select('id')
    .eq('company_id', scope.companyId)
    .eq('status', 'published');
  const cycleIds = (cycles ?? []).map((c) => c.id);
  if (cycleIds.length === 0) return 0;

  const { data: assignments } = await supabase
    .from('review_assignments')
    .select('cycle_id')
    .in('cycle_id', cycleIds)
    .in('reviewee_id', revieweeIds);
  const distinct = new Set((assignments ?? []).map((a) => a.cycle_id));
  return distinct.size;
}

// ---------- KPI 3 + 4: Avaliações pendentes + Taxa de conclusão ----------
export type AssignmentStats = {
  total: number;
  submitted: number;
  pending: number;
  inProgress: number;
  cancelled: number;
  completionRate: number | null;
};

export async function getAssignmentStats(scope: DashboardScope): Promise<AssignmentStats> {
  const empty: AssignmentStats = {
    total: 0, submitted: 0, pending: 0, inProgress: 0, cancelled: 0, completionRate: null,
  };
  const cycleIds = await resolveCycleIds(scope);
  if (!cycleIds || cycleIds.length === 0) return empty;

  const supabase = await createServerSupabaseClient();

  let revieweeIds: string[] | null = null;
  if (scope.employeeIds !== 'all' || scope.departmentId) {
    revieweeIds = await resolveScopedEmployeeIds(scope);
    if (revieweeIds && revieweeIds.length === 0) return empty;
  }

  let query = supabase
    .from('review_assignments')
    .select('status')
    .in('cycle_id', cycleIds)
    .eq('company_id', scope.companyId);
  if (revieweeIds) query = query.in('reviewee_id', revieweeIds);

  const { data } = await query;
  const rows = data ?? [];
  const total = rows.length;
  const submitted = rows.filter((r) => r.status === 'submitted').length;
  const pending = rows.filter((r) => r.status === 'pending').length;
  const inProgress = rows.filter((r) => r.status === 'in_progress').length;
  const cancelled = rows.filter((r) => r.status === 'cancelled').length;
  const effectiveTotal = total - cancelled;
  const completionRate = effectiveTotal > 0 ? (submitted / effectiveTotal) * 100 : null;
  return { total, submitted, pending, inProgress, cancelled, completionRate };
}

// ---------- KPI 5, 6, 7: Médias (geral, por departamento, radar) ----------
type ScaleAnswerRow = {
  assignment_id: string;
  question_id: string;
  scale_value: number | null;
};

type AssignmentMini = {
  id: string;
  reviewee_id: string;
  type: string;
};

type QuestionMini = {
  id: string;
  competency_id: string | null;
  type: string;
};

type CycleRatingInputs = {
  assignments: AssignmentMini[];
  revieweeDeptMap: Map<string, { deptId: string | null; deptName: string | null; fullName: string }>;
  answersByReviewee: Map<string, number[]>;
  answersByReviewee_Competency: Map<string, Map<string, number[]>>;
  answersByCompetency: Map<string, number[]>;
  competencyNames: Map<string, string>;
};

function cycleRatingScopeKey(s: DashboardScope): string {
  const ids = s.employeeIds === 'all'
    ? 'all'
    : [...s.employeeIds].sort().join(',');
  return `${s.companyId}|${s.role}|${ids}|${s.departmentId ?? ''}|${s.cycleId ?? ''}`;
}

// Dedupe within the same request: dashboard calls this 3x (overall, per-dept, competencies).
// React.cache keys by arguments using identity; we pass a stable serialized key as the
// dedup identity plus the scope object for the implementation.
const fetchCycleRatingInputsCached = cache(
  async (_key: string, scope: DashboardScope): Promise<CycleRatingInputs | null> => {
    return fetchCycleRatingInputsImpl(scope);
  },
);

async function fetchCycleRatingInputs(scope: DashboardScope): Promise<CycleRatingInputs | null> {
  return fetchCycleRatingInputsCached(cycleRatingScopeKey(scope), scope);
}

async function fetchCycleRatingInputsImpl(scope: DashboardScope): Promise<CycleRatingInputs | null> {
  const cycleIds = await resolveCycleIds(scope);
  if (!cycleIds || cycleIds.length === 0) return null;

  const supabase = await createServerSupabaseClient();

  let revieweeIdsFilter: string[] | null = null;
  if (scope.employeeIds !== 'all' || scope.departmentId) {
    revieweeIdsFilter = await resolveScopedEmployeeIds(scope);
    if (revieweeIdsFilter && revieweeIdsFilter.length === 0) return null;
  }

  let submittedQuery = supabase
    .from('review_assignments')
    .select('id, reviewee_id, type, status')
    .in('cycle_id', cycleIds)
    .eq('company_id', scope.companyId)
    .eq('status', 'submitted');
  if (revieweeIdsFilter) submittedQuery = submittedQuery.in('reviewee_id', revieweeIdsFilter);
  const { data: submitted } = await submittedQuery;
  const submittedRows = (submitted ?? []) as { id: string; reviewee_id: string; type: string; status: string }[];
  if (submittedRows.length === 0) return null;

  // Escolhe por reviewee: manager se existe, senão self
  const byReviewee = new Map<string, AssignmentMini>();
  for (const a of submittedRows) {
    if (a.type === 'manager') byReviewee.set(a.reviewee_id, a);
  }
  for (const a of submittedRows) {
    if (!byReviewee.has(a.reviewee_id) && a.type === 'self') {
      byReviewee.set(a.reviewee_id, a);
    }
  }
  const chosen = Array.from(byReviewee.values());
  if (chosen.length === 0) return null;

  const assignmentIds = chosen.map((a) => a.id);
  const revieweeIds = Array.from(new Set(chosen.map((a) => a.reviewee_id)));

  const [{ data: answers }, { data: employees }] = await Promise.all([
    supabase
      .from('review_answers')
      .select('assignment_id, question_id, scale_value')
      .in('assignment_id', assignmentIds),
    supabase
      .from('employees')
      .select('id, full_name, department:departments(id, name)')
      .in('id', revieweeIds),
  ]);

  const revieweeDeptMap = new Map<string, { deptId: string | null; deptName: string | null; fullName: string }>();
  for (const e of employees ?? []) {
    const dept = e.department as unknown as { id: string; name: string } | null;
    revieweeDeptMap.set(e.id, {
      deptId: dept?.id ?? null,
      deptName: dept?.name ?? null,
      fullName: e.full_name,
    });
  }

  const answerRows = (answers ?? []) as ScaleAnswerRow[];
  const questionIds = Array.from(new Set(answerRows.map((a) => a.question_id)));
  const { data: questions } = questionIds.length
    ? await supabase
      .from('review_questions')
      .select('id, competency_id, type')
      .in('id', questionIds)
    : { data: [] as QuestionMini[] };

  const qById = new Map<string, QuestionMini>((questions ?? []).map((q) => [q.id, q as QuestionMini]));

  const competencyIds = Array.from(new Set((questions ?? []).map((q) => q.competency_id).filter((x): x is string => !!x)));
  const { data: comps } = competencyIds.length
    ? await supabase
      .from('competencies')
      .select('id, name')
      .in('id', competencyIds)
    : { data: [] as { id: string; name: string }[] };
  const competencyNames = new Map<string, string>((comps ?? []).map((c) => [c.id, c.name]));

  const assignmentIdToReviewee = new Map(chosen.map((a) => [a.id, a.reviewee_id]));

  const answersByReviewee = new Map<string, number[]>();
  const answersByReviewee_Competency = new Map<string, Map<string, number[]>>();
  const answersByCompetency = new Map<string, number[]>();

  for (const ans of answerRows) {
    if (ans.scale_value === null) continue;
    const q = qById.get(ans.question_id);
    if (!q || q.type !== 'scale') continue;
    const revieweeId = assignmentIdToReviewee.get(ans.assignment_id);
    if (!revieweeId) continue;

    const all = answersByReviewee.get(revieweeId) ?? [];
    all.push(ans.scale_value);
    answersByReviewee.set(revieweeId, all);

    const compKey = q.competency_id ?? '__none__';
    const compMap = answersByReviewee_Competency.get(revieweeId) ?? new Map<string, number[]>();
    const compArr = compMap.get(compKey) ?? [];
    compArr.push(ans.scale_value);
    compMap.set(compKey, compArr);
    answersByReviewee_Competency.set(revieweeId, compMap);

    if (q.competency_id) {
      const arr = answersByCompetency.get(q.competency_id) ?? [];
      arr.push(ans.scale_value);
      answersByCompetency.set(q.competency_id, arr);
    }
  }

  return {
    assignments: chosen,
    revieweeDeptMap,
    answersByReviewee,
    answersByReviewee_Competency,
    answersByCompetency,
    competencyNames,
  };
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export async function getOverallAverage(scope: DashboardScope): Promise<number | null> {
  const data = await fetchCycleRatingInputs(scope);
  if (!data) return null;

  const perEmployeeAverages: number[] = [];
  for (const [, compMap] of data.answersByReviewee_Competency) {
    const compAverages: number[] = [];
    for (const [, values] of compMap) {
      const a = avg(values);
      if (a !== null) compAverages.push(a);
    }
    const empAvg = avg(compAverages);
    if (empAvg !== null) perEmployeeAverages.push(empAvg);
  }
  return avg(perEmployeeAverages);
}

export type DepartmentAverage = {
  departmentId: string | null;
  departmentName: string | null;
  average: number | null;
  employeeCount: number;
};

export async function getAveragePerDepartment(scope: DashboardScope): Promise<DepartmentAverage[]> {
  const data = await fetchCycleRatingInputs(scope);
  if (!data) return [];

  const buckets = new Map<string, { name: string | null; employeeScores: number[] }>();

  for (const [revieweeId, compMap] of data.answersByReviewee_Competency) {
    const info = data.revieweeDeptMap.get(revieweeId);
    const key = info?.deptId ?? '__none__';
    const existing = buckets.get(key) ?? { name: info?.deptName ?? null, employeeScores: [] };
    existing.name = existing.name ?? info?.deptName ?? null;

    const compAverages: number[] = [];
    for (const [, values] of compMap) {
      const a = avg(values);
      if (a !== null) compAverages.push(a);
    }
    const empAvg = avg(compAverages);
    if (empAvg !== null) existing.employeeScores.push(empAvg);
    buckets.set(key, existing);
  }

  const result: DepartmentAverage[] = [];
  for (const [key, bucket] of buckets) {
    if (bucket.employeeScores.length === 0) continue;
    result.push({
      departmentId: key === '__none__' ? null : key,
      departmentName: bucket.name ?? (key === '__none__' ? 'Sem departamento' : '—'),
      average: avg(bucket.employeeScores),
      employeeCount: bucket.employeeScores.length,
    });
  }
  result.sort((a, b) => (b.average ?? 0) - (a.average ?? 0));
  return result;
}

export type CompetencyAverage = {
  competencyId: string;
  competencyName: string;
  average: number;
};

export async function getCompetencyAverages(scope: DashboardScope): Promise<CompetencyAverage[]> {
  const data = await fetchCycleRatingInputs(scope);
  if (!data) return [];

  const perReviewee = new Map<string, number[]>();
  for (const [, compMap] of data.answersByReviewee_Competency) {
    for (const [compId, values] of compMap) {
      if (compId === '__none__') continue;
      const empCompAvg = avg(values);
      if (empCompAvg === null) continue;
      const arr = perReviewee.get(compId) ?? [];
      arr.push(empCompAvg);
      perReviewee.set(compId, arr);
    }
  }

  const result: CompetencyAverage[] = [];
  for (const [compId, perRevieweeAverages] of perReviewee) {
    const a = avg(perRevieweeAverages);
    if (a === null) continue;
    result.push({
      competencyId: compId,
      competencyName: data.competencyNames.get(compId) ?? '—',
      average: a,
    });
  }
  result.sort((a, b) => a.competencyName.localeCompare(b.competencyName));
  return result;
}

// ---------- KPI 8: PDIs ativos ----------
export async function countActivePdis(scope: DashboardScope): Promise<number> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('development_plans')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', scope.companyId)
    .is('deleted_at', null)
    .in('status', ['nao_iniciado', 'em_andamento']);

  if (scope.employeeIds !== 'all') {
    if (scope.employeeIds.length === 0) return 0;
    query = query.in('employee_id', scope.employeeIds);
  }

  if (scope.departmentId) {
    const ids = await resolveScopedEmployeeIds(scope);
    if (!ids || ids.length === 0) return 0;
    query = query.in('employee_id', ids);
  }

  const { count } = await query;
  return count ?? 0;
}

// ---------- KPI 9: PDIs atrasados ----------
export async function countOverduePdis(scope: DashboardScope): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from('development_plans')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', scope.companyId)
    .is('deleted_at', null)
    .not('status', 'in', '("concluido","cancelado")')
    .lt('due_date', today);

  if (scope.employeeIds !== 'all') {
    if (scope.employeeIds.length === 0) return 0;
    query = query.in('employee_id', scope.employeeIds);
  }

  if (scope.departmentId) {
    const ids = await resolveScopedEmployeeIds(scope);
    if (!ids || ids.length === 0) return 0;
    query = query.in('employee_id', ids);
  }

  const { count } = await query;
  return count ?? 0;
}

// ---------- KPI 10: Sem feedback 90d ----------
export async function countEmployeesWithoutRecentFeedback(scope: DashboardScope): Promise<number> {
  const activeIds = await resolveActiveScopedEmployeeIds(scope);
  if (activeIds.length === 0) return 0;

  const supabase = await createServerSupabaseClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffIso = cutoff.toISOString();

  const { data } = await supabase
    .from('feedbacks')
    .select('recipient_id')
    .eq('company_id', scope.companyId)
    .is('deleted_at', null)
    .gte('created_at', cutoffIso)
    .in('recipient_id', activeIds);

  const withRecent = new Set((data ?? []).map((r) => r.recipient_id));
  let without = 0;
  for (const id of activeIds) if (!withRecent.has(id)) without += 1;
  return without;
}

export async function listEmployeesWithoutRecentFeedback(companyId: string): Promise<string[]> {
  const supabase = await createServerSupabaseClient();
  const { data: actives } = await supabase
    .from('employees')
    .select('id')
    .eq('company_id', companyId)
    .eq('status', 'active');

  const activeIds = (actives ?? []).map((e) => e.id);
  if (activeIds.length === 0) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const { data: fbs } = await supabase
    .from('feedbacks')
    .select('recipient_id')
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .gte('created_at', cutoff.toISOString())
    .in('recipient_id', activeIds);

  const withRecent = new Set((fbs ?? []).map((r) => r.recipient_id));
  return activeIds.filter((id) => !withRecent.has(id));
}
