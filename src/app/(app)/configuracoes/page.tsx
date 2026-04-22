import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { hasAdminPower } from '@/features/permissions/permissions';
import { loadActorRhPermissions } from '@/features/permissions/queries';

export default async function ConfiguracoesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) redirect('/onboarding/criar-empresa');
  const actorRhPermissions = await loadActorRhPermissions(user.id, profile.role);
  const actorForGate = { role: profile.role, rhPermissions: actorRhPermissions };

  if (
    hasAdminPower(actorForGate, 'can_employees')
    || hasAdminPower(actorForGate, 'can_audit')
  ) {
    redirect('/configuracoes/empresa');
  }

  redirect('/configuracoes/perfil');
}
