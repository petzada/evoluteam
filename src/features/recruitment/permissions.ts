/**
 * Permissions do módulo Recrutamento (FT-7).
 *
 * Nota sobre roles:
 * - O banco guarda role ∈ ('admin_rh','director','user').
 * - "gestor" é derivado: um user que é `hiring_manager` de alguma vaga.
 * - Na UI, tratamos como 4 papéis efetivos: admin_rh / director / gestor / colaborador.
 *
 * Spec: docs/dev/13-ft-7-fundacao.md §5.1
 */

export interface RecruitmentActor {
  role: string;                  // 'admin_rh' | 'director' | 'user'
  employeeId: string | null;     // id em employees (null se user sem perfil de colaborador)
}

// ============================================================
// Acesso ao módulo
// ============================================================

export function canAccessRecruitmentModule(actor: RecruitmentActor): boolean {
  if (actor.role === 'admin_rh' || actor.role === 'director') return true;
  // user comum só acessa se tem perfil de colaborador (pra poder ser hiring_manager)
  return actor.role === 'user' && !!actor.employeeId;
}

// ============================================================
// Vagas (job_openings)
// ============================================================

export function canManageJobOpenings(actor: RecruitmentActor): boolean {
  return actor.role === 'admin_rh';
}

export function canViewAllJobOpenings(actor: RecruitmentActor): boolean {
  return actor.role === 'admin_rh' || actor.role === 'director';
}

/** Gestor só vê vagas próprias — a lista real é filtrada pela RLS. */
export function canViewAssignedJobOpenings(actor: RecruitmentActor): boolean {
  return actor.role === 'user' && !!actor.employeeId;
}

// ============================================================
// Candidatos (candidates)
// ============================================================

export function canManageCandidates(actor: RecruitmentActor): boolean {
  return actor.role === 'admin_rh';
}

export function canViewAllCandidates(actor: RecruitmentActor): boolean {
  return actor.role === 'admin_rh' || actor.role === 'director';
}

// ============================================================
// Aplicações (job_applications)
// ============================================================

export function canManageApplications(actor: RecruitmentActor): boolean {
  return actor.role === 'admin_rh';
}

/**
 * Mover card entre etapas. Admin sempre; gestor quando é hiring_manager
 * da vaga. Checagem concreta de "é hiring_manager dessa vaga" é feita
 * pela RLS + server action.
 */
export function canMoveApplication(actor: RecruitmentActor): boolean {
  if (actor.role === 'admin_rh') return true;
  return actor.role === 'user' && !!actor.employeeId;
}

/** Disparar wizard de contratação — só admin_rh (decisão 7 / matriz B). */
export function canHireCandidate(actor: RecruitmentActor): boolean {
  return actor.role === 'admin_rh';
}

// ============================================================
// Feedback / Scorecard / Tasks (usadas nas Ondas 2 e 3)
// ============================================================

export function canGiveFeedback(actor: RecruitmentActor): boolean {
  if (actor.role === 'admin_rh') return true;
  return actor.role === 'user' && !!actor.employeeId;
}

export function canSubmitScorecard(actor: RecruitmentActor): boolean {
  return canGiveFeedback(actor);
}

export function canManageTasks(actor: RecruitmentActor): boolean {
  return canGiveFeedback(actor);
}

// ============================================================
// Etapas de recrutamento (Configurações)
// ============================================================

export function canManageStages(actor: RecruitmentActor): boolean {
  return actor.role === 'admin_rh';
}

// ============================================================
// Métricas / Relatórios (Onda 3)
// ============================================================

export function canViewMetrics(actor: RecruitmentActor): boolean {
  return canAccessRecruitmentModule(actor);
}
