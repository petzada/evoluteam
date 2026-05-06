// /ajuda — redireciona para o primeiro tópico visível ao actor, ou
// mostra empty state quando content/help/ está vazio (ou nada visível).
//
// Spec: docs/superpowers/specs/2026-05-06-help-tutorials-design.md §"Fluxo de dados".

import { redirect } from 'next/navigation';
import { LifeBuoy } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { SetAppTopBar } from '@/features/shell/AppTopBarContext';
import { actorFromContext, getActorContext } from '@/features/auth/context';
import { getHelpTopics } from '@/features/help/content';
import { filterTopicsForActor } from '@/features/help/visibility';

export default async function HelpIndexPage() {
  const ctx = await getActorContext();
  const actor = actorFromContext(ctx);
  const topics = filterTopicsForActor(await getHelpTopics(), actor);

  if (topics.length > 0) {
    redirect(`/ajuda/${topics[0].slug}`);
  }

  return (
    <>
      <SetAppTopBar title="Ajuda" />
      <EmptyState
        icon={LifeBuoy}
        title="Nenhum tutorial disponível ainda."
        description="Volte em breve — estamos preparando o conteúdo."
      />
    </>
  );
}
