// Filtro de visibilidade de tutoriais.
//
// Regra (espelha isItemVisible da Sidebar):
//   - adminOnly: true        → so admin_rh.
//   - screen: <key>          → canDo(actor, screen, 'view').
//   - sem screen nem adminOnly → baseline (todos os autenticados).
//
// Slug existente mas filtrado pela visibilidade NAO deve revelar sua
// existencia ao actor — a UI deve responder com notFound() (mesmo
// tratamento que slug inexistente).

import { canDo, type CanDoActor } from '@/features/permissions/permissions';
import type { ScreenKey } from '@/features/permissions/types';
import type { HelpTopic } from './types';

export function isTopicVisible(topic: HelpTopic, actor: CanDoActor): boolean {
  if (topic.adminOnly && actor.role !== 'admin_rh') return false;
  if (topic.screen) {
    return canDo(actor, topic.screen as ScreenKey, 'view');
  }
  return true;
}

export function filterTopicsForActor(topics: HelpTopic[], actor: CanDoActor): HelpTopic[] {
  return topics.filter((t) => isTopicVisible(t, actor));
}
