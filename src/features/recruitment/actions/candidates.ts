'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { CandidateInputSchema, type CandidateInput } from '../schema';

type Actor = { userId: string; companyId: string; role: 'admin_rh' | 'director' | 'user' };

async function getActor(): Promise<Actor | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) return null;
  return { userId: user.id, companyId: profile.company_id, role: profile.role as Actor['role'] };
}

export async function createCandidate(input: CandidateInput) {
  const actor = await getActor();
  if (!actor) return { error: 'Não autenticado.' };
  if (actor.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const parsed = CandidateInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  const v = parsed.data;

  const admin = createAdminSupabaseClient();

  // Verificar conflito de email (UNIQUE por company)
  const { data: existing } = await admin
    .from('candidates')
    .select('id')
    .eq('company_id', actor.companyId)
    .eq('email', v.email)
    .maybeSingle();
  if (existing) {
    return { error: 'Já existe um candidato com este e-mail.', existingId: existing.id };
  }

  const { data, error } = await admin
    .from('candidates')
    .insert({
      company_id: actor.companyId,
      name: v.name,
      email: v.email,
      phone: v.phone ?? null,
      linkedin_url: v.linkedinUrl ?? null,
      resume_url: v.resumeUrl ?? null,
      source: v.source,
      source_other: v.source === 'outro' ? (v.sourceOther ?? null) : null,
      notes: v.notes ?? null,
      created_by: actor.userId,
    })
    .select('id, name, email, source')
    .single();

  if (error || !data) return { error: 'Falha ao cadastrar candidato.' };

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'candidate.created',
    entityType: 'candidate',
    entityId: data.id,
    metadata: { candidate_id: data.id, name: data.name, email: data.email, source: data.source },
  });

  revalidatePath('/recrutamento/candidatos');
  return { id: data.id };
}

export async function updateCandidate(id: string, input: CandidateInput) {
  const actor = await getActor();
  if (!actor) return { error: 'Não autenticado.' };
  if (actor.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const parsed = CandidateInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  const v = parsed.data;

  const admin = createAdminSupabaseClient();
  const { data: before } = await admin
    .from('candidates')
    .select('id, email, company_id')
    .eq('id', id)
    .maybeSingle();
  if (!before || before.company_id !== actor.companyId) return { error: 'Candidato não encontrado.' };

  // Verificar conflito se email mudou
  if (before.email !== v.email) {
    const { data: conflict } = await admin
      .from('candidates')
      .select('id')
      .eq('company_id', actor.companyId)
      .eq('email', v.email)
      .neq('id', id)
      .maybeSingle();
    if (conflict) return { error: 'Já existe um candidato com este e-mail.', existingId: conflict.id };
  }

  const { error } = await admin
    .from('candidates')
    .update({
      name: v.name,
      email: v.email,
      phone: v.phone ?? null,
      linkedin_url: v.linkedinUrl ?? null,
      resume_url: v.resumeUrl ?? null,
      source: v.source,
      source_other: v.source === 'outro' ? (v.sourceOther ?? null) : null,
      notes: v.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { error: 'Falha ao salvar candidato.' };

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'candidate.updated',
    entityType: 'candidate',
    entityId: id,
    metadata: { candidate_id: id, name: v.name },
  });

  revalidatePath('/recrutamento/candidatos');
  revalidatePath(`/recrutamento/candidatos/${id}`);
  return { ok: true };
}

export async function archiveCandidate(id: string) {
  const actor = await getActor();
  if (!actor) return { error: 'Não autenticado.' };
  if (actor.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const { data: before } = await admin
    .from('candidates')
    .select('id, name, company_id, archived_at')
    .eq('id', id)
    .maybeSingle();
  if (!before || before.company_id !== actor.companyId) return { error: 'Candidato não encontrado.' };
  if (before.archived_at) return { ok: true };

  const { error } = await admin
    .from('candidates')
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { error: 'Falha ao arquivar candidato.' };

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'candidate.archived',
    entityType: 'candidate',
    entityId: id,
    metadata: { candidate_id: id, name: before.name },
  });

  revalidatePath('/recrutamento/candidatos');
  return { ok: true };
}
