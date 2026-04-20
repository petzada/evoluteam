import { describe, it, expect } from 'vitest';
import {
  CycleBasicsSchema, CycleTypesSchema, QuestionInputSchema, ScaleAnswerSchema, TextAnswerSchema,
  AnswerDraftSchema, DEFAULT_QUESTION_TEMPLATE,
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
  it('todas as perguntas têm texto válido', () => {
    for (const q of DEFAULT_QUESTION_TEMPLATE) {
      expect(QuestionInputSchema.safeParse(q).success).toBe(true);
    }
  });
});
