'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { getActor } from './actor';
import { canChangeUserAccess } from './permissions';
import { EMPTY_RH_PERMISSIONS, type RhPermissions, type Role } from './types';

type Result<T = { ok: true }> = T | { error: string; code?: string };

/**
 * Atualiza o role e (se role='rh') os toggles de permissao de um
 * usuario existente. Substitui a antiga `updateRole` com suporte
 * granular e seguranca contra escalacao.
 *
 * Regras:
 *   - Admin_rh pode alterar qualquer outro usuario para qualquer role.
 *   - RH com can_invites pode alterar Colaboradores mantendo-os como
 *     Colaborador (ou seja, nao escala — P8 · C).
 *   - Ninguem pode alterar o proprio role/toggles.
 *   - Se role mudar para 'rh', trigger no banco cria rh_permissions
 *     com tudo false. Depois, se newPermissions vier, aplicamos UPSERT.
 *   - Se role sair de 'rh', trigger apaga rh_permissions.
 *   - Preserva o invariante "empresa precisa de ao menos um Admin".
 *   - Grava user.role_changed e/ou user.permissions_changed em audit.
 */
export async function updateUserAccess(input: {
  profileId: string;
  newRole: Role;
  newPermissions?: Partial<RhPermissions>;
}): Promise<Result> {
  const actor = await getActor();
  if (!actor) return { error: 'Nao autenticado.' };

  const supabase = await createServerSupabaseClient();
  const { data: targetProfile, error: tErr } = await supabase
    .from('profiles')
    .select('id, role, company_id')
    .eq('id', input.profileId)
    .single();

  if (tErr || !targetProfile) return { error: 'Usuario nao encontrado.' };
  if (targetProfile.company_id !== actor.companyId) {
    return { error: 'Usuario de outra empresa.' };
  }

  const currentRole = targetProfile.role as Role;
  const allowed = canChangeUserAccess(
    actor,
    { userId: targetProfile.id, role: currentRole },
    input.newRole,
  );
  if (!allowed) return { error: 'Sem permissao para esta mudanca.', code: 'FORBIDDEN' };

  // Invariante: ao menos 1 admin_rh ativo na empresa.
  if (currentRole === 'admin_rh' && input.newRole !== 'admin_rh') {
    const admin = createAdminSupabaseClient();
    const { count } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', actor.companyId)
      .eq('role', 'admin_rh');
    if ((count ?? 0) <= 1) {
      return { error: 'A empresa precisa de ao menos um Administrador.', code: 'LAST_ADMIN' };
    }
  }

  const previousPermissions: RhPermissions | null =
    currentRole === 'rh'
      ? await readRhPermissions(input.profileId)
      : null;

  // 1. Atualiza role (trigger cuida de criar/apagar rh_permissions).
  if (currentRole !== input.newRole) {
    const { error: uErr } = await supabase
      .from('profiles')
      .update({ role: input.newRole })
      .eq('id', input.profileId)
      .eq('company_id', actor.companyId);
    if (uErr) return { error: 'Falha ao atualizar papel.' };

    await logActivity({
      companyId: actor.companyId,
      actorUserId: actor.userId,
      action: 'user.role_changed',
      entityType: 'profile',
      entityId: input.profileId,
      metadata: { before: currentRole, after: input.newRole },
    });
  }

  // 2. Se terminamos em role=rh e vierem toggles, UPSERT em rh_permissions.
  if (input.newRole === 'rh' && input.newPermissions) {
    const admin = createAdminSupabaseClient();
    const newPerms = { ...EMPTY_RH_PERMISSIONS, ...input.newPermissions };
    const { error: pErr } = await admin
      .from('rh_permissions')
      .upsert({
        profile_id: input.profileId,
        company_id: actor.companyId,
        ...newPerms,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });
    if (pErr) return { error: 'Falha ao atualizar permissoes do RH.' };

    const permsChanged =
      !previousPermissions
      || (Object.keys(newPerms) as (keyof RhPermissions)[]).some(
        (k) => previousPermissions[k] !== newPerms[k],
      );

    if (permsChanged) {
      await logActivity({
        companyId: actor.companyId,
        actorUserId: actor.userId,
        action: 'user.permissions_changed',
        entityType: 'profile',
        entityId: input.profileId,
        metadata: {
          before: previousPermissions ?? EMPTY_RH_PERMISSIONS,
          after: newPerms,
        },
      });
    }
  }

  revalidatePath('/colaboradores');
  revalidatePath(`/colaboradores/${input.profileId}`);
  // Invalida o layout do (app) tambem — a Sidebar le rhPermissions e
  // muda os items visiveis quando os toggles do RH afetado mudam.
  revalidatePath('/', 'layout');
  return { ok: true };
}

async function readRhPermissions(profileId: string): Promise<RhPermissions | null> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from('rh_permissions')
    .select('can_employees, can_reviews, can_recruitment, can_pdi_feedback, can_invites, can_audit')
    .eq('profile_id', profileId)
    .maybeSingle();
  return data ?? null;
}
