import { describe, it, expect } from 'vitest';
import { aggregateScores, planAssignments, rankTopBottom } from './calc';

describe('aggregateScores', () => {
  it('retorna null/vazio quando não há respostas', () => {
    const { scores, avgOverall } = aggregateScores([]);
    expect(scores).toEqual([]);
    expect(avgOverall).toBeNull();
  });

  it('usa avg do gestor quando disponível', () => {
    const { scores, avgOverall } = aggregateScores([
      { assignmentType: 'self', competencyKey: 'C1', scaleValue: 3 },
      { assignmentType: 'manager', competencyKey: 'C1', scaleValue: 4 },
      { assignmentType: 'manager', competencyKey: 'C1', scaleValue: 5 },
    ]);
    expect(scores).toHaveLength(1);
    expect(scores[0].avgSelf).toBe(3);
    expect(scores[0].avgManager).toBe(4.5);
    expect(scores[0].avgEffective).toBe(4.5); // gestor prevalece
    expect(avgOverall).toBe(4.5);
  });

  it('fallback para self quando não há avaliação de gestor', () => {
    const { scores, avgOverall } = aggregateScores([
      { assignmentType: 'self', competencyKey: 'C1', scaleValue: 4 },
      { assignmentType: 'self', competencyKey: 'C1', scaleValue: 2 },
    ]);
    expect(scores[0].avgManager).toBeNull();
    expect(scores[0].avgSelf).toBe(3);
    expect(scores[0].avgEffective).toBe(3);
    expect(avgOverall).toBe(3);
  });

  it('média geral é média das médias efetivas por competência', () => {
    const { avgOverall } = aggregateScores([
      { assignmentType: 'manager', competencyKey: 'A', scaleValue: 5 },
      { assignmentType: 'manager', competencyKey: 'A', scaleValue: 5 },
      { assignmentType: 'manager', competencyKey: 'B', scaleValue: 1 },
      { assignmentType: 'manager', competencyKey: 'B', scaleValue: 1 },
    ]);
    // (5 + 1) / 2 = 3
    expect(avgOverall).toBe(3);
  });

  it('separa por competência corretamente', () => {
    const { scores } = aggregateScores([
      { assignmentType: 'manager', competencyKey: 'A', scaleValue: 5 },
      { assignmentType: 'manager', competencyKey: 'B', scaleValue: 2 },
    ]);
    expect(scores.find((s) => s.competencyKey === 'A')?.avgManager).toBe(5);
    expect(scores.find((s) => s.competencyKey === 'B')?.avgManager).toBe(2);
  });
});

describe('rankTopBottom', () => {
  it('top e bottom não colidem', () => {
    const scores = [
      { competencyKey: 'A', avgSelf: null, avgManager: 5, avgEffective: 5 },
      { competencyKey: 'B', avgSelf: null, avgManager: 4, avgEffective: 4 },
      { competencyKey: 'C', avgSelf: null, avgManager: 3, avgEffective: 3 },
      { competencyKey: 'D', avgSelf: null, avgManager: 2, avgEffective: 2 },
      { competencyKey: 'E', avgSelf: null, avgManager: 1, avgEffective: 1 },
    ];
    const { top, bottom } = rankTopBottom(scores, 3, 2);
    expect(top.map((s) => s.competencyKey)).toEqual(['A', 'B', 'C']);
    expect(bottom.map((s) => s.competencyKey)).toEqual(['E', 'D']);
  });

  it('ignora competências sem nota efetiva', () => {
    const scores = [
      { competencyKey: 'A', avgSelf: null, avgManager: 5, avgEffective: 5 },
      { competencyKey: 'B', avgSelf: null, avgManager: null, avgEffective: null },
    ];
    const { top, bottom } = rankTopBottom(scores);
    expect(top).toHaveLength(1);
    expect(bottom).toHaveLength(1);
  });
});

describe('planAssignments', () => {
  const participants = [
    { employeeId: 'e1', managerId: 'm1', status: 'active' as const },
    { employeeId: 'e2', managerId: null, status: 'active' as const },
    { employeeId: 'e3', managerId: 'm1', status: 'terminated' as const },
  ];

  it('gera self + manager quando ambos habilitados', () => {
    const plan = planAssignments({
      includeSelf: true, includeManager: true, participants,
    });
    // e1: self + manager · e2: só self (sem gestor) · e3: ignorado (terminated)
    expect(plan).toHaveLength(3);
    expect(plan).toContainEqual({ revieweeId: 'e1', reviewerId: 'e1', type: 'self' });
    expect(plan).toContainEqual({ revieweeId: 'e1', reviewerId: 'm1', type: 'manager' });
    expect(plan).toContainEqual({ revieweeId: 'e2', reviewerId: 'e2', type: 'self' });
  });

  it('respeita includeSelf=false', () => {
    const plan = planAssignments({
      includeSelf: false, includeManager: true, participants,
    });
    expect(plan.every((p) => p.type === 'manager')).toBe(true);
  });

  it('ignora participantes não ativos', () => {
    const plan = planAssignments({
      includeSelf: true, includeManager: true, participants,
    });
    expect(plan.find((p) => p.revieweeId === 'e3')).toBeUndefined();
  });

  it('colaborador sem gestor gera apenas self quando includeManager=true', () => {
    const plan = planAssignments({
      includeSelf: true, includeManager: true,
      participants: [{ employeeId: 'e2', managerId: null, status: 'active' }],
    });
    expect(plan).toEqual([{ revieweeId: 'e2', reviewerId: 'e2', type: 'self' }]);
  });
});
