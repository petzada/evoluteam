import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getEmployeeByUserId, getEmployeeDescendants } from '@/features/employees/queries';
import { listMyPdis, listTeamPdis, listAllPdis } from '@/features/pdi/queries';
import { PdisPage } from '@/features/pdi/components/PdisPage';
import { canDo } from '@/features/permissions/permissions';
import { loadActorGate } from '@/features/permissions/queries';

export default async function PdiRoute() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const role = profile.role as 'admin_rh' | 'director' | 'user' | 'rh';
  const gate = await loadActorGate(user.id, role);
  // Edit em PDI cobre admin_rh + user/rh com toggle. Diretor nao entra
  // (apenas view+comentarios; nao modera/deleta).
  const isAdmin = canDo({ role, ...gate }, 'pdi', 'edit');
  const companyId = profile.company_id;

  const actorEmployee = await getEmployeeByUserId(user.id);
  const actorEmployeeId = actorEmployee?.id ?? null;
  const descendants = actorEmployeeId ? await getEmployeeDescendants(actorEmployeeId) : [];
  const hasTeam = descendants.length > 0;

  const [mine, team, all, { data: employees }, { data: competencies }, { data: cycles }] = await Promise.all([
    actorEmployeeId ? listMyPdis(actorEmployeeId) : Promise.resolve([]),
    hasTeam ? listTeamPdis(descendants) : Promise.resolve([]),
    isAdmin ? listAllPdis(companyId) : Promise.resolve([]),
    supabase
      .from('employees')
      .select('id, full_name, email, status, manager_id, position:positions(id, name)')
      .eq('company_id', companyId)
      .in('status', ['active', 'inactive'])
      .order('full_name'),
    supabase
      .from('competencies')
      .select('id, name')
      .eq('company_id', companyId)
      .eq('is_archived', false)
      .order('name'),
    supabase
      .from('review_cycles')
      .select('id, name, status')
      .eq('company_id', companyId)
      .in('status', ['published', 'closed'])
      .order('created_at', { ascending: false }),
  ]);

  const hasManager = !!actorEmployee?.manager_id;
  const canCreateAny = isAdmin || hasTeam || (!!actorEmployeeId && hasManager);

  return (
    <PdisPage
      mine={mine}
      team={team}
      all={all}
      hasTeam={hasTeam}
      isAdmin={isAdmin}
      canCreateAny={canCreateAny}
      actorEmployeeId={actorEmployeeId}
      employees={(employees ?? []) as Parameters<typeof PdisPage>[0]['employees']}
      competencies={competencies ?? []}
      cycles={cycles ?? []}
    />
  );
}
