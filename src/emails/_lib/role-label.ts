import type { Role } from '@/features/permissions/types';

export function roleLabel(role: Role): string {
  switch (role) {
    case 'admin_rh':
      return 'administrador RH';
    case 'user':
      return 'colaborador';
    default:
      return 'colaborador';
  }
}
