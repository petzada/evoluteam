import { createAdminSupabaseClient } from '@/lib/supabase/admin';

type ActivityAction =
  | 'company.created' | 'company.updated'
  | 'user.invited' | 'user.activated' | 'user.deactivated' | 'user.updated' | 'user.role_changed'
  | 'invite.sent' | 'invite.accepted' | 'invite.revoked' | 'invite.resent'
  | 'employee.created' | 'employee.updated' | 'employee.terminated'
  | 'review_cycle.created' | 'review_cycle.published' | 'review_cycle.closed' | 'review_cycle.archived'
  | 'feedback.created' | 'feedback.deleted'
  | 'pdi.created' | 'pdi.updated' | 'pdi.concluded' | 'pdi.cancelled' | 'pdi.deleted'
  | 'pdi_action.created' | 'pdi_action.updated'
  | 'department.created' | 'department.updated' | 'department.archived' | 'department.deleted'
  | 'role.created' | 'role.updated' | 'role.archived' | 'role.deleted'
  | 'competency.created' | 'competency.updated' | 'competency.archived' | 'competency.deleted';

export async function logActivity({
  companyId,
  actorUserId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  companyId: string;
  actorUserId?: string | null;
  action: ActivityAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminSupabaseClient();
  await supabase.from('activity_logs').insert({
    company_id: companyId,
    actor_user_id: actorUserId ?? null,
    action,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
    metadata: (metadata ?? {}) as Record<string, unknown> as never,
  });
}

export const ACTIVITY_LABELS: Record<string, string> = {
  'company.created': 'Empresa criada',
  'company.updated': 'Empresa atualizada',
  'invite.sent': 'Convite enviado',
  'invite.accepted': 'Convite aceito',
  'invite.revoked': 'Convite revogado',
  'invite.resent': 'Convite reenviado',
  'employee.created': 'Colaborador criado',
  'employee.updated': 'Colaborador atualizado',
  'employee.terminated': 'Colaborador desligado',
  'user.deactivated': 'Usuário desativado',
  'user.role_changed': 'Papel alterado',
  'review_cycle.created': 'Ciclo de avaliação criado',
  'review_cycle.published': 'Ciclo publicado',
  'review_cycle.closed': 'Ciclo encerrado',
  'feedback.created': 'Feedback enviado',
  'feedback.deleted': 'Feedback removido',
  'pdi.created': 'PDI criado',
  'pdi.concluded': 'PDI concluído',
  'pdi.cancelled': 'PDI cancelado',
  'pdi.deleted': 'PDI removido',
};
