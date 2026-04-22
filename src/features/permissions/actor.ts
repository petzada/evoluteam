// Loader central de Actor para uso em server actions e RSC.
// Spec: docs/dev/19-ft-8-granularidade-rh.md §7.
// Fatia 1: arquivo novo. Server actions existentes continuam com getActor
// local proprio ate a Fatia 2 (refatoracao incremental).

import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { Actor, RhPermissions, Role, ScreenPermissions } from './types';

/**
 * Carrega o Actor do request atual.
 *
 * Faz:
 *   1. auth.getUser() via cookies.
 *   2. select em profiles (company_id, role).
 *   3. select em employees por user_id (para employeeId e employeeStatus).
 *   4. se role === 'rh', select em rh_permissions (via admin client para
 *      bypass de RLS — o helper has_rh_permission no banco tambem usa
 *      SECURITY DEFINER, entao a leitura direta so depende de RLS dar
 *      acesso ao proprio registro, o que rh_permissions_select_self ja faz).
 *
 * Retorna null se nao houver usuario autenticado ou se profile nao tiver
 * company_id (convite ainda nao aceito).
 */
export async function getActor(): Promise<Actor | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) return null;

  const role = profile.role as Role;

  const { data: emp } = await supabase
    .from('employees')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('company_id', profile.company_id)
    .maybeSingle();

  let rhPermissions: RhPermissions | null = null;
  if (role === 'rh') {
    // Admin client para garantir leitura mesmo se RLS tiver edge case.
    // A policy rh_permissions_select_self ja permite, mas usamos admin
    // por defesa em profundidade (e evita bater contra RLS em dev local).
    const admin = createAdminSupabaseClient();
    const { data: perms } = await admin
      .from('rh_permissions')
      .select('can_employees, can_reviews, can_recruitment, can_pdi_feedback, can_invites, can_audit')
      .eq('profile_id', user.id)
      .maybeSingle();
    if (perms) {
      rhPermissions = perms;
    } else {
      // Trigger sync_rh_permissions_on_role_change deveria ter criado o
      // registro. Se nao tem, retorna tudo false em vez de null (seguranca).
      rhPermissions = {
        can_employees: false,
        can_reviews: false,
        can_recruitment: false,
        can_pdi_feedback: false,
        can_invites: false,
        can_audit: false,
      };
    }
  }

  // FT-9 — carrega permissoes por tela para user/rh. Admin/Diretor ficam null
  // (pacotes fechados, canDo trata por bypass de role).
  let screenPermissions: ScreenPermissions | null = null;
  if (role === 'user' || role === 'rh') {
    const admin = createAdminSupabaseClient();
    const { data: usp } = await admin
      .from('user_screen_permissions')
      .select('permissions')
      .eq('profile_id', user.id)
      .maybeSingle();
    screenPermissions = (usp?.permissions as ScreenPermissions) ?? {};
  }

  return {
    userId: user.id,
    companyId: profile.company_id,
    role,
    employeeId: emp?.id ?? null,
    employeeStatus: (emp?.status as Actor['employeeStatus']) ?? null,
    rhPermissions,
    screenPermissions,
  };
}
