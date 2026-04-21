'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { RecruitmentStageInputSchema, type RecruitmentStageInput } from '../schema';

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

export async function createRecruitmentStage(input: RecruitmentStageInput) {
  const actor = await getActor();
  if (!actor) return { error: 'Não autenticado.' };
  if (actor.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const parsed = RecruitmentStageInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const admin = createAdminSupabaseClient();

  // Nova etapa é sempre intermediate e vai no final (antes do hired_terminal).
  // Position = max(intermediate) + 1.
  const { data: allStages } = await admin
    .from('recruitment_stages')
    .select('position, kind, archived_at')
    .eq('company_id', actor.companyId)
    .order('position', { ascending: true });
  const active = (allStages ?? []).filter((s) => !s.archived_at);
  const hiredTerminal = active.find((s) => s.kind === 'hired_terminal');
  const nextPos = hiredTerminal ? hiredTerminal.position : (active.at(-1)?.position ?? 0) + 1;

  // Precisamos empurrar hired_terminal +1 se existir pra inserir antes dele
  if (hiredTerminal) {
    await admin
      .from('recruitment_stages')
      .update({ position: hiredTerminal.position + 1 })
      .eq('company_id', actor.companyId)
      .eq('kind', 'hired_terminal')
      .is('archived_at', null);
  }

  const { data, error } = await admin
    .from('recruitment_stages')
    .insert({
      company_id: actor.companyId,
      name: parsed.data.name.trim(),
      position: nextPos,
      kind: 'intermediate',
    })
    .select('id, name, position')
    .single();
  if (error || !data) return { error: 'Falha ao criar etapa.' };

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'recruitment_stage.created',
    entityType: 'recruitment_stage',
    entityId: data.id,
    metadata: { stage_id: data.id, name: data.name, position: data.position },
  });

  revalidatePath('/recrutamento/etapas');
  return { id: data.id };
}

export async function updateRecruitmentStage(id: string, input: RecruitmentStageInput) {
  const actor = await getActor();
  if (!actor) return { error: 'Não autenticado.' };
  if (actor.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const parsed = RecruitmentStageInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const admin = createAdminSupabaseClient();
  const { data: before } = await admin
    .from('recruitment_stages')
    .select('id, name, company_id')
    .eq('id', id)
    .maybeSingle();
  if (!before || before.company_id !== actor.companyId) return { error: 'Etapa não encontrada.' };

  const { error } = await admin
    .from('recruitment_stages')
    .update({ name: parsed.data.name.trim(), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: 'Falha ao salvar etapa.' };

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'recruitment_stage.updated',
    entityType: 'recruitment_stage',
    entityId: id,
    metadata: { stage_id: id, name: parsed.data.name.trim() },
  });

  revalidatePath('/recrutamento/etapas');
  return { ok: true };
}

export async function archiveRecruitmentStage(id: string) {
  const actor = await getActor();
  if (!actor) return { error: 'Não autenticado.' };
  if (actor.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const { data: stage } = await admin
    .from('recruitment_stages')
    .select('id, name, kind, archived_at, company_id')
    .eq('id', id)
    .maybeSingle();
  if (!stage || stage.company_id !== actor.companyId) return { error: 'Etapa não encontrada.' };
  if (stage.kind === 'entry' || stage.kind === 'hired_terminal') {
    return { error: 'Essa etapa é obrigatória e não pode ser arquivada.' };
  }
  if (stage.archived_at) return { ok: true };

  const { error } = await admin
    .from('recruitment_stages')
    .update({ archived_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: 'Falha ao arquivar etapa.' };

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'recruitment_stage.archived',
    entityType: 'recruitment_stage',
    entityId: id,
    metadata: { stage_id: id, name: stage.name },
  });

  revalidatePath('/recrutamento/etapas');
  return { ok: true };
}

/**
 * Reativa uma etapa arquivada (spec 14 §5.11).
 * Insere a etapa reativada no final da lista ativa (antes de
 * hired_terminal, se existir), seguindo a mesma lógica de posicionamento
 * de createRecruitmentStage.
 */
export async function reactivateRecruitmentStage(id: string) {
  const actor = await getActor();
  if (!actor) return { error: 'Não autenticado.' };
  if (actor.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const { data: stage } = await admin
    .from('recruitment_stages')
    .select('id, name, kind, archived_at, company_id')
    .eq('id', id)
    .maybeSingle();
  if (!stage || stage.company_id !== actor.companyId) return { error: 'Etapa não encontrada.' };
  if (!stage.archived_at) return { ok: true };

  // Só intermediárias podem estar arquivadas (entry/hired_terminal não
  // são arquiváveis pelo archiveRecruitmentStage), mas validamos aqui
  // por defesa caso o banco tenha dado arquivada "manual".
  if (stage.kind !== 'intermediate') {
    return { error: 'Apenas etapas intermediárias podem ser reativadas.' };
  }

  // Calcula nova posição: penúltima entre as ativas se existe
  // hired_terminal, senão última.
  const { data: allStages } = await admin
    .from('recruitment_stages')
    .select('id, position, kind, archived_at')
    .eq('company_id', actor.companyId)
    .order('position', { ascending: true });
  const active = (allStages ?? []).filter((s) => !s.archived_at);
  const hiredTerminal = active.find((s) => s.kind === 'hired_terminal');
  const newPos = hiredTerminal ? hiredTerminal.position : (active.at(-1)?.position ?? 0) + 1;

  // Empurra hired_terminal +1 se existe, pra abrir vaga imediatamente antes
  if (hiredTerminal) {
    await admin
      .from('recruitment_stages')
      .update({ position: hiredTerminal.position + 1 })
      .eq('id', hiredTerminal.id);
  }

  const { error } = await admin
    .from('recruitment_stages')
    .update({
      archived_at: null,
      position: newPos,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { error: 'Falha ao reativar etapa.' };

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'recruitment_stage.updated',
    entityType: 'recruitment_stage',
    entityId: id,
    metadata: { stage_id: id, name: stage.name, reactivated: true },
  });

  revalidatePath('/recrutamento/etapas');
  return { ok: true };
}

export async function reorderRecruitmentStages(orderedIds: string[]) {
  const actor = await getActor();
  if (!actor) return { error: 'Não autenticado.' };
  if (actor.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const { data: all } = await admin
    .from('recruitment_stages')
    .select('id, kind, archived_at')
    .eq('company_id', actor.companyId)
    .is('archived_at', null);

  const active = all ?? [];
  if (active.length !== orderedIds.length) return { error: 'Lista de etapas inválida.' };

  // Validações: entry deve ser primeiro; hired_terminal deve ser último.
  const entry = active.find((s) => s.kind === 'entry');
  const hired = active.find((s) => s.kind === 'hired_terminal');
  if (entry && orderedIds[0] !== entry.id) return { error: 'A etapa inicial deve ser a primeira.' };
  if (hired && orderedIds[orderedIds.length - 1] !== hired.id) {
    return { error: 'A etapa de contratação deve ser a última.' };
  }

  // Aplica novas posições (1..N) — em 2 passos pra evitar conflito de UNIQUE:
  // passo 1 zera posições temporariamente em negativos
  for (let i = 0; i < orderedIds.length; i += 1) {
    await admin
      .from('recruitment_stages')
      .update({ position: -(i + 1) })
      .eq('id', orderedIds[i]);
  }
  for (let i = 0; i < orderedIds.length; i += 1) {
    await admin
      .from('recruitment_stages')
      .update({ position: i + 1, updated_at: new Date().toISOString() })
      .eq('id', orderedIds[i]);
  }

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'recruitment_stage.reordered',
    entityType: 'recruitment_stage',
    metadata: { ordered_ids: orderedIds },
  });

  revalidatePath('/recrutamento/etapas');
  return { ok: true };
}
