import { redirect } from 'next/navigation';
import {
  listEmployees, getPositions, getDepartments, getCompanyProfileAccess,
} from '@/features/employees/queries';
import { EmployeesList } from '@/features/employees/components/EmployeesList';
import { canDo } from '@/features/permissions/permissions';
import { getActorContext } from '@/features/auth/context';

export default async function ColaboradoresNovoPage() {
  const { user, profile, gate } = await getActorContext();
  const actor = { role: profile.role, ...gate };
  const canManageEmployees = canDo(actor, 'colaboradores', 'edit');
  if (!canManageEmployees) redirect('/colaboradores');

  const [employees, positions, departments, profileAccess] = await Promise.all([
    listEmployees(profile.company_id),
    getPositions(profile.company_id),
    getDepartments(profile.company_id),
    getCompanyProfileAccess(profile.company_id),
  ]);

  return (
    <EmployeesList
      employees={employees as Parameters<typeof EmployeesList>[0]['employees']}
      positions={positions}
      departments={departments}
      currentUserId={user.id}
      canManageEmployees
      actorIsAdmin={profile.role === 'admin_rh'}
      actorScreenPermissions={gate.screenPermissions}
      profileAccess={profileAccess}
      openSheet
    />
  );
}
