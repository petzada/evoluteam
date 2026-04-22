import {
  canDo,
  canGrantScreenPermissions,
  canInviteAs,
  normalizeScreenPermissions,
} from '@/features/permissions/permissions';
import type { Actor, Role, ScreenPermissions } from '@/features/permissions/types';

type CreateEmployeeAccessInput = {
  role: Role;
  screenPermissions?: ScreenPermissions | null;
};

type CreateEmployeeAccessResult =
  | {
      ok: true;
      inviteRole: Role;
      screenPermissionsSnapshot: ScreenPermissions | null;
    }
  | { ok: false; error: string };

export function resolveCreateEmployeeAccess(
  actor: Actor | null,
  input: CreateEmployeeAccessInput,
): CreateEmployeeAccessResult {
  if (!actor || !canDo(actor, 'colaboradores', 'edit')) {
    return { ok: false, error: 'Sem permissao.' };
  }

  if (!canInviteAs(actor, input.role)) {
    return { ok: false, error: 'Sem permissao para convidar com este papel.' };
  }

  if (input.role !== 'user') {
    return {
      ok: true,
      inviteRole: input.role,
      screenPermissionsSnapshot: null,
    };
  }

  const normalized = normalizeScreenPermissions(input.screenPermissions);
  if (actor.role !== 'admin_rh' && !canGrantScreenPermissions(actor, normalized)) {
    return {
      ok: false,
      error: 'Voce nao pode conceder permissoes que voce mesmo nao possui.',
    };
  }

  return {
    ok: true,
    inviteRole: 'user',
    screenPermissionsSnapshot: Object.keys(normalized).length > 0 ? normalized : null,
  };
}
