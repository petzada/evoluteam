// /ajuda/[slug] — render de um tutorial: vídeo + descrição MDX.
// Spec: docs/superpowers/specs/2026-05-06-help-tutorials-design.md §"Fluxo de dados".

import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { SetAppTopBar } from '@/features/shell/AppTopBarContext';
import { actorFromContext, getActorContext } from '@/features/auth/context';
import { helpMdxComponents } from '@/features/help/components/HelpMdxComponents';
import { HelpVideoPlayer } from '@/features/help/components/HelpVideoPlayer';
import { getHelpTopic } from '@/features/help/content';
import { isTopicVisible } from '@/features/help/visibility';

export default async function HelpTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ctx = await getActorContext();
  const actor = actorFromContext(ctx);

  const topic = await getHelpTopic(slug);
  if (!topic) notFound();
  if (!isTopicVisible(topic.frontmatter, actor)) notFound();

  const { frontmatter, source } = topic;

  return (
    <>
      <SetAppTopBar title={frontmatter.title} />
      <article className="space-y-4">
        <HelpVideoPlayer
          videoUrl={frontmatter.videoUrl}
          title={frontmatter.title}
        />
        <header>
          <h1 className="text-xl font-semibold">{frontmatter.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {frontmatter.description}
          </p>
        </header>
        <div className="prose prose-sm max-w-none">
          <MDXRemote source={source} components={helpMdxComponents} />
        </div>
      </article>
    </>
  );
}
