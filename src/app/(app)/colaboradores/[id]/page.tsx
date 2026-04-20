import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import {
  getEmployee,
  getDirectReports,
  countDirectReports,
  getEmployeeByUserId,
  getEmployeeDescendants,
  getEmployeeActivityLog,
  getPositions,
  getDepartments,
  getManagerCandidates,
} from '@/features/employees/queries';
import { canViewEmployee, canSeeInternalNotes } from '@/features/employees/permissions';
import { EmployeeProfile } from '@/features/employees/components/EmployeeProfile';
import { listFeedbacksForEmployee } from '@/features/feedbacks/queries';

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role, full_name')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const actorRole = profile.role as 'admin_rh' | 'director' | 'user';
  const showInternalNotes = canSeeInternalNotes({ role: actorRole });

  const employee = await getEmployee(id, { includeInternalNotes: showInternalNotes })
    .catch(() => null);
  if (!employee) notFound();

  // Permissão de visualização
  const actorEmployee = await getEmployeeByUserId(user.id);
  const actorEmployeeId = actorEmployee?.id ?? null;
  const descendantIds = await getEmployeeDescendants(id);
  // Ancestor chain: para user comum, precisa que actor esteja na cadeia de gestores do target
  // Como já temos descendantIds de `id`, se target está em descendants de actor → actor é ancestor.
  const actorDescendants = actorEmployeeId
    ? await getEmployeeDescendants(actorEmployeeId)
    : [];
  const isDescendantOfActor = actorDescendants.includes(id);

  const canView = canViewEmployee(
    { id: '', role: actorRole, userId: user.id, employeeId: actorEmployeeId },
    { id, managerChain: isDescendantOfActor ? [actorEmployeeId ?? ''] : [] },
  );
  if (!canView) {
    redirect('/colaboradores');
  }

  const [directReports, subordinatesCount, activityLog, positions, departments, managers, feedbacks] = await Promise.all([
    getDirectReports(id),
    countDirectReports(id),
    getEmployeeActivityLog(profile.company_id, id, employee.user_id),
    getPositions(profile.company_id),
    getDepartments(profile.company_id),
    getManagerCandidates(profile.company_id, id),
    listFeedbacksForEmployee(id),
  ]);

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

  // Role do target
  let targetRole: 'admin_rh' | 'director' | 'user' | null = null;
  if (employee.user_id) {
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', employee.user_id)
      .maybeSingle();
    targetRole = (targetProfile?.role as 'admin_rh' | 'director' | 'user' | null) ?? null;
  }

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
    <EmployeeProfile
      employee={employee as Parameters<typeof EmployeeProfile>[0]['employee']}
      directReports={directReports as Parameters<typeof EmployeeProfile>[0]['directReports']}
      activityLog={activityLog as Parameters<typeof EmployeeProfile>[0]['activityLog']}
      role={targetRole}
      lastSignInAt={lastSignInAt}
      isAdmin={actorRole === 'admin_rh'}
      isSelf={employee.user_id === user.id}
      canSeeInternalNotes={showInternalNotes}
      positions={positions}
      departments={departments}
      managers={managers}
      descendantIds={descendantIds}
      subordinatesCount={subordinatesCount}
      actors={actors}
      feedbacks={feedbacks}
    />
  );
}
