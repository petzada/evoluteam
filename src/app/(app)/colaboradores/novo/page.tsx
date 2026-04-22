import { redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import {
  listEmployees, getPositions, getDepartments, getCompanyProfileRoles,
} from '@/features/employees/queries';
import { EmployeesList } from '@/features/employees/components/EmployeesList';
import { canDo } from '@/features/permissions/permissions';

export default async function ColaboradoresNovoPage() {
  const ctx = await getActorContext();
  const actor = { role: ctx.profile.role, ...ctx.gate };
  const canManageEmployees = canDo(actor, 'colaboradores', 'edit');
  // FT-9: convite unificado com colaboradores.edit.
  if (!canManageEmployees) redirect('/colaboradores');

  const [employees, positions, departments, profileRoles] = await Promise.all([
    listEmployees(ctx.profile.company_id),
    getPositions(ctx.profile.company_id),
    getDepartments(ctx.profile.company_id),
    getCompanyProfileRoles(ctx.profile.company_id),
  ]);

  return (
    <EmployeesList
      employees={employees as Parameters<typeof EmployeesList>[0]['employees']}
      positions={positions}
      departments={departments}
      currentUserId={ctx.user.id}
      canManageEmployees
      actorIsAdmin={ctx.profile.role === 'admin_rh'}
      actorScreenPermissions={ctx.gate.screenPermissions}
      profileRoles={profileRoles}
      openSheet
    />
  );
}
