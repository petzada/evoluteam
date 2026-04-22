'use server';

import { revalidatePath } from 'next/cache';
import { getActor } from '@/features/permissions/actor';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { notify } from '@/lib/notifications';
import { canManageApplications } from '../permissions';
import {
  CandidateInputSchema, type CandidateInput,
  REJECTION_REASONS, WITHDRAWAL_REASONS,
  REJECTION_REASON_LABELS, WITHDRAWAL_REASON_LABELS,
  type RejectionReason, type WithdrawalReason,
} from '../schema';
import type { PipelineSnapshotStage } from '../pipeline-snapshot';

async function isHiringManagerOfJob(jobOpeningId: string, employeeId: string | null) {
  if (!employeeId) return false;
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from('job_openings')
    .select('id')
    .eq('id', jobOpeningId)
    .eq('hiring_manager_id', employeeId)
    .maybeSingle();
  return !!data;
}

/**
 * Vincula candidato existente a uma vaga (cria job_application
 * na etapa entry).
 */
export async function linkCandidateToJob(candidateId: string, jobOpeningId: string) {
  const actor = await getActor();
  if (!actor) return { error: 'NÃ£o autenticado.' };
  if (!canManageApplications(actor)) return { error: 'Sem permissÃ£o.' };

  const admin = createAdminSupabaseClient();

  const { data: job } = await admin
    .from('job_openings')
    .select('id, title, company_id, hiring_manager_id, pipeline_snapshot')
    .eq('id', jobOpeningId)
    .maybeSingle();
  if (!job || job.company_id !== actor.companyId) return { error: 'Vaga nÃ£o encontrada.' };

  const { data: candidate } = await admin
    .from('candidates')
    .select('id, name, company_id')
    .eq('id', candidateId)
    .maybeSingle();
  if (!candidate || candidate.company_id !== actor.companyId) return { error: 'Candidato nÃ£o encontrado.' };

  // JÃ¡ existe aplicaÃ§Ã£o nesta vaga?
  const { data: existing } = await admin
    .from('job_applications')
    .select('id')
    .eq('job_opening_id', jobOpeningId)
    .eq('candidate_id', candidateId)
    .maybeSingle();
  if (existing) return { error: 'Este candidato jÃ¡ estÃ¡ vinculado a esta vaga.' };

  // Entry stage (do snapshot da vaga, nÃ£o do funil global)
  const snapshot = (job.pipeline_snapshot ?? []) as PipelineSnapshotStage[];
  const entryStage = snapshot.find((s) => s.kind === 'entry');
  if (!entryStage) return { error: 'Funil da vaga sem etapa de entrada.' };

  const { data: app, error: appErr } = await admin
    .from('job_applications')
    .insert({
      company_id: actor.companyId,
      job_opening_id: jobOpeningId,
      candidate_id: candidateId,
      current_stage_id: entryStage.id,
      status: 'in_progress',
      stage_entered_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (appErr || !app) return { error: 'Falha ao vincular candidato.' };

  await admin.from('candidate_stage_history').insert({
    application_id: app.id,
    from_stage_id: null,
    to_stage_id: entryStage.id,
    changed_by: actor.userId,
  });

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'application.created',
    entityType: 'application',
    entityId: app.id,
    metadata: {
      application_id: app.id,
      candidate_id: candidateId,
      candidate_name: candidate.name,
      job_opening_id: jobOpeningId,
      job_title: job.title,
    },
  });

  revalidatePath('/recrutamento/candidatos');
  revalidatePath(`/recrutamento/candidatos/${candidateId}`);
  revalidatePath(`/recrutamento/vagas/${jobOpeningId}`);
  return { applicationId: app.id };
}

/**
 * Cria candidato novo + vincula Ã  vaga numa Ãºnica chamada.
 */
export async function createAndLinkCandidate(input: CandidateInput, jobOpeningId: string) {
  const actor = await getActor();
  if (!actor) return { error: 'NÃ£o autenticado.' };
  if (!canManageApplications(actor)) return { error: 'Sem permissÃ£o.' };

  const parsed = CandidateInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados invÃ¡lidos.' };
  const v = parsed.data;

  const admin = createAdminSupabaseClient();

  // Valida vaga
  const { data: job } = await admin
    .from('job_openings')
    .select('id, title, company_id, pipeline_snapshot')
    .eq('id', jobOpeningId)
    .maybeSingle();
  if (!job || job.company_id !== actor.companyId) return { error: 'Vaga nÃ£o encontrada.' };

  // Verificar conflito de email
  const { data: existingCand } = await admin
    .from('candidates')
    .select('id')
    .eq('company_id', actor.companyId)
    .eq('email', v.email)
    .maybeSingle();
  if (existingCand) {
    return { error: 'JÃ¡ existe um candidato com este e-mail. Use "Vincular existente" no sheet.', existingId: existingCand.id };
  }

  // Entry stage (do snapshot da vaga, nÃ£o do funil global)
  const snapshot = (job.pipeline_snapshot ?? []) as PipelineSnapshotStage[];
  const entryStage = snapshot.find((s) => s.kind === 'entry');
  if (!entryStage) return { error: 'Funil da vaga sem etapa de entrada.' };

  // Cria candidato
  const { data: candidate, error: candErr } = await admin
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
    .select('id, name')
    .single();
  if (candErr || !candidate) return { error: 'Falha ao criar candidato.' };

  // Cria aplicaÃ§Ã£o
  const { data: app, error: appErr } = await admin
    .from('job_applications')
    .insert({
      company_id: actor.companyId,
      job_opening_id: jobOpeningId,
      candidate_id: candidate.id,
      current_stage_id: entryStage.id,
      status: 'in_progress',
      stage_entered_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (appErr || !app) {
    // rollback candidato se aplicaÃ§Ã£o falhou
    await admin.from('candidates').delete().eq('id', candidate.id);
    return { error: 'Falha ao vincular candidato Ã  vaga.' };
  }

  await admin.from('candidate_stage_history').insert({
    application_id: app.id,
    from_stage_id: null,
    to_stage_id: entryStage.id,
    changed_by: actor.userId,
  });

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'candidate.created',
    entityType: 'candidate',
    entityId: candidate.id,
    metadata: { candidate_id: candidate.id, name: candidate.name, email: v.email, source: v.source },
  });
  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'application.created',
    entityType: 'application',
    entityId: app.id,
    metadata: {
      application_id: app.id,
      candidate_id: candidate.id,
      candidate_name: candidate.name,
      job_opening_id: jobOpeningId,
      job_title: job.title,
    },
  });

  revalidatePath('/recrutamento/candidatos');
  revalidatePath(`/recrutamento/vagas/${jobOpeningId}`);
  return { candidateId: candidate.id, applicationId: app.id };
}

/**
 * Move candidato entre etapas. Respeitando RLS (admin ou hiring_manager).
 *
 * Invariante do schema (spec 13 Â§4.5): status='hired' implica stage kind='hired_terminal'
 * e sÃ³ Ã© atingido via hireCandidate (que cria o employee atomicamente). Por isso esta
 * action recusa mover para hired_terminal â€” seria bypass do wizard. O Kanban intercepta
 * o drop antes de chamar aqui e abre o HireCandidateDialog.
 */
export async function moveApplicationStage(applicationId: string, targetStageId: string) {
  const actor = await getActor();
  if (!actor) return { error: 'NÃ£o autenticado.' };

  const admin = createAdminSupabaseClient();
  const { data: app } = await admin
    .from('job_applications')
    .select(`
      id, job_opening_id, candidate_id, current_stage_id, status, company_id,
      candidate:candidates(name),
      job_opening:job_openings(title, hiring_manager_id, pipeline_snapshot)
    `)
    .eq('id', applicationId)
    .maybeSingle();
  if (!app || app.company_id !== actor.companyId) return { error: 'AplicaÃ§Ã£o nÃ£o encontrada.' };

  // Perm check
  const hasAdminRecruitment = canManageApplications(actor);
  const isManager = await isHiringManagerOfJob(app.job_opening_id, actor.employeeId);
  if (!hasAdminRecruitment && !isManager) return { error: 'Sem permissÃ£o.' };

  if (app.status !== 'in_progress') return { error: 'AplicaÃ§Ã£o nÃ£o estÃ¡ ativa.' };
  if (app.current_stage_id === targetStageId) return { ok: true };

  // Funil congelado da vaga: snapshot Ã© a Ãºnica fonte de verdade pra
  // validaÃ§Ã£o e ordenaÃ§Ã£o de etapas dessa aplicaÃ§Ã£o.
  const jobObj = app.job_opening as unknown as {
    title: string;
    hiring_manager_id: string | null;
    pipeline_snapshot: PipelineSnapshotStage[] | null;
  } | null;
  const snapshot = (jobObj?.pipeline_snapshot ?? []) as PipelineSnapshotStage[];
  const target = snapshot.find((s) => s.id === targetStageId);
  if (!target) return { error: 'Etapa nÃ£o pertence ao funil desta vaga.' };
  if (target.kind === 'hired_terminal') {
    return {
      error: 'Para contratar use o assistente (drop em "Contratado" abre o wizard).',
      code: 'USE_HIRE_ACTION',
    };
  }

  const fromStage = snapshot.find((s) => s.id === app.current_stage_id) ?? null;

  const { error: updErr } = await admin
    .from('job_applications')
    .update({
      current_stage_id: targetStageId,
      stage_entered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId);
  if (updErr) return { error: 'Falha ao mover candidato.' };

  // Se o usuÃ¡rio pulou etapas (diff de position > 1) no funil da vaga,
  // preencher o histÃ³rico com entries sintÃ©ticas pra cada etapa
  // intermediÃ¡ria, mantendo o funil de relatÃ³rios consistente. Entries
  // sintÃ©ticas ficam fora do timeline do candidato e do cÃ¡lculo de
  // tempo mediano.
  const fromPos = fromStage?.position ?? null;
  const toPos = target.position;
  if (fromPos !== null && toPos - fromPos > 1) {
    const intermediate = snapshot
      .filter((s) => s.position > fromPos && s.position < toPos)
      .sort((a, b) => a.position - b.position);

    const baseMs = Date.now();
    let prevStageId = app.current_stage_id;
    const inserts: Array<{
      application_id: string;
      from_stage_id: string | null;
      to_stage_id: string;
      changed_by: string;
      changed_at: string;
      synthetic: boolean;
    }> = [];
    intermediate.forEach((s, i) => {
      inserts.push({
        application_id: applicationId,
        from_stage_id: prevStageId,
        to_stage_id: s.id,
        changed_by: actor.userId,
        // timestamps incrementais em ms pra preservar ordem de visita
        changed_at: new Date(baseMs + i).toISOString(),
        synthetic: true,
      });
      prevStageId = s.id;
    });
    // Entrada real da etapa de destino, nÃ£o sintÃ©tica.
    inserts.push({
      application_id: applicationId,
      from_stage_id: prevStageId,
      to_stage_id: targetStageId,
      changed_by: actor.userId,
      changed_at: new Date(baseMs + intermediate.length).toISOString(),
      synthetic: false,
    });
    await admin.from('candidate_stage_history').insert(inserts);
  } else {
    // Movimento normal (1 etapa) â€” comportamento original
    await admin.from('candidate_stage_history').insert({
      application_id: applicationId,
      from_stage_id: app.current_stage_id,
      to_stage_id: targetStageId,
      changed_by: actor.userId,
    });
  }

  const candName = (app.candidate as unknown as { name: string } | null)?.name ?? 'Candidato';
  const jobTitle = jobObj?.title ?? '';
  const hiringManagerId = jobObj?.hiring_manager_id ?? null;

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'application.stage_moved',
    entityType: 'application',
    entityId: applicationId,
    metadata: {
      application_id: applicationId,
      candidate_name: candName,
      job_title: jobTitle,
      from_stage: fromStage?.name ?? null,
      to_stage: target.name,
    },
  });

  // NotificaÃ§Ã£o: se a etapa destino tem notifies_hiring_manager=true e o actor
  // nÃ£o Ã© o prÃ³prio gestor da vaga, notifica o hiring_manager (spec 14 Â§6.5, Â§9).
  if (target.notifies_hiring_manager === true && hiringManagerId && actor.employeeId !== hiringManagerId) {
    const { data: mgr } = await admin
      .from('employees')
      .select('user_id')
      .eq('id', hiringManagerId)
      .maybeSingle();
    if (mgr?.user_id) {
      await notify({
        companyId: actor.companyId,
        userId: mgr.user_id,
        type: 'recruitment.candidate_in_manager_stage',
        title: 'Candidato chegou na sua etapa',
        body: `${candName} foi movido(a) para "${target.name}" na vaga ${jobTitle}.`,
        linkUrl: `/recrutamento/vagas/${app.job_opening_id}`,
        entityType: 'application',
        entityId: applicationId,
      });
    }
  }

  revalidatePath(`/recrutamento/vagas/${app.job_opening_id}`);
  revalidatePath(`/recrutamento/candidatos/${app.candidate_id}`);
  return { ok: true };
}

async function markArchived(
  applicationId: string,
  status: 'withdrawn' | 'rejected' | 'frozen',
  extras: {
    withdrawal_reason?: WithdrawalReason;
    rejection_reason?: RejectionReason;
    reason_other?: string | null;
    frozen_reason_notes?: string | null;
  },
) {
  const actor = await getActor();
  if (!actor) return { error: 'NÃ£o autenticado.' };

  const admin = createAdminSupabaseClient();
  const { data: app } = await admin
    .from('job_applications')
    .select(`
      id, job_opening_id, candidate_id, current_stage_id, status, company_id,
      candidate:candidates(name),
      job_opening:job_openings(title, hiring_manager_id)
    `)
    .eq('id', applicationId)
    .maybeSingle();
  if (!app || app.company_id !== actor.companyId) return { error: 'AplicaÃ§Ã£o nÃ£o encontrada.' };

  const hasAdminRecruitment = canManageApplications(actor);
  const isManager = await isHiringManagerOfJob(app.job_opening_id, actor.employeeId);
  if (!hasAdminRecruitment && !isManager) return { error: 'Sem permissÃ£o.' };
  if (app.status !== 'in_progress') return { error: 'AplicaÃ§Ã£o nÃ£o estÃ¡ ativa.' };

  const now = new Date().toISOString();
  const updatePayload =
    status === 'withdrawn'
      ? {
          status,
          updated_at: now,
          withdrawal_reason: extras.withdrawal_reason ?? null,
          rejection_reason: null,
          reason_other: extras.reason_other ?? null,
          frozen_reason_notes: null,
        }
      : status === 'rejected'
        ? {
            status,
            updated_at: now,
            rejection_reason: extras.rejection_reason ?? null,
            withdrawal_reason: null,
            reason_other: extras.reason_other ?? null,
            frozen_reason_notes: null,
          }
        : {
            status,
            updated_at: now,
            rejection_reason: null,
            withdrawal_reason: null,
            reason_other: null,
            frozen_reason_notes: extras.frozen_reason_notes ?? null,
          };

  const { error: updErr } = await admin
    .from('job_applications')
    .update(updatePayload)
    .eq('id', applicationId);
  if (updErr) return { error: 'Falha ao arquivar aplicaÃ§Ã£o.' };

  await admin.from('candidate_stage_history').insert({
    application_id: applicationId,
    from_stage_id: app.current_stage_id,
    to_stage_id: null,
    status_change: { from: 'in_progress', to: status },
    reason_code:
      status === 'withdrawn' ? (extras.withdrawal_reason ?? null) :
      status === 'rejected' ? (extras.rejection_reason ?? null) :
      null,
    reason_notes: status === 'frozen'
      ? (extras.frozen_reason_notes ?? null)
      : (extras.reason_other ?? null),
    changed_by: actor.userId,
  });

  const candName = (app.candidate as unknown as { name: string } | null)?.name ?? 'Candidato';
  const jobTitle = (app.job_opening as unknown as { title: string } | null)?.title ?? '';
  const actionByStatus = {
    withdrawn: 'application.withdrawn',
    rejected: 'application.rejected',
    frozen: 'application.frozen',
  } as const;

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: actionByStatus[status],
    entityType: 'application',
    entityId: applicationId,
    metadata: {
      application_id: applicationId,
      candidate_name: candName,
      job_title: jobTitle,
      reason: extras.withdrawal_reason ?? extras.rejection_reason ?? null,
      reason_label:
        extras.withdrawal_reason ? WITHDRAWAL_REASON_LABELS[extras.withdrawal_reason] :
        extras.rejection_reason ? REJECTION_REASON_LABELS[extras.rejection_reason] :
        null,
      notes: extras.frozen_reason_notes ?? extras.reason_other ?? null,
    },
  });

  revalidatePath(`/recrutamento/vagas/${app.job_opening_id}`);
  revalidatePath(`/recrutamento/candidatos/${app.candidate_id}`);
  return { ok: true };
}

export async function markApplicationWithdrawn(
  applicationId: string,
  reason: WithdrawalReason,
  reasonOther: string | null,
) {
  if (!WITHDRAWAL_REASONS.includes(reason)) return { error: 'Motivo invÃ¡lido.' };
  if (reason === 'outro' && !reasonOther?.trim()) return { error: 'Descreva o motivo "outro".' };
  return markArchived(applicationId, 'withdrawn', {
    withdrawal_reason: reason,
    reason_other: reason === 'outro' ? reasonOther : null,
  });
}

export async function markApplicationRejected(
  applicationId: string,
  reason: RejectionReason,
  reasonOther: string | null,
) {
  if (!REJECTION_REASONS.includes(reason)) return { error: 'Motivo invÃ¡lido.' };
  if (reason === 'outro' && !reasonOther?.trim()) return { error: 'Descreva o motivo "outro".' };
  return markArchived(applicationId, 'rejected', {
    rejection_reason: reason,
    reason_other: reason === 'outro' ? reasonOther : null,
  });
}

export async function markApplicationFrozen(applicationId: string, notes: string) {
  if (!notes?.trim()) return { error: 'Informe o motivo do congelamento.' };
  return markArchived(applicationId, 'frozen', { frozen_reason_notes: notes });
}

