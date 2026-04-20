import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listEmployees, getPositions, getDepartments } from '@/features/employees/queries';
import { EmployeesList } from '@/features/employees/components/EmployeesList';

export default async function ColaboradoresPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const [employees, positions, departments] = await Promise.all([
    listEmployees(profile.company_id),
    getPositions(profile.company_id),
    getDepartments(profile.company_id),
  ]);

  return (
    <EmployeesList
      employees={employees as Parameters<typeof EmployeesList>[0]['employees']}
      positions={positions}
      departments={departments}
      currentUserId={user.id}
      isAdmin={profile.role === 'admin_rh'}
    />
  );
}
