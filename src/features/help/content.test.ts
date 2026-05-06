// Testes de getHelpTopics / getHelpTopic. Usa fixtures persistentes em
// __fixtures__/help/ + diretorios tmp para casos especificos.
//
// `cache()` do React deduplica chamadas dentro do mesmo escopo de modulo,
// entao usamos `vi.resetModules()` entre testes que mudam o cenario.

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const FIXTURES_DIR = path.resolve(__dirname, '__fixtures__/help');

async function makeTmpHelpDir(files: Record<string, string>): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'help-test-'));
  for (const [name, content] of Object.entries(files)) {
    await fs.writeFile(path.join(dir, name), content, 'utf8');
  }
  return dir;
}

async function importFresh() {
  vi.resetModules();
  return import('./content');
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  delete process.env.HELP_CONTENT_DIR;
  vi.restoreAllMocks();
});

describe('getHelpTopics', () => {
  it('retorna [] quando o diretorio nao existe', async () => {
    process.env.HELP_CONTENT_DIR = path.join(os.tmpdir(), 'help-does-not-exist-' + Date.now());
    const { getHelpTopics } = await importFresh();
    expect(await getHelpTopics()).toEqual([]);
  });

  it('le frontmatter valido e deriva slug do filename', async () => {
    process.env.HELP_CONTENT_DIR = FIXTURES_DIR;
    const { getHelpTopics } = await importFresh();
    const topics = await getHelpTopics();

    // topic-invalid.mdx e descartado; topic-valid + topic-second carregam.
    expect(topics).toHaveLength(2);
    expect(topics[0]).toMatchObject({
      slug: 'topic-valid',
      title: 'Boas-vindas',
      videoUrl: 'https://pub-test.r2.dev/help/topic-valid.mp4',
      order: 1,
    });
    expect(topics[1]).toMatchObject({
      slug: 'topic-second',
      title: 'Aprender a usar',
      order: 100, // default
    });
  });

  it('descarta arquivo com frontmatter invalido e mantem os demais', async () => {
    process.env.HELP_CONTENT_DIR = FIXTURES_DIR;
    const { getHelpTopics } = await importFresh();
    const topics = await getHelpTopics();

    expect(topics.find((t) => t.slug === 'topic-invalid')).toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('topic-invalid.mdx'),
    );
  });

  it('ordena por order ASC e desempata por title ASC', async () => {
    const dir = await makeTmpHelpDir({
      'a.mdx': mdx({ title: 'Beta', description: 'd', videoUrl: 'https://x/a.mp4', order: 5 }),
      'b.mdx': mdx({ title: 'Alfa', description: 'd', videoUrl: 'https://x/b.mp4', order: 5 }),
      'c.mdx': mdx({ title: 'Gama', description: 'd', videoUrl: 'https://x/c.mp4', order: 1 }),
    });
    process.env.HELP_CONTENT_DIR = dir;
    const { getHelpTopics } = await importFresh();
    const topics = await getHelpTopics();

    expect(topics.map((t) => t.slug)).toEqual(['c', 'b', 'a']);
  });

  it('rejeita videoUrl http (nao https)', async () => {
    const dir = await makeTmpHelpDir({
      'http.mdx': mdx({ title: 't', description: 'd', videoUrl: 'http://insecure/x.mp4' }),
    });
    process.env.HELP_CONTENT_DIR = dir;
    const { getHelpTopics } = await importFresh();
    expect(await getHelpTopics()).toEqual([]);
  });
});

describe('getHelpTopic', () => {
  it('retorna null para slug com path traversal sem tocar fs', async () => {
    process.env.HELP_CONTENT_DIR = FIXTURES_DIR;
    const { getHelpTopic } = await importFresh();
    expect(await getHelpTopic('../etc/passwd')).toBeNull();
    expect(await getHelpTopic('foo/bar')).toBeNull();
    expect(await getHelpTopic('CAPS')).toBeNull();
    expect(await getHelpTopic('with space')).toBeNull();
  });

  it('retorna frontmatter parsed + source para slug valido', async () => {
    process.env.HELP_CONTENT_DIR = FIXTURES_DIR;
    const { getHelpTopic } = await importFresh();
    const topic = await getHelpTopic('topic-valid');
    expect(topic).not.toBeNull();
    expect(topic?.frontmatter.slug).toBe('topic-valid');
    expect(topic?.frontmatter.title).toBe('Boas-vindas');
    expect(topic?.source).toContain('Corpo MDX válido.');
  });

  it('retorna null quando arquivo nao existe', async () => {
    process.env.HELP_CONTENT_DIR = FIXTURES_DIR;
    const { getHelpTopic } = await importFresh();
    expect(await getHelpTopic('inexistente')).toBeNull();
  });

  it('retorna null quando frontmatter invalido', async () => {
    process.env.HELP_CONTENT_DIR = FIXTURES_DIR;
    const { getHelpTopic } = await importFresh();
    expect(await getHelpTopic('topic-invalid')).toBeNull();
  });
});

// Helper para gerar string MDX a partir de um frontmatter parcial.
function mdx(fm: Record<string, unknown>): string {
  const lines = Object.entries(fm).map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
  return `---\n${lines.join('\n')}\n---\n\nCorpo.\n`;
}
