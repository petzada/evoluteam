import { hasAdminPower } from '@/features/permissions/permissions';
import type { RhPermissions } from '@/features/permissions/types';

export type Role = 'admin_rh' | 'director' | 'user' | 'rh';

export type Actor = {
  role: Role | string;
  userId: string;
  employeeId: string | null;
  rhPermissions?: RhPermissions | null;
};

export type CycleStatus = 'draft' | 'published' | 'closed' | 'archived';

export function canCreateCycle(actor: Actor): boolean {
  return hasAdminPower(actor, 'can_reviews');
}

export function canEditCycle(actor: Actor, cycle: { status: CycleStatus }): boolean {
  if (!hasAdminPower(actor, 'can_reviews')) return false;
  if (cycle.status === 'archived') return false;
  return true;
}

export function isCycleFieldEditable(
  field: 'name' | 'description' | 'periods' | 'responseWindow' | 'participants' | 'form',
  status: CycleStatus,
): boolean {
  if (status === 'draft') return true;
  if (status === 'archived' || status === 'closed') return false;
  switch (field) {
    case 'description':
    case 'responseWindow':
      return true;
    case 'participants':
      return true;
    default:
      return false;
  }
}

export function canSeeCycle(
  actor: Actor,
  involvement: { isParticipant: boolean; isReviewer: boolean },
): boolean {
  if (actor.role === 'admin_rh' || actor.role === 'director') return true;
  if (hasAdminPower(actor, 'can_reviews')) return true;
  return involvement.isParticipant || involvement.isReviewer;
}

export function canAnswerAssignment(
  actor: Actor,
  assignment: { reviewerEmployeeId: string; status: string },
): boolean {
  if (!actor.employeeId) return false;
  if (actor.employeeId !== assignment.reviewerEmployeeId) return false;
  return assignment.status === 'pending' || assignment.status === 'in_progress';
}

export function canSeeResultOf(
  actor: Actor,
  params: {
    targetEmployeeId: string;
    isReleased: boolean;
    descendantsOfActor: string[];
  },
): boolean {
  if (actor.role === 'admin_rh' || actor.role === 'director') return true;
  if (hasAdminPower(actor, 'can_reviews')) return true;
  if (actor.employeeId === params.targetEmployeeId) return params.isReleased;
  return params.descendantsOfActor.includes(params.targetEmployeeId);
}

export function canReleaseResult(actor: Actor): boolean {
  return hasAdminPower(actor, 'can_reviews');
}
