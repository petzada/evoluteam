import { redirect } from 'next/navigation';
import { canManageCandidates } from '@/features/recruitment/permissions';
import { getActorContext } from '@/features/auth/context';
import { NovoCandidatoClient } from './NovoCandidatoClient';

export default async function NovoCandidatoPage() {
  const { profile, employee, gate } = await getActorContext();
  const actor = {
    role: profile.role,
    employeeId: employee?.id ?? null,
    ...gate,
  };
  if (!canManageCandidates(actor)) redirect('/recrutamento/candidatos');

  return <NovoCandidatoClient />;
}
