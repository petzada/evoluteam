import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getDepartments, getPositions } from '@/features/employees/queries';
import {
  getJobOpeningById, listHiringManagerOptions,
} from '@/features/recruitment/queries/jobOpenings';
import {
  listActiveApplicationsByJob,
  listArchivedApplicationsByJob,
} from '@/features/recruitment/queries/applications';
import { listActiveStages } from '@/features/recruitment/queries/stages';
import { countFeedbacksByApplication } from '@/features/recruitment/queries/feedbacks';
import {
  canManageJobOpenings, canMoveApplication,
  canGiveFeedback, canHireCandidate,
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

  const actor = { role: profile.role, employeeId: employeeRow?.id ?? null };

  const job = await getJobOpeningById(id);
  if (!job) notFound();

  const [stages, active, archived, positions, departments, managers] = await Promise.all([
    listActiveStages(profile.company_id),
    listActiveApplicationsByJob(id),
    listArchivedApplicationsByJob(id),
    getPositions(profile.company_id),
    getDepartments(profile.company_id),
    listHiringManagerOptions(profile.company_id),
  ]);

  const feedbackCounts = await countFeedbacksByApplication(active.map((a) => a.id));

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
        positions={positions}
        departments={departments}
        managers={managers}
        searchCandidatesAction={searchCandidatesAction}
      />
    </>
  );
}
