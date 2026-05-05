import { describe, expect, it } from 'vitest';
import { BusinessUnitSchema } from './schema';

describe('BusinessUnitSchema', () => {
  it('aceita nome valido', () => {
    expect(BusinessUnitSchema.parse({ name: 'Hugs' })).toEqual({ name: 'Hugs' });
  });

  it('faz trim do nome', () => {
    expect(BusinessUnitSchema.parse({ name: '  Hugs  ' })).toEqual({ name: 'Hugs' });
  });

  it('rejeita nome com 1 caractere', () => {
    expect(() => BusinessUnitSchema.parse({ name: 'A' })).toThrow();
  });

  it('rejeita nome vazio', () => {
    expect(() => BusinessUnitSchema.parse({ name: '' })).toThrow();
  });

  it('rejeita nome so com whitespace', () => {
    expect(() => BusinessUnitSchema.parse({ name: '   ' })).toThrow();
  });

  it('rejeita nome com 81 caracteres', () => {
    expect(() => BusinessUnitSchema.parse({ name: 'A'.repeat(81) })).toThrow();
  });

  it('aceita nome com 80 caracteres apos trim', () => {
    expect(BusinessUnitSchema.parse({ name: 'A'.repeat(80) })).toEqual({
      name: 'A'.repeat(80),
    });
  });
});
