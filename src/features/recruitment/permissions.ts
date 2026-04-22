/**
 * Permissions do módulo Recrutamento (FT-7).
 *
 * Nota sobre roles:
 * - O banco guarda role ∈ ('admin_rh','director','user','rh').
 * - "gestor" é derivado: um user que é `hiring_manager` de alguma vaga.
 * - Na UI, tratamos como 5 papéis efetivos: admin_rh / director / rh / gestor / colaborador.
 *
 * Spec: docs/dev/13-ft-7-fundacao.md §5.1 + docs/dev/19-ft-8-granularidade-rh.md §7.
 */

import { hasAdminPower } from '@/features/permissions/permissions';
import type { RhPermissions } from '@/features/permissions/types';

export interface RecruitmentActor {
  role: string;                  // 'admin_rh' | 'director' | 'user' | 'rh'
  employeeId: string | null;     // id em employees (null se user sem perfil de colaborador)
  rhPermissions?: RhPermissions | null;
}

// ============================================================
// Acesso ao módulo
// ============================================================

export function canAccessRecruitmentModule(actor: RecruitmentActor): boolean {
  if (actor.role === 'admin_rh' || actor.role === 'director') return true;
  if (actor.role === 'rh') return true;
  // user comum só acessa se tem perfil de colaborador (pra poder ser hiring_manager)
  return actor.role === 'user' && !!actor.employeeId;
}

// ============================================================
// Vagas (job_openings)
// ============================================================

export function canManageJobOpenings(actor: RecruitmentActor): boolean {
  return hasAdminPower(actor, 'can_recruitment');
}

export function canViewAllJobOpenings(actor: RecruitmentActor): boolean {
  if (actor.role === 'admin_rh' || actor.role === 'director') return true;
  return hasAdminPower(actor, 'can_recruitment');
}

/** Gestor só vê vagas próprias — a lista real é filtrada pela RLS. */
export function canViewAssignedJobOpenings(actor: RecruitmentActor): boolean {
  return actor.role === 'user' && !!actor.employeeId;
}

// ============================================================
// Candidatos (candidates)
// ============================================================

/**
 * Compat legado: alguns call sites ainda usam o nome antigo
 * "canManageRecruitment" para gates administrativos do modulo.
 */
export function canManageRecruitment(actor: RecruitmentActor): boolean {
  return hasAdminPower(actor, 'can_recruitment');
}

export function canManageCandidates(actor: RecruitmentActor): boolean {
  return hasAdminPower(actor, 'can_recruitment');
}

export function canViewAllCandidates(actor: RecruitmentActor): boolean {
  if (actor.role === 'admin_rh' || actor.role === 'director') return true;
  return hasAdminPower(actor, 'can_recruitment');
}

// ============================================================
// Aplicações (job_applications)
// ============================================================

export function canManageApplications(actor: RecruitmentActor): boolean {
  return hasAdminPower(actor, 'can_recruitment');
}

/**
 * Mover card entre etapas. Admin/RH-recruitment sempre; gestor quando
 * é hiring_manager da vaga. Checagem concreta de "é hiring_manager" é
 * feita pela RLS + server action.
 */
export function canMoveApplication(actor: RecruitmentActor): boolean {
  if (hasAdminPower(actor, 'can_recruitment')) return true;
  return actor.role === 'user' && !!actor.employeeId;
}

/** Disparar wizard de contratação — admin ou rh com can_recruitment. */
export function canHireCandidate(actor: RecruitmentActor): boolean {
  return hasAdminPower(actor, 'can_recruitment');
}

// ============================================================
// Feedback / Scorecard / Tasks (usadas nas Ondas 2 e 3)
// ============================================================

export function canGiveFeedback(actor: RecruitmentActor): boolean {
  // Director tambem (FT-8 · P4 B): opina em candidato mesmo sem ser HM.
  if (actor.role === 'director') return true;
  if (hasAdminPower(actor, 'can_recruitment')) return true;
  return actor.role === 'user' && !!actor.employeeId;
}

export function canSubmitScorecard(actor: RecruitmentActor): boolean {
  // Director NAO entra aqui (P4 B limita director a feedback — scorecard
  // tem nota e peso de decisao, fica com HM + admin/rh-recruitment).
  if (hasAdminPower(actor, 'can_recruitment')) return true;
  return actor.role === 'user' && !!actor.employeeId;
}

export function canManageTasks(actor: RecruitmentActor): boolean {
  // Director NAO entra aqui (task tem compromisso operacional; P4 B).
  if (hasAdminPower(actor, 'can_recruitment')) return true;
  return actor.role === 'user' && !!actor.employeeId;
}

// ============================================================
// Etapas de recrutamento (Configurações)
// ============================================================

export function canManageStages(actor: RecruitmentActor): boolean {
  return hasAdminPower(actor, 'can_recruitment');
}

// ============================================================
// Métricas / Relatórios (Onda 3)
// ============================================================

export function canViewMetrics(actor: RecruitmentActor): boolean {
  return canAccessRecruitmentModule(actor);
}
