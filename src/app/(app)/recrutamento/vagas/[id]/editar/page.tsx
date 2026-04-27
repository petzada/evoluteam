import { notFound, redirect } from 'next/navigation';
import { getDepartments, getPositions } from '@/features/employees/queries';
import {
  getJobOpeningById, listHiringManagerOptions,
} from '@/features/recruitment/queries/jobOpenings';
import { canManageJobOpenings } from '@/features/recruitment/permissions';
import { canDo } from '@/features/permissions/permissions';
import { getActorContext } from '@/features/auth/context';
import { EditarVagaClient } from './EditarVagaClient';

type Params = Promise<{ id: string }>;

export default async function EditarVagaPage({ params }: { params: Params }) {
  const { id } = await params;
  const { profile, employee, gate } = await getActorContext();
  const actor = {
    role: profile.role,
    employeeId: employee?.id ?? null,
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
      canCreateDepartments={canDo(actor, 'departamentos', 'edit')}
      canCreatePositions={canDo(actor, 'cargos', 'edit')}
    />
  );
}
