import { canDo } from '@/features/permissions/permissions';
import type { ScreenPermissions } from '@/features/permissions/types';
import type { FeedbackType, FeedbackVisibility } from './schema';

export type Role = 'admin_rh' | 'director' | 'user';

export type Actor = {
  role: Role | string;
  userId: string;
  employeeId: string | null;
  employeeStatus?: 'active' | 'inactive' | 'terminated' | null;
  screenPermissions?: ScreenPermissions | null;
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
  // Feedback deletado: so quem pode moderar (feedbacks.edit).
  if (feedback.deletedAt) {
    return canDo(actor, 'feedbacks', 'edit');
  }
  if (actor.employeeId && actor.employeeId === feedback.senderId) return true;
  if (actor.employeeId && actor.employeeId === feedback.recipientId) return true;

  // Canais gestor/rh continuam restritos a quem e ancestor real do destinatario.
  if (
    (feedback.visibility === 'visivel_para_gestor' || feedback.visibility === 'visivel_para_rh')
    && actor.employeeId
    && ancestorsOfRecipient.includes(actor.employeeId)
  ) {
    return true;
  }

  // visivel_para_rh: quem tem feedbacks.view (admin, director, user/rh com toggle).
  if (feedback.visibility === 'visivel_para_rh' && canDo(actor, 'feedbacks', 'view')) {
    return true;
  }

  return false;
}

export function canDeleteFeedback(actor: Actor): boolean {
  return canDo(actor, 'feedbacks', 'edit');
}

export function enforceVisibilityForType(
  type: FeedbackType,
  visibility: FeedbackVisibility,
): FeedbackVisibility {
  if (type === 'observacao_privada') return 'privado';
  return visibility;
}
