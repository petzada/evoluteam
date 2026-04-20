import { z } from 'zod';

export const ProfileSchema = z.object({
  fullName: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().optional().nullable(),
});

export const ChangePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

export type ProfileInput = z.infer<typeof ProfileSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
