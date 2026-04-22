import { notFound, redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import { getDepartments, getPositions } from '@/features/employees/queries';
import {
  getJobOpeningById, listHiringManagerOptions,
} from '@/features/recruitment/queries/jobOpenings';
import { canManageJobOpenings } from '@/features/recruitment/permissions';
import { EditarVagaClient } from './EditarVagaClient';

type Params = Promise<{ id: string }>;

export default async function EditarVagaPage({ params }: { params: Params }) {
  const { id } = await params;
  const ctx = await getActorContext();
  const actor = {
    role: ctx.profile.role,
    employeeId: ctx.employee?.id ?? null,
    ...ctx.gate,
  };
  if (!canManageJobOpenings(actor)) redirect(`/recrutamento/vagas/${id}`);

  const job = await getJobOpeningById(id);
  if (!job) notFound();

  const [departments, positions, managers] = await Promise.all([
    getDepartments(ctx.profile.company_id),
    getPositions(ctx.profile.company_id),
    listHiringManagerOptions(ctx.profile.company_id),
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
