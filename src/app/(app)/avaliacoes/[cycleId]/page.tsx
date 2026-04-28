import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getCycle, getCycleParticipants, getCycleAssignments, getCycleForm,
} from '@/features/reviews/queries';
import { CycleDetail } from '@/features/reviews/components/CycleDetail';
import { BreadcrumbLabel } from '@/features/shell/components/BreadcrumbLabel';
import { canDo } from '@/features/permissions/permissions';
import { getActorContext } from '@/features/auth/context';
import { deriveReviewCycleStatus, REVIEW_CYCLE_STATUS_LABELS } from '@/lib/status-mappers';

function deriveCycleStatus(status: string, responseStart: string, responseEnd: string) {
  const derived = deriveReviewCycleStatus(status, responseStart, responseEnd);
  return {
    status: derived,
    label: REVIEW_CYCLE_STATUS_LABELS[derived],
  };
}

export default async function CycleDetailPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  const { profile, gate } = await getActorContext();
  const supabase = await createServerSupabaseClient();
  const actor = { role: profile.role, ...gate };

  // Paraleliza tudo: getCycle nao precisa preceder as outras queries.
  // Antes era await sequencial.
  const [cycle, participants, assignments, formData, { data: competencies }] = await Promise.all([
    getCycle(cycleId),
    getCycleParticipants(cycleId),
    getCycleAssignments(cycleId),
    getCycleForm(cycleId),
    supabase
      .from('competencies')
      .select('id, name')
      .eq('company_id', profile.company_id),
  ]);
  if (!cycle) notFound();

  return (
    <>
      <BreadcrumbLabel segment={cycleId} label={cycle.name} />
      <CycleDetail
        cycle={{
          id: cycle.id,
          name: cycle.name,
          description: cycle.description,
          period_start: cycle.period_start,
          period_end: cycle.period_end,
          response_start: cycle.response_start,
          response_end: cycle.response_end,
          status: cycle.status as 'draft' | 'published' | 'closed' | 'archived',
          include_self: cycle.include_self,
          include_manager: cycle.include_manager,
          published_at: cycle.published_at,
          closed_at: cycle.closed_at,
        }}
        participants={participants as unknown as Parameters<typeof CycleDetail>[0]['participants']}
        assignments={assignments as unknown as Parameters<typeof CycleDetail>[0]['assignments']}
        questions={formData.questions as unknown as Parameters<typeof CycleDetail>[0]['questions']}
        competencies={competencies ?? []}
        isAdmin={canDo(actor, 'avaliacoes', 'edit')}
        derivedStatus={deriveCycleStatus(cycle.status, cycle.response_start, cycle.response_end)}
      />
    </>
  );
}
