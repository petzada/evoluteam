import { redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import { getDepartments, getPositions } from '@/features/employees/queries';
import {
  listJobOpenings,
  listHiringManagerOptions,
} from '@/features/recruitment/queries/jobOpenings';
import { canManageJobOpenings, canViewAllJobOpenings, canViewAssignedJobOpenings } from '@/features/recruitment/permissions';
import { JobOpeningsTable } from '@/features/recruitment/components/JobOpeningsTable';

export default async function VagasPage() {
  const ctx = await getActorContext();
  const actor = {
    role: ctx.profile.role,
    employeeId: ctx.employee?.id ?? null,
    isHiringManager: ctx.isHiringManager,
    ...ctx.gate,
  };

  if (!canViewAllJobOpenings(actor) && !canViewAssignedJobOpenings(actor)) {
    redirect('/dashboard');
  }

  const [jobs, departments, positions, managers] = await Promise.all([
    listJobOpenings(ctx.profile.company_id),
    getDepartments(ctx.profile.company_id),
    getPositions(ctx.profile.company_id),
    listHiringManagerOptions(ctx.profile.company_id),
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
