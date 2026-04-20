import { notFound, redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getAssignment, getAssignmentAnswers, getActorEmployeeId,
} from '@/features/reviews/queries';
import { getDirectReports } from '@/features/employees/queries';
import { AssignmentResponder } from '@/features/reviews/components/AssignmentResponder';

export default async function ResponderPage({
  params,
}: {
  params: Promise<{ cycleId: string; assignmentId: string }>;
}) {
  const { cycleId, assignmentId } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');

  const assignment = await getAssignment(assignmentId);
  if (!assignment || assignment.cycle_id !== cycleId) notFound();

  const actorEmployeeId = await getActorEmployeeId(user.id);

  const isReviewer = actorEmployeeId && assignment.reviewer_id === actorEmployeeId;
  const isAdmin = profile.role === 'admin_rh';
  if (!isReviewer && !isAdmin) redirect(`/avaliacoes/${cycleId}`);

  if (assignment.status === 'cancelled' || assignment.status === 'submitted') {
    redirect(`/avaliacoes/${cycleId}`);
  }

  const cycleStatus = (assignment.cycle as unknown as { status: string } | null)?.status;
  if (cycleStatus !== 'published') {
    redirect(`/avaliacoes/${cycleId}`);
  }

  const [{ data: questionsRaw }, answers, directReports, { data: competencies }] = await Promise.all([
    supabase
      .from('review_questions')
      .select('id, competency_id, question_order, type, question_text, is_required, scale_min, scale_max')
      .eq('form_id', assignment.form_id)
      .order('question_order'),
    getAssignmentAnswers(assignmentId),
    getDirectReports(assignment.reviewee_id),
    supabase
      .from('competencies')
      .select('id, name')
      .eq('company_id', profile.company_id),
  ]);

  return (
    <AssignmentResponder
      assignment={assignment as unknown as Parameters<typeof AssignmentResponder>[0]['assignment']}
      questions={(questionsRaw ?? []) as Parameters<typeof AssignmentResponder>[0]['questions']}
      existingAnswers={answers}
      competencies={competencies ?? []}
      directReports={directReports as Parameters<typeof AssignmentResponder>[0]['directReports']}
    />
  );
}
