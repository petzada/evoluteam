import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { CandidateSource } from '../schema';

export type CandidateRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;
  resume_url: string | null;
  source: CandidateSource;
  source_other: string | null;
  notes: string | null;
  hired_employee_id: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  active_applications_count: number;
};

const CANDIDATE_SELECT = `
  id, name, email, phone, linkedin_url, resume_url, source, source_other,
  notes, hired_employee_id, archived_at, created_at, updated_at
`;

type RawCandidate = Omit<CandidateRow, 'active_applications_count'>;

async function attachActiveAppsCount(rows: RawCandidate[]): Promise<CandidateRow[]> {
  if (rows.length === 0) return [];
  const supabase = await createServerSupabaseClient();
  const ids = rows.map((r) => r.id);
  const { data: apps } = await supabase
    .from('job_applications')
    .select('candidate_id, status')
    .in('candidate_id', ids);
  const countByCand = new Map<string, number>();
  for (const a of apps ?? []) {
    if (a.status === 'in_progress') {
      countByCand.set(a.candidate_id, (countByCand.get(a.candidate_id) ?? 0) + 1);
    }
  }
  return rows.map((r) => ({ ...r, active_applications_count: countByCand.get(r.id) ?? 0 }));
}

export async function listCandidates(companyId: string): Promise<CandidateRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('candidates')
    .select(CANDIDATE_SELECT)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  return attachActiveAppsCount((data ?? []) as unknown as RawCandidate[]);
}

export async function getCandidateById(id: string): Promise<CandidateRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('candidates')
    .select(CANDIDATE_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;
  const [row] = await attachActiveAppsCount([data as unknown as RawCandidate]);
  return row;
}

export async function searchCandidatesByNameOrEmail(
  companyId: string,
  query: string,
  excludeJobId?: string,
): Promise<CandidateRow[]> {
  if (query.trim().length < 2) return [];
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('candidates')
    .select(CANDIDATE_SELECT)
    .eq('company_id', companyId)
    .is('archived_at', null)
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10);

  let rows = (data ?? []) as unknown as RawCandidate[];

  if (excludeJobId && rows.length > 0) {
    const { data: existing } = await supabase
      .from('job_applications')
      .select('candidate_id')
      .eq('job_opening_id', excludeJobId)
      .eq('status', 'in_progress')
      .in('candidate_id', rows.map((r) => r.id));
    const existingSet = new Set((existing ?? []).map((e: { candidate_id: string }) => e.candidate_id));
    rows = rows.filter((r) => !existingSet.has(r.id));
  }

  return attachActiveAppsCount(rows);
}
