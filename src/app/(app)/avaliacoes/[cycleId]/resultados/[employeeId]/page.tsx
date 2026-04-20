import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getCycle, getResultOverview, getCycleComments,
  getActorEmployeeId, getActorDescendants,
} from '@/features/reviews/queries';
import { ResultDetail } from '@/features/reviews/components/ResultDetail';
import { getPdiForCycleAndEmployee } from '@/features/pdi/queries';

export default async function ResultadoIndividualPage({
  params,
}: {
  params: Promise<{ cycleId: string; employeeId: string }>;
}) {
  const { cycleId, employeeId } = await params;

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

  const { data: employeeRaw } = await supabase
    .from('employees')
    .select('id, full_name, position:positions(id, name), department:departments(id, name)')
    .eq('id', employeeId)
    .maybeSingle();
  if (!employeeRaw) notFound();
  const employee = employeeRaw as unknown as {
    id: string;
    full_name: string;
    position: { id: string; name: string } | null;
    department: { id: string; name: string } | null;
  };

  // Permissão
  const isAdmin = profile.role === 'admin_rh';
  const isDirector = profile.role === 'director';
  const actorEmployeeId = await getActorEmployeeId(user.id);
  const descendants = actorEmployeeId ? await getActorDescendants(user.id) : [];
  const isSelf = actorEmployeeId === employeeId;
  const isManagerPath = descendants.includes(employeeId);

  const overview = await getResultOverview(cycleId, employeeId);
  if (!isAdmin && !isDirector) {
    if (isSelf) {
      if (!overview.isReleased) redirect(`/avaliacoes/${cycleId}`);
    } else if (!isManagerPath) {
      redirect('/avaliacoes');
    }
  }

  const [comments, existingPdi, employeeRow, { data: pdiEmployees }, { data: pdiCompetencies }, { data: pdiCycles }] = await Promise.all([
    getCycleComments(cycleId, employeeId),
    getPdiForCycleAndEmployee(cycleId, employeeId),
    supabase
      .from('employees')
      .select('manager_id')
      .eq('id', employeeId)
      .maybeSingle(),
    supabase
      .from('employees')
      .select('id, full_name, email, status, manager_id, position:positions(id, name)')
      .eq('company_id', profile.company_id)
      .in('status', ['active', 'inactive'])
      .order('full_name'),
    supabase
      .from('competencies')
      .select('id, name')
      .eq('company_id', profile.company_id)
      .eq('is_archived', false)
      .order('name'),
    supabase
      .from('review_cycles')
      .select('id, name, status')
      .eq('company_id', profile.company_id)
      .in('status', ['published', 'closed'])
      .order('created_at', { ascending: false }),
  ]);

  const canCreatePdi =
    isAdmin
    || (actorEmployeeId !== null && employeeRow.data?.manager_id === actorEmployeeId);

  return (
    <ResultDetail
      cycleId={cycleId}
      cycleName={cycle.name}
      employee={employee}
      overview={overview}
      comments={comments}
      isAdmin={isAdmin}
      existingPdi={existingPdi}
      canCreatePdi={canCreatePdi}
      pdiEmployees={(pdiEmployees ?? []) as Parameters<typeof ResultDetail>[0]['pdiEmployees']}
      pdiCompetencies={pdiCompetencies ?? []}
      pdiCycles={pdiCycles ?? []}
      actorEmployeeId={actorEmployeeId}
    />
  );
}
