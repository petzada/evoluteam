import { redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import { canDo } from '@/features/permissions/permissions';

export default async function ConfiguracoesPage() {
  const ctx = await getActorContext();
  const actorForGate = { role: ctx.profile.role, ...ctx.gate };

  if (canDo(actorForGate, 'empresa', 'view')) {
    redirect('/configuracoes/empresa');
  }

  redirect('/configuracoes/perfil');
}
