import { getActorContext } from '@/features/auth/context';

export default async function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  await getActorContext();
  return <>{children}</>;
}
