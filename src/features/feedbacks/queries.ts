import { createServerSupabaseClient } from '@/lib/supabase/server';

export type FeedbackRow = {
  id: string;
  company_id: string;
  sender_id: string;
  recipient_id: string;
  type: string;
  competency_id: string | null;
  message: string;
  visibility: string;
  read_at: string | null;
  created_at: string;
  deleted_at: string | null;
  sender: { id: string; full_name: string; status: string; position: { id: string; name: string } | null } | null;
  recipient: { id: string; full_name: string; status: string; position: { id: string; name: string } | null } | null;
  competency: { id: string; name: string } | null;
};

const BASE_SELECT = `
  id, company_id, sender_id, recipient_id, type, competency_id, message, visibility,
  read_at, created_at, deleted_at,
  sender:employees!sender_id(id, full_name, status, position:positions(id, name)),
  recipient:employees!recipient_id(id, full_name, status, position:positions(id, name)),
  competency:competencies(id, name)
`;

export async function listMyReceivedFeedbacks(employeeId: string): Promise<FeedbackRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('feedbacks')
    .select(BASE_SELECT)
    .eq('recipient_id', employeeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as FeedbackRow[];
}

export async function listMySentFeedbacks(employeeId: string): Promise<FeedbackRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('feedbacks')
    .select(BASE_SELECT)
    .eq('sender_id', employeeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as FeedbackRow[];
}

export async function listTeamFeedbacks(descendantIds: string[]): Promise<FeedbackRow[]> {
  if (descendantIds.length === 0) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('feedbacks')
    .select(BASE_SELECT)
    .in('recipient_id', descendantIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as FeedbackRow[];
}

export async function listFeedbacksForEmployee(employeeId: string): Promise<FeedbackRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('feedbacks')
    .select(BASE_SELECT)
    .eq('recipient_id', employeeId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as FeedbackRow[];
}

export async function listFeedbacksForReviewee(
  employeeId: string,
  periodStart: string,
  periodEnd: string,
): Promise<FeedbackRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('feedbacks')
    .select(BASE_SELECT)
    .eq('recipient_id', employeeId)
    .is('deleted_at', null)
    .gte('created_at', `${periodStart}T00:00:00Z`)
    .lte('created_at', `${periodEnd}T23:59:59Z`)
    .order('created_at', { ascending: false })
    .limit(10);
  return (data ?? []) as unknown as FeedbackRow[];
}

export async function countUnreadFeedbacks(employeeId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from('feedbacks')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', employeeId)
    .is('deleted_at', null)
    .is('read_at', null);
  return count ?? 0;
}

export async function listDeletedFeedbacksForAudit(companyId: string): Promise<FeedbackRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('feedbacks')
    .select(BASE_SELECT)
    .eq('company_id', companyId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
    .limit(50);
  return (data ?? []) as unknown as FeedbackRow[];
}
