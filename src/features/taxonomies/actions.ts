'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import type { TaxonomyInput } from './schema';

async function getActorContext() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) return null;
  return { user, profile: profile as { company_id: string; role: string } };
}

export type Kind = 'department' | 'position' | 'competency';

function tableFor(kind: Kind) {
  if (kind === 'department') return 'departments';
  if (kind === 'position') return 'positions';
  return 'competencies';
}

function routeFor(kind: Kind) {
  if (kind === 'department') return '/configuracoes/departamentos';
  if (kind === 'position') return '/configuracoes/cargos';
  return '/configuracoes/competencias';
}

function labelFor(kind: Kind) {
  if (kind === 'department') return 'Departamento';
  if (kind === 'position') return 'Cargo';
  return 'Competência';
}

function actionFor(kind: Kind, verb: 'created' | 'updated' | 'archived' | 'deleted') {
  const base = kind === 'department' ? 'department' : kind === 'position' ? 'role' : 'competency';
  return `${base}.${verb}` as const;
}

async function countUsage(kind: Kind, id: string, companyId: string): Promise<number> {
  const admin = createAdminSupabaseClient();

  if (kind === 'department' || kind === 'position') {
    const column = kind === 'department' ? 'department_id' : 'position_id';
    const { count } = await admin
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq(column, id)
      .eq('company_id', companyId);
    return count ?? 0;
  }

  const [q, f, p] = await Promise.all([
    admin.from('review_questions').select('*', { count: 'exact', head: true })
      .eq('competency_id', id).eq('company_id', companyId),
    admin.from('feedbacks').select('*', { count: 'exact', head: true })
      .eq('competency_id', id).eq('company_id', companyId),
    admin.from('development_plans').select('*', { count: 'exact', head: true })
      .eq('competency_id', id).eq('company_id', companyId),
  ]);
  return (q.count ?? 0) + (f.count ?? 0) + (p.count ?? 0);
}

export async function createTaxonomy(kind: Kind, input: TaxonomyInput) {
  const ctx = await getActorContext();
  if (!ctx || ctx.profile.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from(tableFor(kind))
    .insert({ company_id: ctx.profile.company_id, name: input.name.trim() })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: `Já existe ${kind === 'competency' ? 'uma' : 'um'} ${labelFor(kind).toLowerCase()} com esse nome.` };
    }
    return { error: `Erro ao criar ${labelFor(kind).toLowerCase()}.` };
  }

  await logActivity({
    companyId: ctx.profile.company_id,
    actorUserId: ctx.user.id,
    action: actionFor(kind, 'created'),
    entityType: kind,
    entityId: data.id,
    metadata: { name: input.name.trim() },
  });

  revalidatePath(routeFor(kind));
  return { ok: true, id: data.id };
}

export async function updateTaxonomy(kind: Kind, id: string, input: TaxonomyInput) {
  const ctx = await getActorContext();
  if (!ctx || ctx.profile.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from(tableFor(kind))
    .update({ name: input.name.trim() })
    .eq('id', id)
    .eq('company_id', ctx.profile.company_id);

  if (error) {
    if (error.code === '23505') {
      return { error: `Já existe ${kind === 'competency' ? 'uma' : 'um'} ${labelFor(kind).toLowerCase()} com esse nome.` };
    }
    return { error: `Erro ao atualizar ${labelFor(kind).toLowerCase()}.` };
  }

  await logActivity({
    companyId: ctx.profile.company_id,
    actorUserId: ctx.user.id,
    action: actionFor(kind, 'updated'),
    entityType: kind,
    entityId: id,
  });

  revalidatePath(routeFor(kind));
  return { ok: true };
}

export async function archiveTaxonomy(kind: Kind, id: string, archived: boolean) {
  const ctx = await getActorContext();
  if (!ctx || ctx.profile.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from(tableFor(kind))
    .update({ is_archived: archived })
    .eq('id', id)
    .eq('company_id', ctx.profile.company_id);

  if (error) return { error: `Erro ao ${archived ? 'arquivar' : 'desarquivar'}.` };

  await logActivity({
    companyId: ctx.profile.company_id,
    actorUserId: ctx.user.id,
    action: archived ? actionFor(kind, 'archived') : actionFor(kind, 'updated'),
    entityType: kind,
    entityId: id,
  });

  revalidatePath(routeFor(kind));
  return { ok: true };
}

export async function deleteTaxonomy(kind: Kind, id: string) {
  const ctx = await getActorContext();
  if (!ctx || ctx.profile.role !== 'admin_rh') return { error: 'Sem permissão.' };

  const count = await countUsage(kind, id, ctx.profile.company_id);
  if (count > 0) {
    if (kind === 'competency') {
      return { error: 'Remova as referências em avaliações, feedbacks ou PDIs antes de deletar.' };
    }
    return { error: 'Remova os colaboradores vinculados antes de deletar.' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from(tableFor(kind))
    .delete()
    .eq('id', id)
    .eq('company_id', ctx.profile.company_id);

  if (error) return { error: `Erro ao deletar ${labelFor(kind).toLowerCase()}.` };

  await logActivity({
    companyId: ctx.profile.company_id,
    actorUserId: ctx.user.id,
    action: actionFor(kind, 'deleted'),
    entityType: kind,
    entityId: id,
  });

  revalidatePath(routeFor(kind));
  return { ok: true };
}
