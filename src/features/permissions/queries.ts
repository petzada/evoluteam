import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { EMPTY_RH_PERMISSIONS, type RhPermissions, type Role } from './types';

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
