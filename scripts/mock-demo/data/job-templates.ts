import type { DepartmentName } from './org-structure';

export type JobTemplate = {
  title: string;
  departmentName: DepartmentName;
  positionName: string;
  description: string;
  employmentType: 'clt' | 'pj' | 'estagio' | 'temporario' | 'freelancer';
  workplaceType: 'presencial' | 'remoto' | 'hibrido';
  location: string;
  openPositions: number;
};

export const JOB_TEMPLATES: JobTemplate[] = [
  {
    title: 'Consultor Comercial Pleno',
    departmentName: 'Comercial',
    positionName: 'Consultor Comercial Pleno',
    employmentType: 'clt',
    workplaceType: 'hibrido',
    location: 'São Paulo, SP',
    openPositions: 2,
    description:
      'Atuação consultiva com clientes interessados em renegociação e estruturação de crédito. A pessoa será responsável por diagnóstico financeiro, condução de objeções, follow-up e alinhamento com Jurídico e Crédito.',
  },
  {
    title: 'Advogado Pleno',
    departmentName: 'Jurídico',
    positionName: 'Advogado Pleno',
    employmentType: 'pj',
    workplaceType: 'hibrido',
    location: 'São Paulo, SP',
    openPositions: 1,
    description:
      'Responsável por análise de contratos bancários, revisão de riscos jurídicos, apoio a casos de renegociação e orientação técnica para times Comercial e Atendimento.',
  },
  {
    title: 'Analista de Crédito Jr',
    departmentName: 'Análise de Crédito',
    positionName: 'Analista de Crédito Jr',
    employmentType: 'clt',
    workplaceType: 'remoto',
    location: 'Brasil',
    openPositions: 1,
    description:
      'Apoio na análise de documentos, histórico financeiro, capacidade de pagamento e critérios internos de risco para recomendações de crédito mais seguras.',
  },
  {
    title: 'Analista de Backoffice',
    departmentName: 'Operações & Backoffice',
    positionName: 'Analista de Backoffice',
    employmentType: 'clt',
    workplaceType: 'presencial',
    location: 'Campinas, SP',
    openPositions: 1,
    description:
      'Organização de documentos, conferência de contratos, atualização de status operacionais e apoio à passagem de bastão entre Comercial, Jurídico e Atendimento.',
  },
  {
    title: 'Atendente de Relacionamento',
    departmentName: 'Atendimento ao Cliente',
    positionName: 'Atendente de Relacionamento',
    employmentType: 'clt',
    workplaceType: 'hibrido',
    location: 'São Paulo, SP',
    openPositions: 2,
    description:
      'Atendimento a clientes em andamento, registro de dúvidas, comunicação de pendências e acompanhamento de prazos com postura empática e organizada.',
  },
];

