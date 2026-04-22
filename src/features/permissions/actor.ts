// Loader central de Actor para uso em server actions e RSC.
// Spec: docs/dev/21-ft-9-redesign-acessos.md §4.

import 'server-only';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import type { Actor, Role, ScreenPermissions } from './types';

/**
 * Carrega o Actor do request atual.
 *
 * Faz:
 *   1. auth.getUser() via cookies.
 *   2. select em profiles (company_id, role).
 *   3. select em employees por user_id (para employeeId e employeeStatus).
 *   4. se role === 'user', select em user_screen_permissions.
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

  let screenPermissions: ScreenPermissions | null = null;
  if (role === 'user') {
    const admin = createAdminSupabaseClient();
    const { data: usp } = await admin
      .from('user_screen_permissions')
      .select('permissions')
      .eq('profile_id', user.id)
      .maybeSingle();
    screenPermissions = (usp?.permissions as ScreenPermissions | undefined) ?? {};
  }

  return {
    userId: user.id,
    companyId: profile.company_id,
    role,
    employeeId: emp?.id ?? null,
    employeeStatus: (emp?.status as Actor['employeeStatus']) ?? null,
    screenPermissions,
  };
}
