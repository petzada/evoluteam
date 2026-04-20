import { describe, it, expect } from 'vitest';
import {
  CompanySchema,
  OnboardingStep1Schema,
  OnboardingStep2Schema,
  SEED_POSITIONS,
  SEED_COMPETENCIES,
} from './schema';

describe('CompanySchema', () => {
  const valid = {
    name: 'Acme Ltda',
    cnpj: '00.000.000/0001-00',
    segment: 'Tecnologia' as const,
    teamSize: '21–50' as const,
  };

  it('aceita empresa válida', () => {
    expect(CompanySchema.safeParse(valid).success).toBe(true);
  });

  it('aceita sem CNPJ', () => {
    const { cnpj: _cnpj, ...withoutCnpj } = valid;
    expect(CompanySchema.safeParse(withoutCnpj).success).toBe(true);
  });

  it('rejeita nome curto', () => {
    expect(CompanySchema.safeParse({ ...valid, name: 'A' }).success).toBe(false);
  });

  it('rejeita segmento fora da lista fechada', () => {
    expect(CompanySchema.safeParse({ ...valid, segment: 'Outro Setor' }).success).toBe(false);
  });

  it('rejeita teamSize fora da lista', () => {
    expect(CompanySchema.safeParse({ ...valid, teamSize: '1000+' }).success).toBe(false);
  });
});

describe('OnboardingStep1Schema', () => {
  it('é alias de CompanySchema', () => {
    const r = OnboardingStep1Schema.safeParse({
      name: 'Acme',
      segment: 'Saúde',
      teamSize: '1–20',
    });
    expect(r.success).toBe(true);
  });
});

describe('OnboardingStep2Schema', () => {
  const valid = {
    fullName: 'João Silva',
    positionId: 'Administrativo/RH',
    departmentName: 'RH',
    hireDate: '2026-04-20',
    phone: '11999999999',
  };

  it('aceita perfil completo', () => {
    expect(OnboardingStep2Schema.safeParse(valid).success).toBe(true);
  });

  it('aceita sem departamento e telefone', () => {
    expect(
      OnboardingStep2Schema.safeParse({
        fullName: valid.fullName,
        positionId: valid.positionId,
        hireDate: valid.hireDate,
      }).success,
    ).toBe(true);
  });

  it('rejeita sem cargo', () => {
    expect(OnboardingStep2Schema.safeParse({ ...valid, positionId: '' }).success).toBe(false);
  });
});

describe('Seeds', () => {
  it('SEED_POSITIONS tem 4 cargos', () => {
    expect(SEED_POSITIONS).toHaveLength(4);
    expect(SEED_POSITIONS).toContain('Administrativo/RH');
  });

  it('SEED_COMPETENCIES tem 7 competências', () => {
    expect(SEED_COMPETENCIES).toHaveLength(7);
  });
});
