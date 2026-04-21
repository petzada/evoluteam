import { createServerSupabaseClient } from '@/lib/supabase/server';

export type MyPendingAssignment = {
  id: string;
  cycleId: string;
  cycleName: string;
  revieweeName: string;
  type: string;
  responseEnd: string;
  status: string;
};

export type MyOpenPdiAction = {
  id: string;
  planId: string;
  title: string;
  dueDate: string;
  status: string;
  planEmployeeName: string;
  isOverdue: boolean;
};

export type MyRecentFeedback = {
  id: string;
  type: string;
  createdAt: string;
  authorName: string | null;
  competencyName: string | null;
  excerpt: string;
};

export type MyCurrentPdi = {
  id: string;
  objective: string;
  dueDate: string;
  status: string;
  totalActions: number;
  doneActions: number;
  competencyName: string | null;
};

export async function getMyPendingAssignments(employeeId: string): Promise<MyPendingAssignment[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('review_assignments')
    .select(`
      id, cycle_id, type, status,
      reviewee:employees!reviewee_id(full_name),
      cycle:review_cycles!cycle_id(id, name, response_end)
    `)
    .eq('reviewer_id', employeeId)
    .in('status', ['pending', 'in_progress'])
    .order('cycle_id');

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    cycle_id: string;
    type: string;
    status: string;
    reviewee: { full_name: string } | null;
    cycle: { id: string; name: string; response_end: string } | null;
  }>;

  return rows
    .filter((r) => r.cycle !== null)
    .map((r) => ({
      id: r.id,
      cycleId: r.cycle_id,
      cycleName: r.cycle!.name,
      revieweeName: r.reviewee?.full_name ?? '—',
      type: r.type,
      responseEnd: r.cycle!.response_end,
      status: r.status,
    }));
}

export async function getMyOpenPdiActions(employeeId: string): Promise<MyOpenPdiAction[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('development_plan_actions')
    .select(`
      id, plan_id, title, due_date, status,
      plan:development_plans!plan_id(id, employee:employees!employee_id(full_name))
    `)
    .eq('responsible_employee_id', employeeId)
    .not('status', 'in', '("concluida","cancelada")')
    .order('due_date', { ascending: true });

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    plan_id: string;
    title: string;
    due_date: string;
    status: string;
    plan: { id: string; employee: { full_name: string } | null } | null;
  }>;

  const todayIso = new Date().toISOString().slice(0, 10);

  return rows.map((r) => ({
    id: r.id,
    planId: r.plan_id,
    title: r.title,
    dueDate: r.due_date,
    status: r.status,
    planEmployeeName: r.plan?.employee?.full_name ?? '—',
    isOverdue: r.due_date < todayIso && r.status !== 'concluida' && r.status !== 'cancelada',
  }));
}

export async function getMyRecentFeedbacks(employeeId: string, limit = 5): Promise<MyRecentFeedback[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('feedbacks')
    .select(`
      id, type, content, created_at, visibility,
      author:employees!author_id(full_name),
      competency:competencies!competency_id(name)
    `)
    .eq('recipient_id', employeeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  const rows = (data ?? []) as unknown as Array<{
    id: string;
    type: string;
    content: string;
    created_at: string;
    visibility: string;
    author: { full_name: string } | null;
    competency: { name: string } | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    createdAt: r.created_at,
    authorName: r.author?.full_name ?? null,
    competencyName: r.competency?.name ?? null,
    excerpt: r.content.length > 160 ? `${r.content.slice(0, 160)}…` : r.content,
  }));
}

export async function getMyCurrentPdi(employeeId: string): Promise<MyCurrentPdi | null> {
  const supabase = await createServerSupabaseClient();
  const { data: plans } = await supabase
    .from('development_plans')
    .select(`
      id, objective, due_date, status,
      competency:competencies!competency_id(name)
    `)
    .eq('employee_id', employeeId)
    .in('status', ['nao_iniciado', 'em_andamento'])
    .is('deleted_at', null)
    .order('due_date', { ascending: true })
    .limit(1);

  const plan = (plans ?? [])[0] as unknown as {
    id: string;
    objective: string;
    due_date: string;
    status: string;
    competency: { name: string } | null;
  } | undefined;
  if (!plan) return null;

  const { data: actions } = await supabase
    .from('development_plan_actions')
    .select('status')
    .eq('plan_id', plan.id);

  const total = actions?.length ?? 0;
  const done = (actions ?? []).filter((a) => a.status === 'concluida').length;

  return {
    id: plan.id,
    objective: plan.objective,
    dueDate: plan.due_date,
    status: plan.status,
    totalActions: total,
    doneActions: done,
    competencyName: plan.competency?.name ?? null,
  };
}
