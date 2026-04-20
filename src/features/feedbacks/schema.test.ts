import { describe, it, expect } from 'vitest';
import { FeedbackInputSchema } from './schema';

describe('FeedbackInputSchema', () => {
  const valid = {
    recipientId: crypto.randomUUID(),
    type: 'elogio' as const,
    competencyId: null,
    message: 'Mensagem de feedback com pelo menos 20 caracteres.',
    visibility: 'privado' as const,
  };

  it('aceita input mínimo válido', () => {
    expect(FeedbackInputSchema.safeParse(valid).success).toBe(true);
  });

  it('rejeita mensagem curta (<20)', () => {
    expect(
      FeedbackInputSchema.safeParse({ ...valid, message: 'curta' }).success,
    ).toBe(false);
  });

  it('rejeita mensagem muito longa (>10.000)', () => {
    expect(
      FeedbackInputSchema.safeParse({ ...valid, message: 'a'.repeat(10001) }).success,
    ).toBe(false);
  });

  it('aceita mensagem no limite do hard cap', () => {
    expect(
      FeedbackInputSchema.safeParse({ ...valid, message: 'a'.repeat(10000) }).success,
    ).toBe(true);
  });

  it('rejeita recipientId não-uuid', () => {
    expect(
      FeedbackInputSchema.safeParse({ ...valid, recipientId: 'nope' }).success,
    ).toBe(false);
  });

  it('rejeita tipo inválido', () => {
    expect(
      FeedbackInputSchema.safeParse({ ...valid, type: 'inexistente' }).success,
    ).toBe(false);
  });

  it('rejeita visibilidade inválida', () => {
    expect(
      FeedbackInputSchema.safeParse({ ...valid, visibility: 'publico' }).success,
    ).toBe(false);
  });

  it('aceita observacao_privada com visibility=privado', () => {
    expect(
      FeedbackInputSchema.safeParse({
        ...valid, type: 'observacao_privada', visibility: 'privado',
      }).success,
    ).toBe(true);
  });

  it('rejeita observacao_privada com visibility != privado', () => {
    expect(
      FeedbackInputSchema.safeParse({
        ...valid, type: 'observacao_privada', visibility: 'visivel_para_gestor',
      }).success,
    ).toBe(false);
  });

  it('competencyId pode ser null', () => {
    expect(
      FeedbackInputSchema.safeParse({ ...valid, competencyId: null }).success,
    ).toBe(true);
  });
});
