import { describe, it, expect } from 'vitest';
import { actionStatusColor, computeActionStatus, computePdiStatus, pdiStatusColor, progressFor } from './utils';

function daysFromNow(delta: number): string {
  const d = new Date();
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

describe('computePdiStatus', () => {
  it('preserva concluido / cancelado mesmo com due_date passada', () => {
    expect(computePdiStatus({ status: 'concluido', due_date: daysFromNow(-10) })).toBe('concluido');
    expect(computePdiStatus({ status: 'cancelado', due_date: daysFromNow(-10) })).toBe('cancelado');
  });
  it('retorna atrasado quando due_date no passado e status não terminal', () => {
    expect(computePdiStatus({ status: 'nao_iniciado', due_date: daysFromNow(-1) })).toBe('atrasado');
    expect(computePdiStatus({ status: 'em_andamento', due_date: daysFromNow(-1) })).toBe('atrasado');
  });
  it('mantém status quando due_date no futuro', () => {
    expect(computePdiStatus({ status: 'nao_iniciado', due_date: daysFromNow(10) })).toBe('nao_iniciado');
    expect(computePdiStatus({ status: 'em_andamento', due_date: daysFromNow(10) })).toBe('em_andamento');
  });
});

describe('computeActionStatus', () => {
  it('preserva concluida / cancelada', () => {
    expect(computeActionStatus({ status: 'concluida', due_date: daysFromNow(-10) })).toBe('concluida');
    expect(computeActionStatus({ status: 'cancelada', due_date: daysFromNow(-10) })).toBe('cancelada');
  });
  it('retorna atrasada quando no passado e não concluída', () => {
    expect(computeActionStatus({ status: 'pendente', due_date: daysFromNow(-1) })).toBe('atrasada');
    expect(computeActionStatus({ status: 'em_andamento', due_date: daysFromNow(-1) })).toBe('atrasada');
  });
  it('mantém status quando no futuro', () => {
    expect(computeActionStatus({ status: 'pendente', due_date: daysFromNow(5) })).toBe('pendente');
  });
});

describe('progressFor', () => {
  it('conta concluídas', () => {
    expect(progressFor([{ status: 'pendente' }, { status: 'concluida' }, { status: 'concluida' }]))
      .toEqual({ done: 2, total: 3 });
  });
  it('lida com lista vazia', () => {
    expect(progressFor([])).toEqual({ done: 0, total: 0 });
  });
});

describe('status colors', () => {
  it('mapeia PDI para paleta semântica global', () => {
    expect(pdiStatusColor('nao_iniciado')).toContain('bg-slate');
    expect(pdiStatusColor('em_andamento')).toContain('bg-amber');
    expect(pdiStatusColor('atrasado')).toContain('bg-amber');
    expect(pdiStatusColor('concluido')).toContain('bg-emerald');
    expect(pdiStatusColor('cancelado')).toContain('bg-red');
  });

  it('mapeia ação de PDI para paleta semântica global', () => {
    expect(actionStatusColor('pendente')).toContain('bg-amber');
    expect(actionStatusColor('em_andamento')).toContain('bg-amber');
    expect(actionStatusColor('atrasada')).toContain('bg-amber');
    expect(actionStatusColor('concluida')).toContain('bg-emerald');
    expect(actionStatusColor('cancelada')).toContain('bg-red');
  });
});
