import { z } from 'zod';

export const leadRoles = ['RH', 'Gestor', 'Diretoria', 'Outro'] as const;

export const teamSizes = [
  'ate-20',
  '21-50',
  '51-150',
  '151-300',
  'mais-300',
] as const;

export const teamSizeLabels: Record<(typeof teamSizes)[number], string> = {
  'ate-20': 'Até 20',
  '21-50': '21-50',
  '51-150': '51-150',
  '151-300': '151-300',
  'mais-300': '+300',
};

export const personalEmailDomains = new Set([
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'me.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'uol.com.br',
  'bol.com.br',
]);

export const leadSchema = z.object({
  fullName: z.string().trim().min(2, 'Informe seu nome completo.').max(120),
  email: z.string().trim().email('Informe um e-mail válido.').max(180),
  company: z.string().trim().min(2, 'Informe o nome da empresa.').max(140),
  role: z.enum(leadRoles, { error: 'Selecione seu papel.' }),
  teamSize: z.enum(teamSizes, { error: 'Selecione o tamanho do time.' }),
  reason: z.string().trim().max(700, 'Use no máximo 700 caracteres.').optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export function isPersonalEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1];
  return domain ? personalEmailDomains.has(domain) : false;
}
