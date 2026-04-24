import {
  listCycles, getCycleProgress, getAssignmentsForReviewer,
  listCycleIdsInvolvingEmployee,
} from '@/features/reviews/queries';
import { CyclesList, type AssignmentForUser } from '@/features/reviews/components/CyclesList';
import { canDo } from '@/features/permissions/permissions';
import { getActorContext } from '@/features/auth/context';

export default async function AvaliacoesPage() {
  const { profile, employee, gate } = await getActorContext();
  const employeeId = employee?.id ?? null;
  const actorForGate = { role: profile.role, ...gate };
  const canSeeAll = canDo(actorForGate, 'avaliacoes', 'view');
  let scopedIds: string[] | null = null;
  if (!canSeeAll) {
    if (!employeeId) {
      scopedIds = [];
    } else {
      scopedIds = await listCycleIdsInvolvingEmployee(profile.company_id, employeeId);
    }
  }

  const cycles = await listCycles(profile.company_id, { scopedIds, includeArchived: true });
  const progressPairs = await Promise.all(
    cycles.map(async (c) => [c.id, await getCycleProgress(c.id)] as const),
  );
  const progressById = new Map(progressPairs);
  const cyclesWithProgress = cycles.map((c) => ({
    ...c,
    progress: progressById.get(c.id),
  }));

  const pending = employeeId
    ? await getAssignmentsForReviewer(employeeId, { onlyOpen: true })
    : [];
  // Só mostra pendentes de ciclos publicados
  const pendingPublished = (pending as unknown as AssignmentForUser[]).filter(
    (a) => a.cycle?.status === 'published',
  );

  return (
    <CyclesList
      cycles={cyclesWithProgress}
      pending={pendingPublished}
      isAdmin={canDo(actorForGate, 'avaliacoes', 'edit')}
    />
  );
}
