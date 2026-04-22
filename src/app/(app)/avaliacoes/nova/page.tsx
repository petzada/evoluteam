import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getDepartments, getPositions } from '@/features/employees/queries';
import { getEligibleEmployees } from '@/features/reviews/queries';
import { ReviewCycleWizard } from '@/features/reviews/components/ReviewCycleWizard';
import { PageHeader } from '@/components/PageHeader';
import { loadActorRhPermissions } from '@/features/permissions/queries';
import { canCreateCycle } from '@/features/reviews/permissions';

export default async function NovaAvaliacaoPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const actorRhPermissions = await loadActorRhPermissions(user.id, profile.role);
  const actor = {
    role: profile.role,
    userId: user.id,
    employeeId: null,
    rhPermissions: actorRhPermissions,
  };
  if (!canCreateCycle(actor)) redirect('/avaliacoes');

  const [positions, departments, employees, { data: competencies }] = await Promise.all([
    getPositions(profile.company_id),
    getDepartments(profile.company_id),
    getEligibleEmployees(profile.company_id),
    supabase
      .from('competencies')
      .select('id, name')
      .eq('company_id', profile.company_id)
      .eq('is_archived', false)
      .order('name'),
  ]);

  return (
    <div>
      <PageHeader
        title="Novo ciclo de avaliação"
        description="Configure em 5 passos. Você pode salvar como rascunho a qualquer momento."
      />
      <ReviewCycleWizard
        deps={{
          positions,
          departments,
          employees: employees as Parameters<typeof ReviewCycleWizard>[0]['deps']['employees'],
          competencies: competencies ?? [],
        }}
      />
    </div>
  );
}
