import { describe, it, expect } from 'vitest';
import {
  JobOpeningInputSchema,
  CandidateInputSchema,
  RecruitmentStageInputSchema,
  HireCandidateInputSchema,
  STALLED_THRESHOLD_DAYS,
  JOB_OPENING_STATUSES,
  APPLICATION_STATUSES,
  CANDIDATE_SOURCES,
  REJECTION_REASONS,
  WITHDRAWAL_REASONS,
} from './schema';

describe('STALLED_THRESHOLD_DAYS', () => {
  it('mantém 5d conforme decisão P50', () => {
    expect(STALLED_THRESHOLD_DAYS).toBe(5);
  });
});

describe('enums', () => {
  it('job_opening_status tem 4 valores (sem draft)', () => {
    expect(JOB_OPENING_STATUSES).toEqual(['open', 'paused', 'closed', 'cancelled']);
  });
  it('application_status tem 5 valores', () => {
    expect(APPLICATION_STATUSES).toHaveLength(5);
    expect(APPLICATION_STATUSES).toContain('in_progress');
    expect(APPLICATION_STATUSES).toContain('hired');
  });
  it('candidate_source inclui outro + as 8 fontes do FT-7.2', () => {
    expect(CANDIDATE_SOURCES).toHaveLength(9);
    expect(CANDIDATE_SOURCES).toContain('outro');
  });
  it('rejection/withdrawal reasons incluem outro', () => {
    expect(REJECTION_REASONS).toContain('outro');
    expect(WITHDRAWAL_REASONS).toContain('outro');
  });
});

describe('JobOpeningInputSchema', () => {
  const valid = {
    title: 'Analista de Suporte Jr',
    employmentType: 'clt' as const,
    workplaceType: 'hibrido' as const,
    openPositions: 2,
  };

  it('aceita input válido mínimo', () => {
    expect(() => JobOpeningInputSchema.parse(valid)).not.toThrow();
  });
  it('rejeita título curto', () => {
    expect(() => JobOpeningInputSchema.parse({ ...valid, title: 'ab' })).toThrow();
  });
  it('rejeita openPositions < 1', () => {
    expect(() => JobOpeningInputSchema.parse({ ...valid, openPositions: 0 })).toThrow();
  });
  it('rejeita employmentType inválido', () => {
    expect(() => JobOpeningInputSchema.parse({ ...valid, employmentType: 'invalid' })).toThrow();
  });
});

describe('CandidateInputSchema', () => {
  const valid = {
    name: 'Maria Silva',
    email: 'maria@example.com',
    source: 'linkedin' as const,
  };

  it('aceita input válido mínimo', () => {
    expect(() => CandidateInputSchema.parse(valid)).not.toThrow();
  });
  it('rejeita email inválido', () => {
    expect(() => CandidateInputSchema.parse({ ...valid, email: 'not-an-email' })).toThrow();
  });
  it('exige sourceOther quando source=outro', () => {
    expect(() => CandidateInputSchema.parse({ ...valid, source: 'outro' })).toThrow();
    expect(() => CandidateInputSchema.parse({ ...valid, source: 'outro', sourceOther: 'TikTok' })).not.toThrow();
  });
  it('aceita linkedinUrl vazio ou válido', () => {
    expect(() => CandidateInputSchema.parse({ ...valid, linkedinUrl: '' })).not.toThrow();
    expect(() => CandidateInputSchema.parse({ ...valid, linkedinUrl: 'https://linkedin.com/in/maria' })).not.toThrow();
  });
});

describe('RecruitmentStageInputSchema', () => {
  it('aceita nome válido', () => {
    expect(() => RecruitmentStageInputSchema.parse({ name: 'Triagem' })).not.toThrow();
  });
  it('rejeita nome muito curto ou muito longo', () => {
    expect(() => RecruitmentStageInputSchema.parse({ name: 'x' })).toThrow();
    expect(() => RecruitmentStageInputSchema.parse({ name: 'x'.repeat(61) })).toThrow();
  });
});

describe('HireCandidateInputSchema · unitId (FT-10)', () => {
  const valid = () => ({
    name: 'Maria Silva',
    email: 'maria@example.com',
    positionId: crypto.randomUUID(),
    hiredAt: '2026-05-05',
    archiveOtherApplications: false,
  });

  it('aceita unitId omitido', () => {
    expect(() => HireCandidateInputSchema.parse(valid())).not.toThrow();
  });

  it('aceita unitId null', () => {
    expect(() => HireCandidateInputSchema.parse({ ...valid(), unitId: null })).not.toThrow();
  });

  it('aceita unitId UUID valido', () => {
    expect(() => HireCandidateInputSchema.parse({
      ...valid(),
      unitId: crypto.randomUUID(),
    })).not.toThrow();
  });

  it('rejeita unitId que nao e UUID', () => {
    expect(() => HireCandidateInputSchema.parse({ ...valid(), unitId: 'nao-uuid' })).toThrow();
  });
});
