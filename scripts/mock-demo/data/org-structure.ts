export const DEMO_COMPANY = {
  name: 'Vértice Crédito Consultoria',
  segment: 'Consultoria Financeira / Jurídica',
  team_size: '51-100',
} as const;

export const DEPARTMENTS = [
  'Comercial',
  'Jurídico',
  'Análise de Crédito',
  'Operações & Backoffice',
  'Atendimento ao Cliente',
  'Administrativo & RH',
] as const;

export type DepartmentName = typeof DEPARTMENTS[number];

export type DepartmentPlan = {
  name: DepartmentName;
  totalEmployees: number;
  managerPosition: string;
  staffPositions: string[];
};

export const DEPARTMENT_PLANS: DepartmentPlan[] = [
  {
    name: 'Comercial',
    totalEmployees: 18,
    managerPosition: 'Gerente Comercial',
    staffPositions: [
      'SDR',
      'Consultor Comercial Jr',
      'Consultor Comercial Pleno',
      'Consultor Comercial Sênior',
    ],
  },
  {
    name: 'Jurídico',
    totalEmployees: 10,
    managerPosition: 'Coordenador Jurídico',
    staffPositions: [
      'Paralegal',
      'Advogado Jr',
      'Advogado Pleno',
      'Advogado Sênior',
    ],
  },
  {
    name: 'Análise de Crédito',
    totalEmployees: 10,
    managerPosition: 'Coordenador de Crédito',
    staffPositions: [
      'Analista de Crédito Jr',
      'Analista de Crédito Pleno',
    ],
  },
  {
    name: 'Operações & Backoffice',
    totalEmployees: 8,
    managerPosition: 'Coordenador de Operações',
    staffPositions: ['Analista de Backoffice'],
  },
  {
    name: 'Atendimento ao Cliente',
    totalEmployees: 9,
    managerPosition: 'Supervisor de Atendimento',
    staffPositions: ['Atendente de Relacionamento'],
  },
  {
    name: 'Administrativo & RH',
    totalEmployees: 5,
    managerPosition: 'Analista de RH',
    staffPositions: ['Analista de RH', 'Analista Financeiro'],
  },
];

export const POSITIONS = Array.from(
  new Set(DEPARTMENT_PLANS.flatMap((department) => [
    department.managerPosition,
    ...department.staffPositions,
  ])),
);

export const COMPETENCIES = [
  {
    name: 'Negociação',
    description: 'Conduz conversas comerciais com estratégia, escuta ativa e foco em acordos sustentáveis.',
  },
  {
    name: 'Comunicação Persuasiva',
    description: 'Explica alternativas de crédito com clareza, segurança e adaptação ao perfil do cliente.',
  },
  {
    name: 'Conhecimento em Direito Bancário',
    description: 'Aplica fundamentos jurídicos ligados a contratos, cobranças, renegociação e proteção do consumidor.',
  },
  {
    name: 'Análise de Risco de Crédito',
    description: 'Interpreta dados financeiros, histórico e garantias para apoiar recomendações consistentes.',
  },
  {
    name: 'Atenção a Detalhes',
    description: 'Revisa documentos, prazos e evidências com rigor antes de orientar o cliente ou avançar processos.',
  },
  {
    name: 'Foco no Cliente',
    description: 'Prioriza uma experiência consultiva, empática e transparente ao longo da jornada.',
  },
  {
    name: 'Compliance e Regulamentação',
    description: 'Segue políticas internas, normas bancárias e cuidados de LGPD nas interações e registros.',
  },
  {
    name: 'Resolução de Problemas',
    description: 'Diagnostica entraves comerciais, jurídicos ou operacionais e propõe caminhos práticos.',
  },
  {
    name: 'Trabalho em Equipe',
    description: 'Colabora entre Comercial, Jurídico, Crédito, Operações e Atendimento para acelerar soluções.',
  },
  {
    name: 'Liderança',
    description: 'Orienta pessoas, acompanha indicadores e desenvolve autonomia no time.',
  },
] as const;

