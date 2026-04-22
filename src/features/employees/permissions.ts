import { canDo } from '@/features/permissions/permissions';
import type { ScreenPermissions } from '@/features/permissions/types';

type Actor = {
  id: string;
  role: string;
  userId: string;
  screenPermissions?: ScreenPermissions | null;
};

type Target = { userId?: string | null };

export function canManageEmployee(actor: Actor): boolean {
  return canDo(actor, 'colaboradores', 'edit');
}

export function canDeactivateSelf(actor: Actor, target: Target): boolean {
  return actor.userId !== target.userId;
}

export function canChangeSelfRole(actor: Actor, target: Target): boolean {
  return actor.userId !== target.userId;
}

export function canSeeInternalNotes(
  actor: { role: string; screenPermissions?: ScreenPermissions | null },
): boolean {
  return actor.role === 'admin_rh';
}

export function canEditEmployee(actor: Actor): boolean {
  return canDo(actor, 'colaboradores', 'edit');
}

export function canTerminateEmployee(actor: Actor, target: Target): boolean {
  if (!canDo(actor, 'colaboradores', 'edit')) return false;
  if (actor.userId && actor.userId === target.userId) return false;
  return true;
}

export function canDeactivateEmployee(actor: Actor, target: Target): boolean {
  if (!canDo(actor, 'colaboradores', 'edit')) return false;
  if (actor.userId && actor.userId === target.userId) return false;
  return true;
}

type ViewActor = Actor & { employeeId?: string | null };
type ViewTarget = { id: string; managerChain?: string[] };

export function canViewEmployee(
  actor: ViewActor,
  target: ViewTarget,
): boolean {
  // canDo('colaboradores', 'view') ja cobre admin_rh (bypass), director
  // (view em tudo) e user/rh com toggle. Baseline: proprio + arvore.
  if (canDo(actor, 'colaboradores', 'view')) return true;
  if (actor.employeeId && actor.employeeId === target.id) return true;
  if (target.managerChain?.includes(actor.employeeId ?? '')) return true;
  return false;
}
