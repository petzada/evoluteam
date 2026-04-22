import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadActorGate } from '@/features/permissions/queries';
import { canAccessRecruitmentModule } from '@/features/recruitment/permissions';
import { hasOpenJobAsHiringManager } from '@/features/recruitment/queries/jobOpenings';

export default async function RecrutamentoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const { data: employeeRow } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .eq('company_id', profile.company_id)
    .maybeSingle();

  const [gate, isHiringManager] = await Promise.all([
    loadActorGate(user.id, profile.role),
    hasOpenJobAsHiringManager(profile.company_id, employeeRow?.id ?? null),
  ]);

  const actor = {
    role: profile.role,
    employeeId: employeeRow?.id ?? null,
    isHiringManager,
    ...gate,
  };

  if (!canAccessRecruitmentModule(actor)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
