import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadActorGate } from '@/features/permissions/queries';
import { hasOpenJobAsHiringManager } from '@/features/recruitment/queries/jobOpenings';
import type { ScreenPermissions } from '@/features/permissions/types';

export type ActorContext = {
  user: { id: string; email: string | null };
  profile: {
    id: string;
    role: 'admin_rh' | 'director' | 'user';
    company_id: string;
    full_name: string;
    avatar_url: string | null;
    company: { name: string; status: string } | null;
  };
  employee: { id: string; status: 'active' | 'inactive' | 'terminated' } | null;
  isManager: boolean;
  isHiringManager: boolean;
  gate: { screenPermissions: ScreenPermissions | null };
};

export const getActorContext = cache(async (): Promise<ActorContext> => {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('id, role, company_id, full_name, avatar_url, company:companies(name, status)')
    .eq('id', user.id)
    .single();

  if (!profileRow) redirect('/login');
  if (!profileRow.company_id) redirect('/onboarding/criar-empresa');

  const company = (profileRow.company ?? null) as { name: string; status: string } | null;
  if (company?.status === 'suspended') redirect('/conta-suspensa');

  const { data: employee } = await supabase
    .from('employees')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('company_id', profileRow.company_id)
    .maybeSingle();

  if (employee?.status === 'terminated') {
    await supabase.auth.signOut();
    redirect('/login?error=conta_desligada');
  }

  const [directReportsRes, isHiringManager, gate] = await Promise.all([
    employee?.id
      ? supabase
          .from('employees')
          .select('*', { count: 'exact', head: true })
          .eq('manager_id', employee.id)
      : Promise.resolve({ count: 0 as number | null }),
    employee?.id
      ? hasOpenJobAsHiringManager(profileRow.company_id, employee.id)
      : Promise.resolve(false),
    loadActorGate(user.id, profileRow.role),
  ]);

  return {
    user: { id: user.id, email: user.email ?? null },
    profile: {
      id: profileRow.id,
      role: profileRow.role as 'admin_rh' | 'director' | 'user',
      company_id: profileRow.company_id,
      full_name: profileRow.full_name,
      avatar_url: profileRow.avatar_url,
      company,
    },
    employee: employee as ActorContext['employee'],
    isManager: (directReportsRes.count ?? 0) > 0,
    isHiringManager,
    gate,
  };
});
