import { z } from 'zod';

export const TaxonomyInputSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório').max(60, 'Máximo 60 caracteres'),
});

export type TaxonomyInput = z.infer<typeof TaxonomyInputSchema>;
