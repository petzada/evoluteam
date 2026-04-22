import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { loadActorGate } from '@/features/permissions/queries';
import { hasOpenJobAsHiringManager } from '@/features/recruitment/queries/jobOpenings';
import { listCandidates } from '@/features/recruitment/queries/candidates';
import { canManageCandidates, canViewAllCandidates, canViewAssignedCandidates } from '@/features/recruitment/permissions';
import { CandidatesTable } from '@/features/recruitment/components/CandidatesTable';

export default async function CandidatosPage() {
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

  if (!canViewAllCandidates(actor) && !canViewAssignedCandidates(actor)) {
    redirect('/dashboard');
  }

  const candidates = await listCandidates(profile.company_id);

  return <CandidatesTable candidates={candidates} canCreate={canManageCandidates(actor)} />;
}
