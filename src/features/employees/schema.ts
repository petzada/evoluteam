import { z } from 'zod';

// FT-9: ScreenPermissions e um map parcial <screen>.<action> -> boolean.
// Shape nao e validado com enum fechado (a lista pode evoluir); validator
// SQL + type guard no app cuidam disso.
export const ScreenPermissionsSchema = z.record(z.string(), z.boolean());

export const EmployeeSchema = z.object({
  fullName: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  positionId: z.string().min(1, 'Cargo obrigatório'),
  role: z.enum(['admin_rh', 'director', 'user']),
  departmentId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  hireDate: z.string().min(1, 'Data obrigatória'),
  phone: z.string().optional().nullable(),
  sendInvite: z.boolean().optional(),
  internalNotes: z.string().optional().nullable(),
  screenPermissions: ScreenPermissionsSchema.optional().nullable(),
});

export const UpdateRoleSchema = z.object({
  employeeId: z.string().uuid(),
  role: z.enum(['admin_rh', 'director', 'user']),
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
