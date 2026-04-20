import { describe, it, expect } from 'vitest';
import { TaxonomyInputSchema } from './schema';

describe('TaxonomyInputSchema', () => {
  it('aceita nome válido', () => {
    expect(TaxonomyInputSchema.safeParse({ name: 'Engenharia' }).success).toBe(true);
  });
  it('rejeita nome curto', () => {
    expect(TaxonomyInputSchema.safeParse({ name: 'A' }).success).toBe(false);
  });
  it('rejeita nome muito longo', () => {
    expect(
      TaxonomyInputSchema.safeParse({ name: 'a'.repeat(61) }).success,
    ).toBe(false);
  });
});
