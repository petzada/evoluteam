export type ManagerValidationResult = { ok: true } | { ok: false; reason: string };

export function validateManagerAssignment(input: {
  employeeId: string | null;
  proposedManagerId: string | null;
  descendantIds: string[];
}): ManagerValidationResult {
  const { employeeId, proposedManagerId, descendantIds } = input;

  if (!proposedManagerId) return { ok: true };

  if (employeeId && employeeId === proposedManagerId) {
    return { ok: false, reason: 'Um colaborador não pode ser gestor de si mesmo.' };
  }

  if (employeeId && descendantIds.includes(proposedManagerId)) {
    return { ok: false, reason: 'Não é possível: criaria uma hierarquia circular.' };
  }

  return { ok: true };
}
