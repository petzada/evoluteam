import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  listCycles, getCycleProgress, getAssignmentsForReviewer, getActorEmployeeId,
  listCycleIdsInvolvingEmployee,
} from '@/features/reviews/queries';
import { CyclesList, type AssignmentForUser } from '@/features/reviews/components/CyclesList';
import { canDo } from '@/features/permissions/permissions';
import { loadActorGate } from '@/features/permissions/queries';

export default async function AvaliacoesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const employeeId = await getActorEmployeeId(user.id);
  const gate = await loadActorGate(user.id, profile.role);
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
