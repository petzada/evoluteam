export type Actor = {
  role: 'admin_rh' | 'director' | 'user' | string;
  employeeId: string | null;
  isManager?: boolean;
};

export function canAccessDashboard(actor: Actor): boolean {
  if (actor.role === 'admin_rh' || actor.role === 'director') return true;
  return !!actor.isManager;
}

export function canFilterByDepartment(actor: Actor): boolean {
  return actor.role === 'admin_rh' || actor.role === 'director';
}

export function canClickDrillDown(actor: Actor): boolean {
  return canAccessDashboard(actor);
}
