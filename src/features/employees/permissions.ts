type Actor = { id: string; role: string; userId: string };
type Target = { userId?: string | null };

export function canManageEmployee(actor: Actor): boolean {
  return actor.role === 'admin_rh';
}

export function canDeactivateSelf(actor: Actor, target: Target): boolean {
  return actor.userId !== target.userId;
}

export function canChangeSelfRole(actor: Actor, target: Target): boolean {
  return actor.userId !== target.userId;
}
