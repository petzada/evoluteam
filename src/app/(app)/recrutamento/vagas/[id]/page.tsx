import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getDepartments, getPositions } from '@/features/employees/queries';
import { loadActorGate } from '@/features/permissions/queries';
import {
  getJobOpeningById, listHiringManagerOptions,
} from '@/features/recruitment/queries/jobOpenings';
import {
  listActiveApplicationsByJob,
  listArchivedApplicationsByJob,
} from '@/features/recruitment/queries/applications';
import { countFeedbacksByApplication, listFeedbacksByJob } from '@/features/recruitment/queries/feedbacks';
import { countScorecardsByApplication, listScorecardsByJob } from '@/features/recruitment/queries/scorecards';
import { getTaskStatesByApplication, listTasksByJob } from '@/features/recruitment/queries/tasks';
import {
  canManageJobOpenings, canMoveApplication,
  canGiveFeedback, canHireCandidate, canManageRecruitment,
} from '@/features/recruitment/permissions';
import { JobOpeningDetail } from '@/features/recruitment/components/JobOpeningDetail';
import { BreadcrumbLabel } from '@/features/shell/components/BreadcrumbLabel';
import { searchCandidatesAction } from '../../_actions/searchCandidatesAction';

type Params = Promise<{ id: string }>;

export default async function VagaDetailPage({ params }: { params: Params }) {
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

  const gate = await loadActorGate(user.id, profile.role);
  const actor = {
    role: profile.role,
    employeeId: employeeRow?.id ?? null,
    ...gate,
  };

  const job = await getJobOpeningById(id);
  if (!job) notFound();

  const [active, archived, positions, departments, managers] = await Promise.all([
    listActiveApplicationsByJob(id),
    listArchivedApplicationsByJob(id),
    getPositions(profile.company_id),
    getDepartments(profile.company_id),
    listHiringManagerOptions(profile.company_id),
  ]);
  const stages = job.pipeline_snapshot;

  const appIds = active.map((a) => a.id);
  const [feedbackCounts, scorecardCounts, taskStates, feedbacks, scorecards, tasks] = await Promise.all([
    countFeedbacksByApplication(appIds),
    countScorecardsByApplication(appIds),
    getTaskStatesByApplication(appIds),
    listFeedbacksByJob(id),
    listScorecardsByJob(id),
    listTasksByJob(id),
  ]);

  return (
    <>
      <BreadcrumbLabel segment={id} label={job.title} />
      <JobOpeningDetail
        job={job}
        stages={stages}
        activeApplications={active}
        archivedApplications={archived}
        canManage={canManageJobOpenings(actor)}
        canMove={canMoveApplication(actor)}
        canGiveFeedback={canGiveFeedback(actor)}
        canHire={canHireCandidate(actor)}
        feedbackCounts={feedbackCounts}
        scorecardCounts={scorecardCounts}
        taskStates={taskStates}
        feedbacks={feedbacks}
        scorecards={scorecards}
        tasks={tasks}
        currentEmployeeId={actor.employeeId}
        isAdmin={canManageRecruitment(actor)}
        positions={positions}
        departments={departments}
        managers={managers}
        searchCandidatesAction={searchCandidatesAction}
      />
    </>
  );
}
