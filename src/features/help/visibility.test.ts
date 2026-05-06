// Matriz de visibilidade × papeis × toggles FT-9.

import { describe, expect, it } from 'vitest';
import { filterTopicsForActor, isTopicVisible } from './visibility';
import type { HelpTopic } from './types';
import {
  adminActor,
  directorActor,
  userPuroActor,
  userComToggleCandidatosActor,
} from './__fixtures__/actors';

const baseTopic = (overrides: Partial<HelpTopic> = {}): HelpTopic => ({
  slug: 't',
  title: 'Tópico',
  description: 'desc',
  videoUrl: 'https://x/y.mp4',
  adminOnly: false,
  order: 100,
  ...overrides,
});

describe('isTopicVisible — baseline (sem screen, sem adminOnly)', () => {
  const topic = baseTopic();

  it('admin vê', () => expect(isTopicVisible(topic, adminActor)).toBe(true));
  it('director vê', () => expect(isTopicVisible(topic, directorActor)).toBe(true));
  it('user puro vê', () => expect(isTopicVisible(topic, userPuroActor)).toBe(true));
  it('user com toggle vê', () =>
    expect(isTopicVisible(topic, userComToggleCandidatosActor)).toBe(true));
});

describe('isTopicVisible — adminOnly: true (sem screen)', () => {
  const topic = baseTopic({ adminOnly: true });

  it('só admin vê', () => {
    expect(isTopicVisible(topic, adminActor)).toBe(true);
    expect(isTopicVisible(topic, directorActor)).toBe(false);
    expect(isTopicVisible(topic, userPuroActor)).toBe(false);
    expect(isTopicVisible(topic, userComToggleCandidatosActor)).toBe(false);
  });
});

describe('isTopicVisible — screen: recrutamento_candidatos', () => {
  const topic = baseTopic({ screen: 'recrutamento_candidatos' });

  it('admin vê (bypass)', () =>
    expect(isTopicVisible(topic, adminActor)).toBe(true));

  it('director vê (acesso amplo de view)', () =>
    expect(isTopicVisible(topic, directorActor)).toBe(true));

  it('user puro NÃO vê (sem toggle)', () =>
    expect(isTopicVisible(topic, userPuroActor)).toBe(false));

  it('user com toggle recrutamento_candidatos.view vê', () =>
    expect(isTopicVisible(topic, userComToggleCandidatosActor)).toBe(true));
});

describe('isTopicVisible — screen de Configurações (auditoria)', () => {
  // director nao tem acesso a Configuracoes (incl. auditoria) por regra do canDo.
  const topic = baseTopic({ screen: 'auditoria' });

  it('admin vê', () => expect(isTopicVisible(topic, adminActor)).toBe(true));
  it('director NÃO vê (Config bloqueada)', () =>
    expect(isTopicVisible(topic, directorActor)).toBe(false));
  it('user puro NÃO vê', () =>
    expect(isTopicVisible(topic, userPuroActor)).toBe(false));
});

describe('isTopicVisible — screen + adminOnly (ambos exigidos)', () => {
  const topic = baseTopic({ screen: 'auditoria', adminOnly: true });

  it('admin vê (passa em ambos)', () =>
    expect(isTopicVisible(topic, adminActor)).toBe(true));

  it('director NÃO vê (falha em adminOnly)', () =>
    expect(isTopicVisible(topic, directorActor)).toBe(false));

  it('user puro NÃO vê (falha em adminOnly)', () =>
    expect(isTopicVisible(topic, userPuroActor)).toBe(false));
});

describe('isTopicVisible — screen desconhecido', () => {
  const topic = baseTopic({ screen: 'screen-que-nao-existe' });

  it('admin NÃO vê (screen desconhecido fica oculto)', () =>
    expect(isTopicVisible(topic, adminActor)).toBe(false));

  it('director NÃO vê (screen desconhecido fica oculto)', () =>
    expect(isTopicVisible(topic, directorActor)).toBe(false));

  it('user NÃO vê (sem toggle correspondente)', () =>
    expect(isTopicVisible(topic, userPuroActor)).toBe(false));
});

describe('filterTopicsForActor', () => {
  const topics: HelpTopic[] = [
    baseTopic({ slug: 'baseline', title: 'A' }),
    baseTopic({ slug: 'admin-only', title: 'B', adminOnly: true }),
    baseTopic({ slug: 'recruta', title: 'C', screen: 'recrutamento_candidatos' }),
    baseTopic({ slug: 'auditoria', title: 'D', screen: 'auditoria' }),
    baseTopic({ slug: 'unknown', title: 'E', screen: 'screen-que-nao-existe' }),
  ];

  it('admin vê todos os tópicos com screen conhecida', () => {
    expect(filterTopicsForActor(topics, adminActor).map((t) => t.slug)).toEqual([
      'baseline', 'admin-only', 'recruta', 'auditoria',
    ]);
  });

  it('director vê baseline + recruta (Config bloqueada, adminOnly bloqueada)', () => {
    expect(filterTopicsForActor(topics, directorActor).map((t) => t.slug)).toEqual([
      'baseline', 'recruta',
    ]);
  });

  it('user puro vê só baseline', () => {
    expect(filterTopicsForActor(topics, userPuroActor).map((t) => t.slug)).toEqual([
      'baseline',
    ]);
  });

  it('user com toggle de candidatos vê baseline + recruta', () => {
    expect(
      filterTopicsForActor(topics, userComToggleCandidatosActor).map((t) => t.slug),
    ).toEqual(['baseline', 'recruta']);
  });
});
