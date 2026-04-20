import { describe, it, expect } from 'vitest';
import {
  CycleBasicsSchema, CycleTypesSchema, QuestionInputSchema, ScaleAnswerSchema, TextAnswerSchema,
  AnswerDraftSchema, DEFAULT_QUESTION_TEMPLATE, resolveTemplateQuestions,
} from './schema';

describe('CycleBasicsSchema', () => {
  const valid = {
    name: 'Ciclo 1S',
    description: null,
    periodStart: '2026-01-01',
    periodEnd: '2026-06-30',
    responseStart: '2026-07-01',
    responseEnd: '2026-07-15',
  };

  it('aceita input válido', () => {
    expect(CycleBasicsSchema.safeParse(valid).success).toBe(true);
  });

  it('rejeita nome curto', () => {
    expect(CycleBasicsSchema.safeParse({ ...valid, name: 'A' }).success).toBe(false);
  });

  it('rejeita período invertido', () => {
    expect(
      CycleBasicsSchema.safeParse({ ...valid, periodStart: '2026-06-30', periodEnd: '2026-01-01' }).success,
    ).toBe(false);
  });

  it('rejeita prazo invertido', () => {
    expect(
      CycleBasicsSchema.safeParse({ ...valid, responseStart: '2026-07-15', responseEnd: '2026-07-01' }).success,
    ).toBe(false);
  });
});

describe('CycleTypesSchema', () => {
  it('aceita pelo menos um tipo', () => {
    expect(CycleTypesSchema.safeParse({ includeSelf: true, includeManager: false }).success).toBe(true);
    expect(CycleTypesSchema.safeParse({ includeSelf: false, includeManager: true }).success).toBe(true);
    expect(CycleTypesSchema.safeParse({ includeSelf: true, includeManager: true }).success).toBe(true);
  });
  it('rejeita ambos false', () => {
    expect(CycleTypesSchema.safeParse({ includeSelf: false, includeManager: false }).success).toBe(false);
  });
});

describe('QuestionInputSchema', () => {
  it('aceita pergunta de nota válida', () => {
    expect(QuestionInputSchema.safeParse({
      questionOrder: 0, type: 'scale', questionText: 'Pergunta válida', isRequired: true,
      scaleMin: 1, scaleMax: 5,
    }).success).toBe(true);
  });
  it('rejeita texto curto', () => {
    expect(QuestionInputSchema.safeParse({
      questionOrder: 0, type: 'text', questionText: 'Ab', isRequired: false,
    }).success).toBe(false);
  });
});

describe('Answer schemas', () => {
  it('ScaleAnswer aceita 1-5', () => {
    expect(ScaleAnswerSchema.safeParse({ questionId: crypto.randomUUID(), scaleValue: 3 }).success).toBe(true);
    expect(ScaleAnswerSchema.safeParse({ questionId: crypto.randomUUID(), scaleValue: 0 }).success).toBe(false);
    expect(ScaleAnswerSchema.safeParse({ questionId: crypto.randomUUID(), scaleValue: 6 }).success).toBe(false);
  });
  it('TextAnswer aceita string limitada', () => {
    expect(TextAnswerSchema.safeParse({ questionId: crypto.randomUUID(), textValue: 'oi' }).success).toBe(true);
    expect(TextAnswerSchema.safeParse({ questionId: crypto.randomUUID(), textValue: 'x'.repeat(2001) }).success).toBe(false);
  });
  it('AnswerDraft é union', () => {
    expect(AnswerDraftSchema.safeParse({ questionId: crypto.randomUUID(), scaleValue: 3 }).success).toBe(true);
    expect(AnswerDraftSchema.safeParse({ questionId: crypto.randomUUID(), textValue: 'oi' }).success).toBe(true);
  });
});

describe('DEFAULT_QUESTION_TEMPLATE', () => {
  it('tem 7 nota + 2 texto', () => {
    expect(DEFAULT_QUESTION_TEMPLATE).toHaveLength(9);
    expect(DEFAULT_QUESTION_TEMPLATE.filter((q) => q.type === 'scale')).toHaveLength(7);
    expect(DEFAULT_QUESTION_TEMPLATE.filter((q) => q.type === 'text')).toHaveLength(2);
  });
  it('todas as 7 perguntas de nota têm hint de competência', () => {
    const scales = DEFAULT_QUESTION_TEMPLATE.filter((q) => q.type === 'scale');
    expect(scales.every((q) => !!q.hintCompetencyName)).toBe(true);
  });
});

describe('resolveTemplateQuestions', () => {
  const competencies = [
    { id: crypto.randomUUID(), name: 'Comunicação' },
    { id: crypto.randomUUID(), name: 'Liderança' },
    { id: crypto.randomUUID(), name: 'Colaboração' },
    { id: crypto.randomUUID(), name: 'Entrega' },
    { id: crypto.randomUUID(), name: 'Organização' },
    { id: crypto.randomUUID(), name: 'Domínio técnico' },
    { id: crypto.randomUUID(), name: 'Comportamento' },
  ];

  it('produz questões válidas conforme QuestionInputSchema', () => {
    const resolved = resolveTemplateQuestions(DEFAULT_QUESTION_TEMPLATE, competencies);
    for (const q of resolved) {
      expect(QuestionInputSchema.safeParse(q).success).toBe(true);
    }
  });

  it('vincula as 7 perguntas de nota às competências seed', () => {
    const resolved = resolveTemplateQuestions(DEFAULT_QUESTION_TEMPLATE, competencies);
    const scales = resolved.filter((q) => q.type === 'scale');
    expect(scales.every((q) => !!q.competencyId)).toBe(true);
  });

  it('fallback para null quando competência não existe na empresa', () => {
    const resolved = resolveTemplateQuestions(DEFAULT_QUESTION_TEMPLATE, []);
    expect(resolved.every((q) => q.competencyId === null)).toBe(true);
  });

  it('casa nome case-insensitive', () => {
    const compId = crypto.randomUUID();
    const resolved = resolveTemplateQuestions(
      [{ questionOrder: 0, type: 'scale', questionText: 'Comunica claramente.', isRequired: true, scaleMin: 1, scaleMax: 5, hintCompetencyName: 'comunicação' }],
      [{ id: compId, name: 'Comunicação' }],
    );
    expect(resolved[0].competencyId).toBe(compId);
  });

  it('text questions sem hint ficam com competencyId null', () => {
    const resolved = resolveTemplateQuestions(DEFAULT_QUESTION_TEMPLATE, competencies);
    const texts = resolved.filter((q) => q.type === 'text');
    expect(texts.every((q) => q.competencyId === null)).toBe(true);
  });
});
