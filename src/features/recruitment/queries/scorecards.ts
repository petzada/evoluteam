import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { FeedbackRecommendation, SalaryExpectation } from '../schema';

export type ScorecardRow = {
  id: string;
  application_id: string;
  stage_id: string;
  author_id: string;
  rating_communication: number;
  rating_experience: number;
  rating_role_fit: number;
  rating_culture_fit: number;
  salary_expectation: SalaryExpectation | null;
  comment: string | null;
  recommendation: FeedbackRecommendation;
  created_at: string;
  updated_at: string;
  author: { id: string; full_name: string } | null;
  stage: { id: string; name: string } | null;
};

const SCORECARD_SELECT = `
  id, application_id, stage_id, author_id,
  rating_communication, rating_experience, rating_role_fit, rating_culture_fit,
  salary_expectation, comment, recommendation,
  created_at, updated_at,
  author:employees!author_id(id, full_name),
  stage:recruitment_stages!stage_id(id, name)
`;

export async function listScorecardsByCandidate(candidateId: string): Promise<ScorecardRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data: apps } = await supabase
    .from('job_applications')
    .select('id')
    .eq('candidate_id', candidateId);
  const appIds = (apps ?? []).map((a: { id: string }) => a.id);
  if (appIds.length === 0) return [];

  const { data } = await supabase
    .from('candidate_scorecards')
    .select(SCORECARD_SELECT)
    .in('application_id', appIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as ScorecardRow[];
}

/**
 * Lista scorecards ativos de todas as applications de uma vaga. Usado pelo
 * CandidateQuickSheet — consumer filtra por application_id em memória.
 */
export async function listScorecardsByJob(jobOpeningId: string): Promise<ScorecardRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data: apps } = await supabase
    .from('job_applications')
    .select('id')
    .eq('job_opening_id', jobOpeningId);
  const appIds = (apps ?? []).map((a: { id: string }) => a.id);
  if (appIds.length === 0) return [];

  const { data } = await supabase
    .from('candidate_scorecards')
    .select(SCORECARD_SELECT)
    .in('application_id', appIds)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as ScorecardRow[];
}

export async function countScorecardsByApplication(
  applicationIds: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (applicationIds.length === 0) return out;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('candidate_scorecards')
    .select('application_id')
    .in('application_id', applicationIds)
    .is('deleted_at', null);
  for (const s of data ?? []) {
    out.set(s.application_id, (out.get(s.application_id) ?? 0) + 1);
  }
  return out;
}
