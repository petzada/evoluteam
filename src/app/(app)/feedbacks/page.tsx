import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  countUnreadFeedbacks, listMyReceivedFeedbacks, listMySentFeedbacks, listTeamFeedbacks,
} from '@/features/feedbacks/queries';
import { FeedbacksPage } from '@/features/feedbacks/components/FeedbacksPage';
import { getEmployeeByUserId, getEmployeeDescendants } from '@/features/employees/queries';
import { getEligibleEmployees } from '@/features/reviews/queries';
import { canDo } from '@/features/permissions/permissions';
import { loadActorGate } from '@/features/permissions/queries';

export default async function FeedbacksRoute({
  searchParams,
}: {
  searchParams?: Promise<{ novo?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const gate = await loadActorGate(user.id, profile.role);
  const actor = { role: profile.role, ...gate };

  const actorEmployee = await getEmployeeByUserId(user.id);
  const currentEmployeeId = actorEmployee?.id ?? null;

  const descendants = currentEmployeeId
    ? await getEmployeeDescendants(currentEmployeeId)
    : [];

  const [received, sent, team, unread, employees, { data: competencies }] = await Promise.all([
    currentEmployeeId ? listMyReceivedFeedbacks(currentEmployeeId) : Promise.resolve([]),
    currentEmployeeId ? listMySentFeedbacks(currentEmployeeId) : Promise.resolve([]),
    descendants.length > 0 ? listTeamFeedbacks(descendants) : Promise.resolve([]),
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
      employees={employees as Parameters<typeof FeedbacksPage>[0]['employees']}
      competencies={competencies ?? []}
      currentEmployeeId={currentEmployeeId}
      isAdmin={canDo(actor, 'feedbacks', 'edit')}
      initialOpenSheet={params.novo === '1'}
      unreadCount={unread}
    />
  );
}
