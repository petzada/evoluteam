import { createServerSupabaseClient } from '@/lib/supabase/server';

export type TaskRow = {
  id: string;
  application_id: string;
  title: string;
  due_date: string | null;
  responsible_id: string;
  created_by: string;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
  responsible: { id: string; full_name: string } | null;
  creator: { id: string; full_name: string } | null;
};

const TASK_SELECT = `
  id, application_id, title, due_date, responsible_id, created_by,
  completed_at, completed_by, created_at, updated_at,
  responsible:employees!responsible_id(id, full_name),
  creator:employees!created_by(id, full_name)
`;

export async function listTasksByCandidate(candidateId: string): Promise<TaskRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data: apps } = await supabase
    .from('job_applications')
    .select('id')
    .eq('candidate_id', candidateId);
  const appIds = (apps ?? []).map((a: { id: string }) => a.id);
  if (appIds.length === 0) return [];
  const { data } = await supabase
    .from('candidate_tasks')
    .select(TASK_SELECT)
    .in('application_id', appIds)
    .is('deleted_at', null)
    .order('due_date', { ascending: true, nullsFirst: false });
  return (data ?? []) as unknown as TaskRow[];
}

/**
 * Lista tarefas ativas de todas as applications de uma vaga. Usado pelo
 * CandidateQuickSheet — consumer filtra por application_id em memória.
 */
export async function listTasksByJob(jobOpeningId: string): Promise<TaskRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data: apps } = await supabase
    .from('job_applications')
    .select('id')
    .eq('job_opening_id', jobOpeningId);
  const appIds = (apps ?? []).map((a: { id: string }) => a.id);
  if (appIds.length === 0) return [];
  const { data } = await supabase
    .from('candidate_tasks')
    .select(TASK_SELECT)
    .in('application_id', appIds)
    .is('deleted_at', null)
    .order('due_date', { ascending: true, nullsFirst: false });
  return (data ?? []) as unknown as TaskRow[];
}

export type TaskKanbanState = {
  total: number;
  completed: number;
  overdue: number;
  pending: number;
};

/**
 * Estado agregado de tarefas por aplicação — usado pro pill no card Kanban.
 */
export async function getTaskStatesByApplication(
  applicationIds: string[],
): Promise<Map<string, TaskKanbanState>> {
  const out = new Map<string, TaskKanbanState>();
  if (applicationIds.length === 0) return out;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('candidate_tasks')
    .select('application_id, due_date, completed_at')
    .in('application_id', applicationIds)
    .is('deleted_at', null);
  const now = new Date();
  for (const t of data ?? []) {
    const appId = t.application_id;
    const state = out.get(appId) ?? { total: 0, completed: 0, overdue: 0, pending: 0 };
    state.total += 1;
    if (t.completed_at) {
      state.completed += 1;
    } else {
      state.pending += 1;
      if (t.due_date && new Date(t.due_date) < now) {
        state.overdue += 1;
      }
    }
    out.set(appId, state);
  }
  return out;
}
