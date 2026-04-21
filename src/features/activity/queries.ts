import { createServerSupabaseClient } from '@/lib/supabase/server';

export const ACTIVITY_PAGE_SIZE = 20;

export type ActivityLogEntry = {
  id: number;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: unknown;
  created_at: string;
  actor_user_id: string | null;
  actorName: string;
};

export async function listActivityLogs(
  companyId: string,
  options?: { page?: number; pageSize?: number; action?: string; dateFrom?: string; dateTo?: string },
): Promise<{ rows: ActivityLogEntry[]; total: number; pageSize: number; page: number }> {
  const supabase = await createServerSupabaseClient();
  const pageSize = options?.pageSize ?? ACTIVITY_PAGE_SIZE;
  const page = Math.max(0, options?.page ?? 0);

  let query = supabase
    .from('activity_logs')
    .select('id, action, entity_type, entity_id, metadata, created_at, actor_user_id', { count: 'exact' })
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(page * pageSize, page * pageSize + pageSize - 1);

  if (options?.action) query = query.eq('action', options.action);
  if (options?.dateFrom) query = query.gte('created_at', options.dateFrom);
  if (options?.dateTo) query = query.lte('created_at', options.dateTo);

  const { data, count, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  if (rows.length === 0) {
    return { rows: [], total: count ?? 0, pageSize, page };
  }

  const actorIds = [...new Set(rows.map((r) => r.actor_user_id).filter(Boolean))] as string[];
  const { data: profiles } = actorIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', actorIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));

  const mapped: ActivityLogEntry[] = rows.map((row) => ({
    ...row,
    actorName: row.actor_user_id ? (profileMap[row.actor_user_id] ?? 'Sistema') : 'Sistema',
  }));

  return { rows: mapped, total: count ?? mapped.length, pageSize, page };
}
