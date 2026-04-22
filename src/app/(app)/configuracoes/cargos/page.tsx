import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listPositionsWithCounts } from '@/features/taxonomies/queries';
import { TaxonomyList } from '@/features/taxonomies/components/TaxonomyList';
import { canDo } from '@/features/permissions/permissions';
import { loadActorGate } from '@/features/permissions/queries';

export default async function CargosPage() {
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
  const actor = { role: profile.role, ...gate };
  if (!canDo(actor, 'cargos', 'view')) {
    redirect('/dashboard');
  }

  const items = await listPositionsWithCounts(profile.company_id);

  return <TaxonomyList kind="position" items={items} canEdit={canDo(actor, 'cargos', 'edit')} />;
}
