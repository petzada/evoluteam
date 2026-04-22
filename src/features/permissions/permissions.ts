// Helpers puros de permissao — chamaveis em server e client.
// Spec original: docs/dev/19-ft-8-granularidade-rh.md §7.
// Spec FT-9 (granularidade por tela): docs/dev/21-ft-9-redesign-acessos.md §1.4 a §1.6.

import type {
  Actor,
  RhPermissionKey,
  RhPermissions,
  Role,
  ScreenAction,
  ScreenKey,
  ScreenPermissionKey,
  ScreenPermissions,
} from './types';

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

// =============================================================
// FT-9 — canDo: granularidade por tela
// Spec: docs/dev/21-ft-9-redesign-acessos.md §1.5 / §4.2
// =============================================================

export type CanDoActor = {
  role: Role | string;
  screenPermissions?: ScreenPermissions | null;
  rhPermissions?: RhPermissions | null; // compat FT-8 durante fases
};

/**
 * Decide se um ator pode executar a acao (view ou edit) na tela informada.
 *
 * Regras (spec FT-9 §1.6):
 *   - admin_rh: tudo.
 *   - director: view em qualquer tela; edit em nenhuma.
 *   - user: checa o toggle correspondente em screenPermissions.
 *   - rh (compat FT-8): se tiver screenPermissions populado, usa ele; senao
 *     cai no mapeamento legado de rhPermissions (ver screenPermissionFromRh).
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
  if (actor.role === 'director') return action === 'view';

  if (actor.role === 'user' || actor.role === 'rh') {
    const key = `${screen}.${action}` as ScreenPermissionKey;

    if (actor.screenPermissions && actor.screenPermissions[key] === true) {
      return true;
    }

    // Fallback: user legado sem registro em user_screen_permissions.
    // rh legado (FT-8) sem backfill ainda aplicado tambem cai aqui.
    if (actor.role === 'rh' && actor.rhPermissions) {
      const legacyKey = mapScreenToLegacyRhKey(screen);
      if (legacyKey && actor.rhPermissions[legacyKey]) return true;
    }
  }

  return false;
}

// Mapeamento screen -> chave legada rh_permissions (para compat transicao FT-8→FT-9).
// Quando screenPermissions nao estiver populado, verifica rhPermissions.
function mapScreenToLegacyRhKey(screen: ScreenKey): RhPermissionKey | null {
  switch (screen) {
    case 'colaboradores':
    case 'cargos':
    case 'departamentos':
    case 'competencias':
      return 'can_employees';
    case 'avaliacoes':
      return 'can_reviews';
    case 'pdi':
    case 'feedbacks':
      return 'can_pdi_feedback';
    case 'recrutamento_vagas':
    case 'recrutamento_candidatos':
    case 'recrutamento_etapas':
    case 'recrutamento_relatorios':
      return 'can_recruitment';
    case 'empresa':
    case 'auditoria':
      return 'can_audit';
    case 'dashboard':
      return null; // baseline, sem toggle
  }
}

/**
 * Helper de escalacao (spec §1.6): colaborador com colaboradores.edit
 * so pode conceder toggles que ele proprio possui.
 *
 * Admin concede livremente; director nao concede; user com toggle
 * valida se o subset de newPerms esta contido em actor.screenPermissions.
 */
export function canGrantScreenPermissions(
  actor: CanDoActor | null,
  newPerms: ScreenPermissions,
): boolean {
  if (!actor) return false;
  if (actor.role === 'admin_rh') return true;
  if (actor.role !== 'user' && actor.role !== 'rh') return false;

  // Usuario comum so concede se ele proprio tem colaboradores.edit
  if (!canDo(actor, 'colaboradores', 'edit')) return false;

  // E so concede subset dos proprios toggles
  const own = actor.screenPermissions ?? {};
  for (const [key, value] of Object.entries(newPerms) as [ScreenPermissionKey, boolean][]) {
    if (value === true && own[key] !== true) return false;
  }
  return true;
}
