import { redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import {
  listEmployees, getPositions, getDepartments, getCompanyProfileRoles,
  getEmployeeDescendants,
} from '@/features/employees/queries';
import { listEmployeesWithoutRecentFeedback } from '@/features/dashboard/queries';
import { EmployeesList } from '@/features/employees/components/EmployeesList';
import { canDo } from '@/features/permissions/permissions';

type SearchParams = Promise<{
  status?: string;
  department?: string;
  position?: string;
  filter?: string;
}>;

export default async function ColaboradoresPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const ctx = await getActorContext();
  const params = await searchParams;
  const filter = params.filter === 'sem_feedback' ? 'sem_feedback' : null;

  const actorForGate = { role: ctx.profile.role, ...ctx.gate };

  // canDo('colaboradores', 'view') cobre admin_rh, director e user/rh com toggle.
  const canSeeAll = canDo(actorForGate, 'colaboradores', 'view');
  let scopedIds: string[] | null = null;

  if (!canSeeAll) {
    const actorId = ctx.employee?.id ?? null;
    if (!actorId) redirect('/dashboard');
    const descendants = await getEmployeeDescendants(actorId);
    const visible = Array.from(new Set([actorId, ...descendants]));
    if (visible.length === 1) {
      redirect(`/colaboradores/${actorId}`);
    }
    scopedIds = visible;
  }

  const [employees, positions, departments, profileRoles, withoutFeedbackIds] = await Promise.all([
    listEmployees(ctx.profile.company_id, { scopedIds }),
    getPositions(ctx.profile.company_id),
    getDepartments(ctx.profile.company_id),
    getCompanyProfileRoles(ctx.profile.company_id),
    filter === 'sem_feedback'
      ? listEmployeesWithoutRecentFeedback(ctx.profile.company_id)
      : Promise.resolve<string[]>([]),
  ]);

  return (
    <EmployeesList
      employees={employees as Parameters<typeof EmployeesList>[0]['employees']}
      positions={positions}
      departments={departments}
      currentUserId={ctx.user.id}
      canManageEmployees={canDo(actorForGate, 'colaboradores', 'edit')}
      actorIsAdmin={ctx.profile.role === 'admin_rh'}
      actorScreenPermissions={ctx.gate.screenPermissions}
      profileRoles={profileRoles}
      initialStatusFilter={params.status ?? null}
      specialFilter={filter}
      specialFilterEmployeeIds={withoutFeedbackIds}
    />
  );
}
