import { canDo } from '@/features/permissions/permissions';
import type { RhPermissions, ScreenPermissions } from '@/features/permissions/types';

export type Role = 'admin_rh' | 'director' | 'user' | 'rh';

export type Actor = {
  role: Role | string;
  userId: string;
  employeeId: string | null;
  rhPermissions?: RhPermissions | null;
  screenPermissions?: ScreenPermissions | null;
};

export type Plan = {
  employee_id: string;
  created_by: string;
};

export type PlanAction = {
  responsible_employee_id: string;
};

export type Employee = {
  id: string;
  manager_id: string | null;
};

export function canCreatePdi(actor: Actor, targetEmployee: Employee): boolean {
  if (canDo(actor, 'pdi', 'edit')) return true;
  if (!actor.employeeId) return false;
  if (targetEmployee.id === actor.employeeId) return true;
  return targetEmployee.manager_id === actor.employeeId;
}

export function canViewPdi(actor: Actor, plan: Plan, ancestorsOfEmployee: string[]): boolean {
  // canDo('pdi', 'view') cobre admin_rh, director e user/rh com toggle.
  if (canDo(actor, 'pdi', 'view')) return true;
  if (actor.employeeId && actor.employeeId === plan.employee_id) return true;
  if (actor.employeeId && ancestorsOfEmployee.includes(actor.employeeId)) return true;
  return false;
}

export function canEditPdiHeader(actor: Actor, plan: Plan): boolean {
  if (canDo(actor, 'pdi', 'edit')) return true;
  return plan.created_by === actor.userId;
}

export function canAddAction(actor: Actor, plan: Plan): boolean {
  return canEditPdiHeader(actor, plan);
}

export function canUpdateActionStatus(actor: Actor, action: PlanAction): boolean {
  if (canDo(actor, 'pdi', 'edit')) return true;
  if (actor.employeeId && action.responsible_employee_id === actor.employeeId) return true;
  return false;
}

export function canCommentOnPdi(actor: Actor, plan: Plan, ancestorsOfEmployee: string[]): boolean {
  return canViewPdi(actor, plan, ancestorsOfEmployee);
}

export function canConcludePdi(actor: Actor, plan: Plan): boolean {
  if (canDo(actor, 'pdi', 'edit')) return true;
  return plan.created_by === actor.userId;
}

export function canCancelPdi(actor: Actor, plan: Plan): boolean {
  return canConcludePdi(actor, plan);
}

export function canDeletePdi(actor: Actor): boolean {
  return canDo(actor, 'pdi', 'edit');
}
