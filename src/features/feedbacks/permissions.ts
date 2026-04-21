import { hasAdminPower } from '@/features/permissions/permissions';
import type { RhPermissions } from '@/features/permissions/types';
import type { FeedbackType, FeedbackVisibility } from './schema';

export type Role = 'admin_rh' | 'director' | 'user' | 'rh';

export type Actor = {
  role: Role | string;
  userId: string;
  employeeId: string | null;
  employeeStatus?: 'active' | 'inactive' | 'terminated' | null;
  rhPermissions?: RhPermissions | null;
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
  // Feedback deletado: so admin_rh ou rh com can_pdi_feedback (moderacao).
  if (feedback.deletedAt) {
    return hasAdminPower(actor, 'can_pdi_feedback');
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

  // visivel_para_rh: admin_rh ja via; agora rh com can_pdi_feedback tambem.
  if (feedback.visibility === 'visivel_para_rh' && hasAdminPower(actor, 'can_pdi_feedback')) {
    return true;
  }

  return false;
}

export function canDeleteFeedback(actor: Actor): boolean {
  return hasAdminPower(actor, 'can_pdi_feedback');
}

export function enforceVisibilityForType(
  type: FeedbackType,
  visibility: FeedbackVisibility,
): FeedbackVisibility {
  if (type === 'observacao_privada') return 'privado';
  return visibility;
}
