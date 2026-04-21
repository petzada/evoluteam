import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCandidateById } from '@/features/recruitment/queries/candidates';
import {
  listApplicationsByCandidate,
  listStageHistoryByCandidate,
} from '@/features/recruitment/queries/applications';
import { canManageCandidates } from '@/features/recruitment/permissions';
import { CandidateProfile } from '@/features/recruitment/components/CandidateProfile';
import { BreadcrumbLabel } from '@/features/shell/components/BreadcrumbLabel';

type Params = Promise<{ id: string }>;

export default async function CandidatoPage({ params }: { params: Params }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const { data: employeeRow } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .eq('company_id', profile.company_id)
    .maybeSingle();

  const actor = { role: profile.role, employeeId: employeeRow?.id ?? null };

  const candidate = await getCandidateById(id);
  if (!candidate) notFound();

  const [applications, history] = await Promise.all([
    listApplicationsByCandidate(id),
    listStageHistoryByCandidate(id),
  ]);

  return (
    <>
      <BreadcrumbLabel segment={id} label={candidate.name} />
      <CandidateProfile
        candidate={candidate}
        applications={applications}
        history={history}
        canManage={canManageCandidates(actor)}
      />
    </>
  );
}
