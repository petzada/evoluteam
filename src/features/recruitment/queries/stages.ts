import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { RecruitmentStageKind } from '../schema';

export type StageRow = {
  id: string;
  name: string;
  position: number;
  kind: RecruitmentStageKind;
  notifies_hiring_manager: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function listActiveStages(companyId: string): Promise<StageRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('recruitment_stages')
    .select('id, name, position, kind, notifies_hiring_manager, archived_at, created_at, updated_at')
    .eq('company_id', companyId)
    .is('archived_at', null)
    .order('position', { ascending: true });
  return (data ?? []) as StageRow[];
}

export async function listAllStages(companyId: string): Promise<StageRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('recruitment_stages')
    .select('id, name, position, kind, notifies_hiring_manager, archived_at, created_at, updated_at')
    .eq('company_id', companyId)
    .order('position', { ascending: true });
  return (data ?? []) as StageRow[];
}

export async function getEntryStage(companyId: string): Promise<StageRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('recruitment_stages')
    .select('id, name, position, kind, notifies_hiring_manager, archived_at, created_at, updated_at')
    .eq('company_id', companyId)
    .eq('kind', 'entry')
    .is('archived_at', null)
    .maybeSingle();
  return (data as StageRow | null) ?? null;
}

export async function getHiredTerminalStage(companyId: string): Promise<StageRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('recruitment_stages')
    .select('id, name, position, kind, notifies_hiring_manager, archived_at, created_at, updated_at')
    .eq('company_id', companyId)
    .eq('kind', 'hired_terminal')
    .is('archived_at', null)
    .maybeSingle();
  return (data as StageRow | null) ?? null;
}
