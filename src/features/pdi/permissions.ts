export type Role = 'admin_rh' | 'director' | 'user';

export type Actor = {
  role: Role | string;
  userId: string;
  employeeId: string | null;
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
  if (actor.role === 'admin_rh') return true;
  if (!actor.employeeId) return false;
  if (targetEmployee.id === actor.employeeId) return true;
  return targetEmployee.manager_id === actor.employeeId;
}

export function canViewPdi(actor: Actor, plan: Plan, ancestorsOfEmployee: string[]): boolean {
  if (actor.role === 'admin_rh' || actor.role === 'director') return true;
  if (actor.employeeId && actor.employeeId === plan.employee_id) return true;
  if (actor.employeeId && ancestorsOfEmployee.includes(actor.employeeId)) return true;
  return false;
}

export function canEditPdiHeader(actor: Actor, plan: Plan): boolean {
  if (actor.role === 'admin_rh') return true;
  return plan.created_by === actor.userId;
}

export function canAddAction(actor: Actor, plan: Plan): boolean {
  return canEditPdiHeader(actor, plan);
}

export function canUpdateActionStatus(actor: Actor, action: PlanAction): boolean {
  if (actor.role === 'admin_rh') return true;
  if (actor.employeeId && action.responsible_employee_id === actor.employeeId) return true;
  return false;
}

export function canCommentOnPdi(actor: Actor, plan: Plan, ancestorsOfEmployee: string[]): boolean {
  return canViewPdi(actor, plan, ancestorsOfEmployee);
}

export function canConcludePdi(actor: Actor, plan: Plan): boolean {
  if (actor.role === 'admin_rh') return true;
  return plan.created_by === actor.userId;
}

export function canCancelPdi(actor: Actor, plan: Plan): boolean {
  return canConcludePdi(actor, plan);
}

export function canDeletePdi(actor: Actor): boolean {
  return actor.role === 'admin_rh';
}
