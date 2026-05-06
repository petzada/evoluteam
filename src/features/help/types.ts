// Tipos publicos da feature Help.
// Spec: docs/superpowers/specs/2026-05-06-help-tutorials-design.md.

import type { HelpFrontmatterParsed } from './schema';

/**
 * Tópico de ajuda já parseado e pronto para listagem.
 * `slug` é derivado do nome do arquivo (não do frontmatter).
 */
export type HelpTopic = HelpFrontmatterParsed & {
  slug: string;
};

/**
 * Resultado de getHelpTopic — frontmatter parsed + corpo MDX bruto
 * para passar pro <MDXRemote source={...} />.
 */
export type HelpTopicSource = {
  frontmatter: HelpTopic;
  source: string;
};
