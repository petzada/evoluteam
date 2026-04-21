import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { JobOpeningStatus, JobOpeningEmploymentType, JobOpeningWorkplaceType } from '../schema';

export type JobOpeningRow = {
  id: string;
  title: string;
  description: string | null;
  department_id: string | null;
  position_id: string | null;
  hiring_manager_id: string | null;
  employment_type: JobOpeningEmploymentType;
  workplace_type: JobOpeningWorkplaceType;
  location: string | null;
  open_positions: number;
  status: JobOpeningStatus;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  department: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
  hiring_manager: { id: string; full_name: string } | null;
  active_candidates_count: number;
};

const JOB_OPENING_SELECT = `
  id, title, description, department_id, position_id, hiring_manager_id,
  employment_type, workplace_type, location, open_positions, status,
  closed_at, created_at, updated_at,
  department:departments(id, name),
  position:positions(id, name),
  hiring_manager:employees!hiring_manager_id(id, full_name)
`;

type RawJob = Omit<JobOpeningRow, 'active_candidates_count'>;

async function attachActiveCandidatesCount(rows: RawJob[]): Promise<JobOpeningRow[]> {
  if (rows.length === 0) return [];
  const supabase = await createServerSupabaseClient();
  const ids = rows.map((r) => r.id);
  const { data: apps } = await supabase
    .from('job_applications')
    .select('job_opening_id, status')
    .in('job_opening_id', ids);
  const countByJob = new Map<string, number>();
  for (const a of apps ?? []) {
    if (a.status === 'in_progress') {
      countByJob.set(a.job_opening_id, (countByJob.get(a.job_opening_id) ?? 0) + 1);
    }
  }
  return rows.map((r) => ({ ...r, active_candidates_count: countByJob.get(r.id) ?? 0 }));
}

export async function listJobOpenings(companyId: string): Promise<JobOpeningRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('job_openings')
    .select(JOB_OPENING_SELECT)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  return attachActiveCandidatesCount((data ?? []) as unknown as RawJob[]);
}

export async function getJobOpeningById(id: string): Promise<JobOpeningRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('job_openings')
    .select(JOB_OPENING_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (!data) return null;
  const [row] = await attachActiveCandidatesCount([data as unknown as RawJob]);
  return row;
}

export type HiringManagerOption = {
  id: string;
  full_name: string;
};

/**
 * Lista employees elegíveis como hiring_manager em formulários de vaga.
 * Por ora, retorna todos employees ativos da company.
 */
export async function listHiringManagerOptions(companyId: string): Promise<HiringManagerOption[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('full_name', { ascending: true });
  return (data ?? []) as HiringManagerOption[];
}
