import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { FeedbackRecommendation } from '../schema';

export type CandidateFeedbackRow = {
  id: string;
  application_id: string;
  stage_id: string;
  author_id: string;
  content: string;
  recommendation: FeedbackRecommendation | null;
  created_at: string;
  updated_at: string;
  author: { id: string; full_name: string } | null;
  stage: { id: string; name: string } | null;
};

const FEEDBACK_SELECT = `
  id, application_id, stage_id, author_id, content, recommendation,
  created_at, updated_at,
  author:employees!author_id(id, full_name),
  stage:recruitment_stages!stage_id(id, name)
`;

export async function listFeedbacksByCandidate(candidateId: string): Promise<CandidateFeedbackRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data: apps } = await supabase
    .from('job_applications')
    .select('id')
    .eq('candidate_id', candidateId);
  const appIds = (apps ?? []).map((a: { id: string }) => a.id);
  if (appIds.length === 0) return [];

  const { data } = await supabase
    .from('candidate_feedbacks')
    .select(FEEDBACK_SELECT)
    .in('application_id', appIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as CandidateFeedbackRow[];
}

export async function listFeedbacksByApplication(applicationId: string): Promise<CandidateFeedbackRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('candidate_feedbacks')
    .select(FEEDBACK_SELECT)
    .eq('application_id', applicationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as CandidateFeedbackRow[];
}

/**
 * Mapa applicationId -> count de feedbacks ativos (pra badge 💬 N no Kanban).
 */
export async function countFeedbacksByApplication(
  applicationIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (applicationIds.length === 0) return out;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('candidate_feedbacks')
    .select('application_id')
    .in('application_id', applicationIds)
    .is('deleted_at', null);
  for (const f of data ?? []) {
    out.set(f.application_id, (out.get(f.application_id) ?? 0) + 1);
  }
  return out;
}
