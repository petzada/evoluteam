import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getDepartments, getPositions } from '@/features/employees/queries';
import { listHiringManagerOptions } from '@/features/recruitment/queries/jobOpenings';
import { NovaVagaClient } from './NovaVagaClient';

export default async function NovaVagaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');
  if (profile.role !== 'admin_rh') redirect('/recrutamento/vagas');

  const [departments, positions, managers] = await Promise.all([
    getDepartments(profile.company_id),
    getPositions(profile.company_id),
    listHiringManagerOptions(profile.company_id),
  ]);

  return <NovaVagaClient departments={departments} positions={positions} managers={managers} />;
}
