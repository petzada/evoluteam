'use server';

import { revalidatePath } from 'next/cache';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { getActor } from '@/features/permissions/actor';
import { canManageJobOpenings } from '../permissions';
import {
  JobOpeningInputSchema,
  type JobOpeningInput,
  type JobOpeningStatus,
  JOB_OPENING_STATUS_LABELS,
} from '../schema';
import { buildPipelineSnapshot } from '../pipeline-snapshot';

export async function createJobOpening(input: JobOpeningInput) {
  const actor = await getActor();
  if (!actor) return { error: 'Nao autenticado.' };
  if (!canManageJobOpenings(actor)) return { error: 'Sem permissao.' };

  const parsed = JobOpeningInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados invalidos.' };
  const v = parsed.data;

  const admin = createAdminSupabaseClient();
  const pipelineSnapshot = await buildPipelineSnapshot(admin, actor.companyId);
  if (pipelineSnapshot.length === 0) {
    return { error: 'Configure ao menos uma etapa de recrutamento antes de criar vagas.' };
  }

  const { data, error } = await admin
    .from('job_openings')
    .insert({
      company_id: actor.companyId,
      title: v.title,
      description: v.description ?? null,
      department_id: v.departmentId ?? null,
      position_id: v.positionId ?? null,
      hiring_manager_id: v.hiringManagerId ?? null,
      employment_type: v.employmentType,
      workplace_type: v.workplaceType,
      location: v.location ?? null,
      open_positions: v.openPositions,
      status: 'open',
      created_by: actor.userId,
      pipeline_snapshot: pipelineSnapshot,
    })
    .select('id, title, status')
    .single();

  if (error || !data) return { error: 'Falha ao criar vaga.' };

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'job_opening.created',
    entityType: 'job_opening',
    entityId: data.id,
    metadata: { job_opening_id: data.id, title: data.title, status: data.status },
  });

  revalidatePath('/recrutamento/vagas');
  return { id: data.id };
}

export async function updateJobOpening(id: string, input: JobOpeningInput) {
  const actor = await getActor();
  if (!actor) return { error: 'Nao autenticado.' };
  if (!canManageJobOpenings(actor)) return { error: 'Sem permissao.' };

  const parsed = JobOpeningInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados invalidos.' };
  const v = parsed.data;

  const admin = createAdminSupabaseClient();
  const { data: before } = await admin
    .from('job_openings')
    .select('id, title, company_id')
    .eq('id', id)
    .maybeSingle();
  if (!before || before.company_id !== actor.companyId) return { error: 'Vaga nao encontrada.' };

  const { error } = await admin
    .from('job_openings')
    .update({
      title: v.title,
      description: v.description ?? null,
      department_id: v.departmentId ?? null,
      position_id: v.positionId ?? null,
      hiring_manager_id: v.hiringManagerId ?? null,
      employment_type: v.employmentType,
      workplace_type: v.workplaceType,
      location: v.location ?? null,
      open_positions: v.openPositions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { error: 'Falha ao salvar vaga.' };

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'job_opening.updated',
    entityType: 'job_opening',
    entityId: id,
    metadata: { job_opening_id: id, title: v.title },
  });

  revalidatePath('/recrutamento/vagas');
  revalidatePath(`/recrutamento/vagas/${id}`);
  return { ok: true };
}

export async function changeJobStatus(id: string, newStatus: JobOpeningStatus) {
  const actor = await getActor();
  if (!actor) return { error: 'Nao autenticado.' };
  if (!canManageJobOpenings(actor)) return { error: 'Sem permissao.' };

  const admin = createAdminSupabaseClient();
  const { data: before } = await admin
    .from('job_openings')
    .select('id, title, status, company_id')
    .eq('id', id)
    .maybeSingle();
  if (!before || before.company_id !== actor.companyId) return { error: 'Vaga nao encontrada.' };
  if (before.status === newStatus) return { ok: true };

  const now = new Date().toISOString();
  const closedAt = (newStatus === 'closed' || newStatus === 'cancelled') ? now : null;
  const { error } = await admin
    .from('job_openings')
    .update({ status: newStatus, updated_at: now, closed_at: closedAt })
    .eq('id', id);
  if (error) return { error: 'Falha ao alterar status.' };

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'job_opening.status_changed',
    entityType: 'job_opening',
    entityId: id,
    metadata: {
      job_opening_id: id,
      title: before.title,
      from_status: before.status,
      to_status: newStatus,
      from_status_label: JOB_OPENING_STATUS_LABELS[before.status as JobOpeningStatus],
      to_status_label: JOB_OPENING_STATUS_LABELS[newStatus],
    },
  });

  revalidatePath('/recrutamento/vagas');
  revalidatePath(`/recrutamento/vagas/${id}`);
  return { ok: true };
}

export async function archiveJobOpening(id: string) {
  // Semanticamente = cancelar (nao ha delete; segue status terminal).
  return changeJobStatus(id, 'cancelled');
}
