import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getActorContext } from '@/features/auth/context';
import { getDepartments, getPositions } from '@/features/employees/queries';
import {
  getCycle, getCycleParticipants, getCycleForm, getEligibleEmployees,
} from '@/features/reviews/queries';
import {
  ReviewCycleWizard,
  type WizardInitialValues,
} from '@/features/reviews/components/ReviewCycleWizard';
import { PublishedCycleEditForm } from '@/features/reviews/components/PublishedCycleEditForm';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { BreadcrumbLabel } from '@/features/shell/components/BreadcrumbLabel';
import { canCreateCycle } from '@/features/reviews/permissions';

export default async function EditCyclePage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  const ctx = await getActorContext();
  const actor = {
    role: ctx.profile.role,
    userId: ctx.user.id,
    employeeId: null,
    ...ctx.gate,
  };
  if (!canCreateCycle(actor)) redirect(`/avaliacoes/${cycleId}`);

  const cycle = await getCycle(cycleId);
  if (!cycle) notFound();

  if (cycle.status === 'closed' || cycle.status === 'archived') {
    return (
      <div>
        <BreadcrumbLabel segment={cycleId} label={cycle.name} />
        <PageHeader
          title="Ciclo não editável"
          description={
            cycle.status === 'archived'
              ? 'Este ciclo está arquivado e não pode ser editado.'
              : 'Este ciclo já foi encerrado e não pode ser editado.'
          }
        />
        <Link href={`/avaliacoes/${cycleId}`}>
          <Button variant="outline">Voltar ao ciclo</Button>
        </Link>
      </div>
    );
  }

  if (cycle.status === 'published') {
    return (
      <div>
        <BreadcrumbLabel segment={cycleId} label={cycle.name} />
        <PageHeader
          title={`Editar: ${cycle.name}`}
          description="Ajustes permitidos após publicação."
        />
        <PublishedCycleEditForm
          cycleId={cycleId}
          initialDescription={cycle.description}
          initialResponseEnd={cycle.response_end}
          responseStart={cycle.response_start}
        />
      </div>
    );
  }

  // status === 'draft': wizard completo em modo edit
  const supabase = await createServerSupabaseClient();
  const [positions, departments, employees, { data: competencies }, participants, formData] =
    await Promise.all([
      getPositions(ctx.profile.company_id),
      getDepartments(ctx.profile.company_id),
      getEligibleEmployees(ctx.profile.company_id),
      supabase
        .from('competencies')
        .select('id, name')
        .eq('company_id', ctx.profile.company_id)
        .eq('is_archived', false)
        .order('name'),
      getCycleParticipants(cycleId),
      getCycleForm(cycleId),
    ]);

  const manualEmployeeIds = participants
    .map((p) => p.employee_id)
    .filter((x): x is string => !!x);

  const questions = (formData.questions ?? []).map((q) => ({
    id: q.id,
    questionOrder: q.question_order,
    type: q.type as 'scale' | 'text',
    questionText: q.question_text,
    isRequired: q.is_required,
    competencyId: q.competency_id,
    scaleMin: q.scale_min,
    scaleMax: q.scale_max,
  }));

  const initialValues: WizardInitialValues = {
    basics: {
      name: cycle.name,
      description: cycle.description ?? '',
      periodStart: cycle.period_start,
      periodEnd: cycle.period_end,
      responseStart: cycle.response_start,
      responseEnd: cycle.response_end,
    },
    types: {
      includeSelf: cycle.include_self,
      includeManager: cycle.include_manager,
    },
    participants: {
      mode: 'filters',
      departmentIds: [],
      positionIds: [],
      manualEmployeeIds,
      excludedEmployeeIds: [],
    },
    questions,
  };

  return (
    <div>
      <BreadcrumbLabel segment={cycleId} label={cycle.name} />
      <PageHeader
        title={`Editar: ${cycle.name}`}
        description="Rascunho — todos os campos podem ser alterados. Você pode salvar como rascunho ou publicar."
      />
      <ReviewCycleWizard
        deps={{
          positions,
          departments,
          employees: employees as Parameters<typeof ReviewCycleWizard>[0]['deps']['employees'],
          competencies: competencies ?? [],
        }}
        editCycleId={cycleId}
        initialValues={initialValues}
      />
    </div>
  );
}
