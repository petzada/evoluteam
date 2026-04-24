import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCycle, listCycleResults, getActorDescendants } from '@/features/reviews/queries';
import { getDepartments } from '@/features/employees/queries';
import { CycleResults } from '@/features/reviews/components/CycleResults';
import { canDo } from '@/features/permissions/permissions';
import { getActorContext } from '@/features/auth/context';

export default async function ResultadosPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;

  const { user, profile, employee, gate } = await getActorContext();
  const supabase = await createServerSupabaseClient();
  const actor = { role: profile.role, ...gate };
  const actorEmployeeId = employee?.id ?? null;

  const isAdmin = canDo(actor, 'avaliacoes', 'edit');
  const isDirector = profile.role === 'director';

  const [cycle, rowsAll, departments, { data: managersRaw }] = await Promise.all([
    getCycle(cycleId),
    listCycleResults(cycleId),
    getDepartments(profile.company_id),
    supabase
      .from('employees')
      .select('id, full_name')
      .eq('company_id', profile.company_id)
      .eq('status', 'active')
      .order('full_name'),
  ]);
  if (!cycle) notFound();

  let rows = rowsAll;
  if (!isAdmin && !isDirector) {
    if (!actorEmployeeId) {
      rows = [];
    } else {
      const descendants = await getActorDescendants(user.id);
      const allowed = new Set([actorEmployeeId, ...descendants]);
      rows = rowsAll.filter((r) => allowed.has(r.employeeId));
    }
  }

  return (
    <CycleResults
      cycleId={cycleId}
      cycleName={cycle.name}
      rows={rows}
      isAdmin={isAdmin}
      departments={departments}
      managers={managersRaw ?? []}
    />
  );
}
