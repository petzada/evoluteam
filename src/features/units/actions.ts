'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { getActor } from '@/features/permissions/actor';
import { BusinessUnitSchema, type BusinessUnitInput } from './schema';
import { canManageUnits } from './permissions';

const ROUTE = '/configuracoes/unidades';

async function getActorContext() {
  const actor = await getActor();
  if (!actor) return null;
  return {
    actor,
    user: { id: actor.userId },
    profile: { company_id: actor.companyId, role: actor.role as string },
  };
}

export async function createUnit(input: BusinessUnitInput) {
  const ctx = await getActorContext();
  if (!ctx) return { error: 'Nao autenticado.' };
  if (!canManageUnits(ctx.actor)) return { error: 'Sem permissao.' };

  const parsed = BusinessUnitSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados invalidos.' };
  }
  const name = parsed.data.name;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('business_units')
    .insert({ company_id: ctx.profile.company_id, name })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ja existe uma unidade com esse nome.' };
    }
    return { error: 'Erro ao criar unidade.' };
  }

  await logActivity({
    companyId: ctx.profile.company_id,
    actorUserId: ctx.user.id,
    action: 'business_unit.created',
    entityType: 'business_unit',
    entityId: data.id,
    metadata: { unit_id: data.id, name },
  });

  revalidatePath(ROUTE);
  return { ok: true, id: data.id };
}

export async function updateUnit(id: string, input: BusinessUnitInput) {
  const ctx = await getActorContext();
  if (!ctx) return { error: 'Nao autenticado.' };
  if (!canManageUnits(ctx.actor)) return { error: 'Sem permissao.' };

  const parsed = BusinessUnitSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados invalidos.' };
  }
  const name = parsed.data.name;

  const supabase = await createServerSupabaseClient();
  const { data: prev } = await supabase
    .from('business_units')
    .select('name')
    .eq('id', id)
    .eq('company_id', ctx.profile.company_id)
    .maybeSingle();
  if (!prev) return { error: 'Unidade nao encontrada.' };

  const { error } = await supabase
    .from('business_units')
    .update({ name })
    .eq('id', id)
    .eq('company_id', ctx.profile.company_id);

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ja existe uma unidade com esse nome.' };
    }
    return { error: 'Erro ao atualizar unidade.' };
  }

  await logActivity({
    companyId: ctx.profile.company_id,
    actorUserId: ctx.user.id,
    action: 'business_unit.updated',
    entityType: 'business_unit',
    entityId: id,
    metadata: { unit_id: id, name_before: prev.name, name_after: name },
  });

  revalidatePath(ROUTE);
  return { ok: true };
}

export async function archiveUnit(id: string) {
  return setArchived(id, true);
}

export async function unarchiveUnit(id: string) {
  return setArchived(id, false);
}

async function setArchived(id: string, archived: boolean) {
  const ctx = await getActorContext();
  if (!ctx) return { error: 'Nao autenticado.' };
  if (!canManageUnits(ctx.actor)) return { error: 'Sem permissao.' };

  const supabase = await createServerSupabaseClient();
  const { data: prev } = await supabase
    .from('business_units')
    .select('name')
    .eq('id', id)
    .eq('company_id', ctx.profile.company_id)
    .maybeSingle();
  if (!prev) return { error: 'Unidade nao encontrada.' };

  const { error } = await supabase
    .from('business_units')
    .update({ is_archived: archived })
    .eq('id', id)
    .eq('company_id', ctx.profile.company_id);

  if (error) {
    return { error: `Erro ao ${archived ? 'arquivar' : 'desarquivar'}.` };
  }

  await logActivity({
    companyId: ctx.profile.company_id,
    actorUserId: ctx.user.id,
    action: archived ? 'business_unit.archived' : 'business_unit.unarchived',
    entityType: 'business_unit',
    entityId: id,
    metadata: { unit_id: id, name: prev.name },
  });

  revalidatePath(ROUTE);
  return { ok: true };
}

export async function deleteUnit(id: string) {
  const ctx = await getActorContext();
  if (!ctx) return { error: 'Nao autenticado.' };
  if (!canManageUnits(ctx.actor)) return { error: 'Sem permissao.' };

  const admin = createAdminSupabaseClient();
  const { count } = await admin
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('unit_id', id)
    .eq('company_id', ctx.profile.company_id);
  if ((count ?? 0) > 0) {
    return { error: 'Remova os colaboradores vinculados antes de deletar.' };
  }

  const supabase = await createServerSupabaseClient();
  const { data: prev } = await supabase
    .from('business_units')
    .select('name')
    .eq('id', id)
    .eq('company_id', ctx.profile.company_id)
    .maybeSingle();
  if (!prev) return { error: 'Unidade nao encontrada.' };

  const { error } = await supabase
    .from('business_units')
    .delete()
    .eq('id', id)
    .eq('company_id', ctx.profile.company_id);

  if (error) return { error: 'Erro ao deletar unidade.' };

  await logActivity({
    companyId: ctx.profile.company_id,
    actorUserId: ctx.user.id,
    action: 'business_unit.deleted',
    entityType: 'business_unit',
    entityId: id,
    metadata: { unit_id: id, name: prev.name },
  });

  revalidatePath(ROUTE);
  return { ok: true };
}
