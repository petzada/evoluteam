import { redirect } from 'next/navigation';
import { canDo } from '@/features/permissions/permissions';
import { getActorContext } from '@/features/auth/context';

export default async function ConfiguracoesPage() {
  const { profile, gate } = await getActorContext();
  const actorForGate = { role: profile.role, ...gate };

  if (canDo(actorForGate, 'empresa', 'view')) {
    redirect('/configuracoes/empresa');
  }

  redirect('/configuracoes/perfil');
}
