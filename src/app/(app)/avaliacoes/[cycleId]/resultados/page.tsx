import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCycle, listCycleResults, getActorDescendants, getActorEmployeeId } from '@/features/reviews/queries';
import { getDepartments } from '@/features/employees/queries';
import { CycleResults } from '@/features/reviews/components/CycleResults';

export default async function ResultadosPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const cycle = await getCycle(cycleId);
  if (!cycle) notFound();

  const isAdmin = profile.role === 'admin_rh';
  const isDirector = profile.role === 'director';

  const [rowsAll, departments, { data: managersRaw }, actorEmployeeId] = await Promise.all([
    listCycleResults(cycleId),
    getDepartments(profile.company_id),
    supabase
      .from('employees')
      .select('id, full_name')
      .eq('company_id', profile.company_id)
      .eq('status', 'active')
      .order('full_name'),
    getActorEmployeeId(user.id),
  ]);

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
