import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/features/employees/queries', () => ({
  getEmployeeDescendants: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(),
}));

import { buildScope, resolveScopeRole } from './queries';
import { getEmployeeDescendants } from '@/features/employees/queries';

describe('dashboard/queries resolveScopeRole', () => {
  it('admin_rh → admin_rh', () => {
    expect(resolveScopeRole({ role: 'admin_rh', actorEmployeeId: 'e1' })).toBe('admin_rh');
  });
  it('director → director', () => {
    expect(resolveScopeRole({ role: 'director', actorEmployeeId: 'e1' })).toBe('director');
  });
  it('user → gestor', () => {
    expect(resolveScopeRole({ role: 'user', actorEmployeeId: 'e1' })).toBe('gestor');
  });
  it('user com dashboard.view vira global', () => {
    expect(resolveScopeRole({
      role: 'user',
      actorEmployeeId: 'e1',
      screenPermissions: { 'dashboard.view': true },
    })).toBe('global');
  });
});

describe('dashboard/queries buildScope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('admin_rh: escopo employeeIds = "all"', async () => {
    const scope = await buildScope({
      companyId: 'c1', role: 'admin_rh', actorEmployeeId: 'e-a',
      departmentId: 'd1', cycleId: 'cy1',
    });
    expect(scope).toEqual({
      companyId: 'c1',
      role: 'admin_rh',
      employeeIds: 'all',
      departmentId: 'd1',
      cycleId: 'cy1',
    });
    expect(getEmployeeDescendants).not.toHaveBeenCalled();
  });

  it('director: escopo employeeIds = "all" + aceita departmentId', async () => {
    const scope = await buildScope({
      companyId: 'c1', role: 'director', actorEmployeeId: 'e-d',
      departmentId: 'd2', cycleId: null,
    });
    expect(scope?.role).toBe('director');
    expect(scope?.employeeIds).toBe('all');
    expect(scope?.departmentId).toBe('d2');
    expect(scope?.cycleId).toBeNull();
    expect(getEmployeeDescendants).not.toHaveBeenCalled();
  });

  it('user com dashboard.view: escopo employeeIds = "all"', async () => {
    const scope = await buildScope({
      companyId: 'c1', role: 'user', actorEmployeeId: 'e-viewer',
      screenPermissions: { 'dashboard.view': true },
      departmentId: null, cycleId: 'cy1',
    });
    expect(scope).toEqual({
      companyId: 'c1',
      role: 'global',
      employeeIds: 'all',
      departmentId: null,
      cycleId: 'cy1',
    });
    expect(getEmployeeDescendants).not.toHaveBeenCalled();
  });

  it('gestor (user) com liderados: employeeIds = [self + descendentes], departmentId descartado', async () => {
    (getEmployeeDescendants as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(['sub1', 'sub2']);
    const scope = await buildScope({
      companyId: 'c1', role: 'user', actorEmployeeId: 'mgr',
      departmentId: 'd-xyz', cycleId: 'cy1',
    });
    expect(scope?.role).toBe('gestor');
    expect(scope?.employeeIds).toEqual(['mgr', 'sub1', 'sub2']);
    expect(scope?.departmentId).toBeNull();
    expect(scope?.cycleId).toBe('cy1');
    expect(getEmployeeDescendants).toHaveBeenCalledWith('mgr');
  });

  it('gestor (user) sem liderados: employeeIds = [self]', async () => {
    (getEmployeeDescendants as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    const scope = await buildScope({
      companyId: 'c1', role: 'user', actorEmployeeId: 'mgr-solo',
      cycleId: null,
    });
    expect(scope?.role).toBe('gestor');
    expect(scope?.employeeIds).toEqual(['mgr-solo']);
  });

  it('gestor (user) deduplica caso getEmployeeDescendants inclua o próprio id', async () => {
    (getEmployeeDescendants as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(['mgr', 'sub1']);
    const scope = await buildScope({
      companyId: 'c1', role: 'user', actorEmployeeId: 'mgr',
      cycleId: null,
    });
    expect(scope?.employeeIds).toEqual(['mgr', 'sub1']);
  });

  it('gestor sem actorEmployeeId retorna null', async () => {
    const scope = await buildScope({
      companyId: 'c1', role: 'user', actorEmployeeId: null,
      cycleId: null,
    });
    expect(scope).toBeNull();
  });
});
