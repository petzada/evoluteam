import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, PipelineSnapshotStage } from '@/lib/supabase/types';

export type { PipelineSnapshotStage };

export async function buildPipelineSnapshot(
  supabase: SupabaseClient<Database>,
  companyId: string,
): Promise<PipelineSnapshotStage[]> {
  const { data } = await supabase
    .from('recruitment_stages')
    .select('id, name, position, kind, notifies_hiring_manager')
    .eq('company_id', companyId)
    .is('archived_at', null)
    .order('position', { ascending: true });
  return (data ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    position: s.position,
    kind: s.kind,
    notifies_hiring_manager: s.notifies_hiring_manager,
  }));
}
