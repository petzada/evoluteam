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

export type QuestionTemplateItem = Omit<QuestionInput, 'competencyId'> & {
  hintCompetencyName?: string;
};

// Cada pergunta de nota do template tem um "hint" que é casado com o nome de
// uma competência seed (docs/dev/00-decisoes-transversais.md §14). As 7 seeds em
// src/features/company/schema.ts: Comunicação, Liderança, Colaboração, Entrega,
// Organização, Domínio técnico, Comportamento.
export const DEFAULT_QUESTION_TEMPLATE: QuestionTemplateItem[] = [
  { questionOrder: 0, type: 'scale', questionText: 'Comunica-se com clareza e objetividade com colegas, liderança e stakeholders.', isRequired: true, scaleMin: 1, scaleMax: 5, hintCompetencyName: 'Comunicação' },
  { questionOrder: 1, type: 'scale', questionText: 'Demonstra liderança adequada ao seu papel, orientando pessoas e assumindo responsabilidades.', isRequired: true, scaleMin: 1, scaleMax: 5, hintCompetencyName: 'Liderança' },
  { questionOrder: 2, type: 'scale', questionText: 'Colabora com o time, compartilha conhecimento e apoia os colegas.', isRequired: true, scaleMin: 1, scaleMax: 5, hintCompetencyName: 'Colaboração' },
  { questionOrder: 3, type: 'scale', questionText: 'Entrega resultados com qualidade e dentro dos prazos combinados.', isRequired: true, scaleMin: 1, scaleMax: 5, hintCompetencyName: 'Entrega' },
  { questionOrder: 4, type: 'scale', questionText: 'Gerencia tempo, prioridades e processos de forma eficiente.', isRequired: true, scaleMin: 1, scaleMax: 5, hintCompetencyName: 'Organização' },
  { questionOrder: 5, type: 'scale', questionText: 'Demonstra domínio técnico compatível com o cargo e busca evolução contínua.', isRequired: true, scaleMin: 1, scaleMax: 5, hintCompetencyName: 'Domínio técnico' },
  { questionOrder: 6, type: 'scale', questionText: 'Age com ética, respeito e alinhamento aos valores da empresa.', isRequired: true, scaleMin: 1, scaleMax: 5, hintCompetencyName: 'Comportamento' },
  { questionOrder: 7, type: 'text', questionText: 'Quais são os principais pontos fortes observados?', isRequired: true },
  { questionOrder: 8, type: 'text', questionText: 'Quais pontos de desenvolvimento você sugere?', isRequired: true },
];

export function resolveTemplateQuestions(
  template: QuestionTemplateItem[],
  competencies: { id: string; name: string }[],
): QuestionInput[] {
  const byName = new Map(
    competencies.map((c) => [c.name.trim().toLowerCase(), c.id]),
  );
  return template.map((item) => {
    const { hintCompetencyName, ...rest } = item;
    const matchedId = hintCompetencyName
      ? byName.get(hintCompetencyName.trim().toLowerCase()) ?? null
      : null;
    return { ...rest, competencyId: matchedId };
  });
}
