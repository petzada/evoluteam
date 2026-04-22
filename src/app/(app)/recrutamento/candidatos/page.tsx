import { redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import { listCandidates } from '@/features/recruitment/queries/candidates';
import { canManageCandidates, canViewAllCandidates, canViewAssignedCandidates } from '@/features/recruitment/permissions';
import { CandidatesTable } from '@/features/recruitment/components/CandidatesTable';

export default async function CandidatosPage() {
  const ctx = await getActorContext();
  const actor = {
    role: ctx.profile.role,
    employeeId: ctx.employee?.id ?? null,
    isHiringManager: ctx.isHiringManager,
    ...ctx.gate,
  };

  if (!canViewAllCandidates(actor) && !canViewAssignedCandidates(actor)) {
    redirect('/dashboard');
  }

  const candidates = await listCandidates(ctx.profile.company_id);

  return <CandidatesTable candidates={candidates} canCreate={canManageCandidates(actor)} />;
}
