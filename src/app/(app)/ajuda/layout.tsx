// Layout 2-colunas da Central de Ajuda. Carrega topicos visiveis ao actor
// uma vez por request e renderiza a lista de topicos + main com children.

import { actorFromContext, getActorContext } from '@/features/auth/context';
import { HelpTopicList } from '@/features/help/components/HelpTopicList';
import { getHelpTopics } from '@/features/help/content';
import { filterTopicsForActor } from '@/features/help/visibility';

export default async function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getActorContext();
  const actor = actorFromContext(ctx);
  const topics = filterTopicsForActor(await getHelpTopics(), actor);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[18rem_1fr]">
      <aside className="md:sticky md:top-0 md:self-start">
        <HelpTopicList topics={topics} />
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
