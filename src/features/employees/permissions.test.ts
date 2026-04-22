import { describe, it, expect } from 'vitest';
import {
  canManageEmployee,
  canDeactivateSelf,
  canChangeSelfRole,
  canSeeInternalNotes,
  canEditEmployee,
  canTerminateEmployee,
  canDeactivateEmployee,
  canViewEmployee,
} from './permissions';

describe('employees/permissions', () => {
  const admin = { id: 'a1', role: 'admin_rh', userId: 'u-admin', employeeId: 'e-admin' };
  const director = { id: 'd1', role: 'director', userId: 'u-director', employeeId: 'e-director' };
  const user = { id: 'u1', role: 'user', userId: 'u-user', employeeId: 'e-user' };

  describe('canManageEmployee', () => {
    it('admin_rh pode gerenciar', () => expect(canManageEmployee(admin)).toBe(true));
    it('director NÃO pode gerenciar', () => expect(canManageEmployee(director)).toBe(false));
    it('user NÃO pode gerenciar', () => expect(canManageEmployee(user)).toBe(false));
  });

  describe('canDeactivateSelf', () => {
    it('bloqueia auto-desativação', () => {
      expect(canDeactivateSelf(admin, { userId: 'u-admin' })).toBe(false);
    });
    it('permite desativar outro usuário', () => {
      expect(canDeactivateSelf(admin, { userId: 'u-other' })).toBe(true);
    });
    it('permite quando target.userId é null', () => {
      expect(canDeactivateSelf(admin, { userId: null })).toBe(true);
    });
  });

  describe('canChangeSelfRole', () => {
    it('bloqueia auto-rebaixamento', () => {
      expect(canChangeSelfRole(admin, { userId: 'u-admin' })).toBe(false);
    });
    it('permite alterar papel de outro', () => {
      expect(canChangeSelfRole(admin, { userId: 'u-other' })).toBe(true);
    });
  });

  describe('canSeeInternalNotes', () => {
    it('só admin_rh enxerga', () => {
      expect(canSeeInternalNotes({ role: 'admin_rh' })).toBe(true);
      expect(canSeeInternalNotes({ role: 'director' })).toBe(false);
      expect(canSeeInternalNotes({ role: 'user' })).toBe(false);
      expect(canSeeInternalNotes({
        role: 'user',
        screenPermissions: { 'colaboradores.edit': true },
      })).toBe(false);
    });
  });

  describe('canEditEmployee', () => {
    it('só admin_rh edita', () => {
      expect(canEditEmployee(admin)).toBe(true);
      expect(canEditEmployee(director)).toBe(false);
      expect(canEditEmployee(user)).toBe(false);
    });
  });

  describe('canTerminateEmployee / canDeactivateEmployee', () => {
    it('admin_rh pode desligar outro', () => {
      expect(canTerminateEmployee(admin, { userId: 'u-other' })).toBe(true);
      expect(canDeactivateEmployee(admin, { userId: 'u-other' })).toBe(true);
    });
    it('admin_rh NÃO pode auto-desligar/desativar', () => {
      expect(canTerminateEmployee(admin, { userId: 'u-admin' })).toBe(false);
      expect(canDeactivateEmployee(admin, { userId: 'u-admin' })).toBe(false);
    });
    it('director não pode', () => {
      expect(canTerminateEmployee(director, { userId: 'u-other' })).toBe(false);
      expect(canDeactivateEmployee(director, { userId: 'u-other' })).toBe(false);
    });
  });

  describe('canViewEmployee', () => {
    it('admin_rh vê qualquer um', () => {
      expect(canViewEmployee(admin, { id: 'e-target' })).toBe(true);
    });
    it('director vê qualquer um', () => {
      expect(canViewEmployee(director, { id: 'e-target' })).toBe(true);
    });
    it('colaborador comum vê a si mesmo', () => {
      expect(canViewEmployee(user, { id: 'e-user' })).toBe(true);
    });
    it('colaborador comum vê liderados diretos/indiretos via cadeia', () => {
      expect(
        canViewEmployee(user, { id: 'e-sub', managerChain: ['e-user'] }),
      ).toBe(true);
    });
    it('colaborador comum NÃO vê outros fora da cadeia', () => {
      expect(canViewEmployee(user, { id: 'e-outsider' })).toBe(false);
    });
  });
});
