import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadActorGate } from '@/features/permissions/queries';
import { canDo } from '@/features/permissions/permissions';
import { listAllStages } from '@/features/recruitment/queries/stages';
import { canManageStages } from '@/features/recruitment/permissions';
import { RecruitmentStagesManager } from '@/features/recruitment/components/RecruitmentStagesManager';

export default async function EtapasPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const { data: employeeRow } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .eq('company_id', profile.company_id)
    .maybeSingle();

  const gate = await loadActorGate(user.id, profile.role);
  const actor = {
    role: profile.role,
    employeeId: employeeRow?.id ?? null,
    ...gate,
  };
  const canEdit = canManageStages(actor);
  const canView = canDo(actor, 'recrutamento_etapas', 'view');
  if (!canView && !canEdit) redirect('/dashboard');

  const stages = await listAllStages(profile.company_id);

  return <RecruitmentStagesManager stages={stages} canEdit={canEdit} />;
}
