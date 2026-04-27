import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getEmployeeDescendants } from '@/features/employees/queries';
import { cache } from 'react';

export type CycleRow = {
  id: string;
  name: string;
  description: string | null;
  period_start: string;
  period_end: string;
  response_start: string;
  response_end: string;
  status: 'draft' | 'published' | 'closed' | 'archived';
  include_self: boolean;
  include_manager: boolean;
  published_at: string | null;
  closed_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function listCycles(
  companyId: string,
  opts: { includeArchived?: boolean; scopedIds?: string[] | null } = {},
) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('review_cycles')
    .select('id, name, description, period_start, period_end, response_start, response_end, status, include_self, include_manager, published_at, closed_at, archived_at, created_at, updated_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (!opts.includeArchived) {
    query = query.neq('status', 'archived');
  }
  if (opts.scopedIds) {
    if (opts.scopedIds.length === 0) return [] as CycleRow[];
    query = query.in('id', opts.scopedIds);
  }
  const { data } = await query;
  return (data ?? []) as CycleRow[];
}

export async function listCycleIdsInvolvingEmployee(
  companyId: string,
  employeeId: string,
): Promise<string[]> {
  const supabase = await createServerSupabaseClient();

  const { data: visibleCycles } = await supabase
    .from('review_cycles')
    .select('id')
    .eq('company_id', companyId)
    .in('status', ['published', 'closed']);
  const visibleIds = new Set((visibleCycles ?? []).map((c) => c.id));
  if (visibleIds.size === 0) return [];

  const [participants, assignments] = await Promise.all([
    supabase
      .from('review_cycle_participants')
      .select('cycle_id')
      .eq('employee_id', employeeId)
      .is('removed_at', null),
    supabase
      .from('review_assignments')
      .select('cycle_id')
      .eq('company_id', companyId)
      .eq('reviewer_id', employeeId),
  ]);

  const ids = new Set<string>();
  for (const r of participants.data ?? []) {
    if (r.cycle_id && visibleIds.has(r.cycle_id)) ids.add(r.cycle_id);
  }
  for (const r of assignments.data ?? []) {
    if (r.cycle_id && visibleIds.has(r.cycle_id)) ids.add(r.cycle_id);
  }
  return Array.from(ids);
}

export async function getCycle(cycleId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('review_cycles')
    .select('id, company_id, name, description, period_start, period_end, response_start, response_end, status, include_self, include_manager, published_at, closed_at, archived_at, created_at, updated_at, created_by')
    .eq('id', cycleId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCycleParticipants(cycleId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('review_cycle_participants')
    .select(`
      id, cycle_id, employee_id, added_at, removed_at, result_released_at, result_released_by,
      employee:employees(
        id, full_name, email, status, manager_id,
        position:positions(id, name),
        department:departments(id, name),
        manager:manager_id(id, full_name)
      )
    `)
    .eq('cycle_id', cycleId)
    .is('removed_at', null);
  return data ?? [];
}

export async function getCycleForm(cycleId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: form } = await supabase
    .from('review_forms')
    .select('id')
    .eq('cycle_id', cycleId)
    .maybeSingle();
  if (!form) return { form: null, questions: [] };
  const { data: questions } = await supabase
    .from('review_questions')
    .select('id, form_id, competency_id, question_order, type, question_text, is_required, scale_min, scale_max, competency:competencies(id, name)')
    .eq('form_id', form.id)
    .order('question_order');
  return { form, questions: questions ?? [] };
}

export async function getCycleAssignments(cycleId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('review_assignments')
    .select(`
      id, cycle_id, reviewee_id, reviewer_id, type, status, submitted_at, cancelled_at, cancelled_reason,
      reviewee:employees!reviewee_id(id, full_name, email),
      reviewer:employees!reviewer_id(id, full_name, email, user_id)
    `)
    .eq('cycle_id', cycleId);
  return data ?? [];
}

export async function getAssignmentsForReviewer(reviewerEmployeeId: string, opts: { onlyOpen?: boolean } = {}) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('review_assignments')
    .select(`
      id, cycle_id, reviewee_id, reviewer_id, type, status, submitted_at,
      reviewee:employees!reviewee_id(id, full_name, position:positions(id, name)),
      cycle:review_cycles!cycle_id(id, name, response_start, response_end, status)
    `)
    .eq('reviewer_id', reviewerEmployeeId);
  if (opts.onlyOpen) {
    query = query.in('status', ['pending', 'in_progress']);
  }
  const { data } = await query;
  return data ?? [];
}

export async function getAssignment(assignmentId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('review_assignments')
    .select(`
      id, company_id, cycle_id, form_id, reviewee_id, reviewer_id, type, status, submitted_at, cancelled_at,
      reviewee:employees!reviewee_id(id, full_name, email, hire_date, position:positions(id, name), department:departments(id, name), manager:manager_id(id, full_name)),
      reviewer:employees!reviewer_id(id, full_name, user_id),
      cycle:review_cycles!cycle_id(id, name, response_start, response_end, status)
    `)
    .eq('id', assignmentId)
    .maybeSingle();
  return data;
}

export async function getAssignmentAnswers(assignmentId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('review_answers')
    .select('id, question_id, scale_value, text_value, answered_at')
    .eq('assignment_id', assignmentId);
  return data ?? [];
}

export type CycleProgress = {
  total: number;
  submitted: number;
  inProgress: number;
  pending: number;
  cancelled: number;
};

const EMPTY_CYCLE_PROGRESS: CycleProgress = {
  total: 0,
  submitted: 0,
  inProgress: 0,
  pending: 0,
  cancelled: 0,
};

const getCycleProgressMapCached = cache(async (cycleIdsKey: string): Promise<Map<string, CycleProgress>> => {
  const cycleIds = cycleIdsKey ? cycleIdsKey.split(',') : [];
  if (cycleIds.length === 0) return new Map();

  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('review_assignments')
    .select('cycle_id, status')
    .in('cycle_id', cycleIds);

  const result = new Map<string, CycleProgress>();
  for (const id of cycleIds) {
    result.set(id, { ...EMPTY_CYCLE_PROGRESS });
  }

  for (const row of data ?? []) {
    const progress = result.get(row.cycle_id);
    if (!progress) continue;
    progress.total += 1;
    if (row.status === 'submitted') progress.submitted += 1;
    else if (row.status === 'in_progress') progress.inProgress += 1;
    else if (row.status === 'pending') progress.pending += 1;
    else if (row.status === 'cancelled') progress.cancelled += 1;
  }

  return result;
});

export function getCycleProgressMap(cycleIds: readonly string[]): Promise<Map<string, CycleProgress>> {
  if (cycleIds.length === 0) return Promise.resolve(new Map());
  const normalizedIds = Array.from(new Set(cycleIds));
  return getCycleProgressMapCached(normalizedIds.join(','));
}

export async function getCycleProgress(cycleId: string): Promise<CycleProgress> {
  const map = await getCycleProgressMap([cycleId]);
  return map.get(cycleId) ?? { ...EMPTY_CYCLE_PROGRESS };
}

export type CompetencyScore = {
  competencyId: string | null;
  competencyName: string | null;
  avgManager: number | null;
  avgSelf: number | null;
  avgEffective: number | null;
  questionCount: number;
};

export type ResultOverview = {
  employeeId: string;
  cycleId: string;
  avgOverall: number | null;
  competencyScores: CompetencyScore[];
  hasManagerReview: boolean;
  hasSelfReview: boolean;
  isReleased: boolean;
  releasedAt: string | null;
};

// Cálculo on-the-fly do resultado de um colaborador em um ciclo
export async function getResultOverview(cycleId: string, employeeId: string): Promise<ResultOverview> {
  const supabase = await createServerSupabaseClient();

  const [{ data: participant }, { data: assignments }] = await Promise.all([
    supabase
      .from('review_cycle_participants')
      .select('result_released_at')
      .eq('cycle_id', cycleId)
      .eq('employee_id', employeeId)
      .maybeSingle(),
    supabase
      .from('review_assignments')
      .select('id, type, status')
      .eq('cycle_id', cycleId)
      .eq('reviewee_id', employeeId),
  ]);

  const submitted = (assignments ?? []).filter((a) => a.status === 'submitted');
  const managerA = submitted.find((a) => a.type === 'manager');
  const selfA = submitted.find((a) => a.type === 'self');

  const emptyResult: ResultOverview = {
    employeeId,
    cycleId,
    avgOverall: null,
    competencyScores: [],
    hasManagerReview: !!managerA,
    hasSelfReview: !!selfA,
    isReleased: !!participant?.result_released_at,
    releasedAt: participant?.result_released_at ?? null,
  };

  if (submitted.length === 0) return emptyResult;

  const assignmentIds = submitted.map((a) => a.id);
  const { data: answers } = await supabase
    .from('review_answers')
    .select('assignment_id, question_id, scale_value, text_value')
    .in('assignment_id', assignmentIds);

  const { data: questions } = await supabase
    .from('review_questions')
    .select('id, competency_id, type, question_text')
    .in('id', (answers ?? []).map((a) => a.question_id));

  const competencyIds = Array.from(
    new Set((questions ?? []).map((q) => q.competency_id).filter((x): x is string => !!x)),
  );
  const { data: competencies } = competencyIds.length
    ? await supabase.from('competencies').select('id, name').in('id', competencyIds)
    : { data: [] as { id: string; name: string }[] };
  const compById = new Map((competencies ?? []).map((c) => [c.id, c.name]));

  const qById = new Map((questions ?? []).map((q) => [q.id, q]));

  const byType = new Map<string, Map<string, number[]>>(); // type -> competencyId|'__none__' -> notes
  byType.set('self', new Map());
  byType.set('manager', new Map());

  const assignmentTypeById = new Map(submitted.map((a) => [a.id, a.type as 'self' | 'manager']));

  for (const ans of answers ?? []) {
    if (ans.scale_value === null) continue;
    const q = qById.get(ans.question_id);
    if (!q || q.type !== 'scale') continue;
    const assignmentType = assignmentTypeById.get(ans.assignment_id);
    if (!assignmentType) continue;
    const key = q.competency_id ?? '__none__';
    const bucket = byType.get(assignmentType)!;
    if (!bucket.has(key)) bucket.set(key, []);
    bucket.get(key)!.push(ans.scale_value);
  }

  const competencyKeys = new Set<string>([
    ...Array.from(byType.get('self')!.keys()),
    ...Array.from(byType.get('manager')!.keys()),
  ]);

  const scores: CompetencyScore[] = [];
  for (const key of competencyKeys) {
    const selfArr = byType.get('self')!.get(key) ?? [];
    const mgrArr = byType.get('manager')!.get(key) ?? [];
    const avgSelf = selfArr.length ? selfArr.reduce((a, b) => a + b, 0) / selfArr.length : null;
    const avgManager = mgrArr.length ? mgrArr.reduce((a, b) => a + b, 0) / mgrArr.length : null;
    const avgEffective = avgManager ?? avgSelf;
    const qCountSample = (questions ?? []).filter((q) => (q.competency_id ?? '__none__') === key && q.type === 'scale').length;
    scores.push({
      competencyId: key === '__none__' ? null : key,
      competencyName: key === '__none__' ? null : (compById.get(key) ?? null),
      avgManager,
      avgSelf,
      avgEffective,
      questionCount: qCountSample,
    });
  }

  scores.sort((a, b) => (a.competencyName ?? '').localeCompare(b.competencyName ?? ''));

  const overallVals = scores.map((s) => s.avgEffective).filter((v): v is number => v !== null);
  const avgOverall = overallVals.length ? overallVals.reduce((a, b) => a + b, 0) / overallVals.length : null;

  return {
    employeeId,
    cycleId,
    avgOverall,
    competencyScores: scores,
    hasManagerReview: !!managerA,
    hasSelfReview: !!selfA,
    isReleased: !!participant?.result_released_at,
    releasedAt: participant?.result_released_at ?? null,
  };
}

export type CycleComment = {
  questionId: string;
  questionText: string;
  author: 'self' | 'manager';
  text: string;
};

export async function getCycleComments(cycleId: string, employeeId: string): Promise<CycleComment[]> {
  const supabase = await createServerSupabaseClient();
  const { data: assignments } = await supabase
    .from('review_assignments')
    .select('id, type, status')
    .eq('cycle_id', cycleId)
    .eq('reviewee_id', employeeId)
    .eq('status', 'submitted');
  if (!assignments?.length) return [];

  const ids = assignments.map((a) => a.id);
  const { data: answers } = await supabase
    .from('review_answers')
    .select('assignment_id, question_id, text_value')
    .in('assignment_id', ids);

  const { data: questions } = await supabase
    .from('review_questions')
    .select('id, question_text, type')
    .in('id', (answers ?? []).map((a) => a.question_id));

  const qById = new Map((questions ?? []).map((q) => [q.id, q]));
  const typeById = new Map(assignments.map((a) => [a.id, a.type as 'self' | 'manager']));

  const comments: CycleComment[] = [];
  for (const ans of answers ?? []) {
    if (!ans.text_value || !ans.text_value.trim()) continue;
    const q = qById.get(ans.question_id);
    if (!q || q.type !== 'text') continue;
    const type = typeById.get(ans.assignment_id);
    if (!type) continue;
    comments.push({
      questionId: q.id,
      questionText: q.question_text,
      author: type,
      text: ans.text_value,
    });
  }
  return comments;
}

// Comentários da liderança (FT-8 P10) — pós-release.
export type ResultLeadershipComment = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  authorEmployeeId: string;
  authorFullName: string;
  authorRole: 'admin_rh' | 'director' | 'user' | null;
  authorIsManagerOfReviewee: boolean;
};

export async function listResultLeadershipComments(
  cycleId: string,
  revieweeEmployeeId: string,
): Promise<ResultLeadershipComment[]> {
  const supabase = await createServerSupabaseClient();
  const { data: rows } = await supabase
    .from('review_result_comments')
    .select('id, content, created_at, updated_at, author_employee_id')
    .eq('cycle_id', cycleId)
    .eq('reviewee_employee_id', revieweeEmployeeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  if (!rows?.length) return [];

  const authorIds = Array.from(new Set(rows.map((r) => r.author_employee_id)));
  const { data: authors } = await supabase
    .from('employees')
    .select('id, full_name, user_id, manager_id')
    .in('id', authorIds);

  const { data: reviewee } = await supabase
    .from('employees')
    .select('manager_id')
    .eq('id', revieweeEmployeeId)
    .maybeSingle();

  const userIds = (authors ?? []).map((a) => a.user_id).filter((x): x is string => !!x);
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, role').in('id', userIds)
    : { data: [] };

  const authorById = new Map((authors ?? []).map((a) => [a.id, a]));
  const roleByUserId = new Map((profiles ?? []).map((p) => [p.id, p.role]));

  return rows.map((r) => {
    const a = authorById.get(r.author_employee_id);
    const role = a?.user_id ? (roleByUserId.get(a.user_id) as ResultLeadershipComment['authorRole']) : null;
    return {
      id: r.id,
      content: r.content,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      authorEmployeeId: r.author_employee_id,
      authorFullName: a?.full_name ?? 'Pessoa',
      authorRole: role ?? null,
      authorIsManagerOfReviewee: !!reviewee?.manager_id && reviewee.manager_id === r.author_employee_id,
    };
  });
}

export type CycleResultRow = {
  employeeId: string;
  fullName: string;
  position: { id: string; name: string } | null;
  department: { id: string; name: string } | null;
  managerId: string | null;
  avgOverall: number | null;
  isReleased: boolean;
  releasedAt: string | null;
  hasManagerReview: boolean;
  hasSelfReview: boolean;
};

export async function listCycleResults(cycleId: string): Promise<CycleResultRow[]> {
  const supabase = await createServerSupabaseClient();

  const { data: participants } = await supabase
    .from('review_cycle_participants')
    .select(`
      employee_id, result_released_at,
      employee:employees!employee_id(id, full_name, manager_id, position:positions(id, name), department:departments(id, name))
    `)
    .eq('cycle_id', cycleId)
    .is('removed_at', null);

  if (!participants?.length) return [];

  const employeeIds = participants.map((p) => p.employee_id);

  const { data: assignments } = await supabase
    .from('review_assignments')
    .select('id, reviewee_id, type, status')
    .eq('cycle_id', cycleId)
    .in('reviewee_id', employeeIds);

  const submitted = (assignments ?? []).filter((a) => a.status === 'submitted');
  if (submitted.length === 0) {
    return participants.map((p) => {
      const emp = p.employee as unknown as { full_name: string; manager_id: string | null; position: { id: string; name: string } | null; department: { id: string; name: string } | null } | null;
      return {
        employeeId: p.employee_id,
        fullName: emp?.full_name ?? '—',
        position: emp?.position ?? null,
        department: emp?.department ?? null,
        managerId: emp?.manager_id ?? null,
        avgOverall: null,
        isReleased: !!p.result_released_at,
        releasedAt: p.result_released_at,
        hasManagerReview: false,
        hasSelfReview: false,
      };
    });
  }

  const assignmentIds = submitted.map((a) => a.id);
  const { data: answers } = await supabase
    .from('review_answers')
    .select('assignment_id, question_id, scale_value')
    .in('assignment_id', assignmentIds);

  const { data: questions } = answers?.length
    ? await supabase
      .from('review_questions')
      .select('id, competency_id, type')
      .in('id', answers.map((a) => a.question_id))
    : { data: [] };

  const scaleQIds = new Set((questions ?? []).filter((q) => q.type === 'scale').map((q) => q.id));
  const compByQ = new Map((questions ?? []).map((q) => [q.id, q.competency_id ?? '__none__']));

  // Para cada reviewee_id: agrupar notas por tipo e competência
  const byEmp = new Map<string, {
    self: Map<string, number[]>;
    manager: Map<string, number[]>;
    hasSelf: boolean;
    hasManager: boolean;
  }>();

  const empByAssignment = new Map(submitted.map((a) => [a.id, { reviewee: a.reviewee_id, type: a.type as 'self' | 'manager' }]));

  for (const a of submitted) {
    let entry = byEmp.get(a.reviewee_id);
    if (!entry) {
      entry = { self: new Map(), manager: new Map(), hasSelf: false, hasManager: false };
      byEmp.set(a.reviewee_id, entry);
    }
    if (a.type === 'self') entry.hasSelf = true;
    if (a.type === 'manager') entry.hasManager = true;
  }

  for (const ans of answers ?? []) {
    if (ans.scale_value === null) continue;
    if (!scaleQIds.has(ans.question_id)) continue;
    const meta = empByAssignment.get(ans.assignment_id);
    if (!meta) continue;
    const entry = byEmp.get(meta.reviewee);
    if (!entry) continue;
    const bucket = entry[meta.type];
    const compKey = compByQ.get(ans.question_id) ?? '__none__';
    if (!bucket.has(compKey)) bucket.set(compKey, []);
    bucket.get(compKey)!.push(ans.scale_value);
  }

  function avgOverallFromEntry(entry: { self: Map<string, number[]>; manager: Map<string, number[]> }) {
    const competencyKeys = new Set<string>([
      ...Array.from(entry.self.keys()),
      ...Array.from(entry.manager.keys()),
    ]);
    if (competencyKeys.size === 0) return null;
    const averages: number[] = [];
    for (const key of competencyKeys) {
      const mgr = entry.manager.get(key) ?? [];
      const slf = entry.self.get(key) ?? [];
      const arr = mgr.length > 0 ? mgr : slf;
      if (arr.length === 0) continue;
      averages.push(arr.reduce((a, b) => a + b, 0) / arr.length);
    }
    if (averages.length === 0) return null;
    return averages.reduce((a, b) => a + b, 0) / averages.length;
  }

  return participants.map((p) => {
    const emp = p.employee as unknown as {
      full_name: string;
      manager_id: string | null;
      position: { id: string; name: string } | null;
      department: { id: string; name: string } | null;
    } | null;
    const entry = byEmp.get(p.employee_id);
    return {
      employeeId: p.employee_id,
      fullName: emp?.full_name ?? '—',
      position: emp?.position ?? null,
      department: emp?.department ?? null,
      managerId: emp?.manager_id ?? null,
      avgOverall: entry ? avgOverallFromEntry(entry) : null,
      isReleased: !!p.result_released_at,
      releasedAt: p.result_released_at,
      hasManagerReview: entry?.hasManager ?? false,
      hasSelfReview: entry?.hasSelf ?? false,
    };
  });
}

export type ReviewCycleForEmployee = {
  cycleId: string;
  cycleName: string;
  periodStart: string;
  periodEnd: string;
  responseStart: string;
  responseEnd: string;
  status: 'draft' | 'published' | 'closed' | 'archived';
  isReleased: boolean;
  releasedAt: string | null;
  avgOverall: number | null;
};

export async function listReviewCyclesForEmployee(
  employeeId: string,
): Promise<ReviewCycleForEmployee[]> {
  const supabase = await createServerSupabaseClient();
  const { data: participants } = await supabase
    .from('review_cycle_participants')
    .select(`
      cycle_id, result_released_at,
      cycle:review_cycles!cycle_id(id, name, status, period_start, period_end, response_start, response_end)
    `)
    .eq('employee_id', employeeId)
    .is('removed_at', null);

  if (!participants?.length) return [];

  const results = await Promise.all(
    participants
      .filter((p) => !!p.cycle)
      .map(async (p) => {
        const cycle = p.cycle as unknown as {
          id: string; name: string;
          status: 'draft' | 'published' | 'closed' | 'archived';
          period_start: string; period_end: string;
          response_start: string; response_end: string;
        };
        const overview = await getResultOverview(cycle.id, employeeId);
        return {
          cycleId: cycle.id,
          cycleName: cycle.name,
          periodStart: cycle.period_start,
          periodEnd: cycle.period_end,
          responseStart: cycle.response_start,
          responseEnd: cycle.response_end,
          status: cycle.status,
          isReleased: !!p.result_released_at,
          releasedAt: p.result_released_at ?? null,
          avgOverall: overview.avgOverall,
        };
      }),
  );

  return results.sort((a, b) =>
    a.responseStart < b.responseStart ? 1 : a.responseStart > b.responseStart ? -1 : 0,
  );
}

export async function getEligibleEmployees(companyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('employees')
    .select('id, full_name, email, status, manager_id, position:positions(id, name), department:departments(id, name)')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('full_name');
  return data ?? [];
}

export async function getActorEmployeeId(userId: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function getActorDescendants(userId: string): Promise<string[]> {
  const empId = await getActorEmployeeId(userId);
  if (!empId) return [];
  return getEmployeeDescendants(empId);
}
