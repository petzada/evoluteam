/**
 * Permissions do modulo Recrutamento.
 *
 * Roles vigentes: 'admin_rh' | 'director' | 'user'.
 * "gestor" e derivado: um user que e hiring_manager de alguma vaga.
 *
 * Spec original: docs/dev/13-ft-7-fundacao.md §5.1.
 * FT-9 (granularidade por tela): docs/dev/21-ft-9-redesign-acessos.md §1.5.
 */

import { canDo } from '@/features/permissions/permissions';
import type { ScreenPermissions } from '@/features/permissions/types';

export interface RecruitmentActor {
  role: 'admin_rh' | 'director' | 'user' | string;
  employeeId: string | null;
  screenPermissions?: ScreenPermissions | null;
}

// ============================================================
// Acesso ao modulo
// ============================================================

export function canAccessRecruitmentModule(actor: RecruitmentActor): boolean {
  if (actor.role === 'admin_rh' || actor.role === 'director') return true;
  // Qualquer tela de recrutamento com view ja libera o modulo inteiro.
  if (canDo(actor, 'recrutamento_vagas', 'view')) return true;
  if (canDo(actor, 'recrutamento_candidatos', 'view')) return true;
  if (canDo(actor, 'recrutamento_etapas', 'view')) return true;
  if (canDo(actor, 'recrutamento_relatorios', 'view')) return true;
  // user/rh comum que e hiring_manager tambem acessa (baseline contextual).
  return actor.role === 'user' && !!actor.employeeId;
}

// ============================================================
// Vagas (job_openings)
// ============================================================

export function canManageJobOpenings(actor: RecruitmentActor): boolean {
  return canDo(actor, 'recrutamento_vagas', 'edit');
}

export function canViewAllJobOpenings(actor: RecruitmentActor): boolean {
  return canDo(actor, 'recrutamento_vagas', 'view');
}

/** Gestor so ve vagas proprias — a lista real e filtrada pela RLS. */
export function canViewAssignedJobOpenings(actor: RecruitmentActor): boolean {
  return actor.role === 'user' && !!actor.employeeId;
}

// ============================================================
// Candidatos (candidates)
// ============================================================

/**
 * Compat legado: alguns call sites ainda usam o nome antigo
 * "canManageRecruitment" para gates administrativos do modulo.
 * Mapeia para candidatos.edit (o uso mais comum).
 */
export function canManageRecruitment(actor: RecruitmentActor): boolean {
  return canDo(actor, 'recrutamento_candidatos', 'edit');
}

export function canManageCandidates(actor: RecruitmentActor): boolean {
  return canDo(actor, 'recrutamento_candidatos', 'edit');
}

export function canViewAllCandidates(actor: RecruitmentActor): boolean {
  return canDo(actor, 'recrutamento_candidatos', 'view');
}

/** Gestor/hiring_manager acessa a tela; RLS filtra para aplicacoes em suas vagas. */
export function canViewAssignedCandidates(actor: RecruitmentActor): boolean {
  return actor.role === 'user' && !!actor.employeeId;
}

// ============================================================
// Aplicacoes (job_applications)
// ============================================================

export function canManageApplications(actor: RecruitmentActor): boolean {
  return canDo(actor, 'recrutamento_candidatos', 'edit');
}

/**
 * Mover card entre etapas. Admin/toggle sempre; gestor quando
 * e hiring_manager da vaga. Checagem concreta de "e hiring_manager" e
 * feita pela RLS + server action.
 */
export function canMoveApplication(actor: RecruitmentActor): boolean {
  if (canDo(actor, 'recrutamento_candidatos', 'edit')) return true;
  return actor.role === 'user' && !!actor.employeeId;
}

/** Disparar wizard de contratacao. */
export function canHireCandidate(actor: RecruitmentActor): boolean {
  return canDo(actor, 'recrutamento_candidatos', 'edit');
}

// ============================================================
// Feedback / Scorecard / Tasks (usadas nas Ondas 2 e 3)
// ============================================================

export function canGiveFeedback(actor: RecruitmentActor): boolean {
  // Director tambem (FT-8 P4 B): opina em candidato mesmo sem ser HM.
  if (actor.role === 'director') return true;
  if (canDo(actor, 'recrutamento_candidatos', 'edit')) return true;
  return actor.role === 'user' && !!actor.employeeId;
}

export function canSubmitScorecard(actor: RecruitmentActor): boolean {
  // Director NAO entra aqui (P4 B limita director a feedback — scorecard
  // tem nota e peso de decisao, fica com HM + admin/toggle).
  if (canDo(actor, 'recrutamento_candidatos', 'edit')) return true;
  return actor.role === 'user' && !!actor.employeeId;
}

export function canManageTasks(actor: RecruitmentActor): boolean {
  // Director NAO entra aqui (task tem compromisso operacional; P4 B).
  if (canDo(actor, 'recrutamento_candidatos', 'edit')) return true;
  return actor.role === 'user' && !!actor.employeeId;
}

// ============================================================
// Etapas de recrutamento (Configuracoes)
// ============================================================

export function canManageStages(actor: RecruitmentActor): boolean {
  return canDo(actor, 'recrutamento_etapas', 'edit');
}

// ============================================================
// Metricas / Relatorios (Onda 3)
// ============================================================

export function canViewMetrics(actor: RecruitmentActor): boolean {
  return canAccessRecruitmentModule(actor);
}
