import { createServerSupabaseClient } from '@/lib/supabase/server';

export type RecruitmentSource = {
  candidateId: string;
  jobOpeningId: string;
  jobTitle: string;
  hiredAt: string;
};

/**
 * Pra um employee criado via wizard de contratação (Onda 2),
 * retorna dados do processo seletivo de origem. Null se não veio
 * de recrutamento.
 *
 * Spec 15 §6.5.
 */
export async function getRecruitmentSourceForEmployee(
  employeeId: string,
): Promise<RecruitmentSource | null> {
  const supabase = await createServerSupabaseClient();
  const { data: candidate } = await supabase
    .from('candidates')
    .select('id')
    .eq('hired_employee_id', employeeId)
    .maybeSingle();
  if (!candidate) return null;

  const { data: app } = await supabase
    .from('job_applications')
    .select(`
      id, job_opening_id, updated_at,
      job_opening:job_openings(title)
    `)
    .eq('candidate_id', candidate.id)
    .eq('status', 'hired')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!app) return null;

  const title = (app.job_opening as unknown as { title: string } | null)?.title ?? '—';
  return {
    candidateId: candidate.id,
    jobOpeningId: app.job_opening_id,
    jobTitle: title,
    hiredAt: app.updated_at,
  };
}
