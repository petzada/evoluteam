import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  countUnreadFeedbacks, listMyReceivedFeedbacks, listMySentFeedbacks,
  listTeamFeedbacks, listCompanyFeedbacks,
} from '@/features/feedbacks/queries';
import { FeedbacksPage } from '@/features/feedbacks/components/FeedbacksPage';
import { getEmployeeDescendants } from '@/features/employees/queries';
import { getEligibleEmployees } from '@/features/reviews/queries';
import { canDo } from '@/features/permissions/permissions';
import { getActorContext } from '@/features/auth/context';

export default async function FeedbacksRoute({
  searchParams,
}: {
  searchParams?: Promise<{ novo?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const { profile, employee, gate } = await getActorContext();
  const supabase = await createServerSupabaseClient();
  const actor = { role: profile.role, ...gate };
  const currentEmployeeId = employee?.id ?? null;
  const canReadCompany = canDo(actor, 'feedbacks', 'view');

  const descendants = currentEmployeeId
    ? await getEmployeeDescendants(currentEmployeeId)
    : [];

  const [received, sent, team, company, unread, employees, { data: competencies }] = await Promise.all([
    currentEmployeeId ? listMyReceivedFeedbacks(currentEmployeeId) : Promise.resolve([]),
    currentEmployeeId ? listMySentFeedbacks(currentEmployeeId) : Promise.resolve([]),
    descendants.length > 0 ? listTeamFeedbacks(descendants) : Promise.resolve([]),
    canReadCompany ? listCompanyFeedbacks(profile.company_id) : Promise.resolve([]),
    currentEmployeeId ? countUnreadFeedbacks(currentEmployeeId) : Promise.resolve(0),
    getEligibleEmployees(profile.company_id),
    supabase
      .from('competencies')
      .select('id, name')
      .eq('company_id', profile.company_id)
      .eq('is_archived', false)
      .order('name'),
  ]);

  return (
    <FeedbacksPage
      received={received}
      sent={sent}
      team={team}
      hasTeam={descendants.length > 0}
      company={company}
      canReadCompany={canReadCompany}
      employees={employees as Parameters<typeof FeedbacksPage>[0]['employees']}
      competencies={competencies ?? []}
      currentEmployeeId={currentEmployeeId}
      isAdmin={canDo(actor, 'feedbacks', 'edit')}
      initialOpenSheet={params.novo === '1'}
      unreadCount={unread}
    />
  );
}
