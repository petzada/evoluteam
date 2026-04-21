import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listAllStages } from '@/features/recruitment/queries/stages';
import { RecruitmentStagesManager } from '@/features/recruitment/components/RecruitmentStagesManager';

export default async function EtapasPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');
  if (profile.role !== 'admin_rh') redirect('/dashboard');

  const stages = await listAllStages(profile.company_id);

  return <RecruitmentStagesManager stages={stages} />;
}
