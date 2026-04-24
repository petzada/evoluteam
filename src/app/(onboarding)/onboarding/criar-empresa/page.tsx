import { redirect } from 'next/navigation';
import { getActor } from '@/features/permissions/actor';
import { OnboardingWizard } from '@/features/company/components/OnboardingWizard';

export default async function CriarEmpresaPage() {
  // Antes este guard vivia no proxy.ts (linha 87-89). Agora o proxy so checa
  // sessao; quem ja tem empresa nao deve voltar para o onboarding.
  const actor = await getActor();
  if (actor) redirect('/dashboard');
  return <OnboardingWizard />;
}
