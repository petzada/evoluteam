import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  listEmployees, getPositions, getDepartments, getCompanyProfileRoles,
} from '@/features/employees/queries';
import { listEmployeesWithoutRecentFeedback } from '@/features/dashboard/queries';
import { EmployeesList } from '@/features/employees/components/EmployeesList';

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
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const params = await searchParams;
  const filter = params.filter === 'sem_feedback' ? 'sem_feedback' : null;

  const [employees, positions, departments, profileRoles, withoutFeedbackIds] = await Promise.all([
    listEmployees(profile.company_id),
    getPositions(profile.company_id),
    getDepartments(profile.company_id),
    getCompanyProfileRoles(profile.company_id),
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
      isAdmin={profile.role === 'admin_rh'}
      profileRoles={profileRoles}
      initialStatusFilter={params.status ?? null}
      specialFilter={filter}
      specialFilterEmployeeIds={withoutFeedbackIds}
    />
  );
}
