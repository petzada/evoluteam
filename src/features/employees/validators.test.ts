import { describe, it, expect } from 'vitest';
import { validateManagerAssignment } from './validators';

describe('validateManagerAssignment', () => {
  it('aceita manager nulo (topo de hierarquia)', () => {
    const r = validateManagerAssignment({
      employeeId: 'e-1',
      proposedManagerId: null,
      descendantIds: [],
    });
    expect(r.ok).toBe(true);
  });

  it('aceita manager nulo durante create (employeeId null)', () => {
    const r = validateManagerAssignment({
      employeeId: null,
      proposedManagerId: null,
      descendantIds: [],
    });
    expect(r.ok).toBe(true);
  });

  it('rejeita auto-referência (employee é seu próprio manager)', () => {
    const r = validateManagerAssignment({
      employeeId: 'e-1',
      proposedManagerId: 'e-1',
      descendantIds: [],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/si mesmo/i);
  });

  it('rejeita ciclo — manager proposto é descendente direto', () => {
    const r = validateManagerAssignment({
      employeeId: 'e-root',
      proposedManagerId: 'e-child',
      descendantIds: ['e-child'],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/circular/i);
  });

  it('rejeita ciclo — manager proposto é descendente indireto (A → B → C, tentar A.manager = C)', () => {
    const r = validateManagerAssignment({
      employeeId: 'e-A',
      proposedManagerId: 'e-C',
      descendantIds: ['e-B', 'e-C'],
    });
    expect(r.ok).toBe(false);
  });

  it('aceita manager fora da cadeia de descendentes', () => {
    const r = validateManagerAssignment({
      employeeId: 'e-A',
      proposedManagerId: 'e-external',
      descendantIds: ['e-B', 'e-C'],
    });
    expect(r.ok).toBe(true);
  });

  it('durante create (employeeId null) nunca há ciclo a checar', () => {
    const r = validateManagerAssignment({
      employeeId: null,
      proposedManagerId: 'e-any',
      descendantIds: [],
    });
    expect(r.ok).toBe(true);
  });
});
