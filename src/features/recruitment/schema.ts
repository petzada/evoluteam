import { z } from 'zod';

export const RECRUITMENT_STAGE_KINDS = ['entry', 'intermediate', 'hired_terminal'] as const;
export type RecruitmentStageKind = typeof RECRUITMENT_STAGE_KINDS[number];

export const JOB_OPENING_EMPLOYMENT_TYPES = [
  'clt', 'pj', 'estagio', 'temporario', 'freelancer',
] as const;
export type JobOpeningEmploymentType = typeof JOB_OPENING_EMPLOYMENT_TYPES[number];

export const JOB_OPENING_WORKPLACE_TYPES = ['presencial', 'remoto', 'hibrido'] as const;
export type JobOpeningWorkplaceType = typeof JOB_OPENING_WORKPLACE_TYPES[number];

export const JOB_OPENING_STATUSES = ['open', 'paused', 'closed', 'cancelled'] as const;
export type JobOpeningStatus = typeof JOB_OPENING_STATUSES[number];

export const APPLICATION_STATUSES = [
  'in_progress', 'hired', 'rejected', 'withdrawn', 'frozen',
] as const;
export type ApplicationStatus = typeof APPLICATION_STATUSES[number];

export const CANDIDATE_SOURCES = [
  'indicacao', 'linkedin', 'site_empresa', 'whatsapp',
  'instagram', 'indeed', 'gupy', 'manual', 'outro',
] as const;
export type CandidateSource = typeof CANDIDATE_SOURCES[number];

export const REJECTION_REASONS = [
  'perfil_tecnico_insuficiente', 'experiencia_incompativel',
  'pretensao_salarial_incompativel', 'fit_cultural_insuficiente',
  'nao_compareceu', 'comunicacao_insuficiente',
  'indisponibilidade_de_horario', 'outro',
] as const;
export type RejectionReason = typeof REJECTION_REASONS[number];

export const WITHDRAWAL_REASONS = [
  'nao_respondeu_contato', 'aceitou_outra_proposta',
  'salario_incompativel', 'beneficios_incompativeis',
  'modelo_trabalho_incompativel', 'localizacao_incompativel',
  'perdeu_interesse', 'processo_muito_longo', 'outro',
] as const;
export type WithdrawalReason = typeof WITHDRAWAL_REASONS[number];

// ============================================================
// Labels pt-BR
// ============================================================

export const JOB_OPENING_EMPLOYMENT_TYPE_LABELS: Record<JobOpeningEmploymentType, string> = {
  clt: 'CLT',
  pj: 'PJ',
  estagio: 'Estágio',
  temporario: 'Temporário',
  freelancer: 'Freelancer',
};

export const JOB_OPENING_WORKPLACE_TYPE_LABELS: Record<JobOpeningWorkplaceType, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  hibrido: 'Híbrido',
};

export const JOB_OPENING_STATUS_LABELS: Record<JobOpeningStatus, string> = {
  open: 'Aberta',
  paused: 'Pausada',
  closed: 'Fechada',
  cancelled: 'Cancelada',
};

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  in_progress: 'Em andamento',
  hired: 'Contratado',
  rejected: 'Reprovado',
  withdrawn: 'Desistente',
  frozen: 'Congelado',
};

export const CANDIDATE_SOURCE_LABELS: Record<CandidateSource, string> = {
  indicacao: 'Indicação',
  linkedin: 'LinkedIn',
  site_empresa: 'Site da empresa',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  indeed: 'Indeed',
  gupy: 'Gupy',
  manual: 'Manual',
  outro: 'Outro',
};

export const REJECTION_REASON_LABELS: Record<RejectionReason, string> = {
  perfil_tecnico_insuficiente: 'Perfil técnico insuficiente',
  experiencia_incompativel: 'Experiência incompatível',
  pretensao_salarial_incompativel: 'Pretensão salarial incompatível',
  fit_cultural_insuficiente: 'Fit cultural insuficiente',
  nao_compareceu: 'Não compareceu',
  comunicacao_insuficiente: 'Comunicação insuficiente',
  indisponibilidade_de_horario: 'Indisponibilidade de horário',
  outro: 'Outro',
};

export const WITHDRAWAL_REASON_LABELS: Record<WithdrawalReason, string> = {
  nao_respondeu_contato: 'Não respondeu contato',
  aceitou_outra_proposta: 'Aceitou outra proposta',
  salario_incompativel: 'Salário incompatível',
  beneficios_incompativeis: 'Benefícios incompatíveis',
  modelo_trabalho_incompativel: 'Modelo de trabalho incompatível',
  localizacao_incompativel: 'Localização incompatível',
  perdeu_interesse: 'Perdeu interesse',
  processo_muito_longo: 'Processo muito longo',
  outro: 'Outro',
};

// ============================================================
// Constantes de negócio
// ============================================================

/**
 * Threshold de "candidato parado" — quando o tempo na etapa atual
 * passa desse valor, o card no Kanban recebe badge amarelo e o
 * candidato aparece na tabela "Parados" do dashboard.
 * Decisão P50: global fixo de 5 dias.
 */
export const STALLED_THRESHOLD_DAYS = 5;

// ============================================================
// Zod schemas (input validators das actions)
// ============================================================

export const JobOpeningInputSchema = z.object({
  title: z.string().min(3, 'Título obrigatório').max(140, 'Máximo 140 caracteres'),
  description: z.string().max(2000, 'Máximo 2.000 caracteres').nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  positionId: z.string().uuid().nullable().optional(),
  hiringManagerId: z.string().uuid().nullable().optional(),
  employmentType: z.enum(JOB_OPENING_EMPLOYMENT_TYPES),
  workplaceType: z.enum(JOB_OPENING_WORKPLACE_TYPES),
  location: z.string().max(200).nullable().optional(),
  openPositions: z.number().int().min(1, 'Mínimo 1 posição'),
});
export type JobOpeningInput = z.infer<typeof JobOpeningInputSchema>;

export const CandidateInputSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório').max(120, 'Máximo 120 caracteres'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().max(30).nullable().optional(),
  linkedinUrl: z.string().url().nullable().optional().or(z.literal('').transform(() => null)),
  resumeUrl: z.string().url().nullable().optional().or(z.literal('').transform(() => null)),
  source: z.enum(CANDIDATE_SOURCES),
  sourceOther: z.string().max(100).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
}).refine(
  (v) => v.source !== 'outro' || (v.sourceOther?.trim()?.length ?? 0) > 0,
  { message: 'Descreva a origem "outro"', path: ['sourceOther'] },
);
export type CandidateInput = z.infer<typeof CandidateInputSchema>;

export const RecruitmentStageInputSchema = z.object({
  name: z.string().min(2, 'Nome obrigatório').max(60, 'Máximo 60 caracteres'),
});
export type RecruitmentStageInput = z.infer<typeof RecruitmentStageInputSchema>;
