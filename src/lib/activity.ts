import { createAdminSupabaseClient } from '@/lib/supabase/admin';

type ActivityAction =
  | 'user.invited' | 'user.activated' | 'user.deactivated' | 'user.updated'
  | 'employee.created' | 'employee.updated'
  | 'review_cycle.created' | 'review_cycle.published' | 'review_cycle.closed'
  | 'feedback.created'
  | 'pdi.created' | 'pdi.updated' | 'pdi_action.created' | 'pdi_action.updated'
  | 'company.updated' | 'department.created' | 'department.updated' | 'department.deleted'
  | 'role.created' | 'role.updated' | 'role.deleted'
  | 'competency.created' | 'competency.updated' | 'competency.deleted';

export async function logActivity({
  companyId,
  actorId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  companyId: string;
  actorId: string;
  action: ActivityAction;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminSupabaseClient();
  await supabase.from('activity_logs').insert({
    company_id: companyId,
    actor_id: actorId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? {},
  });
}
