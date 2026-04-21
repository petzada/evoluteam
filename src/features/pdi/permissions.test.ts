import { describe, it, expect } from 'vitest';
import {
  canCreatePdi, canViewPdi, canEditPdiHeader, canAddAction,
  canUpdateActionStatus, canCommentOnPdi, canConcludePdi, canCancelPdi, canDeletePdi,
  type Actor,
} from './permissions';

const admin: Actor = { role: 'admin_rh', userId: 'u-admin', employeeId: 'e-admin' };
const director: Actor = { role: 'director', userId: 'u-dir', employeeId: 'e-dir' };
const manager: Actor = { role: 'user', userId: 'u-mgr', employeeId: 'e-mgr' };
const employee: Actor = { role: 'user', userId: 'u-emp', employeeId: 'e-emp' };
const other: Actor = { role: 'user', userId: 'u-other', employeeId: 'e-other' };

describe('canCreatePdi', () => {
  const target = { id: 'e-emp', manager_id: 'e-mgr' };

  it('admin sempre pode', () => {
    expect(canCreatePdi(admin, target)).toBe(true);
  });
  it('gestor direto pode', () => {
    expect(canCreatePdi(manager, target)).toBe(true);
  });
  it('não-gestor não pode', () => {
    expect(canCreatePdi(other, target)).toBe(false);
  });
  it('sem employeeId não pode (exceto admin)', () => {
    expect(canCreatePdi({ ...manager, employeeId: null }, target)).toBe(false);
    expect(canCreatePdi({ ...admin, employeeId: null }, target)).toBe(true);
  });
  it('colaborador sem gestor: ninguém cria, exceto admin', () => {
    const orphan = { id: 'e-o', manager_id: null };
    expect(canCreatePdi(admin, orphan)).toBe(true);
    expect(canCreatePdi(manager, orphan)).toBe(false);
  });
});

describe('canViewPdi', () => {
  const plan = { employee_id: 'e-emp', created_by: 'u-mgr' };

  it('admin e director veem tudo', () => {
    expect(canViewPdi(admin, plan, [])).toBe(true);
    expect(canViewPdi(director, plan, [])).toBe(true);
  });
  it('próprio colaborador vê', () => {
    expect(canViewPdi(employee, plan, [])).toBe(true);
  });
  it('gestor ascendente (skip-level) vê', () => {
    expect(canViewPdi(manager, plan, ['e-mgr'])).toBe(true);
  });
  it('colega fora da cadeia não vê', () => {
    expect(canViewPdi(other, plan, ['e-mgr'])).toBe(false);
  });
});

describe('canEditPdiHeader / canAddAction', () => {
  const plan = { employee_id: 'e-emp', created_by: 'u-mgr' };

  it('admin edita', () => {
    expect(canEditPdiHeader(admin, plan)).toBe(true);
    expect(canAddAction(admin, plan)).toBe(true);
  });
  it('criador edita', () => {
    expect(canEditPdiHeader(manager, plan)).toBe(true);
    expect(canAddAction(manager, plan)).toBe(true);
  });
  it('colaborador do PDI não edita', () => {
    expect(canEditPdiHeader(employee, plan)).toBe(false);
    expect(canAddAction(employee, plan)).toBe(false);
  });
});

describe('canUpdateActionStatus', () => {
  const action = { responsible_employee_id: 'e-emp' };

  it('admin atualiza qualquer ação', () => {
    expect(canUpdateActionStatus(admin, action)).toBe(true);
  });
  it('responsável atualiza sua ação', () => {
    expect(canUpdateActionStatus(employee, action)).toBe(true);
  });
  it('criador do PDI (não responsável, não admin) não atualiza status', () => {
    expect(canUpdateActionStatus(manager, action)).toBe(false);
  });
  it('terceiro não atualiza', () => {
    expect(canUpdateActionStatus(other, action)).toBe(false);
  });
});

describe('canCommentOnPdi', () => {
  const plan = { employee_id: 'e-emp', created_by: 'u-mgr' };

  it('admin comenta', () => {
    expect(canCommentOnPdi(admin, plan, [])).toBe(true);
  });
  it('colaborador do PDI comenta', () => {
    expect(canCommentOnPdi(employee, plan, [])).toBe(true);
  });
  it('gestor na cadeia comenta', () => {
    expect(canCommentOnPdi(manager, plan, ['e-mgr'])).toBe(true);
  });
  it('director comenta em PDI que visualiza', () => {
    expect(canCommentOnPdi(director, plan, [])).toBe(true);
  });
  it('terceiro não comenta', () => {
    expect(canCommentOnPdi(other, plan, [])).toBe(false);
  });
});

describe('canConcludePdi / canCancelPdi', () => {
  const plan = { employee_id: 'e-emp', created_by: 'u-mgr' };

  it('admin e criador encerram', () => {
    expect(canConcludePdi(admin, plan)).toBe(true);
    expect(canConcludePdi(manager, plan)).toBe(true);
    expect(canCancelPdi(admin, plan)).toBe(true);
    expect(canCancelPdi(manager, plan)).toBe(true);
  });
  it('outros não encerram', () => {
    expect(canConcludePdi(employee, plan)).toBe(false);
    expect(canCancelPdi(other, plan)).toBe(false);
  });
});

describe('canDeletePdi', () => {
  it('só admin deleta', () => {
    expect(canDeletePdi(admin)).toBe(true);
    expect(canDeletePdi(director)).toBe(false);
    expect(canDeletePdi(manager)).toBe(false);
  });
});
