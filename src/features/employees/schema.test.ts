import { describe, it, expect } from 'vitest';
import {
  EmployeeSchema, UpdateRoleSchema, TransferOptionSchema,
} from './schema';

describe('EmployeeSchema', () => {
  const valid = {
    fullName: 'Ana Souza',
    email: 'ana@empresa.com',
    positionId: 'pos-1',
    role: 'user' as const,
    departmentId: null,
    managerId: null,
    hireDate: '2026-01-15',
    phone: null,
    sendInvite: true,
  };

  it('aceita input mínimo válido', () => {
    expect(EmployeeSchema.safeParse(valid).success).toBe(true);
  });

  it('aceita com internalNotes opcional', () => {
    expect(
      EmployeeSchema.safeParse({ ...valid, internalNotes: 'texto' }).success,
    ).toBe(true);
  });

  it('rejeita nome curto', () => {
    expect(EmployeeSchema.safeParse({ ...valid, fullName: 'A' }).success).toBe(false);
  });

  it('rejeita e-mail inválido', () => {
    expect(EmployeeSchema.safeParse({ ...valid, email: 'naoehemail' }).success).toBe(false);
  });

  it('rejeita papel inválido', () => {
    expect(EmployeeSchema.safeParse({ ...valid, role: 'super_admin' }).success).toBe(false);
  });

  it('rejeita cargo vazio', () => {
    expect(EmployeeSchema.safeParse({ ...valid, positionId: '' }).success).toBe(false);
  });

  it('rejeita data de admissão vazia', () => {
    expect(EmployeeSchema.safeParse({ ...valid, hireDate: '' }).success).toBe(false);
  });

  describe('unitId (FT-10)', () => {
    it('aceita unitId omitido', () => {
      expect(EmployeeSchema.safeParse(valid).success).toBe(true);
    });

    it('aceita unitId null', () => {
      expect(EmployeeSchema.safeParse({ ...valid, unitId: null }).success).toBe(true);
    });

    it('aceita unitId UUID valido', () => {
      expect(EmployeeSchema.safeParse({ ...valid, unitId: crypto.randomUUID() }).success).toBe(true);
    });

    it('rejeita unitId nao-UUID', () => {
      expect(EmployeeSchema.safeParse({ ...valid, unitId: 'nao-uuid' }).success).toBe(false);
    });
  });
});

describe('UpdateRoleSchema', () => {
  it('aceita uuid + papel válido', () => {
    const r = UpdateRoleSchema.safeParse({
      employeeId: crypto.randomUUID(),
      role: 'admin_rh',
    });
    expect(r.success).toBe(true);
  });

  it('rejeita employeeId não-uuid', () => {
    expect(
      UpdateRoleSchema.safeParse({ employeeId: 'abc', role: 'user' }).success,
    ).toBe(false);
  });
});

describe('TransferOptionSchema', () => {
  it('aceita mode=null sem manager', () => {
    expect(TransferOptionSchema.safeParse({ mode: 'null' }).success).toBe(true);
  });

  it('aceita mode=transfer com newManagerId uuid', () => {
    expect(
      TransferOptionSchema.safeParse({ mode: 'transfer', newManagerId: crypto.randomUUID() }).success,
    ).toBe(true);
  });

  it('rejeita mode=transfer sem newManagerId', () => {
    expect(
      TransferOptionSchema.safeParse({ mode: 'transfer' }).success,
    ).toBe(false);
  });

  it('rejeita mode=transfer com newManagerId não-uuid', () => {
    expect(
      TransferOptionSchema.safeParse({ mode: 'transfer', newManagerId: 'abc' }).success,
    ).toBe(false);
  });
});
