import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getActorContext } from '@/features/auth/context';
import { getDepartments, getPositions } from '@/features/employees/queries';
import { getEligibleEmployees } from '@/features/reviews/queries';
import { ReviewCycleWizard } from '@/features/reviews/components/ReviewCycleWizard';
import { PageHeader } from '@/components/PageHeader';
import { canCreateCycle } from '@/features/reviews/permissions';

export default async function NovaAvaliacaoPage() {
  const ctx = await getActorContext();
  const actor = {
    role: ctx.profile.role,
    userId: ctx.user.id,
    employeeId: null,
    ...ctx.gate,
  };
  if (!canCreateCycle(actor)) redirect('/avaliacoes');

  const supabase = await createServerSupabaseClient();
  const [positions, departments, employees, { data: competencies }] = await Promise.all([
    getPositions(ctx.profile.company_id),
    getDepartments(ctx.profile.company_id),
    getEligibleEmployees(ctx.profile.company_id),
    supabase
      .from('competencies')
      .select('id, name')
      .eq('company_id', ctx.profile.company_id)
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
