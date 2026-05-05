import { describe, expect, it } from 'vitest';
import { canManageUnits, canViewUnits } from './permissions';

describe('canManageUnits', () => {
  it('admin_rh sempre pode', () => {
    expect(canManageUnits({ role: 'admin_rh' })).toBe(true);
  });

  it('director nao pode (Configuracoes bloqueada)', () => {
    expect(canManageUnits({ role: 'director' })).toBe(false);
  });

  it('user sem toggle nao pode', () => {
    expect(canManageUnits({ role: 'user', screenPermissions: {} })).toBe(false);
  });

  it('user com unidades.edit pode', () => {
    expect(
      canManageUnits({
        role: 'user',
        screenPermissions: { 'unidades.edit': true, 'unidades.view': true },
      }),
    ).toBe(true);
  });

  it('actor null nao pode', () => {
    expect(canManageUnits(null)).toBe(false);
    expect(canManageUnits(undefined)).toBe(false);
  });
});

describe('canViewUnits', () => {
  it('admin_rh sempre pode', () => {
    expect(canViewUnits({ role: 'admin_rh' })).toBe(true);
  });

  it('director nao pode (Configuracoes bloqueada)', () => {
    expect(canViewUnits({ role: 'director' })).toBe(false);
  });

  it('user com unidades.view pode', () => {
    expect(
      canViewUnits({
        role: 'user',
        screenPermissions: { 'unidades.view': true },
      }),
    ).toBe(true);
  });

  it('user com unidades.edit pode (edit implica view)', () => {
    expect(
      canViewUnits({
        role: 'user',
        screenPermissions: { 'unidades.edit': true },
      }),
    ).toBe(true);
  });
});
