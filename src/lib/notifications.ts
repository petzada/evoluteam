import { createAdminSupabaseClient } from '@/lib/supabase/admin';

type NotificationType = 'invite' | 'review_assigned' | 'review_published' | 'feedback_received' | 'pdi_due_soon' | 'pdi_action_due';

export async function notify({
  userId,
  type,
  title,
  body,
  link,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
}) {
  const supabase = createAdminSupabaseClient();
  await supabase.from('notifications').insert({ user_id: userId, type, title, body, link });
}
