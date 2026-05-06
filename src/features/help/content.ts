// Helpers server-only para ler MDX de content/help/.
// Spec: docs/superpowers/specs/2026-05-06-help-tutorials-design.md §"Estrutura de arquivos".
//
// Slug = filename. Frontmatter validado por Zod; arquivo invalido e descartado
// com console.warn — uma falha NUNCA derruba a pagina.

import 'server-only';

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { cache } from 'react';
import matter from 'gray-matter';
import { helpFrontmatterSchema } from './schema';
import type { HelpTopic, HelpTopicSource } from './types';

// Diretorio raiz dos MDX. Resolvido a partir do cwd do processo Next.
// Lido lazy para permitir sobrescrever via HELP_CONTENT_DIR em testes
// sem precisar de vi.resetModules entre casos.
function getHelpDir(): string {
  return process.env.HELP_CONTENT_DIR
    ? path.resolve(process.env.HELP_CONTENT_DIR)
    : path.join(process.cwd(), 'content', 'help');
}

// Apenas slugs simples. Bloqueia path traversal antes de tocar o fs.
const SLUG_RE = /^[a-z0-9-]+$/;

function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

function compareTopics(a: HelpTopic, b: HelpTopic): number {
  if (a.order !== b.order) return a.order - b.order;
  return a.title.localeCompare(b.title);
}

/**
 * Le todos os MDX de content/help/, valida frontmatter por arquivo e
 * devolve a lista ordenada (order ASC, title ASC para empate).
 *
 * Arquivos com frontmatter invalido sao descartados com console.warn —
 * a pagina continua renderizando os demais.
 *
 * Embrulhada em React `cache()` para deduplicar leituras dentro do
 * mesmo escopo de request (layout + page lendo a mesma lista).
 */
export const getHelpTopics = cache(async (): Promise<HelpTopic[]> => {
  const helpDir = getHelpDir();
  let entries: string[];
  try {
    entries = await fs.readdir(helpDir);
  } catch (err) {
    // Diretorio nao existe ainda — retorna vazio sem warn (cenario esperado).
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }

  const mdxFiles = entries.filter((f) => f.endsWith('.mdx'));
  const topics: HelpTopic[] = [];

  for (const file of mdxFiles) {
    const slug = file.replace(/\.mdx$/, '');
    if (!isValidSlug(slug)) {
      console.warn(`[help] skipping ${file}: invalid slug (must match ${SLUG_RE})`);
      continue;
    }

    let raw: string;
    try {
      raw = await fs.readFile(path.join(helpDir, file), 'utf8');
    } catch (err) {
      console.warn(`[help] skipping ${file}: ${(err as Error).message}`);
      continue;
    }

    let data: Record<string, unknown>;
    try {
      ({ data } = matter(raw));
    } catch (err) {
      console.warn(`[help] skipping ${file}: frontmatter parse error: ${(err as Error).message}`);
      continue;
    }

    const parsed = helpFrontmatterSchema.safeParse(data);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      console.warn(`[help] skipping ${file}: ${issues}`);
      continue;
    }

    topics.push({ slug, ...parsed.data });
  }

  return topics.sort(compareTopics);
});

/**
 * Le um tutorial especifico pelo slug. Retorna `null` se:
 *   - slug nao bate com SLUG_RE (path traversal etc);
 *   - arquivo nao existe;
 *   - frontmatter invalido.
 *
 * Embrulhada em React `cache()` por consistencia com getHelpTopics — no
 * mesmo request, multiplas chamadas com o mesmo slug compartilham IO.
 */
export const getHelpTopic = cache(async (slug: string): Promise<HelpTopicSource | null> => {
  if (!isValidSlug(slug)) return null;

  const filePath = path.join(getHelpDir(), `${slug}.mdx`);
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }

  let data: Record<string, unknown>;
  let content: string;
  try {
    const parsed = matter(raw);
    data = parsed.data;
    content = parsed.content;
  } catch (err) {
    console.warn(`[help] failed to parse ${slug}.mdx: ${(err as Error).message}`);
    return null;
  }

  const result = helpFrontmatterSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    console.warn(`[help] invalid frontmatter in ${slug}.mdx: ${issues}`);
    return null;
  }

  return {
    frontmatter: { slug, ...result.data },
    source: content,
  };
});
