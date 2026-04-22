'use server';

import { revalidatePath } from 'next/cache';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { getActor } from '@/features/permissions/actor';
import { canManageRecruitment, canSubmitScorecard } from '../permissions';
import {
  ScorecardInputSchema,
  type ScorecardInput,
  SCORECARD_EDIT_WINDOW_MINUTES,
} from '../schema';

export async function createScorecard(applicationId: string, input: ScorecardInput) {
  const actor = await getActor();
  if (!actor) return { error: 'Nao autenticado.' };
  if (!actor.employeeId) return { error: 'Usuario sem perfil de colaborador.' };
  if (!canSubmitScorecard(actor)) return { error: 'Sem permissao.' };

  const parsed = ScorecardInputSchema.safeParse(input);
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
  const hiringManagerId =
    (app.job_opening as unknown as { hiring_manager_id: string | null } | null)?.hiring_manager_id;
  const isManager = hiringManagerId === actor.employeeId;
  if (!isAdminRecruitment && !isManager) return { error: 'Sem permissao.' };

  // Valida UNIQUE(application_id, stage_id, author_id)
  const { data: existing } = await admin
    .from('candidate_scorecards')
    .select('id')
    .eq('application_id', applicationId)
    .eq('stage_id', app.current_stage_id)
    .eq('author_id', actor.employeeId)
    .is('deleted_at', null)
    .maybeSingle();
  if (existing) {
    return { error: 'Voce ja preencheu scorecard nesta etapa. Edite o existente.', existingId: existing.id };
  }

  const { data, error } = await admin
    .from('candidate_scorecards')
    .insert({
      company_id: actor.companyId,
      application_id: applicationId,
      stage_id: app.current_stage_id,
      author_id: actor.employeeId,
      rating_communication: parsed.data.rating_communication,
      rating_experience: parsed.data.rating_experience,
      rating_role_fit: parsed.data.rating_role_fit,
      rating_culture_fit: parsed.data.rating_culture_fit,
      salary_expectation: parsed.data.salary_expectation ?? null,
      comment: parsed.data.comment ?? null,
      recommendation: parsed.data.recommendation,
    })
    .select('id')
    .single();
  if (error || !data) return { error: 'Falha ao salvar scorecard.' };

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'candidate_scorecard.submitted',
    entityType: 'candidate_scorecard',
    entityId: data.id,
    metadata: {
      scorecard_id: data.id,
      candidate_name: (app.candidate as unknown as { name: string } | null)?.name,
      job_title: (app.job_opening as unknown as { title: string } | null)?.title,
      stage_name: (app.current_stage as unknown as { name: string } | null)?.name,
      recommendation: parsed.data.recommendation,
    },
  });

  revalidatePath(`/recrutamento/candidatos/${app.candidate_id}`);
  revalidatePath(`/recrutamento/vagas/${app.job_opening_id}`);
  return { id: data.id };
}

export async function updateScorecard(id: string, input: ScorecardInput) {
  const actor = await getActor();
  if (!actor) return { error: 'Nao autenticado.' };

  const parsed = ScorecardInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados invalidos.' };

  const admin = createAdminSupabaseClient();
  const { data: sc } = await admin
    .from('candidate_scorecards')
    .select('id, author_id, created_at, deleted_at, company_id, application_id')
    .eq('id', id)
    .maybeSingle();
  if (!sc || sc.company_id !== actor.companyId) return { error: 'Scorecard nao encontrado.' };
  if (sc.deleted_at) return { error: 'Scorecard ja removido.' };
  if (sc.author_id !== actor.employeeId) return { error: 'Apenas o autor pode editar.' };

  const createdAt = new Date(sc.created_at).getTime();
  const limit = createdAt + SCORECARD_EDIT_WINDOW_MINUTES * 60 * 1000;
  if (Date.now() > limit) {
    return { error: `Janela de edicao (${SCORECARD_EDIT_WINDOW_MINUTES} min) encerrada.` };
  }

  const { error } = await admin
    .from('candidate_scorecards')
    .update({
      rating_communication: parsed.data.rating_communication,
      rating_experience: parsed.data.rating_experience,
      rating_role_fit: parsed.data.rating_role_fit,
      rating_culture_fit: parsed.data.rating_culture_fit,
      salary_expectation: parsed.data.salary_expectation ?? null,
      comment: parsed.data.comment ?? null,
      recommendation: parsed.data.recommendation,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) return { error: 'Falha ao salvar scorecard.' };

  const { data: app } = await admin
    .from('job_applications')
    .select('candidate_id, job_opening_id')
    .eq('id', sc.application_id)
    .maybeSingle();
  if (app) {
    revalidatePath(`/recrutamento/candidatos/${app.candidate_id}`);
    revalidatePath(`/recrutamento/vagas/${app.job_opening_id}`);
  }

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'candidate_scorecard.updated',
    entityType: 'candidate_scorecard',
    entityId: id,
    metadata: { scorecard_id: id },
  });

  return { ok: true };
}

export async function deleteScorecard(id: string) {
  const actor = await getActor();
  if (!actor) return { error: 'Nao autenticado.' };

  const admin = createAdminSupabaseClient();
  const { data: sc } = await admin
    .from('candidate_scorecards')
    .select(`
      id, author_id, created_at, deleted_at, company_id, application_id,
      application:job_applications(candidate_id, job_opening_id,
        candidate:candidates(name),
        job_opening:job_openings(title))
    `)
    .eq('id', id)
    .maybeSingle();
  if (!sc || sc.company_id !== actor.companyId) return { error: 'Scorecard nao encontrado.' };
  if (sc.deleted_at) return { ok: true };

  const isAdminRecruitment = canManageRecruitment(actor);
  const isAuthor = sc.author_id === actor.employeeId;
  if (!isAdminRecruitment && !isAuthor) return { error: 'Sem permissao.' };

  if (isAuthor && !isAdminRecruitment) {
    const createdAt = new Date(sc.created_at).getTime();
    const limit = createdAt + SCORECARD_EDIT_WINDOW_MINUTES * 60 * 1000;
    if (Date.now() > limit) {
      return { error: `Janela de delecao (${SCORECARD_EDIT_WINDOW_MINUTES} min) encerrada.` };
    }
  }

  const { error } = await admin
    .from('candidate_scorecards')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: 'Falha ao remover scorecard.' };

  const appInfo = sc.application as unknown as {
    candidate_id: string;
    job_opening_id: string;
    candidate: { name: string } | null;
    job_opening: { title: string } | null;
  } | null;

  await logActivity({
    companyId: actor.companyId,
    actorUserId: actor.userId,
    action: 'candidate_scorecard.deleted',
    entityType: 'candidate_scorecard',
    entityId: id,
    metadata: {
      scorecard_id: id,
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
