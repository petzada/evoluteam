// Helpers puros de permissao — chamaveis em server e client.
// Spec: docs/dev/21-ft-9-redesign-acessos.md §1.5 / §4.2.

import type {
  Actor,
  Role,
  ScreenAction,
  ScreenKey,
  ScreenPermissionKey,
  ScreenPermissions,
} from './types';
import { ALL_SCREEN_PERMISSION_KEYS } from './types';

// Assinatura minima que canDo precisa saber sobre o actor. Usar um tipo
// estrutural permite que qualquer Actor local (dos modulos existentes) seja
// aceito sem refactor invasivo — basta o objeto ter `role` e (opcionalmente)
// `screenPermissions`.
export type CanDoActor = {
  role: Role | string;
  screenPermissions?: ScreenPermissions | null;
};

// Telas de Configuracoes: director nao tem acesso a nenhuma delas.
// Spec: permissoes.md linhas 40-43 (director so visualiza dashboard/relatorios,
// avaliacoes, feedbacks, pdi e colaboradores). Configuracoes nao e mencionado
// no escopo do director.
const DIRECTOR_BLOCKED_SCREENS: readonly ScreenKey[] = [
  'empresa',
  'cargos',
  'departamentos',
  'unidades',
  'competencias',
  'auditoria',
];

const ALL_SCREEN_PERMISSION_KEYS_SET = new Set<ScreenPermissionKey>(ALL_SCREEN_PERMISSION_KEYS);

function editKeyFor(screen: ScreenKey): ScreenPermissionKey | null {
  const key = `${screen}.edit` as ScreenPermissionKey;
  return ALL_SCREEN_PERMISSION_KEYS_SET.has(key) ? key : null;
}

/**
 * Normaliza o JSON compacto de toggles antes de persistir/comparar:
 * - remove chaves false/invalidas;
 * - garante o invariante edit => view.
 */
export function normalizeScreenPermissions(
  permissions: ScreenPermissions | null | undefined,
): ScreenPermissions {
  const out: ScreenPermissions = {};
  if (!permissions) return out;

  for (const [key, value] of Object.entries(permissions) as [ScreenPermissionKey, boolean][]) {
    if (value !== true || !ALL_SCREEN_PERMISSION_KEYS_SET.has(key)) continue;
    out[key] = true;
    if (key.endsWith('.edit')) {
      const screen = key.slice(0, -'.edit'.length) as ScreenKey;
      const viewKey = `${screen}.view` as ScreenPermissionKey;
      if (ALL_SCREEN_PERMISSION_KEYS_SET.has(viewKey)) {
        out[viewKey] = true;
      }
    }
  }

  return out;
}

/**
 * Lista todos os toggles que um actor nao-admin nao pode conceder. Como o
 * JSON e compacto, chave ausente significa false e deve ficar desabilitada.
 */
export function getDisabledGrantPermissionKeys(
  actorScreenPermissions: ScreenPermissions | null | undefined,
): ScreenPermissionKey[] {
  const own = normalizeScreenPermissions(actorScreenPermissions);
  return ALL_SCREEN_PERMISSION_KEYS.filter((key) => own[key] !== true);
}

/**
 * Decide se um ator pode executar a acao (view ou edit) na tela informada.
 *
 * Regras:
 *   - admin_rh: tudo.
 *   - director: view em qualquer tela EXCETO Configuracoes; edit em nenhuma.
 *   - user: checa o toggle correspondente em screenPermissions.
 *   - demais roles: false.
 *
 * Nao substitui as regras de baseline pessoal/arvore — aquelas sao aplicadas
 * em canView* de cada modulo. canDo cobre apenas o eixo "acesso global".
 */
export function canDo(
  actor: CanDoActor | null | undefined,
  screen: ScreenKey,
  action: ScreenAction,
): boolean {
  if (!actor) return false;
  if (actor.role === 'admin_rh') return true;
  if (actor.role === 'director') {
    if (action === 'edit') return false;
    if (DIRECTOR_BLOCKED_SCREENS.includes(screen)) return false;
    return true;
  }
  if (actor.role === 'user') {
    const key = `${screen}.${action}` as ScreenPermissionKey;
    if (actor.screenPermissions?.[key] === true) return true;
    if (action === 'view') {
      const editKey = editKeyFor(screen);
      if (editKey && actor.screenPermissions?.[editKey] === true) return true;
    }
    return false;
  }
  return false;
}

/**
 * Helper de escalacao: colaborador com colaboradores.edit so pode conceder
 * toggles que ele proprio possui.
 *
 * Admin concede livremente; director nao concede; user com toggle valida
 * se o subset de newPerms esta contido em actor.screenPermissions.
 */
export function canGrantScreenPermissions(
  actor: CanDoActor | null,
  newPerms: ScreenPermissions,
): boolean {
  if (!actor) return false;
  if (actor.role === 'admin_rh') return true;
  if (actor.role !== 'user') return false;

  if (!canDo(actor, 'colaboradores', 'edit')) return false;

  const own = normalizeScreenPermissions(actor.screenPermissions);
  const requested = normalizeScreenPermissions(newPerms);
  for (const [key, value] of Object.entries(requested) as [ScreenPermissionKey, boolean][]) {
    if (value === true && own[key] !== true) return false;
  }
  return true;
}

/**
 * Quem pode conceder qual role em um convite.
 *
 * Regras:
 *   - Administrador concede qualquer role (admin_rh/director/user).
 *   - Colaborador com colaboradores.edit concede apenas 'user' (nao escala).
 *   - Qualquer outro perfil nao concede.
 */
export function canInviteAs(actor: Actor | null, targetRole: Role): boolean {
  if (!actor) return false;
  if (actor.role === 'admin_rh') return true;
  if (
    actor.role === 'user'
    && canDo(actor, 'colaboradores', 'edit')
    && targetRole === 'user'
  ) {
    return true;
  }
  return false;
}

/**
 * Quem pode alterar o role/toggles de um usuario existente.
 *
 * Regras:
 *   - Administrador pode alterar qualquer outro usuario (modal de confirmacao
 *     na UI para escalada a admin_rh — controlada pela UI, nao aqui).
 *   - Colaborador com colaboradores.edit pode alterar dados de outros
 *     Colaboradores mantendo o role (nao escala para director/admin_rh).
 *   - Ninguem pode alterar o proprio role.
 */
export function canChangeUserAccess(
  actor: Actor | null,
  target: { userId: string; role: Role },
  newRole: Role,
): boolean {
  if (!actor) return false;
  if (actor.userId === target.userId) return false;
  if (actor.role === 'admin_rh') return true;
  if (
    actor.role === 'user'
    && canDo(actor, 'colaboradores', 'edit')
    && target.role === 'user'
    && newRole === 'user'
  ) {
    return true;
  }
  return false;
}
