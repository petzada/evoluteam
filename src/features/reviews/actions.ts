'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { notify } from '@/lib/notifications';
import { Resend } from 'resend';
import { getActor } from '@/features/permissions/actor';
import { canDo } from '@/features/permissions/permissions';
import type { Actor } from '@/features/permissions/types';
import {
  CycleBasicsSchema, CycleTypesSchema, ParticipantsSelectionSchema, FormInputSchema,
  type CycleBasicsInput, type CycleTypesInput, type ParticipantsSelection, type QuestionInput,
} from './schema';
import type { TablesInsert, TablesUpdate } from '@/lib/supabase/types';

const resend = new Resend(process.env.RESEND_API_KEY);

type Ctx = Actor;

async function getAdminContext(): Promise<Ctx | null> {
  return getActor();
}

function requireAdmin(ctx: Ctx | null): ctx is Ctx {
  return canDo(ctx, 'avaliacoes', 'edit');
}

async function ensureNotExpired(cycleId: string, companyId: string) {
  const admin = createAdminSupabaseClient();
  const { data: cycle } = await admin
    .from('review_cycles')
    .select('status, response_end')
    .eq('id', cycleId)
    .eq('company_id', companyId)
    .maybeSingle();
  if (!cycle) return;
  if (cycle.status !== 'published') return;
  if (new Date(cycle.response_end) >= new Date()) return;
  const now = new Date().toISOString();
  await admin
    .from('review_cycles')
    .update({ status: 'closed', closed_at: now, updated_at: now })
    .eq('id', cycleId);
  await logActivity({
    companyId,
    actorUserId: null,
    action: 'review_cycle.closed',
    entityType: 'review_cycle',
    entityId: cycleId,
    metadata: { auto: true },
  });
}

// ---------------- CICLO: create/update/publish/close/archive ----------------

export async function createCycleDraft(input: {
  basics: CycleBasicsInput;
  types: CycleTypesInput;
  participants: ParticipantsSelection;
  questions: QuestionInput[];
}) {
  const ctx = await getAdminContext();
  if (!requireAdmin(ctx)) return { error: 'Sem permissão.' };

  const parsedBasics = CycleBasicsSchema.safeParse(input.basics);
  if (!parsedBasics.success) return { error: 'Dados básicos inválidos.' };
  const parsedTypes = CycleTypesSchema.safeParse(input.types);
  if (!parsedTypes.success) return { error: 'Selecione ao menos um tipo de avaliação.' };
  const parsedParticipants = ParticipantsSelectionSchema.safeParse(input.participants);
  if (!parsedParticipants.success) return { error: 'Participantes inválidos.' };

  const admin = createAdminSupabaseClient();

  const { data: cycle, error: cycleErr } = await admin
    .from('review_cycles')
    .insert({
      company_id: ctx.companyId,
      name: input.basics.name,
      description: input.basics.description ?? null,
      period_start: input.basics.periodStart,
      period_end: input.basics.periodEnd,
      response_start: input.basics.responseStart,
      response_end: input.basics.responseEnd,
      include_self: input.types.includeSelf,
      include_manager: input.types.includeManager,
      status: 'draft',
      created_by: ctx.userId,
    })
    .select('id')
    .single();
  if (cycleErr || !cycle) return { error: 'Erro ao criar ciclo.' };

  await upsertFormAndQuestions(cycle.id, ctx.companyId, input.questions);

  const employeeIds = await resolveParticipantIds(ctx.companyId, input.participants);
  if (employeeIds.length > 0) {
    await admin.from('review_cycle_participants').insert(
      employeeIds.map((employee_id) => ({
        company_id: ctx.companyId,
        cycle_id: cycle.id,
        employee_id,
        added_by: ctx.userId,
      })),
    );
  }

  await logActivity({
    companyId: ctx.companyId,
    actorUserId: ctx.userId,
    action: 'review_cycle.created',
    entityType: 'review_cycle',
    entityId: cycle.id,
    metadata: { participants: employeeIds.length },
  });

  revalidatePath('/avaliacoes');
  return { ok: true, cycleId: cycle.id };
}

export async function updateCycleDraft(cycleId: string, input: {
  basics: CycleBasicsInput;
  types: CycleTypesInput;
  participants: ParticipantsSelection;
  questions: QuestionInput[];
}) {
  const ctx = await getAdminContext();
  if (!requireAdmin(ctx)) return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const { data: cycle } = await admin
    .from('review_cycles')
    .select('status')
    .eq('id', cycleId)
    .eq('company_id', ctx.companyId)
    .maybeSingle();
  if (!cycle) return { error: 'Ciclo não encontrado.' };
  if (cycle.status !== 'draft') return { error: 'Ciclo já publicado — ajustes limitados.' };

  await admin
    .from('review_cycles')
    .update({
      name: input.basics.name,
      description: input.basics.description ?? null,
      period_start: input.basics.periodStart,
      period_end: input.basics.periodEnd,
      response_start: input.basics.responseStart,
      response_end: input.basics.responseEnd,
      include_self: input.types.includeSelf,
      include_manager: input.types.includeManager,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cycleId);

  await upsertFormAndQuestions(cycleId, ctx.companyId, input.questions);
  await syncDraftParticipants(cycleId, ctx.companyId, ctx.userId, input.participants);

  await logActivity({
    companyId: ctx.companyId,
    actorUserId: ctx.userId,
    action: 'review_cycle.updated',
    entityType: 'review_cycle',
    entityId: cycleId,
  });

  revalidatePath('/avaliacoes');
  revalidatePath(`/avaliacoes/${cycleId}`);
  return { ok: true };
}

export async function updatePublishedCycleMetadata(cycleId: string, input: {
  description?: string | null;
  responseEnd?: string;
}) {
  const ctx = await getAdminContext();
  if (!requireAdmin(ctx)) return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const { data: cycle } = await admin
    .from('review_cycles')
    .select('status')
    .eq('id', cycleId)
    .eq('company_id', ctx.companyId)
    .maybeSingle();
  if (!cycle) return { error: 'Ciclo não encontrado.' };
  if (cycle.status !== 'published') return { error: 'Apenas ciclos publicados podem ser editados desta forma.' };

  const patch: TablesUpdate<'review_cycles'> = { updated_at: new Date().toISOString() };
  if (input.description !== undefined) patch.description = input.description;
  if (input.responseEnd !== undefined) patch.response_end = input.responseEnd;

  await admin.from('review_cycles').update(patch).eq('id', cycleId);
  await logActivity({
    companyId: ctx.companyId, actorUserId: ctx.userId,
    action: 'review_cycle.updated',
    entityType: 'review_cycle', entityId: cycleId,
  });

  revalidatePath(`/avaliacoes/${cycleId}`);
  return { ok: true };
}

export async function publishCycle(cycleId: string) {
  const ctx = await getAdminContext();
  if (!requireAdmin(ctx)) return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const { data: cycle } = await admin
    .from('review_cycles')
    .select('id, status, include_self, include_manager')
    .eq('id', cycleId)
    .eq('company_id', ctx.companyId)
    .maybeSingle();
  if (!cycle) return { error: 'Ciclo não encontrado.' };
  if (cycle.status !== 'draft') return { error: 'Apenas rascunhos podem ser publicados.' };

  const { data: formRow } = await admin
    .from('review_forms').select('id').eq('cycle_id', cycleId).maybeSingle();
  if (!formRow) return { error: 'Formulário não encontrado.' };

  const { count: qCount } = await admin
    .from('review_questions')
    .select('*', { count: 'exact', head: true })
    .eq('form_id', formRow.id);
  if (!qCount || qCount === 0) return { error: 'Adicione ao menos uma pergunta antes de publicar.' };

  const { data: participants } = await admin
    .from('review_cycle_participants')
    .select(`id, employee_id, employee:employees!employee_id(id, manager_id, user_id, full_name, status)`)
    .eq('cycle_id', cycleId)
    .is('removed_at', null);
  const activeParticipants = (participants ?? []).filter((p) => {
    const emp = p.employee as unknown as { status: string } | null;
    return emp && emp.status === 'active';
  });
  if (activeParticipants.length === 0) return { error: 'Adicione ao menos um participante ativo.' };

  const assignments: TablesInsert<'review_assignments'>[] = [];
  for (const p of activeParticipants) {
    const emp = p.employee as unknown as { id: string; manager_id: string | null };
    if (cycle.include_self) {
      assignments.push({
        company_id: ctx.companyId,
        cycle_id: cycle.id,
        form_id: formRow.id,
        reviewee_id: emp.id,
        reviewer_id: emp.id,
        type: 'self',
      });
    }
    if (cycle.include_manager && emp.manager_id) {
      assignments.push({
        company_id: ctx.companyId,
        cycle_id: cycle.id,
        form_id: formRow.id,
        reviewee_id: emp.id,
        reviewer_id: emp.manager_id,
        type: 'manager',
      });
    }
  }

  const now = new Date().toISOString();
  await admin
    .from('review_cycles')
    .update({ status: 'published', published_at: now, updated_at: now })
    .eq('id', cycleId);

  if (assignments.length > 0) {
    await admin.from('review_assignments').insert(assignments);
  }

  // Notifica reviewers com user_id (sem bloquear em erro)
  const reviewerEmployeeIds = Array.from(new Set(assignments.map((a) => a.reviewer_id)));
  if (reviewerEmployeeIds.length) {
    const { data: reviewers } = await admin
      .from('employees')
      .select('id, user_id, full_name')
      .in('id', reviewerEmployeeIds);
    const { data: cycleFresh } = await admin
      .from('review_cycles')
      .select('name')
      .eq('id', cycleId).maybeSingle();
    for (const r of reviewers ?? []) {
      if (!r.user_id) continue;
      await notify({
        companyId: ctx.companyId,
        userId: r.user_id,
        type: 'review.assignment_new',
        title: `Nova avaliação pendente`,
        body: `Ciclo "${cycleFresh?.name ?? ''}" — abra e responda suas pendências.`,
        linkUrl: '/avaliacoes',
        entityType: 'review_cycle',
        entityId: cycleId,
      });
    }
  }

  await logActivity({
    companyId: ctx.companyId, actorUserId: ctx.userId,
    action: 'review_cycle.published',
    entityType: 'review_cycle', entityId: cycleId,
    metadata: { assignments: assignments.length, participants: activeParticipants.length },
  });

  revalidatePath('/avaliacoes');
  revalidatePath(`/avaliacoes/${cycleId}`);
  revalidatePath('/dashboard');
  return { ok: true, assignments: assignments.length };
}

export async function closeCycle(cycleId: string) {
  const ctx = await getAdminContext();
  if (!requireAdmin(ctx)) return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const { data: cycle } = await admin
    .from('review_cycles')
    .select('status').eq('id', cycleId).eq('company_id', ctx.companyId).maybeSingle();
  if (!cycle) return { error: 'Ciclo não encontrado.' };
  if (cycle.status !== 'published') return { error: 'Apenas ciclos publicados podem ser encerrados.' };

  const now = new Date().toISOString();
  await admin.from('review_cycles').update({ status: 'closed', closed_at: now, updated_at: now }).eq('id', cycleId);
  await logActivity({
    companyId: ctx.companyId, actorUserId: ctx.userId,
    action: 'review_cycle.closed',
    entityType: 'review_cycle', entityId: cycleId,
  });
  revalidatePath(`/avaliacoes/${cycleId}`);
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function archiveCycle(cycleId: string) {
  const ctx = await getAdminContext();
  if (!requireAdmin(ctx)) return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();
  await admin
    .from('review_cycles')
    .update({ status: 'archived', archived_at: now, updated_at: now })
    .eq('id', cycleId).eq('company_id', ctx.companyId);
  await logActivity({
    companyId: ctx.companyId, actorUserId: ctx.userId,
    action: 'review_cycle.archived',
    entityType: 'review_cycle', entityId: cycleId,
  });
  revalidatePath('/avaliacoes');
  revalidatePath('/dashboard');
  return { ok: true };
}

// ---------------- Participantes pós-publish ----------------

export async function addParticipantAction(cycleId: string, employeeId: string) {
  const ctx = await getAdminContext();
  if (!requireAdmin(ctx)) return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const { data: cycle } = await admin
    .from('review_cycles')
    .select('status, include_self, include_manager')
    .eq('id', cycleId).eq('company_id', ctx.companyId).maybeSingle();
  if (!cycle) return { error: 'Ciclo não encontrado.' };

  const { data: existing } = await admin
    .from('review_cycle_participants')
    .select('id, removed_at')
    .eq('cycle_id', cycleId).eq('employee_id', employeeId).maybeSingle();

  if (existing) {
    if (existing.removed_at) {
      await admin
        .from('review_cycle_participants')
        .update({ removed_at: null, added_at: new Date().toISOString(), added_by: ctx.userId })
        .eq('id', existing.id);
    }
  } else {
    await admin.from('review_cycle_participants').insert({
      company_id: ctx.companyId,
      cycle_id: cycleId,
      employee_id: employeeId,
      added_by: ctx.userId,
    });
  }

  if (cycle.status === 'published') {
    const { data: formRow } = await admin
      .from('review_forms').select('id').eq('cycle_id', cycleId).maybeSingle();
    const { data: emp } = await admin
      .from('employees').select('id, manager_id').eq('id', employeeId).maybeSingle();
    if (formRow && emp) {
      const payload: TablesInsert<'review_assignments'>[] = [];
      if (cycle.include_self) {
        payload.push({
          company_id: ctx.companyId, cycle_id: cycleId, form_id: formRow.id,
          reviewee_id: emp.id, reviewer_id: emp.id, type: 'self',
        });
      }
      if (cycle.include_manager && emp.manager_id) {
        payload.push({
          company_id: ctx.companyId, cycle_id: cycleId, form_id: formRow.id,
          reviewee_id: emp.id, reviewer_id: emp.manager_id, type: 'manager',
        });
      }
      if (payload.length) {
        // upsert com ignore de conflito pela UNIQUE
        await admin.from('review_assignments').upsert(payload, {
          onConflict: 'cycle_id,reviewee_id,reviewer_id,type',
          ignoreDuplicates: true,
        });
      }
    }
  }

  revalidatePath(`/avaliacoes/${cycleId}`);
  return { ok: true };
}

export async function removeParticipantAction(cycleId: string, employeeId: string) {
  const ctx = await getAdminContext();
  if (!requireAdmin(ctx)) return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();
  await admin
    .from('review_cycle_participants')
    .update({ removed_at: now })
    .eq('cycle_id', cycleId)
    .eq('employee_id', employeeId);

  // Cancela assignments ainda abertos
  await admin
    .from('review_assignments')
    .update({ status: 'cancelled', cancelled_at: now, cancelled_reason: 'reviewee_removed' })
    .eq('cycle_id', cycleId)
    .eq('reviewee_id', employeeId)
    .in('status', ['pending', 'in_progress']);

  revalidatePath(`/avaliacoes/${cycleId}`);
  return { ok: true };
}

export async function cancelAssignment(assignmentId: string, reason: string = 'admin_manual') {
  const ctx = await getAdminContext();
  if (!requireAdmin(ctx)) return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { data: a } = await admin
    .from('review_assignments')
    .select('cycle_id, status')
    .eq('id', assignmentId).eq('company_id', ctx.companyId).maybeSingle();
  if (!a) return { error: 'Assignment não encontrado.' };
  if (a.status === 'submitted' || a.status === 'cancelled') return { error: 'Não é possível cancelar neste estado.' };

  await admin
    .from('review_assignments')
    .update({ status: 'cancelled', cancelled_at: now, cancelled_reason: reason })
    .eq('id', assignmentId);

  revalidatePath(`/avaliacoes/${a.cycle_id}`);
  return { ok: true };
}

export async function reassignReviewer(assignmentId: string, newReviewerEmployeeId: string) {
  const ctx = await getAdminContext();
  if (!requireAdmin(ctx)) return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const { data: a } = await admin
    .from('review_assignments')
    .select('cycle_id, reviewee_id, type, status')
    .eq('id', assignmentId).eq('company_id', ctx.companyId).maybeSingle();
  if (!a) return { error: 'Assignment não encontrado.' };
  if (a.status === 'submitted' || a.status === 'cancelled') {
    return { error: 'Só é possível reatribuir assignments abertos.' };
  }
  if (a.reviewee_id === newReviewerEmployeeId && a.type === 'manager') {
    return { error: 'O avaliado não pode ser reviewer de si mesmo em avaliação do gestor.' };
  }

  const { error } = await admin
    .from('review_assignments')
    .update({ reviewer_id: newReviewerEmployeeId })
    .eq('id', assignmentId);
  if (error) return { error: 'Erro ao reatribuir.' };

  revalidatePath(`/avaliacoes/${a.cycle_id}`);
  return { ok: true };
}

// ---------------- Respostas ----------------

export async function saveAnswerDraft(assignmentId: string, input: {
  questionId: string;
  scaleValue?: number | null;
  textValue?: string | null;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado.' };

  const admin = createAdminSupabaseClient();
  const { data: a } = await admin
    .from('review_assignments')
    .select('id, company_id, cycle_id, reviewer_id, status, reviewee_id')
    .eq('id', assignmentId).maybeSingle();
  if (!a) return { error: 'Assignment não encontrado.' };

  await ensureNotExpired(a.cycle_id, a.company_id);

  // Confirma que reviewer é o próprio user
  const { data: reviewer } = await admin
    .from('employees').select('id, user_id').eq('id', a.reviewer_id).maybeSingle();
  if (!reviewer || reviewer.user_id !== user.id) return { error: 'Sem permissão.' };

  // Re-check cycle status
  const { data: cycle } = await admin.from('review_cycles').select('status').eq('id', a.cycle_id).single();
  if (cycle?.status !== 'published') return { error: 'Ciclo não está aberto para respostas.' };

  if (a.status === 'submitted' || a.status === 'cancelled') {
    return { error: 'Avaliação já encerrada.' };
  }

  const { error: upsertErr } = await admin
    .from('review_answers')
    .upsert({
      assignment_id: assignmentId,
      company_id: a.company_id,
      question_id: input.questionId,
      scale_value: input.scaleValue ?? null,
      text_value: input.textValue ?? null,
      answered_at: new Date().toISOString(),
    }, { onConflict: 'assignment_id,question_id' });
  if (upsertErr) return { error: 'Erro ao salvar resposta.' };

  // Move para in_progress se estava pending
  if (a.status === 'pending') {
    await admin.from('review_assignments').update({ status: 'in_progress' }).eq('id', assignmentId);
  }

  return { ok: true };
}

export async function submitAssignment(assignmentId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado.' };

  const admin = createAdminSupabaseClient();
  const { data: a } = await admin
    .from('review_assignments')
    .select('id, company_id, cycle_id, reviewer_id, form_id, status')
    .eq('id', assignmentId).maybeSingle();
  if (!a) return { error: 'Assignment não encontrado.' };

  await ensureNotExpired(a.cycle_id, a.company_id);

  const { data: cycle } = await admin
    .from('review_cycles').select('status').eq('id', a.cycle_id).single();
  if (cycle?.status !== 'published') return { error: 'Ciclo não está aberto para respostas.' };

  const { data: reviewer } = await admin
    .from('employees').select('user_id').eq('id', a.reviewer_id).maybeSingle();
  if (!reviewer || reviewer.user_id !== user.id) return { error: 'Sem permissão.' };

  if (a.status === 'submitted') return { error: 'Já enviado.' };
  if (a.status === 'cancelled') return { error: 'Avaliação cancelada.' };

  // Checa obrigatórias respondidas
  const [{ data: questions }, { data: answers }] = await Promise.all([
    admin.from('review_questions').select('id, is_required, type').eq('form_id', a.form_id),
    admin.from('review_answers').select('question_id, scale_value, text_value').eq('assignment_id', assignmentId),
  ]);
  const answeredMap = new Map((answers ?? []).map((r) => [r.question_id, r]));
  const missing = (questions ?? []).filter((q) => {
    if (!q.is_required) return false;
    const ans = answeredMap.get(q.id);
    if (!ans) return true;
    if (q.type === 'scale') return ans.scale_value === null;
    return !ans.text_value || !ans.text_value.trim();
  });
  if (missing.length > 0) return { error: `Há ${missing.length} pergunta(s) obrigatória(s) sem resposta.` };

  const now = new Date().toISOString();
  await admin
    .from('review_assignments')
    .update({ status: 'submitted', submitted_at: now })
    .eq('id', assignmentId);

  await logActivity({
    companyId: a.company_id, actorUserId: user.id,
    action: 'review_assignment.submitted',
    entityType: 'review_assignment', entityId: assignmentId,
  });

  revalidatePath('/avaliacoes');
  revalidatePath(`/avaliacoes/${a.cycle_id}`);
  revalidatePath('/dashboard');
  return { ok: true };
}

// ---------------- Lembretes ----------------

export async function sendReminders(cycleId: string, reviewerEmployeeId?: string) {
  const ctx = await getAdminContext();
  if (!requireAdmin(ctx)) return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  let query = admin
    .from('review_assignments')
    .select(`id, reviewer_id, reviewer:employees!reviewer_id(id, full_name, email, user_id), cycle:review_cycles!cycle_id(name)`)
    .eq('cycle_id', cycleId)
    .in('status', ['pending', 'in_progress']);
  if (reviewerEmployeeId) query = query.eq('reviewer_id', reviewerEmployeeId);
  const { data: rows } = await query;

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  let sent = 0;
  let failed = 0;
  const seen = new Set<string>();
  for (const row of rows ?? []) {
    const rev = row.reviewer as unknown as { email: string; full_name: string; user_id: string | null } | null;
    const cyc = row.cycle as unknown as { name: string } | null;
    if (!rev || !rev.email || seen.has(rev.email)) continue;
    seen.add(rev.email);
    try {
      await resend.emails.send({
        from: 'Evoluteam <marcio@marct.co>',
        to: rev.email,
        subject: `Lembrete: você tem avaliações pendentes`,
        html: `
          <p>Olá ${rev.full_name},</p>
          <p>Você ainda tem avaliações pendentes no ciclo "${cyc?.name ?? ''}".</p>
          <p><a href="${origin}/avaliacoes">Abrir avaliações</a></p>
        `,
      });
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  await logActivity({
    companyId: ctx.companyId, actorUserId: ctx.userId,
    action: 'review_cycle.reminded',
    entityType: 'review_cycle', entityId: cycleId,
    metadata: { sent, failed },
  });

  return { ok: true, sent, failed };
}

// ---------------- Resultados ----------------

export async function releaseResult(cycleId: string, employeeId: string) {
  const ctx = await getAdminContext();
  if (!requireAdmin(ctx)) return { error: 'Sem permissão.' };
  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();
  await admin
    .from('review_cycle_participants')
    .update({ result_released_at: now, result_released_by: ctx.userId })
    .eq('cycle_id', cycleId).eq('employee_id', employeeId);

  await logActivity({
    companyId: ctx.companyId, actorUserId: ctx.userId,
    action: 'review_result.released',
    entityType: 'review_cycle', entityId: cycleId,
    metadata: { employeeId },
  });

  // Notifica o colaborador se tiver user_id
  const { data: emp } = await admin
    .from('employees').select('user_id').eq('id', employeeId).maybeSingle();
  if (emp?.user_id) {
    const { data: cyc } = await admin.from('review_cycles').select('name').eq('id', cycleId).single();
    await notify({
      companyId: ctx.companyId,
      userId: emp.user_id,
      type: 'review.result_released',
      title: `Seu resultado foi liberado`,
      body: `Ciclo "${cyc?.name ?? ''}" — veja seu resultado.`,
      linkUrl: `/avaliacoes/${cycleId}/resultados/${employeeId}`,
      entityType: 'review_cycle',
      entityId: cycleId,
    });
  }

  revalidatePath(`/avaliacoes/${cycleId}/resultados`);
  revalidatePath(`/avaliacoes/${cycleId}/resultados/${employeeId}`);
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function hideResult(cycleId: string, employeeId: string) {
  const ctx = await getAdminContext();
  if (!requireAdmin(ctx)) return { error: 'Sem permissão.' };
  const admin = createAdminSupabaseClient();
  await admin
    .from('review_cycle_participants')
    .update({ result_released_at: null, result_released_by: null })
    .eq('cycle_id', cycleId).eq('employee_id', employeeId);
  await logActivity({
    companyId: ctx.companyId, actorUserId: ctx.userId,
    action: 'review_result.hidden',
    entityType: 'review_cycle', entityId: cycleId,
    metadata: { employeeId },
  });
  revalidatePath(`/avaliacoes/${cycleId}/resultados`);
  revalidatePath(`/avaliacoes/${cycleId}/resultados/${employeeId}`);
  return { ok: true };
}

// ---------------- Helpers internos ----------------

async function upsertFormAndQuestions(cycleId: string, companyId: string, questions: QuestionInput[]) {
  const admin = createAdminSupabaseClient();

  let { data: form } = await admin
    .from('review_forms').select('id').eq('cycle_id', cycleId).maybeSingle();
  if (!form) {
    const inserted = await admin
      .from('review_forms')
      .insert({ company_id: companyId, cycle_id: cycleId })
      .select('id').single();
    form = inserted.data ?? null;
  }
  if (!form) return;

  // Apaga perguntas existentes e reinsere (simples para MVP)
  await admin.from('review_questions').delete().eq('form_id', form.id);

  if (questions.length === 0) return;

  const parsed = FormInputSchema.safeParse({ questions });
  if (!parsed.success) return;

  const rows: TablesInsert<'review_questions'>[] = parsed.data.questions.map((q, idx) => ({
    company_id: companyId,
    form_id: form!.id,
    question_order: idx,
    type: q.type,
    question_text: q.questionText,
    is_required: q.isRequired,
    competency_id: q.competencyId ?? null,
    scale_min: q.type === 'scale' ? (q.scaleMin ?? 1) : null,
    scale_max: q.type === 'scale' ? (q.scaleMax ?? 5) : null,
  }));
  await admin.from('review_questions').insert(rows);
}

async function resolveParticipantIds(
  companyId: string,
  selection: ParticipantsSelection,
): Promise<string[]> {
  const admin = createAdminSupabaseClient();
  const { data: all } = await admin
    .from('employees')
    .select('id, department_id, position_id, status')
    .eq('company_id', companyId)
    .eq('status', 'active');
  const actives = all ?? [];

  const set = new Set<string>();
  if (selection.mode === 'all') {
    for (const e of actives) set.add(e.id);
  } else {
    if (selection.departmentIds.length > 0) {
      for (const e of actives) if (e.department_id && selection.departmentIds.includes(e.department_id)) set.add(e.id);
    }
    if (selection.positionIds.length > 0) {
      for (const e of actives) if (e.position_id && selection.positionIds.includes(e.position_id)) set.add(e.id);
    }
    for (const id of selection.manualEmployeeIds) set.add(id);
  }
  for (const id of selection.excludedEmployeeIds) set.delete(id);
  return Array.from(set);
}

async function syncDraftParticipants(
  cycleId: string,
  companyId: string,
  userId: string,
  selection: ParticipantsSelection,
) {
  const admin = createAdminSupabaseClient();
  const desired = await resolveParticipantIds(companyId, selection);
  const desiredSet = new Set(desired);

  const { data: existing } = await admin
    .from('review_cycle_participants')
    .select('id, employee_id, removed_at')
    .eq('cycle_id', cycleId);
  const existingMap = new Map((existing ?? []).map((p) => [p.employee_id, p]));

  // Adicionar novos
  const toInsert: TablesInsert<'review_cycle_participants'>[] = [];
  for (const id of desired) {
    const ex = existingMap.get(id);
    if (!ex) {
      toInsert.push({
        company_id: companyId, cycle_id: cycleId, employee_id: id, added_by: userId,
      });
    } else if (ex.removed_at) {
      await admin
        .from('review_cycle_participants')
        .update({ removed_at: null, added_at: new Date().toISOString(), added_by: userId })
        .eq('id', ex.id);
    }
  }
  if (toInsert.length) await admin.from('review_cycle_participants').insert(toInsert);

  // Marcar removidos
  const now = new Date().toISOString();
  for (const [empId, p] of existingMap) {
    if (!desiredSet.has(empId) && !p.removed_at) {
      await admin
        .from('review_cycle_participants')
        .update({ removed_at: now })
        .eq('id', p.id);
    }
  }
}

// ============================================================
// FT-8 P10 — Comentarios da lideranca em resultado de ciclo
// ============================================================

async function getCommenterContext(): Promise<{
  userId: string;
  companyId: string;
  role: 'admin_rh' | 'director' | 'user' | 'rh';
  employeeId: string | null;
} | null> {
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
    role: profile.role as 'admin_rh' | 'director' | 'user' | 'rh',
    employeeId: emp?.id ?? null,
  };
}

async function isResultReleasedFor(
  cycleId: string,
  revieweeEmployeeId: string,
): Promise<boolean> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from('review_cycle_participants')
    .select('result_released_at')
    .eq('cycle_id', cycleId)
    .eq('employee_id', revieweeEmployeeId)
    .maybeSingle();
  return !!data?.result_released_at;
}

export async function createResultComment(input: {
  cycleId: string;
  revieweeEmployeeId: string;
  content: string;
}) {
  const ctx = await getCommenterContext();
  if (!ctx) return { error: 'Nao autenticado.' };
  if (!ctx.employeeId) return { error: 'Perfil de colaborador nao encontrado.' };

  const content = input.content.trim();
  if (!content) return { error: 'Comentario vazio.' };
  if (content.length > 4000) return { error: 'Comentario muito longo (maximo 4000 caracteres).' };

  const released = await isResultReleasedFor(input.cycleId, input.revieweeEmployeeId);
  if (!released) {
    return { error: 'Resultado ainda nao foi liberado para esta pessoa.', code: 'NOT_RELEASED' };
  }

  // Insere via RLS (policy rrc_insert valida author + role + ancestors).
  const supabase = await createServerSupabaseClient();
  const { data: inserted, error: iErr } = await supabase
    .from('review_result_comments')
    .insert({
      company_id: ctx.companyId,
      cycle_id: input.cycleId,
      reviewee_employee_id: input.revieweeEmployeeId,
      author_employee_id: ctx.employeeId,
      content,
    })
    .select('id')
    .single();
  if (iErr || !inserted) {
    return { error: 'Sem permissao para comentar neste resultado.', code: 'FORBIDDEN' };
  }

  await logActivity({
    companyId: ctx.companyId,
    actorUserId: ctx.userId,
    action: 'review_result_comment.created',
    entityType: 'review_cycle',
    entityId: input.cycleId,
    metadata: { commentId: inserted.id, revieweeEmployeeId: input.revieweeEmployeeId },
  });

  // Notifica o avaliado.
  const admin = createAdminSupabaseClient();
  const [{ data: reviewee }, { data: cyc }, { data: author }] = await Promise.all([
    admin.from('employees').select('user_id, full_name').eq('id', input.revieweeEmployeeId).maybeSingle(),
    admin.from('review_cycles').select('name').eq('id', input.cycleId).maybeSingle(),
    admin.from('employees').select('full_name').eq('id', ctx.employeeId).maybeSingle(),
  ]);
  if (reviewee?.user_id) {
    await notify({
      companyId: ctx.companyId,
      userId: reviewee.user_id,
      type: 'review.result_comment',
      title: 'Novo comentario no seu resultado',
      body: `${author?.full_name ?? 'Alguem'} comentou no ciclo "${cyc?.name ?? ''}".`,
      linkUrl: `/avaliacoes/${input.cycleId}/resultados/${input.revieweeEmployeeId}`,
      entityType: 'review_cycle',
      entityId: input.cycleId,
    });
  }

  revalidatePath(`/avaliacoes/${input.cycleId}/resultados/${input.revieweeEmployeeId}`);
  return { ok: true, id: inserted.id };
}

export async function updateResultComment(input: {
  commentId: string;
  content: string;
}) {
  const ctx = await getCommenterContext();
  if (!ctx) return { error: 'Nao autenticado.' };

  const content = input.content.trim();
  if (!content) return { error: 'Comentario vazio.' };
  if (content.length > 4000) return { error: 'Comentario muito longo (maximo 4000 caracteres).' };

  // Policy rrc_update permite autor ate 2h; admin_rh pode sempre.
  const supabase = await createServerSupabaseClient();
  const { data: updated, error: uErr } = await supabase
    .from('review_result_comments')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', input.commentId)
    .select('id, cycle_id, reviewee_employee_id')
    .maybeSingle();
  if (uErr || !updated) {
    return { error: 'Nao foi possivel editar (fora da janela de 2h ou sem permissao).', code: 'FORBIDDEN' };
  }

  await logActivity({
    companyId: ctx.companyId,
    actorUserId: ctx.userId,
    action: 'review_result_comment.updated',
    entityType: 'review_cycle',
    entityId: updated.cycle_id,
    metadata: { commentId: updated.id, revieweeEmployeeId: updated.reviewee_employee_id },
  });
  revalidatePath(`/avaliacoes/${updated.cycle_id}/resultados/${updated.reviewee_employee_id}`);
  return { ok: true };
}

export async function deleteResultComment(input: { commentId: string }) {
  const ctx = await getCommenterContext();
  if (!ctx) return { error: 'Nao autenticado.' };

  const supabase = await createServerSupabaseClient();
  const { data: updated, error: uErr } = await supabase
    .from('review_result_comments')
    .update({ deleted_at: new Date().toISOString(), deleted_by: ctx.userId })
    .eq('id', input.commentId)
    .select('id, cycle_id, reviewee_employee_id')
    .maybeSingle();
  if (uErr || !updated) {
    return { error: 'Nao foi possivel remover.', code: 'FORBIDDEN' };
  }

  await logActivity({
    companyId: ctx.companyId,
    actorUserId: ctx.userId,
    action: 'review_result_comment.deleted',
    entityType: 'review_cycle',
    entityId: updated.cycle_id,
    metadata: { commentId: updated.id, revieweeEmployeeId: updated.reviewee_employee_id },
  });
  revalidatePath(`/avaliacoes/${updated.cycle_id}/resultados/${updated.reviewee_employee_id}`);
  return { ok: true };
}
