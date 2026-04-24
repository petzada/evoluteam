import { redirect } from 'next/navigation';
import { listDepartmentsWithCounts } from '@/features/taxonomies/queries';
import { TaxonomyList } from '@/features/taxonomies/components/TaxonomyList';
import { canDo } from '@/features/permissions/permissions';
import { getActorContext } from '@/features/auth/context';

export default async function DepartamentosPage() {
  const { profile, gate } = await getActorContext();
  const actor = { role: profile.role, ...gate };
  if (!canDo(actor, 'departamentos', 'view')) {
    redirect('/dashboard');
  }

  const items = await listDepartmentsWithCounts(profile.company_id);

  return <TaxonomyList kind="department" items={items} canEdit={canDo(actor, 'departamentos', 'edit')} />;
}
