import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { ApplicationStatus, RejectionReason, WithdrawalReason } from '../schema';

export type ApplicationRow = {
  id: string;
  job_opening_id: string;
  candidate_id: string;
  current_stage_id: string;
  status: ApplicationStatus;
  rejection_reason: RejectionReason | null;
  withdrawal_reason: WithdrawalReason | null;
  reason_other: string | null;
  frozen_reason_notes: string | null;
  stage_entered_at: string;
  created_at: string;
  updated_at: string;
  candidate: {
    id: string;
    name: string;
    email: string;
    source: string;
    source_other: string | null;
  } | null;
  current_stage: { id: string; name: string; kind: string; position: number } | null;
  job_opening: { id: string; title: string } | null;
};

const APPLICATION_SELECT = `
  id, job_opening_id, candidate_id, current_stage_id, status,
  rejection_reason, withdrawal_reason, reason_other, frozen_reason_notes,
  stage_entered_at, created_at, updated_at,
  candidate:candidates(id, name, email, source, source_other),
  current_stage:recruitment_stages!current_stage_id(id, name, kind, position),
  job_opening:job_openings(id, title)
`;

export async function listActiveApplicationsByJob(jobOpeningId: string): Promise<ApplicationRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('job_applications')
    .select(APPLICATION_SELECT)
    .eq('job_opening_id', jobOpeningId)
    .eq('status', 'in_progress')
    .order('stage_entered_at', { ascending: true });
  return (data ?? []) as unknown as ApplicationRow[];
}

export async function listArchivedApplicationsByJob(jobOpeningId: string): Promise<ApplicationRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('job_applications')
    .select(APPLICATION_SELECT)
    .eq('job_opening_id', jobOpeningId)
    .neq('status', 'in_progress')
    .order('updated_at', { ascending: false });
  return (data ?? []) as unknown as ApplicationRow[];
}

export async function listApplicationsByCandidate(candidateId: string): Promise<ApplicationRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('job_applications')
    .select(APPLICATION_SELECT)
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as ApplicationRow[];
}

export async function getApplicationById(id: string): Promise<ApplicationRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('job_applications')
    .select(APPLICATION_SELECT)
    .eq('id', id)
    .maybeSingle();
  return data as unknown as ApplicationRow | null;
}

// ============================================================
// Stage history (timeline do perfil do candidato)
// ============================================================

export type StageHistoryRow = {
  id: string;
  application_id: string;
  from_stage_id: string | null;
  to_stage_id: string | null;
  status_change: { from: ApplicationStatus; to: ApplicationStatus } | null;
  reason_code: string | null;
  reason_notes: string | null;
  changed_at: string;
  changed_by: string | null;
  from_stage: { id: string; name: string } | null;
  to_stage: { id: string; name: string } | null;
  changed_by_profile: { id: string; full_name: string | null } | null;
};

export async function listStageHistoryByCandidate(candidateId: string): Promise<StageHistoryRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data: apps } = await supabase
    .from('job_applications')
    .select('id')
    .eq('candidate_id', candidateId);
  const appIds = (apps ?? []).map((a: { id: string }) => a.id);
  if (appIds.length === 0) return [];
  const { data } = await supabase
    .from('candidate_stage_history')
    .select(`
      id, application_id, from_stage_id, to_stage_id, status_change,
      reason_code, reason_notes, changed_at, changed_by,
      from_stage:recruitment_stages!from_stage_id(id, name),
      to_stage:recruitment_stages!to_stage_id(id, name),
      changed_by_profile:profiles!changed_by(id, full_name)
    `)
    .in('application_id', appIds)
    .eq('synthetic', false)
    .order('changed_at', { ascending: false });
  return (data ?? []) as unknown as StageHistoryRow[];
}
