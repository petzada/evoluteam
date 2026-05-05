import { notFound, redirect } from 'next/navigation';
import { getDepartments, getPositions } from '@/features/employees/queries';
import { getUnits } from '@/features/units/queries';
import {
  getJobOpeningById,
  listHiringManagerOptions,
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
  canViewAllJobOpenings, canViewAssignedJobOpenings,
} from '@/features/recruitment/permissions';
import { JobOpeningDetail } from '@/features/recruitment/components/JobOpeningDetail';
import { BreadcrumbLabel } from '@/features/shell/components/BreadcrumbLabel';
import { getActorContext } from '@/features/auth/context';
import { searchCandidatesAction } from '../../_actions/searchCandidatesAction';

type Params = Promise<{ id: string }>;

export default async function VagaDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const { profile, employee, isHiringManager, gate } = await getActorContext();
  const actor = {
    role: profile.role,
    employeeId: employee?.id ?? null,
    isHiringManager,
    ...gate,
  };

  if (!canViewAllJobOpenings(actor) && !canViewAssignedJobOpenings(actor)) {
    redirect('/dashboard');
  }

  const job = await getJobOpeningById(id);
  if (!job) notFound();
  const actorForJob = {
    ...actor,
    isHiringManager: actor.employeeId === job.hiring_manager_id,
  };

  const [active, archived, positions, departments, units, managers] = await Promise.all([
    listActiveApplicationsByJob(id),
    listArchivedApplicationsByJob(id),
    getPositions(profile.company_id),
    getDepartments(profile.company_id),
    // FT-10: apenas unidades ativas — wizard de contratacao cria com unidade nova/ativa.
    getUnits(profile.company_id),
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
        canManage={canManageJobOpenings(actorForJob)}
        canMove={canMoveApplication(actorForJob)}
        canGiveFeedback={canGiveFeedback(actorForJob)}
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
        units={units}
        canCreateUnits={profile.role === 'admin_rh' || gate.screenPermissions?.['unidades.edit'] === true}
        managers={managers}
        searchCandidatesAction={searchCandidatesAction}
      />
    </>
  );
}
