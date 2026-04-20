import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function listEmployees(companyId: string, search?: string) {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('employees')
    .select(`
      id, full_name, email, phone, status, hire_date, user_id, created_at,
      position:positions(id, name),
      department:departments(id, name),
      manager:employees!manager_id(id, full_name),
      invite:invites(id, token, role, expires_at, accepted_at, revoked_at, created_at)
    `)
    .eq('company_id', companyId)
    .order('full_name');

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getEmployee(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('employees')
    .select(`
      id, full_name, email, phone, status, hire_date, user_id,
      position:positions(id, name),
      department:departments(id, name),
      manager:employees!manager_id(id, full_name),
      invite:invites(id, role, expires_at, accepted_at, revoked_at)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function getPositions(companyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('positions')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('is_archived', false)
    .order('name');
  return data ?? [];
}

export async function getDepartments(companyId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('departments')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('is_archived', false)
    .order('name');
  return data ?? [];
}

export async function getProfile(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, company_id, role, full_name, phone, avatar_url')
    .eq('id', userId)
    .single();
  return data;
}

export async function getDashboardKpis(companyId: string) {
  const supabase = await createServerSupabaseClient();

  const [{ count: activeCount }, { count: pendingCount }, { count: deptCount }] =
    await Promise.all([
      supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active'),
      supabase
        .from('invites')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .is('accepted_at', null)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString()),
      supabase
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_archived', false),
    ]);

  return {
    activeEmployees: activeCount ?? 0,
    pendingInvites: pendingCount ?? 0,
    departments: deptCount ?? 0,
  };
}
