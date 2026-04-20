import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function listActivityLogs(
  companyId: string,
  options?: { page?: number; action?: string; dateFrom?: string; dateTo?: string },
) {
  const supabase = await createServerSupabaseClient();
  const pageSize = 30;
  const page = options?.page ?? 0;

  let query = supabase
    .from('activity_logs')
    .select('id, action, entity_type, entity_id, metadata, created_at, actor_user_id')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (options?.action) query = query.eq('action', options.action);
  if (options?.dateFrom) query = query.gte('created_at', options.dateFrom);
  if (options?.dateTo) query = query.lte('created_at', options.dateTo);

  const { data, error } = await query;
  if (error) throw error;

  if (!data?.length) return [];

  // Fetch actor names via profiles
  const actorIds = [...new Set(data.map((r) => r.actor_user_id).filter(Boolean))] as string[];
  const { data: profiles } = actorIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', actorIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));

  return data.map((row) => ({
    ...row,
    actorName: row.actor_user_id ? (profileMap[row.actor_user_id] ?? 'Sistema') : 'Sistema',
  }));
}
