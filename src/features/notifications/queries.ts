import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function getUnreadCount(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null);
  return count ?? 0;
}

export async function listRecentNotifications(userId: string, limit = 20) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, body, link_url, read_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}
