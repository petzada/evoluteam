'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { notify } from '@/lib/notifications';
import { getActor } from '@/features/permissions/actor';
import { canDo } from '@/features/permissions/permissions';
import { listCompanyFeedbacksPage } from './queries';
import { FeedbackInputSchema, type FeedbackInput } from './schema';
import { enforceVisibilityForType } from './permissions';

const LoadCompanyFeedbacksPageInputSchema = z.object({
  page: z.number().int().min(0).optional(),
  pageSize: z.number().int().min(1).max(50).optional(),
  typeFilter: z.array(z.string().min(1)).optional(),
  competencyFilter: z.array(z.string().min(1)).optional(),
  period: z.enum(['all', '30d', '6m', '1y']).optional(),
});

type LoadCompanyFeedbacksPageInput = z.input<typeof LoadCompanyFeedbacksPageInputSchema>;

export async function sendFeedback(input: FeedbackInput) {
  const ctx = await getActor();
  if (!ctx) return { error: 'NÃ£o autenticado.' };
  if (!ctx.employeeId) return { error: 'VocÃª precisa ser um colaborador para enviar feedback.' };
  if (ctx.employeeStatus === 'terminated') return { error: 'Colaboradores desligados nÃ£o podem enviar feedback.' };

  const parsed = FeedbackInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados invÃ¡lidos.' };
  }
  const value = parsed.data;
  const visibility = enforceVisibilityForType(value.type, value.visibility);

  if (value.recipientId === ctx.employeeId) {
    return { error: 'VocÃª nÃ£o pode enviar feedback para si mesmo.' };
  }

  const admin = createAdminSupabaseClient();

  const { data: recipient } = await admin
    .from('employees')
    .select('id, status, user_id, full_name')
    .eq('id', value.recipientId)
    .eq('company_id', ctx.companyId)
    .maybeSingle();
  if (!recipient) return { error: 'DestinatÃ¡rio nÃ£o encontrado.' };
  if (recipient.status === 'terminated') {
    return { error: 'NÃ£o Ã© possÃ­vel enviar feedback para colaborador desligado.' };
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
    console.error('[feedbacks.sendFeedback]', error?.message ?? 'no row returned');
    return { error: 'Erro ao enviar feedback.' };
  }

  if (recipient.user_id) {
    await notify({
      companyId: ctx.companyId,
      userId: recipient.user_id,
      type: 'feedback_received',
      title: 'Novo feedback',
      body: 'VocÃª recebeu um feedback.',
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
  if (!ctx || !ctx.employeeId) return { error: 'NÃ£o autenticado.' };

  const admin = createAdminSupabaseClient();
  const { data: fb } = await admin
    .from('feedbacks')
    .select('id, recipient_id, read_at')
    .eq('id', feedbackId)
    .maybeSingle();
  if (!fb) return { error: 'Feedback nÃ£o encontrado.' };
  if (fb.recipient_id !== ctx.employeeId) return { error: 'Sem permissÃ£o.' };
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
  if (!ctx) return { error: 'NÃ£o autenticado.' };
  if (!canDo(ctx, 'feedbacks', 'edit')) return { error: 'Sem permissÃ£o.' };

  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { data: fb } = await admin
    .from('feedbacks')
    .select('id, recipient_id')
    .eq('id', feedbackId)
    .eq('company_id', ctx.companyId)
    .maybeSingle();
  if (!fb) return { error: 'Feedback nÃ£o encontrado.' };

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

export async function loadCompanyFeedbacksPage(input: LoadCompanyFeedbacksPageInput = {}) {
  const ctx = await getActor();
  if (!ctx) return { error: 'Nao autenticado.' };
  if (!canDo(ctx, 'feedbacks', 'view')) return { error: 'Sem permissao.' };

  const parsed = LoadCompanyFeedbacksPageInputSchema.safeParse(input);
  if (!parsed.success) return { error: 'Filtros invalidos.' };

  return listCompanyFeedbacksPage(ctx.companyId, parsed.data);
}
