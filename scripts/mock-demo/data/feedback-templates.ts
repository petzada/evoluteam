export type FeedbackType =
  | 'elogio'
  | 'reconhecimento'
  | 'ponto_de_melhoria'
  | 'orientacao'
  | 'observacao_privada';

type FeedbackContext = {
  recipientName: string;
  senderName: string;
  competencyName?: string | null;
};

const templates: Record<FeedbackType, ((context: FeedbackContext) => string)[]> = {
  elogio: [
    ({ recipientName }) =>
      `${recipientName} conduziu a conversa com o cliente com muita clareza e trouxe segurança para a tomada de decisão.`,
    ({ recipientName, competencyName }) =>
      `${recipientName} demonstrou ${competencyName ?? 'excelente postura consultiva'} ao transformar um caso complexo em próximos passos objetivos.`,
    ({ recipientName }) =>
      `${recipientName} manteve o cliente informado durante todo o processo e evitou retrabalho entre Comercial e Operações.`,
  ],
  reconhecimento: [
    ({ recipientName }) =>
      `${recipientName} teve papel importante no fechamento de uma negociação sensível, conciliando urgência comercial e cuidado regulatório.`,
    ({ recipientName }) =>
      `Reconheço a consistência de ${recipientName} no acompanhamento dos casos de renegociação e na qualidade dos registros no funil.`,
    ({ recipientName, competencyName }) =>
      `${recipientName} vem se destacando em ${competencyName ?? 'colaboração entre áreas'} e ajudou o time a destravar uma demanda crítica.`,
  ],
  ponto_de_melhoria: [
    ({ recipientName }) =>
      `${recipientName} pode antecipar riscos documentais antes de avançar para a análise jurídica, reduzindo idas e vindas com o cliente.`,
    ({ recipientName, competencyName }) =>
      `Um ponto de evolução para ${recipientName} é fortalecer ${competencyName ?? 'a priorização'} quando há muitos casos urgentes ao mesmo tempo.`,
    ({ recipientName }) =>
      `${recipientName} deve registrar decisões comerciais com mais contexto para facilitar a continuidade pelo time de backoffice.`,
  ],
  orientacao: [
    ({ recipientName }) =>
      `${recipientName}, vale reservar alguns minutos após cada atendimento para documentar objeções, próximos passos e riscos percebidos.`,
    ({ recipientName, competencyName }) =>
      `${recipientName}, recomendo praticar ${competencyName ?? 'comunicação consultiva'} em simulações de clientes com perfil mais resistente.`,
    ({ recipientName }) =>
      `${recipientName}, antes de acionar o Jurídico, tente separar contrato, histórico de cobrança e resumo do objetivo do cliente.`,
  ],
  observacao_privada: [
    ({ recipientName }) =>
      `Nota privada sobre ${recipientName}: acompanhar de perto a carga de trabalho nas semanas de pico para evitar perda de qualidade.`,
    ({ recipientName }) =>
      `Registro privado: ${recipientName} parece responder melhor a combinados objetivos e checkpoints curtos durante negociações críticas.`,
    ({ recipientName }) =>
      `Observação privada sobre ${recipientName}: há potencial claro para assumir casos mais sensíveis com apoio gradual da liderança.`,
  ],
};

export function buildFeedbackMessage(type: FeedbackType, context: FeedbackContext, index: number): string {
  const options = templates[type];
  const base = options[index % options.length](context);
  return `${base} Contexto: consultoria de crédito, negociação com documentação sensível e foco em uma experiência transparente.`;
}

