import { redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import { canDo } from '@/features/permissions/permissions';
import { listUnitsWithCounts } from '@/features/units/queries';
import { UnitsManager } from '@/features/units/components/UnitsManager';

export default async function UnidadesPage() {
  const { profile, gate } = await getActorContext();
  const actor = { role: profile.role, ...gate };

  // FT-10: gate de view + redirect padrao das telas de Configuracoes.
  if (!canDo(actor, 'unidades', 'view')) {
    redirect('/dashboard');
  }

  const units = await listUnitsWithCounts(profile.company_id);

  return (
    <UnitsManager
      units={units}
      canEdit={canDo(actor, 'unidades', 'edit')}
    />
  );
}
