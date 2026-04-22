import { z } from 'zod';

export const RhPermissionsSchema = z.object({
  can_employees: z.boolean(),
  can_reviews: z.boolean(),
  can_recruitment: z.boolean(),
  can_pdi_feedback: z.boolean(),
  can_invites: z.boolean(),
  can_audit: z.boolean(),
});

export const EmployeeSchema = z.object({
  fullName: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  positionId: z.string().min(1, 'Cargo obrigatório'),
  role: z.enum(['admin_rh', 'director', 'user', 'rh']),
  departmentId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  hireDate: z.string().min(1, 'Data obrigatória'),
  phone: z.string().optional().nullable(),
  sendInvite: z.boolean().optional(),
  internalNotes: z.string().optional().nullable(),
  rhPermissions: RhPermissionsSchema.optional().nullable(),
});

export const UpdateRoleSchema = z.object({
  employeeId: z.string().uuid(),
  role: z.enum(['admin_rh', 'director', 'user', 'rh']),
});

export const TransferOptionSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('transfer'), newManagerId: z.string().uuid() }),
  z.object({ mode: z.literal('null') }),
]);

export const DepartmentInputSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
});

export const PositionInputSchema = DepartmentInputSchema;

export type EmployeeInput = z.infer<typeof EmployeeSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
export type TransferOption = z.infer<typeof TransferOptionSchema>;
export type DepartmentInput = z.infer<typeof DepartmentInputSchema>;
export type PositionInput = z.infer<typeof PositionInputSchema>;
