import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getDepartments, getPositions } from '@/features/employees/queries';
import { getEligibleEmployees } from '@/features/reviews/queries';
import { ReviewCycleWizard } from '@/features/reviews/components/ReviewCycleWizard';
import { SetAppTopBar } from '@/features/shell/AppTopBarContext';
import { canCreateCycle } from '@/features/reviews/permissions';
import { getActorContext } from '@/features/auth/context';

export default async function NovaAvaliacaoPage() {
  const { user, profile, gate } = await getActorContext();
  const supabase = await createServerSupabaseClient();
  const actor = {
    role: profile.role,
    userId: user.id,
    employeeId: null,
    ...gate,
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
      <SetAppTopBar title="Novo ciclo de avaliação" />
      <p className="mb-4 text-sm text-muted-foreground">
        Configure em 5 passos. Você pode salvar como rascunho a qualquer momento.
      </p>
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
