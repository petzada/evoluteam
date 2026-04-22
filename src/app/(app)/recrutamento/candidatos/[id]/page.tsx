import { notFound, redirect } from 'next/navigation';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { getActorContext } from '@/features/auth/context';
import { getCandidateById } from '@/features/recruitment/queries/candidates';
import {
  listApplicationsByCandidate,
  listStageHistoryByCandidate,
} from '@/features/recruitment/queries/applications';
import { listFeedbacksByCandidate } from '@/features/recruitment/queries/feedbacks';
import { listScorecardsByCandidate } from '@/features/recruitment/queries/scorecards';
import { listTasksByCandidate } from '@/features/recruitment/queries/tasks';
import { listHiringManagerOptions } from '@/features/recruitment/queries/jobOpenings';
import {
  canManageCandidates, canGiveFeedback, canManageRecruitment,
  canViewAllCandidates, canViewAssignedCandidates,
} from '@/features/recruitment/permissions';
import { CandidateProfile } from '@/features/recruitment/components/CandidateProfile';
import { BreadcrumbLabel } from '@/features/shell/components/BreadcrumbLabel';

type Params = Promise<{ id: string }>;

export default async function CandidatoPage({ params }: { params: Params }) {
  const { id } = await params;
  const ctx = await getActorContext();
  const actor = {
    role: ctx.profile.role,
    employeeId: ctx.employee?.id ?? null,
    isHiringManager: ctx.isHiringManager,
    ...ctx.gate,
  };

  if (!canViewAllCandidates(actor) && !canViewAssignedCandidates(actor)) {
    redirect('/dashboard');
  }

  const candidate = await getCandidateById(id);
  if (!candidate) notFound();

  const [applications, history, feedbacks, scorecards, tasks, responsibleOptions] = await Promise.all([
    listApplicationsByCandidate(id),
    listStageHistoryByCandidate(id),
    listFeedbacksByCandidate(id),
    listScorecardsByCandidate(id),
    listTasksByCandidate(id),
    listHiringManagerOptions(ctx.profile.company_id),
  ]);

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
        scorecards={scorecards}
        tasks={tasks}
        hiredEmployeeName={hiredEmployeeName}
        canManage={canManageCandidates(actor)}
        canGiveFeedback={canGiveFeedback(actor)}
        currentEmployeeId={actor.employeeId}
        isAdmin={canManageRecruitment(actor)}
        applicationsOwnedByCurrentGestor={ownedByGestor}
        responsibleOptions={responsibleOptions}
      />
    </>
  );
}
