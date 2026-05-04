import { redirect } from 'next/navigation';
import {
  listEmployees, getPositions, getDepartments, getCompanyProfileAccess,
  getEmployeeDescendants,
} from '@/features/employees/queries';
import { listEmployeesWithoutRecentFeedback } from '@/features/dashboard/queries';
import { EmployeesList } from '@/features/employees/components/EmployeesList';
import { canDo } from '@/features/permissions/permissions';
import { getActorContext } from '@/features/auth/context';

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
  const { user, profile, employee, gate } = await getActorContext();

  const params = await searchParams;
  const filter = params.filter === 'sem_feedback' ? 'sem_feedback' : null;

  const actorForGate = { role: profile.role, ...gate };

  // canDo('colaboradores', 'view') cobre admin_rh, director e user/rh com toggle.
  const canSeeAll = canDo(actorForGate, 'colaboradores', 'view');
  let scopedIds: string[] | null = null;

  if (!canSeeAll) {
    if (!employee?.id) redirect('/dashboard');
    const descendants = await getEmployeeDescendants(employee.id);
    const visible = Array.from(new Set([employee.id, ...descendants]));
    if (visible.length === 1) {
      redirect(`/colaboradores/${employee.id}`);
    }
    scopedIds = visible;
  }

  const [employees, positions, departments, profileAccess, withoutFeedbackIds] = await Promise.all([
    listEmployees(profile.company_id, { scopedIds }),
    getPositions(profile.company_id),
    getDepartments(profile.company_id),
    getCompanyProfileAccess(profile.company_id),
    filter === 'sem_feedback'
      ? listEmployeesWithoutRecentFeedback(profile.company_id)
      : Promise.resolve<string[]>([]),
  ]);

  return (
    <EmployeesList
      employees={employees as Parameters<typeof EmployeesList>[0]['employees']}
      positions={positions}
      departments={departments}
      currentUserId={user.id}
      canManageEmployees={canDo(actorForGate, 'colaboradores', 'edit')}
      actorIsAdmin={profile.role === 'admin_rh'}
      actorScreenPermissions={gate.screenPermissions}
      profileAccess={profileAccess}
      initialStatusFilter={params.status ?? null}
      specialFilter={filter}
      specialFilterEmployeeIds={withoutFeedbackIds}
    />
  );
}
