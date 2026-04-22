import { z } from 'zod';

export const SEGMENTS = [
  'Tecnologia', 'Comércio/Varejo', 'Indústria', 'Serviços', 'Saúde',
  'Educação', 'Financeiro', 'Construção Civil', 'Agronegócio', 'Outro',
] as const;

export const TEAM_SIZES = ['1–20', '21–50', '51–100', '101–300', '300+'] as const;

export const SEED_COMPETENCIES = [
  'Comunicação', 'Liderança', 'Colaboração', 'Entrega',
  'Organização', 'Domínio técnico', 'Comportamento',
];

export const CompanySchema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  cnpj: z.string().optional(),
  segment: z.enum(SEGMENTS, { message: 'Segmento obrigatório' }),
  teamSize: z.enum(TEAM_SIZES, { message: 'Tamanho obrigatório' }),
  logoUrl: z.string().optional(),
});

export const OnboardingStep1Schema = CompanySchema;

export const OnboardingStep2Schema = z.object({
  fullName: z.string().min(2, 'Nome obrigatório'),
  positionName: z.string().trim().min(2, 'Informe seu cargo').max(80, 'Máximo 80 caracteres'),
  departmentName: z.string().optional(),
  hireDate: z.string().min(1, 'Data obrigatória'),
  phone: z.string().optional(),
});

export type CompanyInput = z.infer<typeof CompanySchema>;
export type OnboardingStep1Input = z.infer<typeof OnboardingStep1Schema>;
export type OnboardingStep2Input = z.infer<typeof OnboardingStep2Schema>;
