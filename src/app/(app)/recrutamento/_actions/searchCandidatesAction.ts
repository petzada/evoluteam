'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { searchCandidatesByNameOrEmail, type CandidateRow } from '@/features/recruitment/queries/candidates';

/**
 * Wrapper server-side para busca de candidatos usada no
 * AddCandidateSheet (vincular existente).
 * Recebe `query` do cliente; o jobOpeningId de exclusão é
 * passado implícito via call site (abaixo).
 */
export async function searchCandidatesAction(query: string): Promise<CandidateRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) return [];
  return searchCandidatesByNameOrEmail(profile.company_id, query);
}
