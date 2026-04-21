import { hasAdminPower } from '@/features/permissions/permissions';
import type { RhPermissions } from '@/features/permissions/types';

export type Actor = {
  role: 'admin_rh' | 'director' | 'user' | 'rh' | string;
  employeeId: string | null;
  isManager?: boolean;
  rhPermissions?: RhPermissions | null;
};

export function canAccessDashboard(actor: Actor): boolean {
  if (actor.role === 'admin_rh' || actor.role === 'director') return true;
  // RH (independente de toggle) tem visao geral — dashboard faz parte do core.
  if (actor.role === 'rh') return true;
  return !!actor.isManager;
}

export function canFilterByDepartment(actor: Actor): boolean {
  if (actor.role === 'admin_rh' || actor.role === 'director') return true;
  // Filtrar por departamento exige familiaridade com a estrutura organizacional.
  return hasAdminPower(actor, 'can_employees');
}

export function canClickDrillDown(actor: Actor): boolean {
  return canAccessDashboard(actor);
}
