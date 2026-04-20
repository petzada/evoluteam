import type { FeedbackType, FeedbackVisibility } from './schema';

export type Role = 'admin_rh' | 'director' | 'user';

export type Actor = {
  role: Role | string;
  userId: string;
  employeeId: string | null;
  employeeStatus?: 'active' | 'inactive' | 'terminated' | null;
};

export type FeedbackView = {
  senderId: string;
  recipientId: string;
  visibility: FeedbackVisibility;
  deletedAt: string | null;
  type?: FeedbackType;
};

export function canSendFeedback(actor: Actor): boolean {
  if (!actor.employeeId) return false;
  return actor.employeeStatus !== 'terminated';
}

export function canReceiveFeedback(recipient: { status: string }): boolean {
  return recipient.status === 'active' || recipient.status === 'inactive';
}

export function canViewFeedback(
  actor: Actor,
  feedback: FeedbackView,
  ancestorsOfRecipient: string[],
): boolean {
  if (feedback.deletedAt) return actor.role === 'admin_rh';
  if (actor.employeeId && actor.employeeId === feedback.senderId) return true;
  if (actor.employeeId && actor.employeeId === feedback.recipientId) return true;

  if (
    (feedback.visibility === 'visivel_para_gestor' || feedback.visibility === 'visivel_para_rh')
    && actor.employeeId
    && ancestorsOfRecipient.includes(actor.employeeId)
  ) {
    return true;
  }

  if (feedback.visibility === 'visivel_para_rh' && actor.role === 'admin_rh') {
    return true;
  }

  return false;
}

export function canDeleteFeedback(actor: Actor): boolean {
  return actor.role === 'admin_rh';
}

export function enforceVisibilityForType(
  type: FeedbackType,
  visibility: FeedbackVisibility,
): FeedbackVisibility {
  if (type === 'observacao_privada') return 'privado';
  return visibility;
}
