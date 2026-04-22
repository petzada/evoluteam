import { redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import { canManageCandidates } from '@/features/recruitment/permissions';
import { NovoCandidatoClient } from './NovoCandidatoClient';

export default async function NovoCandidatoPage() {
  const ctx = await getActorContext();
  const actor = {
    role: ctx.profile.role,
    employeeId: ctx.employee?.id ?? null,
    ...ctx.gate,
  };
  if (!canManageCandidates(actor)) redirect('/recrutamento/candidatos');

  return <NovoCandidatoClient />;
}
