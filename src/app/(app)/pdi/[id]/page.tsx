import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getPdiDetail, listActionsForPlan, listCommentsForPlan,
} from '@/features/pdi/queries';
import { PdiDetail } from '@/features/pdi/components/PdiDetail';
import { BreadcrumbLabel } from '@/features/shell/components/BreadcrumbLabel';
import { canDo } from '@/features/permissions/permissions';
import { getActorContext } from '@/features/auth/context';

export default async function PdiDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { user, profile, employee, gate } = await getActorContext();
  const supabase = await createServerSupabaseClient();
  const actor = { role: profile.role, ...gate };
  const isAdmin = canDo(actor, 'pdi', 'edit');
  const isDirector = profile.role === 'director';
  const actorEmployeeId = employee?.id ?? null;

  const plan = await getPdiDetail(id);
  if (!plan) notFound();

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
    <>
      <BreadcrumbLabel segment={id} label={plan.employee ? `PDI de ${plan.employee.full_name}` : 'PDI'} />
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
    </>
  );
}
