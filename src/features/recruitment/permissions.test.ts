import { describe, it, expect } from 'vitest';
import {
  canAccessRecruitmentModule,
  canManageJobOpenings,
  canViewAllJobOpenings,
  canViewAssignedJobOpenings,
  canManageCandidates,
  canViewAllCandidates,
  canManageApplications,
  canMoveApplication,
  canHireCandidate,
  canGiveFeedback,
  canSubmitScorecard,
  canManageTasks,
  canManageStages,
  canViewMetrics,
} from './permissions';

const admin = { role: 'admin_rh', employeeId: 'e-admin' };
const director = { role: 'director', employeeId: 'e-dir' };
const gestor = { role: 'user', employeeId: 'e-mgr' };
const colaborador = { role: 'user', employeeId: 'e-user' };
const userSemEmployee = { role: 'user', employeeId: null };

describe('canAccessRecruitmentModule', () => {
  it('permite admin_rh e director', () => {
    expect(canAccessRecruitmentModule(admin)).toBe(true);
    expect(canAccessRecruitmentModule(director)).toBe(true);
  });
  it('permite user com perfil de employee', () => {
    expect(canAccessRecruitmentModule(gestor)).toBe(true);
    expect(canAccessRecruitmentModule(colaborador)).toBe(true);
  });
  it('bloqueia user sem perfil de employee', () => {
    expect(canAccessRecruitmentModule(userSemEmployee)).toBe(false);
  });
});

describe('gestão de vagas', () => {
  it('canManageJobOpenings: só admin_rh', () => {
    expect(canManageJobOpenings(admin)).toBe(true);
    expect(canManageJobOpenings(director)).toBe(false);
    expect(canManageJobOpenings(gestor)).toBe(false);
  });
  it('canViewAllJobOpenings: admin e director', () => {
    expect(canViewAllJobOpenings(admin)).toBe(true);
    expect(canViewAllJobOpenings(director)).toBe(true);
    expect(canViewAllJobOpenings(gestor)).toBe(false);
  });
  it('canViewAssignedJobOpenings: user com employee', () => {
    expect(canViewAssignedJobOpenings(gestor)).toBe(true);
    expect(canViewAssignedJobOpenings(colaborador)).toBe(true);
    expect(canViewAssignedJobOpenings(userSemEmployee)).toBe(false);
    expect(canViewAssignedJobOpenings(admin)).toBe(false);
  });
});

describe('candidatos e aplicações', () => {
  it('canManageCandidates: só admin_rh', () => {
    expect(canManageCandidates(admin)).toBe(true);
    expect(canManageCandidates(director)).toBe(false);
    expect(canManageCandidates(gestor)).toBe(false);
  });
  it('canViewAllCandidates: admin e director', () => {
    expect(canViewAllCandidates(admin)).toBe(true);
    expect(canViewAllCandidates(director)).toBe(true);
    expect(canViewAllCandidates(gestor)).toBe(false);
  });
  it('canManageApplications: só admin_rh', () => {
    expect(canManageApplications(admin)).toBe(true);
    expect(canManageApplications(gestor)).toBe(false);
  });
  it('canMoveApplication: admin e user-com-employee', () => {
    expect(canMoveApplication(admin)).toBe(true);
    expect(canMoveApplication(gestor)).toBe(true);
    expect(canMoveApplication(director)).toBe(false);
    expect(canMoveApplication(userSemEmployee)).toBe(false);
  });
  it('canHireCandidate: só admin_rh (matriz B)', () => {
    expect(canHireCandidate(admin)).toBe(true);
    expect(canHireCandidate(director)).toBe(false);
    expect(canHireCandidate(gestor)).toBe(false);
  });
});

describe('feedback, scorecard, tasks', () => {
  it('canGiveFeedback: admin, director (FT-8) e user-com-employee', () => {
    expect(canGiveFeedback(admin)).toBe(true);
    expect(canGiveFeedback(gestor)).toBe(true);
    // FT-8 P4 B: director passou a dar feedback em candidato.
    expect(canGiveFeedback(director)).toBe(true);
    expect(canGiveFeedback(userSemEmployee)).toBe(false);
  });
  it('canSubmitScorecard: director NAO (P4 B limita a feedback)', () => {
    expect(canSubmitScorecard(admin)).toBe(true);
    expect(canSubmitScorecard(gestor)).toBe(true);
    expect(canSubmitScorecard(director)).toBe(false);
  });
  it('canManageTasks: director NAO (P4 B limita a feedback)', () => {
    expect(canManageTasks(admin)).toBe(true);
    expect(canManageTasks(gestor)).toBe(true);
    expect(canManageTasks(director)).toBe(false);
  });
});

describe('configuração e métricas', () => {
  it('canManageStages: só admin_rh', () => {
    expect(canManageStages(admin)).toBe(true);
    expect(canManageStages(director)).toBe(false);
    expect(canManageStages(gestor)).toBe(false);
  });
  it('canViewMetrics: qualquer um com acesso ao módulo', () => {
    expect(canViewMetrics(admin)).toBe(true);
    expect(canViewMetrics(director)).toBe(true);
    expect(canViewMetrics(gestor)).toBe(true);
    expect(canViewMetrics(userSemEmployee)).toBe(false);
  });
});
