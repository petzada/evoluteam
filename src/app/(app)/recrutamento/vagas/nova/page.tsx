import { redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import { getDepartments, getPositions } from '@/features/employees/queries';
import { canManageJobOpenings } from '@/features/recruitment/permissions';
import { listHiringManagerOptions } from '@/features/recruitment/queries/jobOpenings';
import { NovaVagaClient } from './NovaVagaClient';

export default async function NovaVagaPage() {
  const ctx = await getActorContext();
  const actor = {
    role: ctx.profile.role,
    employeeId: ctx.employee?.id ?? null,
    ...ctx.gate,
  };
  if (!canManageJobOpenings(actor)) redirect('/recrutamento/vagas');

  const [departments, positions, managers] = await Promise.all([
    getDepartments(ctx.profile.company_id),
    getPositions(ctx.profile.company_id),
    listHiringManagerOptions(ctx.profile.company_id),
  ]);

  return <NovaVagaClient departments={departments} positions={positions} managers={managers} />;
}
