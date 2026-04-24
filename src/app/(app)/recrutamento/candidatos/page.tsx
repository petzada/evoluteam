import { redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import { listCandidates } from '@/features/recruitment/queries/candidates';
import { canManageCandidates, canViewAllCandidates, canViewAssignedCandidates } from '@/features/recruitment/permissions';
import { CandidatesTable } from '@/features/recruitment/components/CandidatesTable';

export default async function CandidatosPage() {
  const { profile, employee, isHiringManager, gate } = await getActorContext();
  const actor = {
    role: profile.role,
    employeeId: employee?.id ?? null,
    isHiringManager,
    ...gate,
  };

  if (!canViewAllCandidates(actor) && !canViewAssignedCandidates(actor)) {
    redirect('/dashboard');
  }

  const candidates = await listCandidates(profile.company_id);

  return <CandidatesTable candidates={candidates} canCreate={canManageCandidates(actor)} />;
}
