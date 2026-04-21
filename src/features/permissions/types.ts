// Tipos transversais de roles e permissoes granulares.
// Spec: docs/dev/19-ft-8-granularidade-rh.md §5, §7.

export type Role = 'admin_rh' | 'director' | 'user' | 'rh';

export const ROLE_LABELS: Record<Role, string> = {
  admin_rh: 'Administrador',
  director: 'Diretor',
  rh: 'RH',
  user: 'Colaborador',
};

export type RhPermissionKey =
  | 'can_employees'
  | 'can_reviews'
  | 'can_recruitment'
  | 'can_pdi_feedback'
  | 'can_invites'
  | 'can_audit';

export type RhPermissions = {
  can_employees: boolean;
  can_reviews: boolean;
  can_recruitment: boolean;
  can_pdi_feedback: boolean;
  can_invites: boolean;
  can_audit: boolean;
};

export const EMPTY_RH_PERMISSIONS: RhPermissions = {
  can_employees: false,
  can_reviews: false,
  can_recruitment: false,
  can_pdi_feedback: false,
  can_invites: false,
  can_audit: false,
};

export const RH_PERMISSION_MODULES: {
  key: RhPermissionKey;
  label: string;
  description: string;
}[] = [
  {
    key: 'can_employees',
    label: 'Colaboradores e estrutura',
    description:
      'Gerenciar colaboradores, departamentos, cargos e competências.',
  },
  {
    key: 'can_reviews',
    label: 'Avaliações',
    description: 'Criar e publicar ciclos, liberar resultados e acompanhar consolidados.',
  },
  {
    key: 'can_recruitment',
    label: 'Recrutamento',
    description:
      'Configurar etapas, criar vagas, gerenciar candidatos e contratar.',
  },
  {
    key: 'can_pdi_feedback',
    label: 'PDIs e feedbacks',
    description: 'Moderar feedbacks e criar PDI para qualquer colaborador.',
  },
  {
    key: 'can_invites',
    label: 'Convites e acessos',
    description:
      'Enviar convites para novos colaboradores.',
  },
  {
    key: 'can_audit',
    label: 'Auditoria',
    description: 'Ver histórico de ações no sistema e dados da empresa.',
  },
];

// Actor e um snapshot de quem esta executando uma acao.
// E consumido em server actions e nas funcoes can* de cada feature.
export type Actor = {
  userId: string;
  companyId: string;
  role: Role;
  employeeId: string | null;
  employeeStatus: 'active' | 'inactive' | 'terminated' | null;
  rhPermissions: RhPermissions | null; // populado apenas quando role === 'rh'
};
