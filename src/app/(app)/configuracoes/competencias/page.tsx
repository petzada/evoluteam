import { redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import { listCompetenciesWithCounts } from '@/features/taxonomies/queries';
import { TaxonomyList } from '@/features/taxonomies/components/TaxonomyList';
import { canDo } from '@/features/permissions/permissions';

export default async function CompetenciasPage() {
  const ctx = await getActorContext();
  const actor = { role: ctx.profile.role, ...ctx.gate };
  if (!canDo(actor, 'competencias', 'view')) {
    redirect('/dashboard');
  }

  const items = await listCompetenciesWithCounts(ctx.profile.company_id);

  return <TaxonomyList kind="competency" items={items} canEdit={canDo(actor, 'competencias', 'edit')} />;
}
