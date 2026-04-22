'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { logActivity } from '@/lib/activity';
import { getActor } from './actor';
import {
  canChangeUserAccess,
  canGrantScreenPermissions,
  normalizeScreenPermissions,
} from './permissions';
import {
  EMPTY_SCREEN_PERMISSIONS,
  type Role,
  type ScreenPermissions,
  type ScreenPermissionKey,
} from './types';

type Result<T = { ok: true }> = T | { error: string; code?: string };

/**
 * Atualiza o role e (se role='user') os toggles de permissao por tela de um
 * usuario existente. FT-9 substitui a antiga rh_permissions por
 * user_screen_permissions.
 *
 * Regras:
 *   - Admin_rh pode alterar qualquer outro usuario para qualquer role.
 *   - Colaborador com colaboradores.edit pode alterar Colaboradores mantendo
 *     o papel (nao escala), e apenas com toggles subset dos proprios.
 *   - Ninguem pode alterar o proprio role/toggles.
 *   - Se role mudar para 'user', trigger no banco cria user_screen_permissions
 *     vazio. Depois, se newScreenPermissions vier, aplicamos UPSERT.
 *   - Se role sair de 'user' (virando director/admin_rh), trigger apaga.
 *   - Preserva o invariante "empresa precisa de ao menos um Admin".
 *   - Grava user.role_changed e/ou user.permissions_changed em audit.
 */
export async function updateUserAccess(input: {
  profileId: string;
  newRole: Role;
  newScreenPermissions?: ScreenPermissions;
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

  // Validacao de escalacao: actor nao-admin so concede toggles subset dos proprios.
  if (
    actor.role !== 'admin_rh'
    && input.newRole === 'user'
    && input.newScreenPermissions
    && !canGrantScreenPermissions(actor, normalizeScreenPermissions(input.newScreenPermissions))
  ) {
    return {
      error: 'Voce nao pode conceder permissoes que voce mesmo nao possui.',
      code: 'ESCALATION_DENIED',
    };
  }

  const previousPermissions: ScreenPermissions | null =
    currentRole === 'user'
      ? await readScreenPermissions(input.profileId)
      : null;

  // 1. Atualiza role (trigger cuida de criar/apagar user_screen_permissions).
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

  // 2. Se terminamos em role=user e vierem toggles, UPSERT em user_screen_permissions.
  if (input.newRole === 'user' && input.newScreenPermissions) {
    const admin = createAdminSupabaseClient();
    const newPerms = normalizeScreenPermissions(input.newScreenPermissions);
    const { error: pErr } = await admin
      .from('user_screen_permissions')
      .upsert({
        profile_id: input.profileId,
        company_id: actor.companyId,
        permissions: newPerms,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'profile_id' });
    if (pErr) return { error: 'Falha ao atualizar permissoes.' };

    const permsChanged = permissionsDiffer(previousPermissions ?? {}, newPerms);
    if (permsChanged) {
      await logActivity({
        companyId: actor.companyId,
        actorUserId: actor.userId,
        action: 'user.permissions_changed',
        entityType: 'profile',
        entityId: input.profileId,
        metadata: {
          before: previousPermissions ?? EMPTY_SCREEN_PERMISSIONS,
          after: newPerms,
        },
      });
    }
  }

  revalidatePath('/colaboradores');
  revalidatePath(`/colaboradores/${input.profileId}`);
  // Invalida layout (app) porque a Sidebar le screenPermissions.
  revalidatePath('/', 'layout');
  return { ok: true };
}

async function readScreenPermissions(profileId: string): Promise<ScreenPermissions | null> {
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from('user_screen_permissions')
    .select('permissions')
    .eq('profile_id', profileId)
    .maybeSingle();
  return (data?.permissions as ScreenPermissions | undefined) ?? null;
}

function permissionsDiffer(a: ScreenPermissions, b: ScreenPermissions): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const ak = k as ScreenPermissionKey;
    if ((a[ak] ?? false) !== (b[ak] ?? false)) return true;
  }
  return false;
}
