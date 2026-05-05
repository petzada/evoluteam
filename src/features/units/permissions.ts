// Spec FT-10 §5.2: gerenciar unidade espelha o padrao FT-9 (canDo + screen edit).
// Atribuir/editar unit_id em employees segue o gate de colaboradores.edit.

import { canDo, type CanDoActor } from '@/features/permissions/permissions';

/**
 * Pode criar/editar/arquivar/desarquivar unidades em /configuracoes/unidades.
 * - admin_rh: sempre.
 * - user com toggle `unidades.edit`: sim.
 * - director: nao (Configuracoes esta no DIRECTOR_BLOCKED_SCREENS).
 */
export function canManageUnits(actor: CanDoActor | null | undefined): boolean {
  return canDo(actor, 'unidades', 'edit');
}

/**
 * Pode visualizar a tela /configuracoes/unidades.
 * View segue mesmo padrao das outras telas de configuracao.
 */
export function canViewUnits(actor: CanDoActor | null | undefined): boolean {
  return canDo(actor, 'unidades', 'view');
}
