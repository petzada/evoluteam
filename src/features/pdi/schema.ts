import { z } from 'zod';

export const PDI_STATUSES = ['nao_iniciado', 'em_andamento', 'concluido', 'cancelado'] as const;
export const PDI_ACTION_STATUSES = ['pendente', 'em_andamento', 'concluida', 'cancelada'] as const;

export type PdiStatus = typeof PDI_STATUSES[number];
export type PdiActionStatus = typeof PDI_ACTION_STATUSES[number];
export type PdiComputedStatus = PdiStatus | 'atrasado';
export type PdiActionComputedStatus = PdiActionStatus | 'atrasada';

export const PDI_STATUS_LABELS: Record<PdiComputedStatus, string> = {
  nao_iniciado: 'Não iniciado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  atrasado: 'Atrasado',
};

export const PDI_ACTION_STATUS_LABELS: Record<PdiActionComputedStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  atrasada: 'Atrasada',
};

export const PdiInputSchema = z.object({
  employeeId: z.string().uuid('Colaborador obrigatório'),
  objective: z
    .string()
    .min(10, 'Mínimo 10 caracteres')
    .max(500, 'Máximo 500 caracteres'),
  competencyId: z.string().uuid().nullable().optional(),
  cycleId: z.string().uuid().nullable().optional(),
  dueDate: z.string().min(1, 'Prazo obrigatório'),
});

export type PdiInput = z.infer<typeof PdiInputSchema>;

export const PdiActionInputSchema = z.object({
  title: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(200, 'Máximo 200 caracteres'),
  dueDate: z.string().min(1, 'Prazo obrigatório'),
  responsibleEmployeeId: z.string().uuid('Responsável obrigatório'),
});

export type PdiActionInput = z.infer<typeof PdiActionInputSchema>;

export const PdiActionStatusSchema = z.enum(PDI_ACTION_STATUSES);

export const PdiCommentSchema = z.object({
  body: z
    .string()
    .min(1, 'Comentário obrigatório')
    .max(2000, 'Máximo 2000 caracteres'),
});

export type PdiCommentInput = z.infer<typeof PdiCommentSchema>;
