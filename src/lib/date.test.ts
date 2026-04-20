import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatDate, formatDateTime, formatRelative } from './date';

describe('formatDate', () => {
  it('formata como dd/MM/yyyy em pt-BR', () => {
    // 12 de março de 2026, 15:00 UTC = 12:00 São Paulo (UTC-3)
    expect(formatDate('2026-03-12T15:00:00Z')).toBe('12/03/2026');
  });

  it('respeita timezone São Paulo (rolagem de dia)', () => {
    // 13/03 02:00 UTC = 12/03 23:00 São Paulo
    expect(formatDate('2026-03-13T02:00:00Z')).toBe('12/03/2026');
  });
});

describe('formatDateTime', () => {
  it('formata data + hora em pt-BR', () => {
    const out = formatDateTime('2026-03-12T15:00:00Z');
    expect(out).toMatch(/12\/03\/2026/);
    expect(out).toMatch(/12:00/);
  });
});

describe('formatRelative', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-20T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retorna "Hoje" para data de hoje', () => {
    expect(formatRelative('2026-04-20T08:00:00Z')).toBe('Hoje');
  });

  it('retorna "Ontem" para 1 dia atrás', () => {
    expect(formatRelative('2026-04-19T12:00:00Z')).toBe('Ontem');
  });

  it('retorna "N dias atrás" para 2-6 dias', () => {
    expect(formatRelative('2026-04-17T12:00:00Z')).toBe('3 dias atrás');
  });

  it('formata como data quando ≥7 dias atrás', () => {
    expect(formatRelative('2026-04-10T12:00:00Z')).toBe('10/04/2026');
  });
});
