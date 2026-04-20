import { z } from 'zod';

export const FEEDBACK_TYPES = [
  'elogio',
  'reconhecimento',
  'ponto_de_melhoria',
  'orientacao',
  'observacao_privada',
] as const;

export const FEEDBACK_VISIBILITIES = [
  'privado',
  'visivel_para_gestor',
  'visivel_para_rh',
] as const;

export type FeedbackType = typeof FEEDBACK_TYPES[number];
export type FeedbackVisibility = typeof FEEDBACK_VISIBILITIES[number];

export const FeedbackInputSchema = z.object({
  recipientId: z.string().uuid('Destinatário obrigatório'),
  type: z.enum(FEEDBACK_TYPES),
  competencyId: z.string().uuid().nullable().optional(),
  message: z
    .string()
    .min(20, 'Mínimo 20 caracteres')
    .max(10000, 'Máximo 10.000 caracteres'),
  visibility: z.enum(FEEDBACK_VISIBILITIES),
}).refine(
  (v) => v.type !== 'observacao_privada' || v.visibility === 'privado',
  {
    message: 'Observação privada deve ter visibilidade privado.',
    path: ['visibility'],
  },
);

export type FeedbackInput = z.infer<typeof FeedbackInputSchema>;

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  elogio: 'Elogio',
  reconhecimento: 'Reconhecimento',
  ponto_de_melhoria: 'Ponto de melhoria',
  orientacao: 'Orientação',
  observacao_privada: 'Observação privada',
};

export const FEEDBACK_TYPE_DESCRIPTIONS: Record<FeedbackType, string> = {
  elogio: 'Algo que a pessoa fez bem e merece reconhecimento.',
  reconhecimento: 'Reconhecer conquista significativa ou entrega.',
  ponto_de_melhoria: 'Área que pode ser desenvolvida.',
  orientacao: 'Sugestão ou dica para o desenvolvimento.',
  observacao_privada: 'Nota pessoal — visível apenas para você.',
};

export const FEEDBACK_VISIBILITY_LABELS: Record<FeedbackVisibility, string> = {
  privado: 'Privado',
  visivel_para_gestor: 'Visível para gestor',
  visivel_para_rh: 'Visível para RH',
};

export const FEEDBACK_VISIBILITY_DESCRIPTIONS: Record<FeedbackVisibility, string> = {
  privado: 'Apenas você e o destinatário.',
  visivel_para_gestor: 'Também visível aos gestores da cadeia.',
  visivel_para_rh: 'Também visível ao RH e gestores.',
};
