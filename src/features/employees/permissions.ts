import { hasAdminPower } from '@/features/permissions/permissions';
import type { RhPermissions } from '@/features/permissions/types';

type Actor = {
  id: string;
  role: string;
  userId: string;
  rhPermissions?: RhPermissions | null;
};

type Target = { userId?: string | null };

export function canManageEmployee(actor: Actor): boolean {
  return hasAdminPower(actor, 'can_employees');
}

export function canDeactivateSelf(actor: Actor, target: Target): boolean {
  return actor.userId !== target.userId;
}

export function canChangeSelfRole(actor: Actor, target: Target): boolean {
  return actor.userId !== target.userId;
}

export function canSeeInternalNotes(
  actor: { role: string; rhPermissions?: RhPermissions | null },
): boolean {
  return hasAdminPower(actor, 'can_employees');
}

export function canEditEmployee(actor: Actor): boolean {
  return hasAdminPower(actor, 'can_employees');
}

export function canTerminateEmployee(actor: Actor, target: Target): boolean {
  if (!hasAdminPower(actor, 'can_employees')) return false;
  if (actor.userId && actor.userId === target.userId) return false;
  return true;
}

export function canDeactivateEmployee(actor: Actor, target: Target): boolean {
  if (!hasAdminPower(actor, 'can_employees')) return false;
  if (actor.userId && actor.userId === target.userId) return false;
  return true;
}

type ViewActor = Actor & { employeeId?: string | null };
type ViewTarget = { id: string; managerChain?: string[] };

export function canViewEmployee(
  actor: ViewActor,
  target: ViewTarget,
): boolean {
  if (actor.role === 'admin_rh') return true;
  if (actor.role === 'director') return true;
  if (actor.role === 'rh' && actor.rhPermissions?.can_employees) return true;
  if (actor.employeeId && actor.employeeId === target.id) return true;
  if (target.managerChain?.includes(actor.employeeId ?? '')) return true;
  return false;
}
