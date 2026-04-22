'use server';

import { revalidatePath } from 'next/cache';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { notify } from '@/lib/notifications';
import { getActor } from '@/features/permissions/actor';
import { canDo } from '@/features/permissions/permissions';
import type { Actor } from '@/features/permissions/types';
import {
  PdiInputSchema, PdiActionInputSchema, PdiActionStatusSchema, PdiCommentSchema,
  type PdiInput, type PdiActionInput, type PdiCommentInput,
  PDI_ACTION_STATUSES, type PdiActionStatus,
} from './schema';

type Ctx = Actor;

async function getActorEmployeeForManagerCheck(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  ctx: Ctx,
): Promise<string | null> {
  return ctx.employeeId;
}

export async function createPdi(input: PdiInput) {
  const ctx = await getActor();
  if (!ctx) return { error: 'Não autenticado.' };

  const parsed = PdiInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  const value = parsed.data;

  const admin = createAdminSupabaseClient();

  const { data: target } = await admin
    .from('employees')
    .select('id, manager_id, status, user_id, full_name, company_id')
    .eq('id', value.employeeId)
    .maybeSingle();
  if (!target || target.company_id !== ctx.companyId) {
    return { error: 'Colaborador não encontrado.' };
  }
  if (target.status === 'terminated') {
    return { error: 'Não é possível criar PDI para colaborador desligado.' };
  }

  const actorEmployeeId = await getActorEmployeeForManagerCheck(admin, ctx);
  const isManager = actorEmployeeId && target.manager_id === actorEmployeeId;
  const isSelf = actorEmployeeId && target.id === actorEmployeeId;
  const isAdmin = canDo(ctx, 'pdi', 'edit');
  if (!isAdmin && !isManager && !isSelf) {
    return { error: 'Sem permissão para criar PDI para este colaborador.' };
  }
  if (!target.manager_id) {
    return { error: 'O colaborador precisa ter um gestor direto definido para ter PDI.' };
  }

  if (value.competencyId) {
    const { data: comp } = await admin
      .from('competencies')
      .select('id, company_id')
      .eq('id', value.competencyId)
      .maybeSingle();
    if (!comp || comp.company_id !== ctx.companyId) {
      return { error: 'Competência inválida.' };
    }
  }

  if (value.cycleId) {
    const { data: cycle } = await admin
      .from('review_cycles')
      .select('id, company_id')
      .eq('id', value.cycleId)
      .maybeSingle();
    if (!cycle || cycle.company_id !== ctx.companyId) {
      return { error: 'Ciclo inválido.' };
    }
  }

  const { data: inserted, error } = await admin
    .from('development_plans')
    .insert({
      company_id: ctx.companyId,
      employee_id: value.employeeId,
      cycle_id: value.cycleId ?? null,
      competency_id: value.competencyId ?? null,
      objective: value.objective.trim(),
      due_date: value.dueDate,
      status: 'nao_iniciado',
      created_by: ctx.userId,
    })
    .select('id')
    .single();

  if (error || !inserted) return { error: 'Erro ao criar PDI.' };

  if (target.user_id) {
    await notify({
      companyId: ctx.companyId,
      userId: target.user_id,
      type: 'pdi_created',
      title: 'Novo PDI criado',
      body: 'Um novo PDI foi criado para você.',
      linkUrl: `/pdi/${inserted.id}`,
      entityType: 'development_plan',
      entityId: inserted.id,
    });
  }

  await logActivity({
    companyId: ctx.companyId,
    actorUserId: ctx.userId,
    action: 'pdi.created',
    entityType: 'development_plan',
    entityId: inserted.id,
    metadata: {
      employee_id: value.employeeId,
      cycle_id: value.cycleId ?? null,
      competency_id: value.competencyId ?? null,
    },
  });

  revalidatePath('/pdi');
  revalidatePath(`/colaboradores/${value.employeeId}`);
  if (value.cycleId) {
    revalidatePath(`/avaliacoes/${value.cycleId}/resultados/${value.employeeId}`);
  }
  revalidatePath('/dashboard');
  return { ok: true, id: inserted.id };
}

async function loadPlan(planId: string) {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from('development_plans')
    .select('id, company_id, employee_id, cycle_id, created_by, status, deleted_at')
    .eq('id', planId)
    .maybeSingle();
  return data;
}

export async function updatePdiHeader(planId: string, input: Partial<PdiInput>) {
  const ctx = await getActor();
  if (!ctx) return { error: 'Não autenticado.' };
  const plan = await loadPlan(planId);
  if (!plan || plan.company_id !== ctx.companyId || plan.deleted_at) {
    return { error: 'PDI não encontrado.' };
  }
  if (!canDo(ctx, 'pdi', 'edit') && plan.created_by !== ctx.userId) {
    return { error: 'Sem permissão.' };
  }

  const admin = createAdminSupabaseClient();
  const patch: {
    updated_at: string;
    objective?: string;
    due_date?: string;
    competency_id?: string | null;
    cycle_id?: string | null;
  } = { updated_at: new Date().toISOString() };
  if (input.objective) {
    const s = input.objective.trim();
    if (s.length < 10 || s.length > 500) return { error: 'Objetivo entre 10 e 500 caracteres.' };
    patch.objective = s;
  }
  if (input.dueDate) patch.due_date = input.dueDate;
  if (input.competencyId !== undefined) patch.competency_id = input.competencyId;
  if (input.cycleId !== undefined) patch.cycle_id = input.cycleId;

  const { error } = await admin.from('development_plans').update(patch).eq('id', planId);
  if (error) return { error: 'Erro ao atualizar PDI.' };

  await logActivity({
    companyId: ctx.companyId,
    actorUserId: ctx.userId,
    action: 'pdi.updated',
    entityType: 'development_plan',
    entityId: planId,
  });

  revalidatePath(`/pdi/${planId}`);
  revalidatePath('/pdi');
  return { ok: true };
}

export async function concludePdi(planId: string) {
  const ctx = await getActor();
  if (!ctx) return { error: 'Não autenticado.' };
  const plan = await loadPlan(planId);
  if (!plan || plan.company_id !== ctx.companyId || plan.deleted_at) {
    return { error: 'PDI não encontrado.' };
  }
  if (!canDo(ctx, 'pdi', 'edit') && plan.created_by !== ctx.userId) {
    return { error: 'Sem permissão.' };
  }
  if (plan.status === 'concluido') return { ok: true };

  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from('development_plans')
    .update({ status: 'concluido', concluded_at: now, updated_at: now })
    .eq('id', planId);
  if (error) return { error: 'Erro ao concluir PDI.' };

  const { data: employee } = await admin
    .from('employees')
    .select('user_id')
    .eq('id', plan.employee_id)
    .maybeSingle();
  const targetUserId = employee?.user_id ?? null;

  const notifiedUserIds = new Set<string>();
  if (targetUserId && targetUserId !== ctx.userId) {
    notifiedUserIds.add(targetUserId);
    await notify({
      companyId: ctx.companyId,
      userId: targetUserId,
      type: 'pdi_concluded',
      title: 'PDI concluído',
      body: 'Seu PDI foi concluído.',
      linkUrl: `/pdi/${planId}`,
      entityType: 'development_plan',
      entityId: planId,
    });
  }
  if (plan.created_by !== ctx.userId && !notifiedUserIds.has(plan.created_by)) {
    await notify({
      companyId: ctx.companyId,
      userId: plan.created_by,
      type: 'pdi_concluded',
      title: 'PDI concluído',
      body: 'Um PDI que você criou foi concluído.',
      linkUrl: `/pdi/${planId}`,
      entityType: 'development_plan',
      entityId: planId,
    });
  }

  await logActivity({
    companyId: ctx.companyId,
    actorUserId: ctx.userId,
    action: 'pdi.concluded',
    entityType: 'development_plan',
    entityId: planId,
  });

  revalidatePath(`/pdi/${planId}`);
  revalidatePath('/pdi');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function cancelPdi(planId: string) {
  const ctx = await getActor();
  if (!ctx) return { error: 'Não autenticado.' };
  const plan = await loadPlan(planId);
  if (!plan || plan.company_id !== ctx.companyId || plan.deleted_at) {
    return { error: 'PDI não encontrado.' };
  }
  if (!canDo(ctx, 'pdi', 'edit') && plan.created_by !== ctx.userId) {
    return { error: 'Sem permissão.' };
  }
  if (plan.status === 'cancelado') return { ok: true };

  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from('development_plans')
    .update({ status: 'cancelado', cancelled_at: now, updated_at: now })
    .eq('id', planId);
  if (error) return { error: 'Erro ao cancelar PDI.' };

  await logActivity({
    companyId: ctx.companyId,
    actorUserId: ctx.userId,
    action: 'pdi.cancelled',
    entityType: 'development_plan',
    entityId: planId,
  });

  revalidatePath(`/pdi/${planId}`);
  revalidatePath('/pdi');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function deletePdi(planId: string) {
  const ctx = await getActor();
  if (!ctx) return { error: 'Não autenticado.' };
  if (!canDo(ctx, 'pdi', 'edit')) return { error: 'Sem permissão.' };
  const plan = await loadPlan(planId);
  if (!plan || plan.company_id !== ctx.companyId || plan.deleted_at) {
    return { error: 'PDI não encontrado.' };
  }

  const admin = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const { error } = await admin
    .from('development_plans')
    .update({ deleted_at: now, deleted_by: ctx.userId, updated_at: now })
    .eq('id', planId);
  if (error) return { error: 'Erro ao remover PDI.' };

  await logActivity({
    companyId: ctx.companyId,
    actorUserId: ctx.userId,
    action: 'pdi.deleted',
    entityType: 'development_plan',
    entityId: planId,
  });

  revalidatePath('/pdi');
  revalidatePath('/configuracoes/auditoria');
  return { ok: true };
}

export async function addAction(planId: string, input: PdiActionInput) {
  const ctx = await getActor();
  if (!ctx) return { error: 'Não autenticado.' };
  const plan = await loadPlan(planId);
  if (!plan || plan.company_id !== ctx.companyId || plan.deleted_at) {
    return { error: 'PDI não encontrado.' };
  }
  if (!canDo(ctx, 'pdi', 'edit') && plan.created_by !== ctx.userId) {
    return { error: 'Sem permissão.' };
  }

  const parsed = PdiActionInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  const value = parsed.data;

  const admin = createAdminSupabaseClient();

  const { data: responsible } = await admin
    .from('employees')
    .select('id, status, company_id')
    .eq('id', value.responsibleEmployeeId)
    .maybeSingle();
  if (!responsible || responsible.company_id !== ctx.companyId) {
    return { error: 'Responsável inválido.' };
  }
  if (responsible.status === 'terminated') {
    return { error: 'Responsável não pode estar desligado.' };
  }

  const { count } = await admin
    .from('development_plan_actions')
    .select('*', { count: 'exact', head: true })
    .eq('plan_id', planId);

  const { data: inserted, error } = await admin
    .from('development_plan_actions')
    .insert({
      plan_id: planId,
      company_id: ctx.companyId,
      title: value.title.trim(),
      due_date: value.dueDate,
      responsible_employee_id: value.responsibleEmployeeId,
      status: 'pendente',
      sort_order: count ?? 0,
    })
    .select('id')
    .single();
  if (error || !inserted) return { error: 'Erro ao criar ação.' };

  await logActivity({
    companyId: ctx.companyId,
    actorUserId: ctx.userId,
    action: 'pdi_action.created',
    entityType: 'development_plan_action',
    entityId: inserted.id,
    metadata: { plan_id: planId },
  });

  revalidatePath(`/pdi/${planId}`);
  return { ok: true, id: inserted.id };
}

export async function updateAction(actionId: string, input: PdiActionInput) {
  const ctx = await getActor();
  if (!ctx) return { error: 'Não autenticado.' };

  const parsed = PdiActionInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  const value = parsed.data;

  const admin = createAdminSupabaseClient();
  const { data: action } = await admin
    .from('development_plan_actions')
    .select('id, plan_id, company_id')
    .eq('id', actionId)
    .maybeSingle();
  if (!action || action.company_id !== ctx.companyId) {
    return { error: 'Ação não encontrada.' };
  }
  const plan = await loadPlan(action.plan_id);
  if (!plan || plan.deleted_at) return { error: 'PDI não encontrado.' };
  if (!canDo(ctx, 'pdi', 'edit') && plan.created_by !== ctx.userId) {
    return { error: 'Sem permissão.' };
  }

  const { data: responsible } = await admin
    .from('employees')
    .select('id, status, company_id')
    .eq('id', value.responsibleEmployeeId)
    .maybeSingle();
  if (!responsible || responsible.company_id !== ctx.companyId) {
    return { error: 'Responsável inválido.' };
  }
  if (responsible.status === 'terminated') {
    return { error: 'Responsável não pode estar desligado.' };
  }

  const { error } = await admin
    .from('development_plan_actions')
    .update({
      title: value.title.trim(),
      due_date: value.dueDate,
      responsible_employee_id: value.responsibleEmployeeId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', actionId);
  if (error) return { error: 'Erro ao atualizar ação.' };

  await logActivity({
    companyId: ctx.companyId,
    actorUserId: ctx.userId,
    action: 'pdi_action.updated',
    entityType: 'development_plan_action',
    entityId: actionId,
    metadata: { plan_id: plan.id, fields: ['title', 'due_date', 'responsible_employee_id'] },
  });

  revalidatePath(`/pdi/${plan.id}`);
  return { ok: true };
}

export async function updateActionStatus(actionId: string, status: PdiActionStatus) {
  const ctx = await getActor();
  if (!ctx) return { error: 'Não autenticado.' };

  const statusParsed = PdiActionStatusSchema.safeParse(status);
  if (!statusParsed.success) return { error: 'Status inválido.' };

  const admin = createAdminSupabaseClient();
  const { data: action } = await admin
    .from('development_plan_actions')
    .select('id, plan_id, responsible_employee_id, status, company_id')
    .eq('id', actionId)
    .maybeSingle();
  if (!action || action.company_id !== ctx.companyId) {
    return { error: 'Ação não encontrada.' };
  }

  const plan = await loadPlan(action.plan_id);
  if (!plan || plan.deleted_at) return { error: 'PDI não encontrado.' };

  const isAdmin = canDo(ctx, 'pdi', 'edit');
  const isResponsible = ctx.employeeId && action.responsible_employee_id === ctx.employeeId;
  if (!isAdmin && !isResponsible) {
    return { error: 'Sem permissão para atualizar esta ação.' };
  }

  if (!PDI_ACTION_STATUSES.includes(status)) return { error: 'Status inválido.' };

  const now = new Date().toISOString();
  const { error } = await admin
    .from('development_plan_actions')
    .update({ status, updated_at: now })
    .eq('id', actionId);
  if (error) return { error: 'Erro ao atualizar ação.' };

  if (action.status === 'pendente' && status !== 'pendente' && plan.status === 'nao_iniciado') {
    await admin
      .from('development_plans')
      .update({ status: 'em_andamento', updated_at: now })
      .eq('id', plan.id);
  }

  await logActivity({
    companyId: ctx.companyId,
    actorUserId: ctx.userId,
    action: 'pdi_action.updated',
    entityType: 'development_plan_action',
    entityId: actionId,
    metadata: { from: action.status, to: status, plan_id: plan.id },
  });

  revalidatePath(`/pdi/${plan.id}`);
  revalidatePath('/pdi');
  return { ok: true };
}

export async function removeAction(actionId: string) {
  const ctx = await getActor();
  if (!ctx) return { error: 'Não autenticado.' };
  const admin = createAdminSupabaseClient();
  const { data: action } = await admin
    .from('development_plan_actions')
    .select('id, plan_id, company_id')
    .eq('id', actionId)
    .maybeSingle();
  if (!action || action.company_id !== ctx.companyId) {
    return { error: 'Ação não encontrada.' };
  }
  const plan = await loadPlan(action.plan_id);
  if (!plan || plan.deleted_at) return { error: 'PDI não encontrado.' };
  if (!canDo(ctx, 'pdi', 'edit') && plan.created_by !== ctx.userId) {
    return { error: 'Sem permissão.' };
  }

  const { error } = await admin
    .from('development_plan_actions')
    .delete()
    .eq('id', actionId);
  if (error) return { error: 'Erro ao remover ação.' };

  revalidatePath(`/pdi/${plan.id}`);
  return { ok: true };
}

export async function addComment(planId: string, input: PdiCommentInput) {
  const ctx = await getActor();
  if (!ctx) return { error: 'Não autenticado.' };
  if (!ctx.employeeId) return { error: 'Você precisa ser um colaborador para comentar.' };

  const plan = await loadPlan(planId);
  if (!plan || plan.company_id !== ctx.companyId || plan.deleted_at) {
    return { error: 'PDI não encontrado.' };
  }

  const parsed = PdiCommentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const admin = createAdminSupabaseClient();

  const { data: inserted, error } = await admin
    .from('development_plan_comments')
    .insert({
      plan_id: planId,
      company_id: ctx.companyId,
      author_id: ctx.employeeId,
      body: parsed.data.body.trim(),
    })
    .select('id')
    .single();
  if (error || !inserted) return { error: 'Erro ao comentar.' };

  revalidatePath(`/pdi/${planId}`);
  return { ok: true, id: inserted.id };
}

export async function deleteComment(commentId: string) {
  const ctx = await getActor();
  if (!ctx) return { error: 'Não autenticado.' };
  const admin = createAdminSupabaseClient();
  const { data: c } = await admin
    .from('development_plan_comments')
    .select('id, plan_id, author_id, company_id, deleted_at')
    .eq('id', commentId)
    .maybeSingle();
  if (!c || c.company_id !== ctx.companyId || c.deleted_at) {
    return { error: 'Comentário não encontrado.' };
  }

  const isAuthor = ctx.employeeId && c.author_id === ctx.employeeId;
  if (!isAuthor && !canDo(ctx, 'pdi', 'edit')) return { error: 'Sem permissão.' };

  const { error } = await admin
    .from('development_plan_comments')
    .update({ deleted_at: new Date().toISOString(), deleted_by: ctx.userId })
    .eq('id', commentId);
  if (error) return { error: 'Erro ao remover comentário.' };

  revalidatePath(`/pdi/${c.plan_id}`);
  return { ok: true };
}
