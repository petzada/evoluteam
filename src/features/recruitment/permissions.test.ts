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
import type { ScreenPermissions } from '@/features/permissions/types';

const admin = { role: 'admin_rh', employeeId: 'e-admin' };
const director = { role: 'director', employeeId: 'e-dir' };
const gestor = { role: 'user', employeeId: 'e-mgr' };
const colaborador = { role: 'user', employeeId: 'e-user' };
const userSemEmployee = { role: 'user', employeeId: null };

function userWithPerms(perms: ScreenPermissions, employeeId: string | null = 'e1') {
  return { role: 'user', employeeId, screenPermissions: perms };
}

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
  it('canManageJobOpenings: admin_rh e user com toggle', () => {
    expect(canManageJobOpenings(admin)).toBe(true);
    expect(canManageJobOpenings(director)).toBe(false);
    expect(canManageJobOpenings(gestor)).toBe(false);
    expect(canManageJobOpenings(userWithPerms({ 'recrutamento_vagas.edit': true }))).toBe(true);
    expect(canManageJobOpenings(userWithPerms({ 'recrutamento_vagas.view': true }))).toBe(false);
  });
  it('canViewAllJobOpenings: admin_rh, director e user com toggle', () => {
    expect(canViewAllJobOpenings(admin)).toBe(true);
    expect(canViewAllJobOpenings(director)).toBe(true);
    expect(canViewAllJobOpenings(gestor)).toBe(false);
    expect(canViewAllJobOpenings(userWithPerms({ 'recrutamento_vagas.view': true }))).toBe(true);
  });
  it('canViewAssignedJobOpenings: user com employeeId (independe de toggle)', () => {
    expect(canViewAssignedJobOpenings(gestor)).toBe(true);
    expect(canViewAssignedJobOpenings(colaborador)).toBe(true);
    expect(canViewAssignedJobOpenings(userSemEmployee)).toBe(false);
    expect(canViewAssignedJobOpenings(admin)).toBe(false);
  });
});

describe('candidatos e aplicações', () => {
  it('canManageCandidates: admin_rh e user com toggle', () => {
    expect(canManageCandidates(admin)).toBe(true);
    expect(canManageCandidates(director)).toBe(false);
    expect(canManageCandidates(gestor)).toBe(false);
    expect(canManageCandidates(userWithPerms({ 'recrutamento_candidatos.edit': true }))).toBe(true);
    expect(canManageCandidates(userWithPerms({ 'recrutamento_candidatos.view': true }))).toBe(false);
  });
  it('canViewAllCandidates: admin_rh, director e user com toggle', () => {
    expect(canViewAllCandidates(admin)).toBe(true);
    expect(canViewAllCandidates(director)).toBe(true);
    expect(canViewAllCandidates(gestor)).toBe(false);
    expect(canViewAllCandidates(userWithPerms({ 'recrutamento_candidatos.view': true }))).toBe(true);
  });
  it('canManageApplications: admin_rh e user com toggle', () => {
    expect(canManageApplications(admin)).toBe(true);
    expect(canManageApplications(gestor)).toBe(false);
    expect(canManageApplications(userWithPerms({ 'recrutamento_candidatos.edit': true }))).toBe(true);
  });
  it('canMoveApplication: admin, user-com-toggle, user-com-employee(HM); director nao', () => {
    expect(canMoveApplication(admin)).toBe(true);
    expect(canMoveApplication(gestor)).toBe(true);
    expect(canMoveApplication(director)).toBe(false);
    expect(canMoveApplication(userSemEmployee)).toBe(false);
    expect(canMoveApplication(userWithPerms({ 'recrutamento_candidatos.edit': true }, null))).toBe(true);
  });
  it('canHireCandidate: admin_rh e user com toggle', () => {
    expect(canHireCandidate(admin)).toBe(true);
    expect(canHireCandidate(director)).toBe(false);
    expect(canHireCandidate(gestor)).toBe(false);
    expect(canHireCandidate(userWithPerms({ 'recrutamento_candidatos.edit': true }))).toBe(true);
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
  it('canManageStages: admin_rh e user com toggle', () => {
    expect(canManageStages(admin)).toBe(true);
    expect(canManageStages(director)).toBe(false);
    expect(canManageStages(gestor)).toBe(false);
    expect(canManageStages(userWithPerms({ 'recrutamento_etapas.edit': true }))).toBe(true);
  });
  it('canViewMetrics: qualquer um com acesso ao módulo', () => {
    expect(canViewMetrics(admin)).toBe(true);
    expect(canViewMetrics(director)).toBe(true);
    expect(canViewMetrics(gestor)).toBe(true);
    expect(canViewMetrics(userSemEmployee)).toBe(false);
  });
});
