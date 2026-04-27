import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getEmployeeDescendants } from '@/features/employees/queries';
import { listMyPdis, listTeamPdis, listAllPdis } from '@/features/pdi/queries';
import { PdisPage } from '@/features/pdi/components/PdisPage';
import { canDo } from '@/features/permissions/permissions';
import { getActorContext } from '@/features/auth/context';

export default async function PdiRoute() {
  const { profile, employee, gate } = await getActorContext();
  const supabase = await createServerSupabaseClient();
  const role = profile.role;
  const actorForGate = { role, ...gate };
  const isAdmin = canDo(actorForGate, 'pdi', 'edit');
  const canSeeAll = canDo(actorForGate, 'pdi', 'view');
  const companyId = profile.company_id;

  const actorEmployeeId = employee?.id ?? null;
  const descendants = actorEmployeeId ? await getEmployeeDescendants(actorEmployeeId) : [];
  const hasTeam = descendants.length > 0;

  const [mine, team, all, { data: employees }, { data: competencies }, { data: cycles }] = await Promise.all([
    actorEmployeeId ? listMyPdis(actorEmployeeId) : Promise.resolve([]),
    hasTeam ? listTeamPdis(descendants) : Promise.resolve([]),
    canSeeAll ? listAllPdis(companyId) : Promise.resolve([]),
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

  const canCreateAny = isAdmin || hasTeam || !!actorEmployeeId;

  return (
    <PdisPage
      mine={mine}
      team={team}
      all={all}
      hasTeam={hasTeam}
      isAdmin={isAdmin}
      canSeeAll={canSeeAll}
      canCreateAny={canCreateAny}
      actorEmployeeId={actorEmployeeId}
      employees={(employees ?? []) as Parameters<typeof PdisPage>[0]['employees']}
      competencies={competencies ?? []}
      cycles={cycles ?? []}
    />
  );
}
