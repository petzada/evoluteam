'use server';

import { revalidatePath } from 'next/cache';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { getActor } from '@/features/permissions/actor';
import { canManageRecruitment, canGiveFeedback as canGiveRecruitmentFeedback } from '../permissions';
import {
  CandidateFeedbackInputSchema,
  type CandidateFeedbackInput,
  FEEDBACK_EDIT_WINDOW_MINUTES,
} from '../schema';

export async function createFeedback(applicationId: string, input: CandidateFeedbackInput) {
  const actor = await getActor();
  if (!actor) return { error: 'Nao autenticado.' };
  if (!actor.employeeId) return { error: 'Usuario sem perfil de colaborador.' };
  if (!canGiveRecruitmentFeedback(actor)) return { error: 'Sem permissao.' };

  const parsed = CandidateFeedbackInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados invalidos.' };

  const admin = createAdminSupabaseClient();
  const { data: app } = await admin
    .from('job_applications')
    .select(`
      id, company_id, current_stage_id, candidate_id, job_opening_id,
      candidate:candidates(name),
      job_opening:job_openings(title, hiring_manager_id),
      current_stage:recruitment_stages!current_stage_id(name)
    `)
    .eq('id', applicationId)
    .maybeSingle();
  if (!app || app.company_id !== actor.companyId) return { error: 'Aplicacao nao encontrada.' };

  const isAdminRecruitment = canManageRecruitment(actor);
  const isDirector = actor.role === 'director';
  const isManager =
    (app.job_opening as unknown as { hiring_manager_id: string | null } | null)?.hiring_manager_id
    === actor.employeeId;
  if (!isAdminRecruitment && !isDirector && !isManager) return { error: 'Sem permissao.' };

  const { data, error } = await admin
    .from('candidate_feedbacks')
    .insert({
      company_id: actor.companyId,
      application_id: applicationId,
      stage_id: app.current_stage_id,
      author_id: actor.employeeId,
      content: parsed.data.content,
      recommendation: parsed.data.recommendation ?? null,
    })
    .select('id')
    .single();
  if (error || !data) return { error: 'Falha ao salvar feedback.' };

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'candidate_feedback.created',
    entityType: 'candidate_feedback',
    entityId: data.id,
    metadata: {
      feedback_id: data.id,
      candidate_name: (app.candidate as unknown as { name: string } | null)?.name,
      job_title: (app.job_opening as unknown as { title: string } | null)?.title,
      stage_name: (app.current_stage as unknown as { name: string } | null)?.name,
      recommendation: parsed.data.recommendation ?? null,
    },
  });

  revalidatePath(`/recrutamento/candidatos/${app.candidate_id}`);
  revalidatePath(`/recrutamento/vagas/${app.job_opening_id}`);
  return { id: data.id };
}

export async function updateFeedback(id: string, input: CandidateFeedbackInput) {
  const actor = await getActor();
  if (!actor) return { error: 'Nao autenticado.' };
  if (!canGiveRecruitmentFeedback(actor)) return { error: 'Sem permissao.' };

  const parsed = CandidateFeedbackInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados invalidos.' };

  const admin = createAdminSupabaseClient();
  const { data: fb } = await admin
    .from('candidate_feedbacks')
    .select('id, author_id, created_at, deleted_at, company_id, application_id')
    .eq('id', id)
    .maybeSingle();
  if (!fb || fb.company_id !== actor.companyId) return { error: 'Feedback nao encontrado.' };
  if (fb.deleted_at) return { error: 'Feedback ja removido.' };
  if (fb.author_id !== actor.employeeId) return { error: 'Apenas o autor pode editar.' };

  const createdAt = new Date(fb.created_at).getTime();
  const limit = createdAt + FEEDBACK_EDIT_WINDOW_MINUTES * 60 * 1000;
  if (Date.now() > limit) {
    return { error: `Janela de edicao (${FEEDBACK_EDIT_WINDOW_MINUTES} min) encerrada.` };
  }

  const { error } = await admin
    .from('candidate_feedbacks')
    .update({
      content: parsed.data.content,
      recommendation: parsed.data.recommendation ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { error: 'Falha ao salvar feedback.' };

  const { data: app } = await admin
    .from('job_applications')
    .select('candidate_id, job_opening_id')
    .eq('id', fb.application_id)
    .maybeSingle();
  if (app) {
    revalidatePath(`/recrutamento/candidatos/${app.candidate_id}`);
    revalidatePath(`/recrutamento/vagas/${app.job_opening_id}`);
  }
  return { ok: true };
}

export async function deleteFeedback(id: string) {
  const actor = await getActor();
  if (!actor) return { error: 'Nao autenticado.' };

  const admin = createAdminSupabaseClient();
  const { data: fb } = await admin
    .from('candidate_feedbacks')
    .select(`
      id, author_id, created_at, deleted_at, company_id, application_id,
      application:job_applications(candidate_id, job_opening_id,
        candidate:candidates(name),
        job_opening:job_openings(title))
    `)
    .eq('id', id)
    .maybeSingle();
  if (!fb || fb.company_id !== actor.companyId) return { error: 'Feedback nao encontrado.' };
  if (fb.deleted_at) return { ok: true };

  const isAdminRecruitment = canManageRecruitment(actor);
  const isAuthor = fb.author_id === actor.employeeId;
  if (!isAdminRecruitment && !isAuthor) return { error: 'Sem permissao.' };

  if (isAuthor && !isAdminRecruitment) {
    const createdAt = new Date(fb.created_at).getTime();
    const limit = createdAt + FEEDBACK_EDIT_WINDOW_MINUTES * 60 * 1000;
    if (Date.now() > limit) {
      return { error: `Janela de delecao (${FEEDBACK_EDIT_WINDOW_MINUTES} min) encerrada.` };
    }
  }

  const { error } = await admin
    .from('candidate_feedbacks')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: 'Falha ao remover feedback.' };

  const appInfo = fb.application as unknown as {
    candidate_id: string;
    job_opening_id: string;
    candidate: { name: string } | null;
    job_opening: { title: string } | null;
  } | null;

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'candidate_feedback.deleted',
    entityType: 'candidate_feedback',
    entityId: id,
    metadata: {
      feedback_id: id,
      candidate_name: appInfo?.candidate?.name,
      job_title: appInfo?.job_opening?.title,
      deleted_by_admin: isAdminRecruitment && !isAuthor,
    },
  });

  if (appInfo) {
    revalidatePath(`/recrutamento/candidatos/${appInfo.candidate_id}`);
    revalidatePath(`/recrutamento/vagas/${appInfo.job_opening_id}`);
  }
  return { ok: true };
}
