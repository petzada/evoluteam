import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { canDo } from '@/features/permissions/permissions';
import { getActorContext } from '@/features/auth/context';
import {
  getEmployee,
  getDirectReports,
  countDirectReports,
  getEmployeeDescendants,
  getEmployeeActivityLog,
  getPositions,
  getDepartments,
  getManagerCandidates,
} from '@/features/employees/queries';
import { canViewEmployee, canSeeInternalNotes } from '@/features/employees/permissions';
import { EmployeeProfile } from '@/features/employees/components/EmployeeProfile';
import { BreadcrumbLabel } from '@/features/shell/components/BreadcrumbLabel';
import { listFeedbacksForEmployee } from '@/features/feedbacks/queries';
import { listPdisForEmployee } from '@/features/pdi/queries';
import { listReviewCyclesForEmployee } from '@/features/reviews/queries';
import { getRecruitmentSourceForEmployee } from '@/features/recruitment/queries/employeeSource';

export default async function EmployeeProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const search = (await searchParams) ?? {};
  const supabase = await createServerSupabaseClient();

  const { user, profile, employee: actorEmployee, gate } = await getActorContext();
  const actorRole = profile.role;
  const actorEmployeeId = actorEmployee?.id ?? null;

  const showInternalNotes = canSeeInternalNotes({
    role: actorRole,
    ...gate,
  });

  // Paraleliza: getEmployee, getEmployeeDescendants(id) e getEmployeeDescendants(actor)
  // sao independentes. Antes rodavam sequencialmente.
  const [employee, descendantIds, actorDescendants] = await Promise.all([
    getEmployee(id, { includeInternalNotes: showInternalNotes }).catch(() => null),
    getEmployeeDescendants(id),
    actorEmployeeId
      ? getEmployeeDescendants(actorEmployeeId)
      : Promise.resolve<string[]>([]),
  ]);
  if (!employee) notFound();

  // Ancestor chain: para user comum, precisa que actor esteja na cadeia de gestores do target.
  // Como temos descendants de actor, se target esta em descendants de actor -> actor e ancestor.
  const isDescendantOfActor = actorDescendants.includes(id);

  const canView = canViewEmployee(
    { id: '', role: actorRole, userId: user.id, employeeId: actorEmployeeId, ...gate },
    { id, managerChain: isDescendantOfActor ? [actorEmployeeId ?? ''] : [] },
  );
  if (!canView) {
    redirect('/colaboradores');
  }

  const [
    directReports, subordinatesCount, activityLog, positions, departments, managers,
    feedbacks, pdis, reviewCycles,
    { data: pdiEmployees }, { data: pdiCompetencies }, { data: pdiCycles },
  ] = await Promise.all([
    getDirectReports(id),
    countDirectReports(id),
    getEmployeeActivityLog(profile.company_id, id, employee.user_id),
    getPositions(profile.company_id),
    getDepartments(profile.company_id),
    getManagerCandidates(profile.company_id, id),
    listFeedbacksForEmployee(id),
    listPdisForEmployee(id),
    listReviewCyclesForEmployee(id),
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

  const canCreatePdiHere =
    canDo({ role: actorRole, ...gate }, 'pdi', 'edit')
    || (actorEmployeeId !== null && employee.manager?.id === actorEmployeeId);

  // canSeeResults: quem tem avaliacoes.view ve tudo; gestor vê descendentes;
  // self só com liberação. Quando canSeeResults=false e isSelf=true, o
  // componente libera por ciclo (isReleased).
  const isSelfHere = employee.user_id === user.id;
  const canSeeResults =
    canDo({ role: actorRole, ...gate }, 'avaliacoes', 'view')
    || (!isSelfHere && isDescendantOfActor);

  // Último login via admin auth
  let lastSignInAt: string | null = null;
  if (employee.user_id) {
    try {
      const admin = createAdminSupabaseClient();
      const { data } = await admin.auth.admin.getUserById(employee.user_id);
      lastSignInAt = data.user?.last_sign_in_at ?? null;
    } catch {
      lastSignInAt = null;
    }
  }

  // Role + screenPermissions do target (para o AccessSheet em edicao).
  let targetRole: 'admin_rh' | 'director' | 'user' | null = null;
  let targetScreenPermissions: import('@/features/permissions/types').ScreenPermissions = {};
  if (employee.user_id) {
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', employee.user_id)
      .maybeSingle();
    targetRole = (targetProfile?.role as 'admin_rh' | 'director' | 'user' | null) ?? null;
    if (targetRole === 'user') {
      const admin = createAdminSupabaseClient();
      const { data: perms } = await admin
        .from('user_screen_permissions')
        .select('permissions')
        .eq('profile_id', employee.user_id)
        .maybeSingle();
      if (perms?.permissions) {
        targetScreenPermissions = perms.permissions as import('@/features/permissions/types').ScreenPermissions;
      }
    }
  }

  // Origem de recrutamento (Onda 2 FT-7): se employee veio do wizard de contratação
  const recruitmentSource = await getRecruitmentSourceForEmployee(id);

  // Nomes dos atores do activity_log
  const actorIds = Array.from(
    new Set(activityLog.map((l) => l.actor_user_id).filter((x): x is string => !!x)),
  );
  const actors: Record<string, string> = {};
  if (actorIds.length) {
    const { data: actorProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', actorIds);
    for (const p of actorProfiles ?? []) actors[p.id] = p.full_name;
  }

  return (
    <>
      <BreadcrumbLabel segment={id} label={employee.full_name} />
      <EmployeeProfile
      employee={employee as Parameters<typeof EmployeeProfile>[0]['employee']}
      directReports={directReports as Parameters<typeof EmployeeProfile>[0]['directReports']}
      activityLog={activityLog as Parameters<typeof EmployeeProfile>[0]['activityLog']}
      role={targetRole}
      lastSignInAt={lastSignInAt}
      isAdmin={canDo({ role: actorRole, ...gate }, 'colaboradores', 'edit')}
      isSelf={employee.user_id === user.id}
      canSeeInternalNotes={showInternalNotes}
      positions={positions}
      departments={departments}
      managers={managers}
      descendantIds={descendantIds}
      subordinatesCount={subordinatesCount}
      actors={actors}
      feedbacks={feedbacks}
      reviewCycles={reviewCycles}
      canSeeResults={canSeeResults}
      initialTab={search.tab}
      pdis={pdis}
      canCreatePdi={canCreatePdiHere}
      pdiEmployees={(pdiEmployees ?? []) as Parameters<typeof EmployeeProfile>[0]['pdiEmployees']}
      pdiCompetencies={pdiCompetencies ?? []}
      pdiCycles={pdiCycles ?? []}
      actorEmployeeId={actorEmployeeId}
      targetScreenPermissions={targetScreenPermissions}
      currentActorRole={actorRole}
      actorIsAdmin={actorRole === 'admin_rh'}
      actorScreenPermissions={gate.screenPermissions ?? undefined}
      recruitmentSource={recruitmentSource}
    />
    </>
  );
}
