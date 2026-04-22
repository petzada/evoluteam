import { redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import { listPositionsWithCounts } from '@/features/taxonomies/queries';
import { TaxonomyList } from '@/features/taxonomies/components/TaxonomyList';
import { canDo } from '@/features/permissions/permissions';

export default async function CargosPage() {
  const ctx = await getActorContext();
  const actor = { role: ctx.profile.role, ...ctx.gate };
  if (!canDo(actor, 'cargos', 'view')) {
    redirect('/dashboard');
  }

  const items = await listPositionsWithCounts(ctx.profile.company_id);

  return <TaxonomyList kind="position" items={items} canEdit={canDo(actor, 'cargos', 'edit')} />;
}
