import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  EMPTY_RH_PERMISSIONS,
  type RhPermissions,
  type Role,
  type ScreenPermissions,
} from './types';

/**
 * Carrega rhPermissions do usuario apenas se role='rh'. Para outros roles
 * retorna null (suficiente para hasAdminPower que ja sabe ignorar).
 *
 * Use nas pages que precisam fazer gates granulares — evita 5 linhas
 * boilerplate em cada Server Component.
 */
export async function loadActorRhPermissions(
  userId: string,
  role: string,
): Promise<RhPermissions | null> {
  if (role !== 'rh') return null;
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from('rh_permissions')
    .select('can_employees, can_reviews, can_recruitment, can_pdi_feedback, can_invites, can_audit')
    .eq('profile_id', userId)
    .maybeSingle();
  return data ?? null;
}

/**
 * Carrega screenPermissions do usuario (FT-9). So existe registro se
 * profile.role in ('user', 'rh'). Admin/Diretor retornam null.
 * Use nas pages Server Component que precisam montar o actor para canDo.
 */
export async function loadActorScreenPermissions(
  userId: string,
  role: string,
): Promise<ScreenPermissions | null> {
  if (role !== 'user' && role !== 'rh') return null;
  const admin = createAdminSupabaseClient();
  const { data } = await admin
    .from('user_screen_permissions')
    .select('permissions')
    .eq('profile_id', userId)
    .maybeSingle();
  return (data?.permissions as ScreenPermissions | undefined) ?? {};
}

/**
 * Helper combinado: carrega rhPermissions + screenPermissions numa chamada.
 * Util para pages que precisam passar ambos ao actor de gates.
 */
export async function loadActorGate(
  userId: string,
  role: string,
): Promise<{
  rhPermissions: RhPermissions | null;
  screenPermissions: ScreenPermissions | null;
}> {
  const [rhPermissions, screenPermissions] = await Promise.all([
    loadActorRhPermissions(userId, role),
    loadActorScreenPermissions(userId, role),
  ]);
  return { rhPermissions, screenPermissions };
}

/**
 * Carrega role + permissions atuais de um usuario, para preencher o
 * AccessForm em modo edicao (drawer "Gerenciar acesso").
 */
export async function getUserAccess(
  profileId: string,
): Promise<{
  profileId: string;
  fullName: string;
  email: string;
  role: Role;
  rhPermissions: RhPermissions;
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

  let rhPermissions: RhPermissions = { ...EMPTY_RH_PERMISSIONS };
  if (profile.role === 'rh') {
    const { data } = await admin
      .from('rh_permissions')
      .select('can_employees, can_reviews, can_recruitment, can_pdi_feedback, can_invites, can_audit')
      .eq('profile_id', profileId)
      .maybeSingle();
    if (data) rhPermissions = data;
  }

  return {
    profileId: profile.id,
    fullName: profile.full_name,
    email: authUser?.email ?? '',
    role: profile.role as Role,
    rhPermissions,
  };
}
