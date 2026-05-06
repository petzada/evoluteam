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
import {
  ALL_SCREEN_PERMISSION_KEYS,
  type ScreenKey,
  type ScreenPermissionKey,
} from '@/features/permissions/types';
import type { HelpTopic } from './types';

const VALID_VIEW_PERMISSION_KEYS = new Set<ScreenPermissionKey>(
  ALL_SCREEN_PERMISSION_KEYS.filter((key) => key.endsWith('.view')),
);

function toKnownScreen(screen: string): ScreenKey | null {
  const viewKey = `${screen}.view` as ScreenPermissionKey;
  if (!VALID_VIEW_PERMISSION_KEYS.has(viewKey)) return null;
  return screen as ScreenKey;
}

export function isTopicVisible(topic: HelpTopic, actor: CanDoActor): boolean {
  if (topic.adminOnly && actor.role !== 'admin_rh') return false;
  if (topic.screen) {
    const screen = toKnownScreen(topic.screen);
    if (!screen) return false;
    return canDo(actor, screen, 'view');
  }
  return true;
}

export function filterTopicsForActor(topics: HelpTopic[], actor: CanDoActor): HelpTopic[] {
  return topics.filter((t) => isTopicVisible(t, actor));
}
