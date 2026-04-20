import { describe, it, expect } from 'vitest';
import { canManageEmployee, canDeactivateSelf, canChangeSelfRole } from './permissions';

describe('employees/permissions', () => {
  const admin = { id: 'a1', role: 'admin_rh', userId: 'u-admin' };
  const director = { id: 'd1', role: 'director', userId: 'u-director' };
  const user = { id: 'u1', role: 'user', userId: 'u-user' };

  describe('canManageEmployee', () => {
    it('admin_rh pode gerenciar', () => {
      expect(canManageEmployee(admin)).toBe(true);
    });

    it('director NÃO pode gerenciar', () => {
      expect(canManageEmployee(director)).toBe(false);
    });

    it('user NÃO pode gerenciar', () => {
      expect(canManageEmployee(user)).toBe(false);
    });
  });

  describe('canDeactivateSelf', () => {
    it('bloqueia auto-desativação', () => {
      expect(canDeactivateSelf(admin, { userId: 'u-admin' })).toBe(false);
    });

    it('permite desativar outro usuário', () => {
      expect(canDeactivateSelf(admin, { userId: 'u-other' })).toBe(true);
    });

    it('permite quando target.userId é null (employee sem acesso)', () => {
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
});
