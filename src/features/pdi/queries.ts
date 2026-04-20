import { createServerSupabaseClient } from '@/lib/supabase/server';

export type PlanRow = {
  id: string;
  company_id: string;
  employee_id: string;
  cycle_id: string | null;
  competency_id: string | null;
  objective: string;
  due_date: string;
  status: string;
  created_by: string;
  concluded_at: string | null;
  cancelled_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  employee: {
    id: string;
    full_name: string;
    status: string;
    position: { id: string; name: string } | null;
  } | null;
  competency: { id: string; name: string; is_archived: boolean } | null;
  cycle: { id: string; name: string; status: string } | null;
  actions_count: number;
  actions_done: number;
};

export type PlanActionRow = {
  id: string;
  plan_id: string;
  company_id: string;
  title: string;
  due_date: string;
  status: string;
  responsible_employee_id: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  responsible: { id: string; full_name: string; status: string } | null;
};

export type PlanCommentRow = {
  id: string;
  plan_id: string;
  company_id: string;
  author_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
  author: { id: string; full_name: string } | null;
};

const PLAN_SELECT = `
  id, company_id, employee_id, cycle_id, competency_id, objective, due_date, status,
  created_by, concluded_at, cancelled_at, deleted_at, created_at, updated_at,
  employee:employees!employee_id(id, full_name, status, position:positions(id, name)),
  competency:competencies(id, name, is_archived),
  cycle:review_cycles(id, name, status)
`;

type RawPlan = Omit<PlanRow, 'actions_count' | 'actions_done'>;

async function attachActionStats(rows: RawPlan[]): Promise<PlanRow[]> {
  if (rows.length === 0) return [];
  const supabase = await createServerSupabaseClient();
  const ids = rows.map((r) => r.id);
  const { data: actions } = await supabase
    .from('development_plan_actions')
    .select('plan_id, status')
    .in('plan_id', ids);
  const statsByPlan = new Map<string, { done: number; total: number }>();
  for (const a of actions ?? []) {
    const s = statsByPlan.get(a.plan_id) ?? { done: 0, total: 0 };
    s.total += 1;
    if (a.status === 'concluida') s.done += 1;
    statsByPlan.set(a.plan_id, s);
  }
  return rows.map((r) => ({
    ...r,
    actions_count: statsByPlan.get(r.id)?.total ?? 0,
    actions_done: statsByPlan.get(r.id)?.done ?? 0,
  }));
}

export async function listMyPdis(employeeId: string): Promise<PlanRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('development_plans')
    .select(PLAN_SELECT)
    .eq('employee_id', employeeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return attachActionStats((data ?? []) as unknown as RawPlan[]);
}

export async function listTeamPdis(descendantIds: string[]): Promise<PlanRow[]> {
  if (descendantIds.length === 0) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('development_plans')
    .select(PLAN_SELECT)
    .in('employee_id', descendantIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return attachActionStats((data ?? []) as unknown as RawPlan[]);
}

export async function listAllPdis(companyId: string): Promise<PlanRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('development_plans')
    .select(PLAN_SELECT)
    .eq('company_id', companyId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return attachActionStats((data ?? []) as unknown as RawPlan[]);
}

export async function listPdisForEmployee(employeeId: string): Promise<PlanRow[]> {
  return listMyPdis(employeeId);
}

export async function getPdiDetail(planId: string): Promise<PlanRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('development_plans')
    .select(PLAN_SELECT)
    .eq('id', planId)
    .is('deleted_at', null)
    .maybeSingle();
  if (!data) return null;
  const [withStats] = await attachActionStats([data as unknown as RawPlan]);
  return withStats ?? null;
}

export async function listActionsForPlan(planId: string): Promise<PlanActionRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('development_plan_actions')
    .select(`
      id, plan_id, company_id, title, due_date, status, responsible_employee_id, sort_order,
      created_at, updated_at,
      responsible:employees!responsible_employee_id(id, full_name, status)
    `)
    .eq('plan_id', planId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  return (data ?? []) as unknown as PlanActionRow[];
}

export async function listCommentsForPlan(planId: string): Promise<PlanCommentRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('development_plan_comments')
    .select(`
      id, plan_id, company_id, author_id, body, created_at, deleted_at,
      author:employees!author_id(id, full_name)
    `)
    .eq('plan_id', planId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });
  return (data ?? []) as unknown as PlanCommentRow[];
}

export async function getPdiForCycleAndEmployee(
  cycleId: string,
  employeeId: string,
): Promise<PlanRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('development_plans')
    .select(PLAN_SELECT)
    .eq('cycle_id', cycleId)
    .eq('employee_id', employeeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  const [withStats] = await attachActionStats([data as unknown as RawPlan]);
  return withStats ?? null;
}

export async function listActivePdiIds(employeeIds: string[]): Promise<Set<string>> {
  if (employeeIds.length === 0) return new Set();
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('development_plans')
    .select('employee_id')
    .in('employee_id', employeeIds)
    .in('status', ['nao_iniciado', 'em_andamento'])
    .is('deleted_at', null);
  return new Set((data ?? []).map((r) => r.employee_id));
}
