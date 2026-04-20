import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getEmployeeByUserId } from '@/features/employees/queries';
import {
  getPdiDetail, listActionsForPlan, listCommentsForPlan,
} from '@/features/pdi/queries';
import { PdiDetail } from '@/features/pdi/components/PdiDetail';

export default async function PdiDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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

  const plan = await getPdiDetail(id);
  if (!plan) notFound();

  const role = profile.role as 'admin_rh' | 'director' | 'user';
  const isAdmin = role === 'admin_rh';
  const isDirector = role === 'director';

  const actorEmployee = await getEmployeeByUserId(user.id);
  const actorEmployeeId = actorEmployee?.id ?? null;

  const [actions, comments, { data: employees }, { data: competencies }, { data: cycles }] = await Promise.all([
    listActionsForPlan(plan.id),
    listCommentsForPlan(plan.id),
    supabase
      .from('employees')
      .select('id, full_name, email, status, position:positions(id, name)')
      .eq('company_id', profile.company_id)
      .in('status', ['active', 'inactive'])
      .order('full_name'),
    supabase
      .from('competencies')
      .select('id, name')
      .eq('company_id', profile.company_id)
      .eq('is_archived', false)
      .order('name'),
    supabase
      .from('review_cycles')
      .select('id, name, status')
      .eq('company_id', profile.company_id)
      .in('status', ['published', 'closed'])
      .order('created_at', { ascending: false }),
  ]);

  return (
    <PdiDetail
      plan={plan}
      actions={actions}
      comments={comments}
      employees={(employees ?? []) as Parameters<typeof PdiDetail>[0]['employees']}
      competencies={competencies ?? []}
      cycles={cycles ?? []}
      actorUserId={user.id}
      actorEmployeeId={actorEmployeeId}
      isAdmin={isAdmin}
      isDirector={isDirector}
    />
  );
}
