import { redirect } from 'next/navigation';
import { getDepartments, getPositions } from '@/features/employees/queries';
import {
  listJobOpenings,
  listHiringManagerOptions,
} from '@/features/recruitment/queries/jobOpenings';
import { canManageJobOpenings, canViewAllJobOpenings, canViewAssignedJobOpenings } from '@/features/recruitment/permissions';
import { JobOpeningsTable } from '@/features/recruitment/components/JobOpeningsTable';
import { getActorContext } from '@/features/auth/context';

export default async function VagasPage() {
  const { profile, employee, isHiringManager, gate } = await getActorContext();
  const actor = {
    role: profile.role,
    employeeId: employee?.id ?? null,
    isHiringManager,
    ...gate,
  };

  if (!canViewAllJobOpenings(actor) && !canViewAssignedJobOpenings(actor)) {
    redirect('/dashboard');
  }

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
