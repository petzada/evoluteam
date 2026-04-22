import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getActorContext } from '@/features/auth/context';
import {
  countUnreadFeedbacks, listMyReceivedFeedbacks, listMySentFeedbacks, listTeamFeedbacks,
} from '@/features/feedbacks/queries';
import { FeedbacksPage } from '@/features/feedbacks/components/FeedbacksPage';
import { getEmployeeDescendants } from '@/features/employees/queries';
import { getEligibleEmployees } from '@/features/reviews/queries';
import { canDo } from '@/features/permissions/permissions';

export default async function FeedbacksRoute({
  searchParams,
}: {
  searchParams?: Promise<{ novo?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const ctx = await getActorContext();
  const actor = { role: ctx.profile.role, ...ctx.gate };
  const currentEmployeeId = ctx.employee?.id ?? null;

  const descendants = currentEmployeeId
    ? await getEmployeeDescendants(currentEmployeeId)
    : [];

  const supabase = await createServerSupabaseClient();
  const [received, sent, team, unread, employees, { data: competencies }] = await Promise.all([
    currentEmployeeId ? listMyReceivedFeedbacks(currentEmployeeId) : Promise.resolve([]),
    currentEmployeeId ? listMySentFeedbacks(currentEmployeeId) : Promise.resolve([]),
    descendants.length > 0 ? listTeamFeedbacks(descendants) : Promise.resolve([]),
    currentEmployeeId ? countUnreadFeedbacks(currentEmployeeId) : Promise.resolve(0),
    getEligibleEmployees(ctx.profile.company_id),
    supabase
      .from('competencies')
      .select('id, name')
      .eq('company_id', ctx.profile.company_id)
      .eq('is_archived', false)
      .order('name'),
  ]);

  return (
    <FeedbacksPage
      received={received}
      sent={sent}
      team={team}
      hasTeam={descendants.length > 0}
      employees={employees as Parameters<typeof FeedbacksPage>[0]['employees']}
      competencies={competencies ?? []}
      currentEmployeeId={currentEmployeeId}
      isAdmin={canDo(actor, 'feedbacks', 'edit')}
      initialOpenSheet={params.novo === '1'}
      unreadCount={unread}
    />
  );
}
