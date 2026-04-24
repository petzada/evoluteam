import { redirect } from 'next/navigation';
import { listCompetenciesWithCounts } from '@/features/taxonomies/queries';
import { TaxonomyList } from '@/features/taxonomies/components/TaxonomyList';
import { canDo } from '@/features/permissions/permissions';
import { getActorContext } from '@/features/auth/context';

export default async function CompetenciasPage() {
  const { profile, gate } = await getActorContext();
  const actor = { role: profile.role, ...gate };
  if (!canDo(actor, 'competencias', 'view')) {
    redirect('/dashboard');
  }

  const items = await listCompetenciesWithCounts(profile.company_id);

  return <TaxonomyList kind="competency" items={items} canEdit={canDo(actor, 'competencias', 'edit')} />;
}
