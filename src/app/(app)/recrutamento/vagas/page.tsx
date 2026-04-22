import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getDepartments, getPositions } from '@/features/employees/queries';
import { loadActorRhPermissions } from '@/features/permissions/queries';
import { listJobOpenings, listHiringManagerOptions } from '@/features/recruitment/queries/jobOpenings';
import { canManageJobOpenings } from '@/features/recruitment/permissions';
import { JobOpeningsTable } from '@/features/recruitment/components/JobOpeningsTable';

export default async function VagasPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const { data: employeeRow } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .eq('company_id', profile.company_id)
    .maybeSingle();

  const actorRhPermissions = await loadActorRhPermissions(user.id, profile.role);
  const actor = {
    role: profile.role,
    employeeId: employeeRow?.id ?? null,
    rhPermissions: actorRhPermissions,
  };

  const [jobs, departments, positions, managers] = await Promise.all([
    listJobOpenings(profile.company_id),
    getDepartments(profile.company_id),
    getPositions(profile.company_id),
    listHiringManagerOptions(profile.company_id),
  ]);

  return (
    <JobOpeningsTable
      jobs={jobs}
      departments={departments}
      positions={positions}
      managers={managers}
      canCreate={canManageJobOpenings(actor)}
    />
  );
}
