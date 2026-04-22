import { canDo } from '@/features/permissions/permissions';
import type { RhPermissions, ScreenPermissions } from '@/features/permissions/types';

export type Actor = {
  role: 'admin_rh' | 'director' | 'user' | 'rh' | string;
  employeeId: string | null;
  isManager?: boolean;
  rhPermissions?: RhPermissions | null;
  screenPermissions?: ScreenPermissions | null;
};

export function canAccessDashboard(actor: Actor): boolean {
  // Dashboard agregado: quem tem algo para consolidar. Colaborador comum
  // sem equipe nao acessa a versao "painel de empresa" — o layout mostra
  // "Inicio" (operacional) no lugar via isOperationalOnly.
  if (actor.role === 'admin_rh' || actor.role === 'director') return true;
  if (canDo(actor, 'dashboard', 'view')) return true;
  // Fallback legado: role rh sempre via dashboard na FT-8.
  if (actor.role === 'rh') return true;
  // Gestor direto ve dashboard da equipe (baseline hierarquico).
  return !!actor.isManager;
}

export function canFilterByDepartment(actor: Actor): boolean {
  // Filtrar por departamento exige familiaridade com a estrutura organizacional.
  return canDo(actor, 'colaboradores', 'view');
}

export function canClickDrillDown(actor: Actor): boolean {
  return canAccessDashboard(actor);
}
