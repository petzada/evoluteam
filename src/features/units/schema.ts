import { z } from 'zod';

// FT-10 §7. Mesmo padrao de TaxonomyInputSchema, mas com limite 80 (vs 60)
// porque nomes de unidade frequentemente trazem holding/marca por extenso.
export const BusinessUnitSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Nome muito curto')
    .max(80, 'Nome muito longo'),
});

export type BusinessUnitInput = z.infer<typeof BusinessUnitSchema>;

export type BusinessUnit = {
  id: string;
  name: string;
  is_archived: boolean;
};
