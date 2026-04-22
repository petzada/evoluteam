import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getActorContext } from '@/features/auth/context';
import { getCycle, listCycleResults, getActorDescendants } from '@/features/reviews/queries';
import { getDepartments } from '@/features/employees/queries';
import { CycleResults } from '@/features/reviews/components/CycleResults';
import { canDo } from '@/features/permissions/permissions';

export default async function ResultadosPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  const ctx = await getActorContext();
  const actor = { role: ctx.profile.role, ...ctx.gate };

  const cycle = await getCycle(cycleId);
  if (!cycle) notFound();

  const isAdmin = canDo(actor, 'avaliacoes', 'edit');
  const isDirector = ctx.profile.role === 'director';
  const actorEmployeeId = ctx.employee?.id ?? null;

  const supabase = await createServerSupabaseClient();
  const [rowsAll, departments, { data: managersRaw }] = await Promise.all([
    listCycleResults(cycleId),
    getDepartments(ctx.profile.company_id),
    supabase
      .from('employees')
      .select('id, full_name')
      .eq('company_id', ctx.profile.company_id)
      .eq('status', 'active')
      .order('full_name'),
  ]);

  let rows = rowsAll;
  if (!isAdmin && !isDirector) {
    if (!actorEmployeeId) {
      rows = [];
    } else {
      const descendants = await getActorDescendants(ctx.user.id);
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
