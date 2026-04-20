import { z } from 'zod';

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
});

export const UpdateRoleSchema = z.object({
  employeeId: z.string().uuid(),
  role: z.enum(['admin_rh', 'director', 'user']),
});

export type EmployeeInput = z.infer<typeof EmployeeSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>;
