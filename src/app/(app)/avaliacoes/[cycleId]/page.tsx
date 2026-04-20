import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getCycle, getCycleParticipants, getCycleAssignments, getCycleForm,
} from '@/features/reviews/queries';

import { CycleDetail } from '@/features/reviews/components/CycleDetail';

function deriveCycleLabel(status: string, responseStart: string, responseEnd: string): string {
  if (status === 'draft') return 'Rascunho';
  if (status === 'archived') return 'Arquivado';
  if (status === 'closed') return 'Encerrado';
  const now = new Date();
  if (new Date(responseStart) > now) return 'Agendado';
  if (new Date(responseEnd) < now) return 'Encerrado (lazy)';
  return 'Em andamento';
}

export default async function CycleDetailPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const { cycleId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const cycle = await getCycle(cycleId);
  if (!cycle) notFound();

  const [participants, assignments, formData, { data: competencies }] = await Promise.all([
    getCycleParticipants(cycleId),
    getCycleAssignments(cycleId),
    getCycleForm(cycleId),
    supabase
      .from('competencies')
      .select('id, name')
      .eq('company_id', profile.company_id),
  ]);

  return (
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
      isAdmin={profile.role === 'admin_rh'}
      deriveLabel={deriveCycleLabel(cycle.status, cycle.response_start, cycle.response_end)}
    />
  );
}
