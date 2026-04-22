import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listCompetenciesWithCounts } from '@/features/taxonomies/queries';
import { TaxonomyList } from '@/features/taxonomies/components/TaxonomyList';
import { canDo } from '@/features/permissions/permissions';
import { loadActorGate } from '@/features/permissions/queries';

export default async function CompetenciasPage() {
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
  if (!canDo(actor, 'competencias', 'view')) {
    redirect('/dashboard');
  }

  const items = await listCompetenciesWithCounts(profile.company_id);

  return <TaxonomyList kind="competency" items={items} canEdit={canDo(actor, 'competencias', 'edit')} />;
}
