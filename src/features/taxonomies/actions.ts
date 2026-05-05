'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { getActor } from '@/features/permissions/actor';
import { canDo } from '@/features/permissions/permissions';
import type { ScreenKey } from '@/features/permissions/types';
import { createUnit } from '@/features/units/actions';
import type { TaxonomyInput } from './schema';

async function getActorContext() {
  const actor = await getActor();
  if (!actor) return null;
  return {
    actor,
    user: { id: actor.userId },
    profile: { company_id: actor.companyId, role: actor.role as string },
  };
}

// FT-10: 'unit' delega para createUnit (feature units), preservando assinatura
// (kind, { name }) -> { id?, error? } usada pelos selects com inline-create.
// Os helpers internos abaixo so trabalham com os kinds da TaxonomyList classica
// (departments/positions/competencies) — 'unit' tem fluxo proprio em src/features/units.
export type Kind = 'department' | 'position' | 'competency' | 'unit';
type ClassicKind = Exclude<Kind, 'unit'>;

// FT-9: cada kind tem sua tela especifica em vez do gate generico can_employees.
function screenFor(kind: ClassicKind): ScreenKey {
  if (kind === 'department') return 'departamentos';
  if (kind === 'position') return 'cargos';
  return 'competencias';
}

function canManageKind(actor: Parameters<typeof canDo>[0], kind: ClassicKind): boolean {
  return canDo(actor, screenFor(kind), 'edit');
}

function tableFor(kind: ClassicKind) {
  if (kind === 'department') return 'departments';
  if (kind === 'position') return 'positions';
  return 'competencies';
}

function routeFor(kind: ClassicKind) {
  if (kind === 'department') return '/configuracoes/departamentos';
  if (kind === 'position') return '/configuracoes/cargos';
  return '/configuracoes/competencias';
}

function labelFor(kind: ClassicKind) {
  if (kind === 'department') return 'Departamento';
  if (kind === 'position') return 'Cargo';
  return 'Competência';
}

function actionFor(kind: ClassicKind, verb: 'created' | 'updated' | 'archived' | 'deleted') {
  const base = kind === 'department' ? 'department' : kind === 'position' ? 'role' : 'competency';
  return `${base}.${verb}` as const;
}

async function countUsage(kind: ClassicKind, id: string, companyId: string): Promise<number> {
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
  // FT-10: unidades vivem em business_units (lookup separado) e tem schema/policies
  // proprias. Delegamos para a feature units, mantendo a interface uniforme dos
  // selects de inline-create.
  if (kind === 'unit') {
    return createUnit({ name: input.name });
  }
  const classicKind: ClassicKind = kind;

  const ctx = await getActorContext();
  if (!ctx || !canManageKind(ctx.actor, classicKind)) return { error: 'Sem permissão.' };

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from(tableFor(classicKind))
    .insert({ company_id: ctx.profile.company_id, name: input.name.trim() })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: `Já existe ${classicKind === 'competency' ? 'uma' : 'um'} ${labelFor(classicKind).toLowerCase()} com esse nome.` };
    }
    return { error: `Erro ao criar ${labelFor(classicKind).toLowerCase()}.` };
  }

  await logActivity({
    companyId: ctx.profile.company_id,
    actorUserId: ctx.user.id,
    action: actionFor(classicKind, 'created'),
    entityType: classicKind,
    entityId: data.id,
    metadata: { name: input.name.trim() },
  });

  revalidatePath(routeFor(classicKind));
  return { ok: true, id: data.id };
}

export async function updateTaxonomy(kind: ClassicKind, id: string, input: TaxonomyInput) {
  const ctx = await getActorContext();
  if (!ctx || !canManageKind(ctx.actor, kind)) return { error: 'Sem permissão.' };

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

export async function archiveTaxonomy(kind: ClassicKind, id: string, archived: boolean) {
  const ctx = await getActorContext();
  if (!ctx || !canManageKind(ctx.actor, kind)) return { error: 'Sem permissão.' };

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

export async function deleteTaxonomy(kind: ClassicKind, id: string) {
  const ctx = await getActorContext();
  if (!ctx || !canManageKind(ctx.actor, kind)) return { error: 'Sem permissão.' };

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
