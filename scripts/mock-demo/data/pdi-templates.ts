export type PdiTemplate = {
  objective: string;
  competencyName: string;
  actions: string[];
  comments: string[];
};

export const PDI_TEMPLATES: PdiTemplate[] = [
  {
    objective: 'Fortalecer a condução de negociações consultivas em casos de renegociação de empréstimos com alto valor.',
    competencyName: 'Negociação',
    actions: [
      'Revisar três gravações de atendimento e mapear objeções recorrentes',
      'Participar de uma simulação quinzenal com o gestor',
      'Criar roteiro de perguntas para diagnóstico financeiro do cliente',
      'Acompanhar uma negociação sênior e registrar aprendizados',
      'Apresentar plano de abordagem para dois casos complexos',
    ],
    comments: [
      'Boa evolução na escuta ativa; manter atenção ao fechamento dos próximos passos.',
      'O roteiro inicial já reduziu retrabalho nos casos de crédito consignado.',
    ],
  },
  {
    objective: 'Aprimorar a análise documental antes do envio para o Jurídico e reduzir pendências de contrato.',
    competencyName: 'Atenção a Detalhes',
    actions: [
      'Criar checklist de documentos por tipo de operação',
      'Revisar pendências históricas dos últimos trinta dias',
      'Validar checklist com Jurídico e Backoffice',
      'Aplicar checklist em dez casos novos',
      'Medir reincidência de documentos faltantes',
    ],
    comments: [
      'Checklist aprovado; próxima etapa é garantir uso consistente no time.',
      'As pendências caíram nos casos acompanhados nesta semana.',
    ],
  },
  {
    objective: 'Desenvolver repertório técnico em direito bancário aplicado a renegociação e defesa do consumidor.',
    competencyName: 'Conhecimento em Direito Bancário',
    actions: [
      'Concluir trilha interna sobre contratos bancários',
      'Resumir cinco casos práticos com orientação jurídica',
      'Participar de reunião de alinhamento com o time Jurídico',
      'Preparar guia rápido de termos críticos para atendimento',
    ],
    comments: [
      'O guia de termos ficou claro e já pode apoiar o onboarding de novos consultores.',
      'Trazer mais exemplos de cláusulas sensíveis na próxima revisão.',
    ],
  },
  {
    objective: 'Melhorar a priorização de demandas entre prospecção, follow-up e documentação de clientes ativos.',
    competencyName: 'Resolução de Problemas',
    actions: [
      'Classificar carteira por urgência e valor potencial',
      'Definir blocos diários de follow-up',
      'Revisar fila semanalmente com o gestor',
      'Registrar impedimentos e decisões no CRM',
    ],
    comments: [
      'A rotina de blocos reduziu atrasos nos retornos ao cliente.',
      'Manter disciplina de registro mesmo nos dias de maior volume.',
    ],
  },
  {
    objective: 'Aumentar a consistência da comunicação com clientes em etapas sensíveis do processo de crédito.',
    competencyName: 'Comunicação Persuasiva',
    actions: [
      'Reescrever modelos de mensagem para aprovação, pendência e proposta',
      'Testar abordagem com dois perfis de cliente',
      'Coletar feedback do Atendimento sobre clareza das mensagens',
      'Padronizar próximos passos em todos os retornos',
    ],
    comments: [
      'Os modelos novos estão mais objetivos e reduziram dúvidas repetidas.',
      'Ajustar tom quando houver negativa parcial para preservar confiança.',
    ],
  },
  {
    objective: 'Ampliar autonomia na análise de risco de crédito para orientar recomendações comerciais com mais precisão.',
    competencyName: 'Análise de Risco de Crédito',
    actions: [
      'Estudar critérios internos de risco por perfil de cliente',
      'Analisar dez casos fechados e comparar decisão versus resultado',
      'Construir matriz simples de alertas para o time Comercial',
      'Validar matriz com a coordenação de Crédito',
    ],
    comments: [
      'A matriz ajudou a explicar recusas sem desgastar a relação com o cliente.',
      'Incluir exemplos de garantias e composição de renda na próxima versão.',
    ],
  },
];

