import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Role, ScreenPermissions } from './types';

/**
 * Carrega screenPermissions do usuario. So existe registro se profile.role='user'.
 * Admin/Diretor retornam null.
 *
 * Use nas pages Server Component que precisam montar o actor para canDo.
 */
export async function loadActorScreenPermissions(
  userId: string,
  role: string,
): Promise<ScreenPermissions | null> {
  if (role !== 'user') return null;
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from('user_screen_permissions')
    .select('permissions')
    .eq('profile_id', userId)
    .maybeSingle();
  return (data?.permissions as ScreenPermissions | undefined) ?? {};
}

/**
 * Alias wrapper para compat das pages que ja usam loadActorGate. Retorna um
 * objeto pronto pra spread em actor = { role, ...gate }.
 */
export async function loadActorGate(
  userId: string,
  role: string,
): Promise<{ screenPermissions: ScreenPermissions | null }> {
  const screenPermissions = await loadActorScreenPermissions(userId, role);
  return { screenPermissions };
}

/**
 * Carrega role + screenPermissions atuais de um usuario, para preencher o
 * AccessForm em modo edicao (drawer "Gerenciar acesso").
 */
export async function getUserAccess(
  profileId: string,
): Promise<{
  profileId: string;
  fullName: string;
  email: string;
  role: Role;
  screenPermissions: ScreenPermissions;
} | null> {
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role, company_id')
    .eq('id', profileId)
    .single();
  if (!profile) return null;

  // email vive em auth.users; usa admin client.
  const admin = createAdminSupabaseClient();
  const { data: { user: authUser } } = await admin.auth.admin.getUserById(profileId);

  let screenPermissions: ScreenPermissions = {};
  if (profile.role === 'user') {
    const { data } = await admin
      .from('user_screen_permissions')
      .select('permissions')
      .eq('profile_id', profileId)
      .maybeSingle();
    if (data?.permissions) screenPermissions = data.permissions as ScreenPermissions;
  }

  return {
    profileId: profile.id,
    fullName: profile.full_name,
    email: authUser?.email ?? '',
    role: profile.role as Role,
    screenPermissions,
  };
}
