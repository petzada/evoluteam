import { describe, expect, it } from 'vitest';
import {
  canChangeUserAccess,
  canInviteAs,
  canManageEmployeesAndStructure,
  canManageInvites,
  canManageRecruitment,
  canManageReviews,
  canModeratePdiAndFeedback,
  canViewAudit,
  hasAdminPower,
} from './permissions';
import { EMPTY_RH_PERMISSIONS, type Actor, type RhPermissions } from './types';

const baseActor = (partial: Partial<Actor> = {}): Actor => ({
  userId: 'u1',
  companyId: 'c1',
  role: 'user',
  employeeId: 'e1',
  employeeStatus: 'active',
  rhPermissions: null,
  ...partial,
});

const rhWith = (perms: Partial<RhPermissions>): Actor =>
  baseActor({
    role: 'rh',
    rhPermissions: { ...EMPTY_RH_PERMISSIONS, ...perms },
  });

describe('hasAdminPower', () => {
  it('retorna true para admin_rh em qualquer area', () => {
    const actor = baseActor({ role: 'admin_rh' });
    expect(hasAdminPower(actor, 'can_employees')).toBe(true);
    expect(hasAdminPower(actor, 'can_reviews')).toBe(true);
    expect(hasAdminPower(actor, 'can_recruitment')).toBe(true);
    expect(hasAdminPower(actor, 'can_pdi_feedback')).toBe(true);
    expect(hasAdminPower(actor, 'can_invites')).toBe(true);
    expect(hasAdminPower(actor, 'can_audit')).toBe(true);
  });

  it('retorna false para director em toda area (director nao tem poder administrativo)', () => {
    const actor = baseActor({ role: 'director' });
    expect(hasAdminPower(actor, 'can_employees')).toBe(false);
    expect(hasAdminPower(actor, 'can_reviews')).toBe(false);
  });

  it('retorna false para user comum em toda area', () => {
    expect(hasAdminPower(baseActor(), 'can_employees')).toBe(false);
    expect(hasAdminPower(baseActor(), 'can_invites')).toBe(false);
  });

  it('rh sem toggles retorna false em tudo', () => {
    const actor = rhWith({});
    expect(hasAdminPower(actor, 'can_employees')).toBe(false);
    expect(hasAdminPower(actor, 'can_reviews')).toBe(false);
    expect(hasAdminPower(actor, 'can_recruitment')).toBe(false);
    expect(hasAdminPower(actor, 'can_pdi_feedback')).toBe(false);
    expect(hasAdminPower(actor, 'can_invites')).toBe(false);
    expect(hasAdminPower(actor, 'can_audit')).toBe(false);
  });

  it('rh so tem poder nas areas em que o toggle esta ativo', () => {
    const actor = rhWith({ can_employees: true, can_reviews: true });
    expect(hasAdminPower(actor, 'can_employees')).toBe(true);
    expect(hasAdminPower(actor, 'can_reviews')).toBe(true);
    expect(hasAdminPower(actor, 'can_recruitment')).toBe(false);
    expect(hasAdminPower(actor, 'can_pdi_feedback')).toBe(false);
  });

  it('retorna false para actor null/undefined', () => {
    expect(hasAdminPower(null, 'can_employees')).toBe(false);
    expect(hasAdminPower(undefined, 'can_employees')).toBe(false);
  });

  it('aceita objetos parciais que tem role e rhPermissions (estrutural)', () => {
    expect(hasAdminPower({ role: 'admin_rh' }, 'can_employees')).toBe(true);
    expect(
      hasAdminPower(
        { role: 'rh', rhPermissions: { ...EMPTY_RH_PERMISSIONS, can_invites: true } },
        'can_invites',
      ),
    ).toBe(true);
  });
});

describe('atalhos por modulo', () => {
  it('mapeiam para hasAdminPower na area correta', () => {
    const adm = baseActor({ role: 'admin_rh' });
    expect(canManageEmployeesAndStructure(adm)).toBe(true);
    expect(canManageReviews(adm)).toBe(true);
    expect(canManageRecruitment(adm)).toBe(true);
    expect(canModeratePdiAndFeedback(adm)).toBe(true);
    expect(canManageInvites(adm)).toBe(true);
    expect(canViewAudit(adm)).toBe(true);

    const rhRec = rhWith({ can_recruitment: true });
    expect(canManageRecruitment(rhRec)).toBe(true);
    expect(canManageReviews(rhRec)).toBe(false);
  });
});

describe('canInviteAs (P8 · C — escalacao restrita)', () => {
  it('admin_rh pode conceder qualquer role', () => {
    const adm = baseActor({ role: 'admin_rh' });
    expect(canInviteAs(adm, 'user')).toBe(true);
    expect(canInviteAs(adm, 'rh')).toBe(true);
    expect(canInviteAs(adm, 'director')).toBe(true);
    expect(canInviteAs(adm, 'admin_rh')).toBe(true);
  });

  it('rh com can_invites concede APENAS Colaborador', () => {
    const rh = rhWith({ can_invites: true });
    expect(canInviteAs(rh, 'user')).toBe(true);
    expect(canInviteAs(rh, 'rh')).toBe(false);
    expect(canInviteAs(rh, 'director')).toBe(false);
    expect(canInviteAs(rh, 'admin_rh')).toBe(false);
  });

  it('rh sem can_invites nao concede nada', () => {
    const rh = rhWith({ can_employees: true });
    expect(canInviteAs(rh, 'user')).toBe(false);
    expect(canInviteAs(rh, 'rh')).toBe(false);
  });

  it('director e user comum nao concedem nada', () => {
    expect(canInviteAs(baseActor({ role: 'director' }), 'user')).toBe(false);
    expect(canInviteAs(baseActor(), 'user')).toBe(false);
  });

  it('null actor nao concede nada', () => {
    expect(canInviteAs(null, 'user')).toBe(false);
  });
});

describe('canChangeUserAccess', () => {
  it('ninguem pode alterar o proprio role', () => {
    const adm = baseActor({ role: 'admin_rh', userId: 'same' });
    expect(canChangeUserAccess(adm, { userId: 'same', role: 'admin_rh' }, 'user')).toBe(false);
  });

  it('admin_rh pode alterar qualquer outro usuario para qualquer role', () => {
    const adm = baseActor({ role: 'admin_rh' });
    expect(canChangeUserAccess(adm, { userId: 'other', role: 'user' }, 'rh')).toBe(true);
    expect(canChangeUserAccess(adm, { userId: 'other', role: 'director' }, 'admin_rh')).toBe(true);
  });

  it('rh com can_invites so pode "editar" Colaboradores mantendo-os Colaboradores', () => {
    const rh = rhWith({ can_invites: true });
    expect(canChangeUserAccess(rh, { userId: 'other', role: 'user' }, 'user')).toBe(true);
    // Nao pode escalar:
    expect(canChangeUserAccess(rh, { userId: 'other', role: 'user' }, 'rh')).toBe(false);
    expect(canChangeUserAccess(rh, { userId: 'other', role: 'user' }, 'director')).toBe(false);
    // Nao pode editar quem ja tem role privilegiado:
    expect(canChangeUserAccess(rh, { userId: 'other', role: 'rh' }, 'user')).toBe(false);
    expect(canChangeUserAccess(rh, { userId: 'other', role: 'director' }, 'user')).toBe(false);
  });

  it('rh sem can_invites nao altera ninguem', () => {
    const rh = rhWith({ can_reviews: true });
    expect(canChangeUserAccess(rh, { userId: 'other', role: 'user' }, 'user')).toBe(false);
  });

  it('director e user comum nao alteram ninguem', () => {
    expect(
      canChangeUserAccess(baseActor({ role: 'director' }), { userId: 'other', role: 'user' }, 'user'),
    ).toBe(false);
    expect(canChangeUserAccess(baseActor(), { userId: 'other', role: 'user' }, 'user')).toBe(false);
  });
});
