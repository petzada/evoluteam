import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getDepartments, getPositions } from '@/features/employees/queries';
import { loadActorGate } from '@/features/permissions/queries';
import {
  getJobOpeningById, listHiringManagerOptions,
} from '@/features/recruitment/queries/jobOpenings';
import { canManageJobOpenings } from '@/features/recruitment/permissions';
import { EditarVagaClient } from './EditarVagaClient';

type Params = Promise<{ id: string }>;

export default async function EditarVagaPage({ params }: { params: Params }) {
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

  const { data: employeeRow } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .eq('company_id', profile.company_id)
    .maybeSingle();

  const gate = await loadActorGate(user.id, profile.role);
  const actor = {
    role: profile.role,
    employeeId: employeeRow?.id ?? null,
    ...gate,
  };
  if (!canManageJobOpenings(actor)) redirect(`/recrutamento/vagas/${id}`);

  const job = await getJobOpeningById(id);
  if (!job) notFound();

  const [departments, positions, managers] = await Promise.all([
    getDepartments(profile.company_id),
    getPositions(profile.company_id),
    listHiringManagerOptions(profile.company_id),
  ]);

  return (
    <EditarVagaClient
      initial={{
        id: job.id,
        title: job.title,
        description: job.description,
        departmentId: job.department_id,
        positionId: job.position_id,
        hiringManagerId: job.hiring_manager_id,
        employmentType: job.employment_type,
        workplaceType: job.workplace_type,
        location: job.location,
        openPositions: job.open_positions,
      }}
      departments={departments}
      positions={positions}
      managers={managers}
    />
  );
}
