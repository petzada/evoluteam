import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function getCurrentProfile() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('id, company_id, role, full_name, phone, avatar_url')
    .eq('id', user.id)
    .single();
  return data;
}

export async function getCurrentUserEmployee(companyId: string, userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('employees')
    .select(`
      id, full_name, email, hire_date,
      position:positions(name),
      department:departments(name)
    `)
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .maybeSingle();
  return data;
}
