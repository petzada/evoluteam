// Helpers puros de permissao — chamaveis em server e client.
// Spec: docs/dev/19-ft-8-granularidade-rh.md §7.

import type { Actor, RhPermissionKey, RhPermissions, Role } from './types';

// Assinatura minima que hasAdminPower precisa saber sobre o actor.
// Usar um tipo estrutural permite que qualquer Actor local (dos
// modulos existentes) seja aceito sem refactor invasivo — basta o
// objeto ter `role` e (opcionalmente) `rhPermissions`.
export type HasAdminPowerActor = {
  role: Role | string;
  rhPermissions?: RhPermissions | null;
};

/**
 * Retorna true se o actor tem poder administrativo na area indicada.
 *
 * admin_rh tem tudo por default.
 * rh tem um poder se o toggle correspondente em rh_permissions esta ativo.
 * Outros roles nao tem poder administrativo nesta dimensao.
 *
 * Esta funcao e o ponto unico de checagem "admin power". Qualquer gate
 * de UI ou server action que antes olhava apenas `role === 'admin_rh'`
 * passa a chamar hasAdminPower(actor, 'can_X').
 */
export function hasAdminPower(
  actor: HasAdminPowerActor | null | undefined,
  area: RhPermissionKey,
): boolean {
  if (!actor) return false;
  if (actor.role === 'admin_rh') return true;
  if (actor.role === 'rh' && actor.rhPermissions?.[area]) return true;
  return false;
}

/**
 * Atalhos por modulo — equivalem a hasAdminPower + label semantica.
 * Ajudam a tornar as intencoes explicitas nos call sites.
 */
export const canManageEmployeesAndStructure = (actor: HasAdminPowerActor | null) =>
  hasAdminPower(actor, 'can_employees');

export const canManageReviews = (actor: HasAdminPowerActor | null) =>
  hasAdminPower(actor, 'can_reviews');

export const canManageRecruitment = (actor: HasAdminPowerActor | null) =>
  hasAdminPower(actor, 'can_recruitment');

export const canModeratePdiAndFeedback = (actor: HasAdminPowerActor | null) =>
  hasAdminPower(actor, 'can_pdi_feedback');

export const canManageInvites = (actor: HasAdminPowerActor | null) =>
  hasAdminPower(actor, 'can_invites');

export const canViewAudit = (actor: HasAdminPowerActor | null) =>
  hasAdminPower(actor, 'can_audit');

/**
 * Quem pode conceder qual role em um convite.
 *
 * Regra P8 · C (decisao de brainstorm):
 *   - Administrador concede qualquer role.
 *   - RH com can_invites concede apenas Colaborador.
 *   - Qualquer outro perfil nao concede.
 */
export function canInviteAs(actor: Actor | null, targetRole: Role): boolean {
  if (!actor) return false;
  if (actor.role === 'admin_rh') return true;
  if (actor.role === 'rh' && actor.rhPermissions?.can_invites && targetRole === 'user') {
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
 *   - RH com can_invites pode alterar dados de usuarios que sao Colaborador
 *     e manter o role como Colaborador (nao escala para rh/director/admin_rh).
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
    actor.role === 'rh' &&
    actor.rhPermissions?.can_invites &&
    target.role === 'user' &&
    newRole === 'user'
  ) {
    return true;
  }
  return false;
}
