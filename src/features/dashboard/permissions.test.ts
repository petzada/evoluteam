import { describe, it, expect } from 'vitest';
import {
  canAccessDashboard, canFilterByDepartment, canClickDrillDown,
} from './permissions';

describe('dashboard/permissions', () => {
  const admin = { role: 'admin_rh', employeeId: 'e-admin' };
  const director = { role: 'director', employeeId: 'e-director' };
  const managerUser = { role: 'user', employeeId: 'e-mgr', isManager: true };
  const plainUser = { role: 'user', employeeId: 'e-user', isManager: false };
  const dashboardViewer = {
    role: 'user',
    employeeId: 'e-viewer',
    isManager: false,
    screenPermissions: { 'dashboard.view': true },
  };

  describe('canAccessDashboard', () => {
    it('admin_rh acessa', () => expect(canAccessDashboard(admin)).toBe(true));
    it('director acessa', () => expect(canAccessDashboard(director)).toBe(true));
    it('gestor (user com liderados) acessa', () => expect(canAccessDashboard(managerUser)).toBe(true));
    it('user com dashboard.view acessa dashboard agregado', () => {
      expect(canAccessDashboard(dashboardViewer)).toBe(true);
    });
    it('user sem liderados NÃO acessa', () => expect(canAccessDashboard(plainUser)).toBe(false));
    it('user sem flag explícita de isManager NÃO acessa', () => {
      expect(canAccessDashboard({ role: 'user', employeeId: 'e-x' })).toBe(false);
    });
  });

  describe('canFilterByDepartment', () => {
    it('admin_rh filtra por depto', () => expect(canFilterByDepartment(admin)).toBe(true));
    it('director filtra por depto', () => expect(canFilterByDepartment(director)).toBe(true));
    it('gestor NÃO filtra por depto', () => expect(canFilterByDepartment(managerUser)).toBe(false));
    it('user apenas com dashboard.view NÃO filtra por depto', () => {
      expect(canFilterByDepartment(dashboardViewer)).toBe(false);
    });
    it('user comum NÃO filtra por depto', () => expect(canFilterByDepartment(plainUser)).toBe(false));
  });

  describe('canClickDrillDown', () => {
    it('segue a regra de acesso ao dashboard', () => {
      expect(canClickDrillDown(admin)).toBe(true);
      expect(canClickDrillDown(director)).toBe(true);
      expect(canClickDrillDown(managerUser)).toBe(true);
      expect(canClickDrillDown(dashboardViewer)).toBe(true);
      expect(canClickDrillDown(plainUser)).toBe(false);
    });
  });
});
