export type ScaleAnswer = {
  assignmentType: 'self' | 'manager';
  competencyKey: string; // use '__none__' when no competency
  scaleValue: number;
};

export type CompetencyScoreResult = {
  competencyKey: string;
  avgSelf: number | null;
  avgManager: number | null;
  avgEffective: number | null;
};

export function aggregateScores(answers: ScaleAnswer[]): {
  scores: CompetencyScoreResult[];
  avgOverall: number | null;
} {
  const bySelf = new Map<string, number[]>();
  const byManager = new Map<string, number[]>();

  for (const a of answers) {
    const bucket = a.assignmentType === 'self' ? bySelf : byManager;
    if (!bucket.has(a.competencyKey)) bucket.set(a.competencyKey, []);
    bucket.get(a.competencyKey)!.push(a.scaleValue);
  }

  const keys = new Set<string>([
    ...Array.from(bySelf.keys()),
    ...Array.from(byManager.keys()),
  ]);

  const scores: CompetencyScoreResult[] = [];
  for (const key of keys) {
    const selfArr = bySelf.get(key) ?? [];
    const mgrArr = byManager.get(key) ?? [];
    const avgSelf = selfArr.length ? mean(selfArr) : null;
    const avgManager = mgrArr.length ? mean(mgrArr) : null;
    const avgEffective = avgManager ?? avgSelf;
    scores.push({ competencyKey: key, avgSelf, avgManager, avgEffective });
  }

  scores.sort((a, b) => a.competencyKey.localeCompare(b.competencyKey));

  const effective = scores
    .map((s) => s.avgEffective)
    .filter((v): v is number => v !== null);
  const avgOverall = effective.length ? mean(effective) : null;

  return { scores, avgOverall };
}

export function rankTopBottom(
  scores: CompetencyScoreResult[],
  topN = 3,
  bottomN = 3,
): { top: CompetencyScoreResult[]; bottom: CompetencyScoreResult[] } {
  const valid = scores.filter((s) => s.avgEffective !== null);
  const sortedDesc = [...valid].sort((a, b) => (b.avgEffective ?? 0) - (a.avgEffective ?? 0));
  const top = sortedDesc.slice(0, topN);
  const bottom = [...valid]
    .sort((a, b) => (a.avgEffective ?? 0) - (b.avgEffective ?? 0))
    .slice(0, bottomN);
  return { top, bottom };
}

export type AssignmentPlanInput = {
  includeSelf: boolean;
  includeManager: boolean;
  participants: { employeeId: string; managerId: string | null; status: 'active' | 'inactive' | 'terminated' }[];
};

export type AssignmentPlanItem = {
  revieweeId: string;
  reviewerId: string;
  type: 'self' | 'manager';
};

export function planAssignments(input: AssignmentPlanInput): AssignmentPlanItem[] {
  const result: AssignmentPlanItem[] = [];
  for (const p of input.participants) {
    if (p.status !== 'active') continue;
    if (input.includeSelf) {
      result.push({ revieweeId: p.employeeId, reviewerId: p.employeeId, type: 'self' });
    }
    if (input.includeManager && p.managerId) {
      result.push({ revieweeId: p.employeeId, reviewerId: p.managerId, type: 'manager' });
    }
  }
  return result;
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
