import { describe, expect, it } from 'vitest';
import { resolveCreateEmployeeAccess } from './access';
import type { Actor, ScreenPermissions } from '@/features/permissions/types';

const actor = (permissions: ScreenPermissions, role: Actor['role'] = 'user'): Actor => ({
  userId: 'u-actor',
  companyId: 'c1',
  role,
  employeeId: 'e-actor',
  employeeStatus: 'active',
  screenPermissions: role === 'user' ? permissions : null,
});

describe('resolveCreateEmployeeAccess', () => {
  it('admin_rh pode convidar user com toggles normalizados', () => {
    const result = resolveCreateEmployeeAccess(actor({}, 'admin_rh'), {
      role: 'user',
      screenPermissions: { 'pdi.edit': true },
    });

    expect(result).toEqual({
      ok: true,
      inviteRole: 'user',
      screenPermissionsSnapshot: {
        'pdi.view': true,
        'pdi.edit': true,
      },
    });
  });

  it('user com colaboradores.edit so concede subset dos proprios toggles', () => {
    const manager = actor({
      'colaboradores.view': true,
      'colaboradores.edit': true,
      'pdi.view': true,
      'pdi.edit': true,
    });

    expect(resolveCreateEmployeeAccess(manager, {
      role: 'user',
      screenPermissions: { 'pdi.edit': true },
    })).toEqual({
      ok: true,
      inviteRole: 'user',
      screenPermissionsSnapshot: {
        'pdi.view': true,
        'pdi.edit': true,
      },
    });

    expect(resolveCreateEmployeeAccess(manager, {
      role: 'user',
      screenPermissions: { 'avaliacoes.view': true },
    })).toEqual({
      ok: false,
      error: 'Voce nao pode conceder permissoes que voce mesmo nao possui.',
    });
  });

  it('user com colaboradores.edit nao convida director/admin_rh', () => {
    const manager = actor({
      'colaboradores.view': true,
      'colaboradores.edit': true,
    });

    expect(resolveCreateEmployeeAccess(manager, {
      role: 'director',
      screenPermissions: null,
    })).toEqual({
      ok: false,
      error: 'Sem permissao para convidar com este papel.',
    });
  });
});
