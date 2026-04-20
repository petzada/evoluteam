import { describe, it, expect } from 'vitest';
import { EmployeeSchema, UpdateRoleSchema } from './schema';

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
