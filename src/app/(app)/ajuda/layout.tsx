// Layout 2-colunas da Central de Ajuda. Carrega tópicos visíveis ao actor
// uma vez por request e renderiza a coluna esquerda (lista) + main com children.
//
// Spec: docs/superpowers/specs/2026-05-06-help-tutorials-design.md §"Fluxo de dados".

import Link from 'next/link';
import { LifeBuoy } from 'lucide-react';
import { actorFromContext, getActorContext } from '@/features/auth/context';
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
        <nav aria-label="Tópicos de ajuda" className="rounded-md border bg-card">
          {topics.length === 0 ? (
            <div className="px-3 py-4 text-sm text-muted-foreground">
              Nenhum tutorial disponível.
            </div>
          ) : (
            <ul className="divide-y">
              {topics.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/ajuda/${t.slug}`}
                    className="flex items-start gap-2 px-3 py-2.5 text-sm hover:bg-accent"
                  >
                    <LifeBuoy className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{t.title}</span>
                      <span className="block text-xs text-muted-foreground line-clamp-2">
                        {t.description}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
