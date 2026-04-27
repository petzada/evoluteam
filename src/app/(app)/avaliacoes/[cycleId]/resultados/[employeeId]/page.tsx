import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getCycle, getResultOverview, getCycleComments,
  getActorDescendants,
  listResultLeadershipComments,
} from '@/features/reviews/queries';
import { getEmployeeAncestors } from '@/features/employees/queries';
import { ResultDetail } from '@/features/reviews/components/ResultDetail';
import { getPdiForCycleAndEmployee } from '@/features/pdi/queries';
import { getActorContext } from '@/features/auth/context';

export default async function ResultadoIndividualPage({
  params,
}: {
  params: Promise<{ cycleId: string; employeeId: string }>;
}) {
  const { cycleId, employeeId } = await params;

  const { user, profile, employee: actorEmployee } = await getActorContext();
  const supabase = await createServerSupabaseClient();
  const actorEmployeeId = actorEmployee?.id ?? null;
  const isAdmin = profile.role === 'admin_rh';
  const isDirector = profile.role === 'director';

  // Paraleliza: cycle, employeeRaw, descendants e overview sao independentes.
  const [cycle, { data: employeeRaw }, descendants, overview] = await Promise.all([
    getCycle(cycleId),
    supabase
      .from('employees')
      .select('id, full_name, position:positions(id, name), department:departments(id, name)')
      .eq('id', employeeId)
      .maybeSingle(),
    actorEmployeeId ? getActorDescendants(user.id) : Promise.resolve<string[]>([]),
    getResultOverview(cycleId, employeeId),
  ]);
  if (!cycle) notFound();
  if (!employeeRaw) notFound();
  const employee = employeeRaw as unknown as {
    id: string;
    full_name: string;
    position: { id: string; name: string } | null;
    department: { id: string; name: string } | null;
  };

  const isSelf = actorEmployeeId === employeeId;
  const isManagerPath = descendants.includes(employeeId);
  if (!isAdmin && !isDirector) {
    if (isSelf) {
      if (!overview.isReleased) redirect(`/avaliacoes/${cycleId}`);
    } else if (!isManagerPath) {
      redirect('/avaliacoes');
    }
  }

  const [comments, existingPdi, employeeRow, leadershipComments, ancestorsOfReviewee, { data: pdiEmployees }, { data: pdiCompetencies }, { data: pdiCycles }] = await Promise.all([
    getCycleComments(cycleId, employeeId),
    getPdiForCycleAndEmployee(cycleId, employeeId),
    supabase
      .from('employees')
      .select('manager_id')
      .eq('id', employeeId)
      .maybeSingle(),
    listResultLeadershipComments(cycleId, employeeId),
    getEmployeeAncestors(employeeId),
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
    || (actorEmployeeId !== null && employeeId === actorEmployeeId)
    || (actorEmployeeId !== null && employeeRow.data?.manager_id === actorEmployeeId);

  // FT-8 P10: quem pode comentar = admin_rh, director ou ancestor do avaliado
  // (e ciclo liberado, validado no componente via overview.isReleased).
  const canLeaveLeadershipComment =
    isAdmin
    || isDirector
    || (actorEmployeeId !== null && ancestorsOfReviewee.includes(actorEmployeeId));

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
      leadershipComments={leadershipComments}
      canLeaveLeadershipComment={canLeaveLeadershipComment}
    />
  );
}
