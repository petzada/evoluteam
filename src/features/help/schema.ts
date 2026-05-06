// Schema Zod do frontmatter dos tutoriais em content/help/*.mdx.
// Spec: docs/superpowers/specs/2026-05-06-help-tutorials-design.md §"Schema Zod".

import { z } from 'zod';

export const helpFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  videoUrl: z
    .string()
    .url()
    .refine((v) => v.startsWith('https://'), 'videoUrl must be https'),
  duration: z.number().int().positive().optional(),
  // valor desconhecido faz canDo retornar false → tópico oculto
  screen: z.string().optional(),
  adminOnly: z.boolean().optional().default(false),
  order: z.number().int().optional().default(100),
});

export type HelpFrontmatterInput = z.input<typeof helpFrontmatterSchema>;
export type HelpFrontmatterParsed = z.output<typeof helpFrontmatterSchema>;
