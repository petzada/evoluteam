import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { canDo } from '@/features/permissions/permissions';
import { loadActorGate } from '@/features/permissions/queries';

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
  const gate = await loadActorGate(user.id, profile.role);
  const actorForGate = { role: profile.role, ...gate };

  if (canDo(actorForGate, 'empresa', 'view')) {
    redirect('/configuracoes/empresa');
  }

  redirect('/configuracoes/perfil');
}
