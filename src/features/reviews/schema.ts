import { z } from 'zod';

const cycleBasicsShape = {
  name: z.string().min(2, 'Nome obrigatório').max(120),
  description: z.string().max(500).optional().nullable(),
  periodStart: z.string().min(1, 'Obrigatório'),
  periodEnd: z.string().min(1, 'Obrigatório'),
  responseStart: z.string().min(1, 'Obrigatório'),
  responseEnd: z.string().min(1, 'Obrigatório'),
};

export const CycleBasicsSchema = z.object(cycleBasicsShape)
  .refine((v) => new Date(v.periodStart) <= new Date(v.periodEnd), {
    message: 'Período inválido.',
    path: ['periodEnd'],
  })
  .refine((v) => new Date(v.responseStart) <= new Date(v.responseEnd), {
    message: 'Prazo inválido.',
    path: ['responseEnd'],
  });

const cycleTypesShape = {
  includeSelf: z.boolean(),
  includeManager: z.boolean(),
};

export const CycleTypesSchema = z.object(cycleTypesShape)
  .refine((v) => v.includeSelf || v.includeManager, {
    message: 'Selecione ao menos um tipo.',
    path: ['includeSelf'],
  });

export const ParticipantsSelectionSchema = z.object({
  mode: z.enum(['all', 'filters']),
  departmentIds: z.array(z.string().uuid()).default([]),
  positionIds: z.array(z.string().uuid()).default([]),
  manualEmployeeIds: z.array(z.string().uuid()).default([]),
  excludedEmployeeIds: z.array(z.string().uuid()).default([]),
});

export const QuestionInputSchema = z.object({
  id: z.string().uuid().optional(),
  questionOrder: z.number().int().min(0),
  type: z.enum(['scale', 'text']),
  questionText: z.string().min(3, 'Texto muito curto').max(500),
  isRequired: z.boolean().default(true),
  competencyId: z.string().uuid().nullable().optional(),
  scaleMin: z.number().int().nullable().optional(),
  scaleMax: z.number().int().nullable().optional(),
});

export const FormInputSchema = z.object({
  questions: z.array(QuestionInputSchema).min(1, 'Ao menos uma pergunta.'),
});

export const CycleDraftSchema = z.object({
  ...cycleBasicsShape,
  ...cycleTypesShape,
  participants: ParticipantsSelectionSchema,
  questions: z.array(QuestionInputSchema).default([]),
});

export const ScaleAnswerSchema = z.object({
  questionId: z.string().uuid(),
  scaleValue: z.number().int().min(1).max(5),
});
export const TextAnswerSchema = z.object({
  questionId: z.string().uuid(),
  textValue: z.string().max(2000),
});
export const AnswerDraftSchema = z.union([ScaleAnswerSchema, TextAnswerSchema]);

export type CycleBasicsInput = z.infer<typeof CycleBasicsSchema>;
export type CycleTypesInput = z.infer<typeof CycleTypesSchema>;
export type ParticipantsSelection = z.infer<typeof ParticipantsSelectionSchema>;
export type QuestionInput = z.infer<typeof QuestionInputSchema>;
export type FormInput = z.infer<typeof FormInputSchema>;
export type CycleDraft = z.infer<typeof CycleDraftSchema>;
export type AnswerDraft = z.infer<typeof AnswerDraftSchema>;

export const DEFAULT_QUESTION_TEMPLATE: QuestionInput[] = [
  { questionOrder: 0, type: 'scale', questionText: 'Entrega os compromissos combinados dentro do prazo.', isRequired: true, scaleMin: 1, scaleMax: 5 },
  { questionOrder: 1, type: 'scale', questionText: 'Demonstra iniciativa e busca soluções proativamente.', isRequired: true, scaleMin: 1, scaleMax: 5 },
  { questionOrder: 2, type: 'scale', questionText: 'Comunica-se de forma clara com colegas e stakeholders.', isRequired: true, scaleMin: 1, scaleMax: 5 },
  { questionOrder: 3, type: 'scale', questionText: 'Colabora e apoia o time quando necessário.', isRequired: true, scaleMin: 1, scaleMax: 5 },
  { questionOrder: 4, type: 'scale', questionText: 'Demonstra domínio técnico das responsabilidades da função.', isRequired: true, scaleMin: 1, scaleMax: 5 },
  { questionOrder: 5, type: 'scale', questionText: 'Adapta-se bem a mudanças e imprevistos.', isRequired: true, scaleMin: 1, scaleMax: 5 },
  { questionOrder: 6, type: 'scale', questionText: 'Busca aprendizado contínuo e melhora consistentemente.', isRequired: true, scaleMin: 1, scaleMax: 5 },
  { questionOrder: 7, type: 'text', questionText: 'Quais são os principais pontos fortes observados?', isRequired: true },
  { questionOrder: 8, type: 'text', questionText: 'Quais pontos de desenvolvimento você sugere?', isRequired: true },
];
