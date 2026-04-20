import { describe, it, expect } from 'vitest';
import { LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from './schema';

describe('LoginSchema', () => {
  it('aceita e-mail válido + senha', () => {
    const r = LoginSchema.safeParse({ email: 'a@b.com', password: 'secret' });
    expect(r.success).toBe(true);
  });

  it('rejeita e-mail inválido', () => {
    const r = LoginSchema.safeParse({ email: 'naoehemail', password: 'x' });
    expect(r.success).toBe(false);
  });

  it('rejeita senha vazia', () => {
    const r = LoginSchema.safeParse({ email: 'a@b.com', password: '' });
    expect(r.success).toBe(false);
  });
});

describe('ForgotPasswordSchema', () => {
  it('aceita e-mail válido', () => {
    expect(ForgotPasswordSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
  });

  it('rejeita e-mail vazio', () => {
    expect(ForgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
  });
});

describe('ResetPasswordSchema', () => {
  it('aceita senha ≥8 caracteres iguais', () => {
    const r = ResetPasswordSchema.safeParse({
      password: '12345678',
      confirmPassword: '12345678',
    });
    expect(r.success).toBe(true);
  });

  it('rejeita senha <8 caracteres', () => {
    const r = ResetPasswordSchema.safeParse({
      password: '1234567',
      confirmPassword: '1234567',
    });
    expect(r.success).toBe(false);
  });

  it('rejeita quando senhas não conferem', () => {
    const r = ResetPasswordSchema.safeParse({
      password: '12345678',
      confirmPassword: '87654321',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path.includes('confirmPassword'))).toBe(true);
    }
  });
});
