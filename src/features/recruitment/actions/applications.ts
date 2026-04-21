'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { notify } from '@/lib/notifications';
import {
  CandidateInputSchema, type CandidateInput,
  REJECTION_REASONS, WITHDRAWAL_REASONS,
  REJECTION_REASON_LABELS, WITHDRAWAL_REASON_LABELS,
  type RejectionReason, type WithdrawalReason,
} from '../schema';

type Actor = {
  userId: string;
  companyId: string;
  role: 'admin_rh' | 'director' | 'user';
  employeeId: string | null;
};

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
  const { data: emp } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .eq('company_id', profile.company_id)
    .maybeSingle();
  return {
    userId: user.id,
    companyId: profile.company_id,
    role: profile.role as Actor['role'],
    employeeId: emp?.id ?? null,
  };
}

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
  if (!actor) return { error: 'Não autenticado.' };
  if (actor.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();

  const { data: job } = await admin
    .from('job_openings')
    .select('id, title, company_id, hiring_manager_id')
    .eq('id', jobOpeningId)
    .maybeSingle();
  if (!job || job.company_id !== actor.companyId) return { error: 'Vaga não encontrada.' };

  const { data: candidate } = await admin
    .from('candidates')
    .select('id, name, company_id')
    .eq('id', candidateId)
    .maybeSingle();
  if (!candidate || candidate.company_id !== actor.companyId) return { error: 'Candidato não encontrado.' };

  // Já existe aplicação nesta vaga?
  const { data: existing } = await admin
    .from('job_applications')
    .select('id')
    .eq('job_opening_id', jobOpeningId)
    .eq('candidate_id', candidateId)
    .maybeSingle();
  if (existing) return { error: 'Este candidato já está vinculado a esta vaga.' };

  // Entry stage
  const { data: entryStage } = await admin
    .from('recruitment_stages')
    .select('id')
    .eq('company_id', actor.companyId)
    .eq('kind', 'entry')
    .is('archived_at', null)
    .maybeSingle();
  if (!entryStage) return { error: 'Etapa de entrada não configurada.' };

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
 * Cria candidato novo + vincula à vaga numa única chamada.
 */
export async function createAndLinkCandidate(input: CandidateInput, jobOpeningId: string) {
  const actor = await getActor();
  if (!actor) return { error: 'Não autenticado.' };
  if (actor.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const parsed = CandidateInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  const v = parsed.data;

  const admin = createAdminSupabaseClient();

  // Valida vaga
  const { data: job } = await admin
    .from('job_openings')
    .select('id, title, company_id')
    .eq('id', jobOpeningId)
    .maybeSingle();
  if (!job || job.company_id !== actor.companyId) return { error: 'Vaga não encontrada.' };

  // Verificar conflito de email
  const { data: existingCand } = await admin
    .from('candidates')
    .select('id')
    .eq('company_id', actor.companyId)
    .eq('email', v.email)
    .maybeSingle();
  if (existingCand) {
    return { error: 'Já existe um candidato com este e-mail. Use "Vincular existente" no sheet.', existingId: existingCand.id };
  }

  // Entry stage
  const { data: entryStage } = await admin
    .from('recruitment_stages')
    .select('id')
    .eq('company_id', actor.companyId)
    .eq('kind', 'entry')
    .is('archived_at', null)
    .maybeSingle();
  if (!entryStage) return { error: 'Etapa de entrada não configurada.' };

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

  // Cria aplicação
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
    // rollback candidato se aplicação falhou
    await admin.from('candidates').delete().eq('id', candidate.id);
    return { error: 'Falha ao vincular candidato à vaga.' };
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
 * Invariante do schema (spec 13 §4.5): status='hired' implica stage kind='hired_terminal'
 * e só é atingido via hireCandidate (que cria o employee atomicamente). Por isso esta
 * action recusa mover para hired_terminal — seria bypass do wizard. O Kanban intercepta
 * o drop antes de chamar aqui e abre o HireCandidateDialog.
 */
export async function moveApplicationStage(applicationId: string, targetStageId: string) {
  const actor = await getActor();
  if (!actor) return { error: 'Não autenticado.' };

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
  if (!app || app.company_id !== actor.companyId) return { error: 'Aplicação não encontrada.' };

  // Perm check
  const isAdmin = actor.role === 'admin_rh';
  const isManager = await isHiringManagerOfJob(app.job_opening_id, actor.employeeId);
  if (!isAdmin && !isManager) return { error: 'Sem permissão.' };

  if (app.status !== 'in_progress') return { error: 'Aplicação não está ativa.' };
  if (app.current_stage_id === targetStageId) return { ok: true };

  // Valida target stage
  const { data: target } = await admin
    .from('recruitment_stages')
    .select('id, kind, name, notifies_hiring_manager, archived_at, company_id')
    .eq('id', targetStageId)
    .maybeSingle();
  if (!target || target.company_id !== actor.companyId || target.archived_at) {
    return { error: 'Etapa inválida.' };
  }
  if (target.kind === 'hired_terminal') {
    return {
      error: 'Para contratar use o assistente (drop em "Contratado" abre o wizard).',
      code: 'USE_HIRE_ACTION',
    };
  }

  // Pega nome da etapa anterior pra metadata
  const { data: fromStage } = await admin
    .from('recruitment_stages')
    .select('id, name')
    .eq('id', app.current_stage_id)
    .maybeSingle();

  const { error: updErr } = await admin
    .from('job_applications')
    .update({
      current_stage_id: targetStageId,
      stage_entered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId);
  if (updErr) return { error: 'Falha ao mover candidato.' };

  await admin.from('candidate_stage_history').insert({
    application_id: applicationId,
    from_stage_id: app.current_stage_id,
    to_stage_id: targetStageId,
    changed_by: actor.userId,
  });

  const candName = (app.candidate as unknown as { name: string } | null)?.name ?? 'Candidato';
  const jobTitle = (app.job_opening as unknown as { title: string; hiring_manager_id: string | null } | null)?.title ?? '';
  const hiringManagerId = (app.job_opening as unknown as { hiring_manager_id: string | null } | null)?.hiring_manager_id;

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

  // Notificação: se a etapa destino tem notifies_hiring_manager=true e o actor
  // não é o próprio gestor da vaga, notifica o hiring_manager (spec 14 §6.5, §9).
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
  if (!actor) return { error: 'Não autenticado.' };

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
  if (!app || app.company_id !== actor.companyId) return { error: 'Aplicação não encontrada.' };

  const isAdmin = actor.role === 'admin_rh';
  const isManager = await isHiringManagerOfJob(app.job_opening_id, actor.employeeId);
  if (!isAdmin && !isManager) return { error: 'Sem permissão.' };
  if (app.status !== 'in_progress') return { error: 'Aplicação não está ativa.' };

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
  if (updErr) return { error: 'Falha ao arquivar aplicação.' };

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
  if (!WITHDRAWAL_REASONS.includes(reason)) return { error: 'Motivo inválido.' };
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
  if (!REJECTION_REASONS.includes(reason)) return { error: 'Motivo inválido.' };
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
