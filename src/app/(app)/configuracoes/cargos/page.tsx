import { redirect } from 'next/navigation';
import { listPositionsWithCounts } from '@/features/taxonomies/queries';
import { TaxonomyList } from '@/features/taxonomies/components/TaxonomyList';
import { canDo } from '@/features/permissions/permissions';
import { getActorContext } from '@/features/auth/context';

export default async function CargosPage() {
  const { profile, gate } = await getActorContext();
  const actor = { role: profile.role, ...gate };
  if (!canDo(actor, 'cargos', 'view')) {
    redirect('/dashboard');
  }

  const items = await listPositionsWithCounts(profile.company_id);

  return <TaxonomyList kind="position" items={items} canEdit={canDo(actor, 'cargos', 'edit')} />;
}
