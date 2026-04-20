import { createAdminSupabaseClient } from '@/lib/supabase/admin';

type NotificationType =
  | 'invite_accepted'
  | 'review.assignment_new' | 'review.result_released'
  | 'review_assigned' | 'review_published' | 'review_reminder' | 'review_result_released'
  | 'feedback_received'
  | 'pdi_created' | 'pdi_due_soon' | 'pdi_concluded' | 'pdi_action_due';

export async function notify({
  companyId,
  userId,
  type,
  title,
  body,
  linkUrl,
  entityType,
  entityId,
}: {
  companyId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  linkUrl?: string;
  entityType?: string;
  entityId?: string;
}) {
  const supabase = createAdminSupabaseClient();
  await supabase.from('notifications').insert({
    company_id: companyId,
    user_id: userId,
    type,
    title,
    body: body ?? null,
    link_url: linkUrl ?? null,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
  });
}
