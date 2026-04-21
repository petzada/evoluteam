import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getCandidateById } from '@/features/recruitment/queries/candidates';
import {
  listApplicationsByCandidate,
  listStageHistoryByCandidate,
} from '@/features/recruitment/queries/applications';
import { listFeedbacksByCandidate } from '@/features/recruitment/queries/feedbacks';
import {
  canManageCandidates, canGiveFeedback,
} from '@/features/recruitment/permissions';
import { CandidateProfile } from '@/features/recruitment/components/CandidateProfile';
import { BreadcrumbLabel } from '@/features/shell/components/BreadcrumbLabel';

type Params = Promise<{ id: string }>;

export default async function CandidatoPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const { data: employeeRow } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .eq('company_id', profile.company_id)
    .maybeSingle();

  const actor = { role: profile.role, employeeId: employeeRow?.id ?? null };

  const candidate = await getCandidateById(id);
  if (!candidate) notFound();

  const [applications, history, feedbacks] = await Promise.all([
    listApplicationsByCandidate(id),
    listStageHistoryByCandidate(id),
    listFeedbacksByCandidate(id),
  ]);

  // Link bidirecional — nome do employee hired (se existir)
  let hiredEmployeeName: string | null = null;
  if (candidate.hired_employee_id) {
    const admin = createAdminSupabaseClient();
    const { data: emp } = await admin
      .from('employees')
      .select('full_name')
      .eq('id', candidate.hired_employee_id)
      .maybeSingle();
    hiredEmployeeName = emp?.full_name ?? null;
  }

  // Quais aplicações pertencem a vagas cujo gestor é o actor atual
  // (pra controlar permissão de feedback)
  const ownedByGestor = new Set<string>();
  if (actor.role === 'user' && actor.employeeId) {
    const admin = createAdminSupabaseClient();
    const { data: owned } = await admin
      .from('job_applications')
      .select('id, job_opening:job_openings!job_opening_id(hiring_manager_id)')
      .eq('candidate_id', id);
    for (const row of owned ?? []) {
      const mgrId = (row.job_opening as unknown as { hiring_manager_id: string | null } | null)?.hiring_manager_id;
      if (mgrId === actor.employeeId) ownedByGestor.add(row.id);
    }
  }

  return (
    <>
      <BreadcrumbLabel segment={id} label={candidate.name} />
      <CandidateProfile
        candidate={candidate}
        applications={applications}
        history={history}
        feedbacks={feedbacks}
        hiredEmployeeName={hiredEmployeeName}
        canManage={canManageCandidates(actor)}
        canGiveFeedback={canGiveFeedback(actor)}
        currentEmployeeId={actor.employeeId}
        isAdmin={actor.role === 'admin_rh'}
        applicationsOwnedByCurrentGestor={ownedByGestor}
      />
    </>
  );
}
