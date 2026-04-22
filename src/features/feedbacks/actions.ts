'use server';

import { revalidatePath } from 'next/cache';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { notify } from '@/lib/notifications';
import { getActor } from '@/features/permissions/actor';
import { hasAdminPower } from '@/features/permissions/permissions';
import { FeedbackInputSchema, type FeedbackInput } from './schema';
import { enforceVisibilityForType } from './permissions';

export async function sendFeedback(input: FeedbackInput) {
  const ctx = await getActor();
  if (!ctx) return { error: 'Não autenticado.' };
  if (!ctx.employeeId) return { error: 'Você precisa ser um colaborador para enviar feedback.' };
  if (ctx.employeeStatus === 'terminated') return { error: 'Colaboradores desligados não podem enviar feedback.' };

  const parsed = FeedbackInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const value = parsed.data;
  const visibility = enforceVisibilityForType(value.type, value.visibility);

  if (value.recipientId === ctx.employeeId) {
    return { error: 'Você não pode enviar feedback para si mesmo.' };
  }

  const admin = createAdminSupabaseClient();

  const { data: recipient } = await admin
    .from('employees')
    .select('id, status, user_id, full_name')
    .eq('id', value.recipientId)
    .eq('company_id', ctx.companyId)
    .maybeSingle();
  if (!recipient) return { error: 'Destinatário não encontrado.' };
  if (recipient.status === 'terminated') {
    return { error: 'Não é possível enviar feedback para colaborador desligado.' };
  }

  const { data: inserted, error } = await admin
    .from('feedbacks')
    .insert({
      company_id: ctx.companyId,
      sender_id: ctx.employeeId,
      recipient_id: value.recipientId,
      type: value.type,
      competency_id: value.competencyId ?? null,
      message: value.message.trim(),
      visibility,
    })
    .select('id')
    .single();
  if (error || !inserted) {
    return { error: 'Erro ao enviar feedback.' };
  }

  if (recipient.user_id) {
    await notify({
      companyId: ctx.companyId,
      userId: recipient.user_id,
      type: 'feedback_received',
      title: 'Novo feedback',
      body: 'Você recebeu um feedback.',
      linkUrl: '/feedbacks',
      entityType: 'feedback',
      entityId: inserted.id,
    });
  }

  await logActivity({
    companyId: ctx.companyId,
    actorUserId: ctx.userId,
    action: 'feedback.created',
    entityType: 'feedback',
    entityId: inserted.id,
    metadata: {
      type: value.type,
      visibility,
      has_competency: !!value.competencyId,
    },
  });

  revalidatePath('/feedbacks');
  revalidatePath(`/colaboradores/${value.recipientId}`);
  revalidatePath('/dashboard');
  return { ok: true, id: inserted.id };
}

export async function markFeedbackAsRead(feedbackId: string) {
  const ctx = await getActor();
  if (!ctx || !ctx.employeeId) return { error: 'Não autenticado.' };

  const admin = createAdminSupabaseClient();
  const { data: fb } = await admin
    .from('feedbacks')
    .select('id, recipient_id, read_at')
    .eq('id', feedbackId)
    .maybeSingle();
  if (!fb) return { error: 'Feedback não encontrado.' };
  if (fb.recipient_id !== ctx.employeeId) return { error: 'Sem permissão.' };
  if (fb.read_at) return { ok: true };

  await admin
    .from('feedbacks')
    .update({ read_at: new Date().toISOString() })
    .eq('id', feedbackId);

  revalidatePath('/feedbacks');
  return { ok: true };
}

export async function deleteFeedback(feedbackId: string) {
  const ctx = await getActor();
  if (!ctx) return { error: 'Não autenticado.' };
  if (!hasAdminPower(ctx, 'can_pdi_feedback')) return { error: 'Sem permissão.' };

  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { data: fb } = await admin
    .from('feedbacks')
    .select('id, recipient_id')
    .eq('id', feedbackId)
    .eq('company_id', ctx.companyId)
    .maybeSingle();
  if (!fb) return { error: 'Feedback não encontrado.' };

  await admin
    .from('feedbacks')
    .update({ deleted_at: now, deleted_by: ctx.userId })
    .eq('id', feedbackId);

  await logActivity({
    companyId: ctx.companyId,
    actorUserId: ctx.userId,
    action: 'feedback.deleted',
    entityType: 'feedback',
    entityId: feedbackId,
  });

  revalidatePath('/feedbacks');
  revalidatePath('/configuracoes/auditoria');
  if (fb.recipient_id) {
    revalidatePath(`/colaboradores/${fb.recipient_id}`);
  }
  return { ok: true };
}
