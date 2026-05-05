// Tipos transversais de roles e permissoes por tela.
// Spec: docs/dev/21-ft-9-redesign-acessos.md §1 e §4.

export type Role = 'admin_rh' | 'director' | 'user';

export const ROLE_LABELS: Record<Role, string> = {
  admin_rh: 'Administrador',
  director: 'Diretor',
  user: 'Colaborador',
};

/**
 * Label de papel para exibicao em listas/perfil. Apenas UI — nao altera
 * regras de autorizacao. "Supervisor" e como chamamos um Colaborador que
 * recebeu o toggle `colaboradores.edit` no convite (pode gerenciar outros
 * Colaboradores dentro do subset dos proprios toggles).
 */
export function getRoleDisplayLabel(
  role: Role,
  perms?: ScreenPermissions | null,
): string {
  if (role === 'user' && perms?.['colaboradores.edit'] === true) {
    return 'Supervisor';
  }
  return ROLE_LABELS[role];
}

// =============================================================
// ScreenPermissions — granularidade por tela da sidebar
// Spec: docs/dev/21-ft-9-redesign-acessos.md §1.3.
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
  | 'unidades'
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
  | 'unidades.view' | 'unidades.edit'
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
      { key: 'unidades',      label: 'Unidades',      description: 'CRUD de unidades do grupo.',    hasEdit: true  },
      { key: 'departamentos', label: 'Departamentos', description: 'CRUD de departamentos.',        hasEdit: true  },
      { key: 'cargos',        label: 'Cargos',        description: 'CRUD de cargos.',               hasEdit: true  },
      { key: 'competencias',  label: 'Competências',  description: 'CRUD de competências.',         hasEdit: true  },
      { key: 'auditoria',     label: 'Auditoria',     description: 'Logs de atividades do sistema.', hasEdit: false },
    ],
  },
];

// Flatten: lista de todas as keys validas. Util para validacao.
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
  'unidades.view',      'unidades.edit',
  'competencias.view',  'competencias.edit',
  'auditoria.view',
];

// =============================================================
// Actor
// =============================================================
// Snapshot de quem esta executando uma acao. Consumido em server actions
// e nas funcoes can* de cada feature.
//
// screenPermissions e populado apenas quando role === 'user'. Admin/Diretor
// sao pacotes fechados e bypassam verificacoes em canDo.
export type Actor = {
  userId: string;
  companyId: string;
  role: Role;
  employeeId: string | null;
  employeeStatus: 'active' | 'inactive' | 'terminated' | null;
  screenPermissions: ScreenPermissions | null;
};
