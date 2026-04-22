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

// =============================================================
// FT-9 — Permissoes por tela (view/edit) · granularidade maxima
// Spec: docs/dev/21-ft-9-redesign-acessos.md
// Convive com RhPermissions durante as fases de migracao.
// =============================================================

export type ScreenKey =
  | 'dashboard'
  | 'colaboradores'
  | 'avaliacoes'
  | 'feedbacks'
  | 'pdi'
  | 'recrutamento_vagas'
  | 'recrutamento_candidatos'
  | 'recrutamento_etapas'
  | 'recrutamento_relatorios'
  | 'empresa'
  | 'cargos'
  | 'departamentos'
  | 'competencias'
  | 'auditoria';

export type ScreenAction = 'view' | 'edit';

// Pares validos <screen>.<action>. Telas view-only nao expoem .edit.
export type ScreenPermissionKey =
  | 'dashboard.view'
  | 'colaboradores.view' | 'colaboradores.edit'
  | 'avaliacoes.view'    | 'avaliacoes.edit'
  | 'feedbacks.view'     | 'feedbacks.edit'
  | 'pdi.view'           | 'pdi.edit'
  | 'recrutamento_vagas.view'      | 'recrutamento_vagas.edit'
  | 'recrutamento_candidatos.view' | 'recrutamento_candidatos.edit'
  | 'recrutamento_etapas.view'     | 'recrutamento_etapas.edit'
  | 'recrutamento_relatorios.view'
  | 'empresa.view' | 'empresa.edit'
  | 'cargos.view'  | 'cargos.edit'
  | 'departamentos.view' | 'departamentos.edit'
  | 'competencias.view'  | 'competencias.edit'
  | 'auditoria.view';

// ScreenPermissions e um mapa parcial; chaves nao presentes = false.
export type ScreenPermissions = Partial<Record<ScreenPermissionKey, boolean>>;

export const EMPTY_SCREEN_PERMISSIONS: ScreenPermissions = {};

// Modulos agrupados por secao da sidebar — usado pelo drawer "Gerenciar acesso".
export const SCREEN_PERMISSION_MODULES: {
  section: 'Geral' | 'Recrutamento' | 'Configurações';
  screens: {
    key: ScreenKey;
    label: string;
    description: string;
    hasEdit: boolean;
  }[];
}[] = [
  {
    section: 'Geral',
    screens: [
      { key: 'dashboard',    label: 'Dashboard',    description: 'Visão consolidada da empresa.',              hasEdit: false },
      { key: 'colaboradores',label: 'Colaboradores', description: 'Lista, perfis, convites e desligamentos.',   hasEdit: true  },
      { key: 'avaliacoes',   label: 'Avaliações',   description: 'Ciclos, participantes, resultados.',          hasEdit: true  },
      { key: 'feedbacks',    label: 'Feedbacks',    description: 'Envio, leitura global e moderação.',          hasEdit: true  },
      { key: 'pdi',          label: 'PDI',          description: 'Planos de desenvolvimento de qualquer pessoa.',hasEdit: true  },
    ],
  },
  {
    section: 'Recrutamento',
    screens: [
      { key: 'recrutamento_vagas',      label: 'Vagas',       description: 'Criar e editar vagas.',               hasEdit: true  },
      { key: 'recrutamento_candidatos', label: 'Candidatos',  description: 'Cadastrar e gerenciar candidatos.',   hasEdit: true  },
      { key: 'recrutamento_etapas',     label: 'Etapas',      description: 'Configurar funil do recrutamento.',   hasEdit: true  },
      { key: 'recrutamento_relatorios', label: 'Relatórios',  description: 'Métricas e KPIs do recrutamento.',    hasEdit: false },
    ],
  },
  {
    section: 'Configurações',
    screens: [
      { key: 'empresa',       label: 'Empresa',       description: 'Dados cadastrais da empresa.',  hasEdit: true  },
      { key: 'cargos',        label: 'Cargos',        description: 'CRUD de cargos.',               hasEdit: true  },
      { key: 'departamentos', label: 'Departamentos', description: 'CRUD de departamentos.',        hasEdit: true  },
      { key: 'competencias',  label: 'Competências',  description: 'CRUD de competências.',         hasEdit: true  },
      { key: 'auditoria',     label: 'Auditoria',     description: 'Logs de atividades do sistema.', hasEdit: false },
    ],
  },
];

// Flatten: lista de todas as keys validas. Util para validacao e migration.
export const ALL_SCREEN_PERMISSION_KEYS: ScreenPermissionKey[] = [
  'dashboard.view',
  'colaboradores.view', 'colaboradores.edit',
  'avaliacoes.view',    'avaliacoes.edit',
  'feedbacks.view',     'feedbacks.edit',
  'pdi.view',           'pdi.edit',
  'recrutamento_vagas.view',      'recrutamento_vagas.edit',
  'recrutamento_candidatos.view', 'recrutamento_candidatos.edit',
  'recrutamento_etapas.view',     'recrutamento_etapas.edit',
  'recrutamento_relatorios.view',
  'empresa.view',       'empresa.edit',
  'cargos.view',        'cargos.edit',
  'departamentos.view', 'departamentos.edit',
  'competencias.view',  'competencias.edit',
  'auditoria.view',
];

// =============================================================
// Actor
// =============================================================

// Actor e um snapshot de quem esta executando uma acao.
// E consumido em server actions e nas funcoes can* de cada feature.
//
// Durante Fase 1-3 da FT-9, rhPermissions e screenPermissions coexistem:
//   rhPermissions: populado quando role === 'rh' (FT-8 legado).
//   screenPermissions: populado quando role === 'user' ou 'rh' (FT-9).
// A partir da Fase 4, rhPermissions e removido.
export type Actor = {
  userId: string;
  companyId: string;
  role: Role;
  employeeId: string | null;
  employeeStatus: 'active' | 'inactive' | 'terminated' | null;
  rhPermissions: RhPermissions | null;
  screenPermissions: ScreenPermissions | null;
};
