import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  listEmployees, getPositions, getDepartments, getCompanyProfileRoles,
} from '@/features/employees/queries';
import { EmployeesList } from '@/features/employees/components/EmployeesList';
import { loadActorRhPermissions } from '@/features/permissions/queries';
import { hasAdminPower } from '@/features/permissions/permissions';

export default async function ColaboradoresNovoPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const actorRhPermissions = await loadActorRhPermissions(user.id, profile.role);
  const actor = { role: profile.role, rhPermissions: actorRhPermissions };
  const canOpenNovo =
    hasAdminPower(actor, 'can_employees') || hasAdminPower(actor, 'can_invites');
  if (!canOpenNovo) redirect('/colaboradores');

  const [employees, positions, departments, profileRoles] = await Promise.all([
    listEmployees(profile.company_id),
    getPositions(profile.company_id),
    getDepartments(profile.company_id),
    getCompanyProfileRoles(profile.company_id),
  ]);

  return (
    <EmployeesList
      employees={employees as Parameters<typeof EmployeesList>[0]['employees']}
      positions={positions}
      departments={departments}
      currentUserId={user.id}
      isAdmin
      profileRoles={profileRoles}
      openSheet
    />
  );
}
