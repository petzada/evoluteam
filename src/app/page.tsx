import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LandingPage } from '@/features/landing/LandingPage';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Evoluteam | Feedback, avaliação e PDI no mesmo fluxo',
  description:
    'Landing pública do Evoluteam: feedback contínuo, ciclo de avaliação e PDI conectados para transformar avaliação em desenvolvimento.',
  alternates: {
    canonical: '/',
  },
};

export default async function RootPage() {
  const supabase = await createServerSupabaseClient();
  let user = null;

  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Em caso de token inválido ou erro de sessão, ignoramos para exibir a landing page pública
  }

  if (user) redirect('/dashboard');

  return <LandingPage />;
}
