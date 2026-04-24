import { getActorContext } from '@/features/auth/context';

export default async function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  // getActorContext garante sessao + empresa ativa + nao-terminated.
  // E cacheado por request, entao nao duplica as queries do (app)/layout.
  await getActorContext();
  return <>{children}</>;
}
