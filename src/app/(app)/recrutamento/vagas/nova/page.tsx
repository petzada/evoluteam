import { redirect } from 'next/navigation';
import { getDepartments, getPositions } from '@/features/employees/queries';
import { canManageJobOpenings } from '@/features/recruitment/permissions';
import { listHiringManagerOptions } from '@/features/recruitment/queries/jobOpenings';
import { canDo } from '@/features/permissions/permissions';
import { getActorContext } from '@/features/auth/context';
import { NovaVagaClient } from './NovaVagaClient';

export default async function NovaVagaPage() {
  const { profile, employee, gate } = await getActorContext();
  const actor = {
    role: profile.role,
    employeeId: employee?.id ?? null,
    ...gate,
  };
  if (!canManageJobOpenings(actor)) redirect('/recrutamento/vagas');

  const [departments, positions, managers] = await Promise.all([
    getDepartments(profile.company_id),
    getPositions(profile.company_id),
    listHiringManagerOptions(profile.company_id),
  ]);

  return (
    <NovaVagaClient
      departments={departments}
      positions={positions}
      managers={managers}
      canCreateDepartments={canDo(actor, 'departamentos', 'edit')}
      canCreatePositions={canDo(actor, 'cargos', 'edit')}
    />
  );
}
