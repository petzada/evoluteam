'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MessageSquare, Star, ListChecks } from 'lucide-react';
import {
  Sheet, SheetContent, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ApplicationRow } from '../queries/applications';
import type { CandidateFeedbackRow } from '../queries/feedbacks';
import type { ScorecardRow } from '../queries/scorecards';
import type { TaskRow } from '../queries/tasks';
import { FeedbackCard } from './cards/FeedbackCard';
import { StageBlock } from './cards/ScorecardCards';
import { TaskRowItem } from './cards/TaskRow';
import { FeedbackSheet, type FeedbackContext, type FeedbackEditInitial } from './FeedbackSheet';
import { ScorecardSheet, type ScorecardContext, type ScorecardEditInitial } from './ScorecardSheet';
import { TaskDialog, type TaskContext, type TaskEditInitial } from './TaskDialog';
import { deleteFeedback } from '../actions/feedbacks';
import { deleteScorecard } from '../actions/scorecards';
import { completeTask, reopenTask, deleteTask } from '../actions/tasks';

interface EmployeeOption { id: string; full_name: string }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  application: ApplicationRow | null;
  feedbacks: CandidateFeedbackRow[];
  scorecards: ScorecardRow[];
  tasks: TaskRow[];
  currentEmployeeId: string | null;
  isAdmin: boolean;
  canGiveFeedback: boolean;
  responsibleOptions: EmployeeOption[];
}

export function CandidateQuickSheet({
  open, onOpenChange, application,
  feedbacks, scorecards, tasks,
  currentEmployeeId, isAdmin, canGiveFeedback,
  responsibleOptions,
}: Props) {
  const router = useRouter();

  // Sub-dialogs
  const [feedbackSheet, setFeedbackSheet] = useState<{
    open: boolean;
    initial: FeedbackEditInitial | null;
  }>({ open: false, initial: null });

  const [scorecardSheet, setScorecardSheet] = useState<{
    open: boolean;
    initial: ScorecardEditInitial | null;
  }>({ open: false, initial: null });

  const [taskDialog, setTaskDialog] = useState<{
    open: boolean;
    initial: TaskEditInitial | null;
  }>({ open: false, initial: null });

  // Scorecards agrupados por stage (para ComparisonTable quando >=2)
  const scorecardsByStage = useMemo(() => {
    const map = new Map<string, ScorecardRow[]>();
    for (const sc of scorecards) {
      const list = map.get(sc.stage_id) ?? [];
      list.push(sc);
      map.set(sc.stage_id, list);
    }
    return map;
  }, [scorecards]);

  // Tarefas ordenadas: pendentes primeiro (por due_date asc nulls last), concluídas depois
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const ac = !!a.completed_at, bc = !!b.completed_at;
      if (ac !== bc) return ac ? 1 : -1;
      if (!ac) {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      }
      return (b.completed_at ?? '').localeCompare(a.completed_at ?? '');
    });
  }, [tasks]);

  if (!application) return null;

  const feedbackContext: FeedbackContext = {
    applicationId: application.id,
    candidateName: application.candidate?.name ?? 'Candidato',
    candidateEmail: application.candidate?.email ?? null,
    jobTitle: application.job_opening?.title ?? 'Vaga',
    stageName: application.current_stage?.name ?? '—',
  };

  const scorecardContext: ScorecardContext = {
    applicationId: application.id,
    candidateName: application.candidate?.name ?? 'Candidato',
    jobTitle: application.job_opening?.title ?? 'Vaga',
    stageName: application.current_stage?.name ?? '—',
  };

  const taskContext: TaskContext = {
    applicationId: application.id,
    candidateName: application.candidate?.name ?? 'Candidato',
    jobTitle: application.job_opening?.title ?? 'Vaga',
  };

  function openFeedbackEdit(fb: CandidateFeedbackRow) {
    setFeedbackSheet({
      open: true,
      initial: { id: fb.id, content: fb.content, recommendation: fb.recommendation },
    });
  }

  function openScorecardEdit(sc: ScorecardRow) {
    setScorecardSheet({
      open: true,
      initial: {
        id: sc.id,
        rating_communication: sc.rating_communication,
        rating_experience: sc.rating_experience,
        rating_role_fit: sc.rating_role_fit,
        rating_culture_fit: sc.rating_culture_fit,
        salary_expectation: sc.salary_expectation,
        comment: sc.comment,
        recommendation: sc.recommendation,
      },
    });
  }

  function openTaskEdit(t: TaskRow) {
    setTaskDialog({
      open: true,
      initial: {
        id: t.id,
        title: t.title,
        due_date: t.due_date,
        responsible_id: t.responsible_id,
      },
    });
  }

  async function onDeleteFeedback(id: string) {
    const result = await deleteFeedback(id);
    if ('error' in result && result.error) { toast.error(result.error); return; }
    toast.success('Feedback removido');
    router.refresh();
  }

  async function onDeleteScorecard(id: string) {
    const result = await deleteScorecard(id);
    if ('error' in result && result.error) { toast.error(result.error); return; }
    toast.success('Scorecard removido');
    router.refresh();
  }

  async function onToggleTask(t: TaskRow) {
    const result = t.completed_at ? await reopenTask(t.id) : await completeTask(t.id);
    if ('error' in result && result.error) { toast.error(result.error); return; }
    router.refresh();
  }

  async function onDeleteTask(id: string) {
    const result = await deleteTask(id);
    if ('error' in result && result.error) { toast.error(result.error); return; }
    toast.success('Tarefa removida');
    router.refresh();
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="sm:max-w-[640px] w-full p-0 flex flex-col gap-0"
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-5 border-b">
            <SheetTitle className="text-lg font-bold tracking-tight">
              {application.candidate?.name ?? 'Candidato'}
            </SheetTitle>
            {application.candidate?.email && (
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                {application.candidate.email}
              </SheetDescription>
            )}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap text-sm">
              <span className="text-foreground font-medium">
                {application.job_opening?.title ?? 'Vaga'}
              </span>
              <span className="text-muted-foreground">·</span>
              <Badge
                variant="outline"
                className="border-orange-200 bg-orange-50 text-orange-700 font-semibold"
              >
                {application.current_stage?.name ?? '—'}
              </Badge>
            </div>
          </div>

          {/* Tabs + body (flex-1 pra empurrar footer pro fim) */}
          <Tabs defaultValue="feedbacks" className="flex-1 flex flex-col min-h-0 gap-0">
            <TabsList variant="line" className="px-6 pt-2 border-b rounded-none justify-start h-auto bg-transparent">
              <TabsTrigger value="feedbacks" className="gap-1.5">
                Feedbacks
                <span className="text-muted-foreground font-normal">({feedbacks.length})</span>
              </TabsTrigger>
              <TabsTrigger value="scorecards" className="gap-1.5">
                Scorecards
                <span className="text-muted-foreground font-normal">({scorecards.length})</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="gap-1.5">
                Tarefas
                <span className="text-muted-foreground font-normal">({tasks.length})</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              <TabsContent value="feedbacks" className="mt-0">
                {feedbacks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Nenhum feedback registrado ainda.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {feedbacks.map((fb) => (
                      <li key={fb.id} className="pt-3 first:pt-0 pb-3 last:pb-0">
                        <FeedbackCard
                          fb={fb}
                          currentEmployeeId={currentEmployeeId}
                          isAdmin={isAdmin}
                          onEdit={() => openFeedbackEdit(fb)}
                          onDelete={() => onDeleteFeedback(fb.id)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="scorecards" className="mt-0">
                {scorecards.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Nenhum scorecard registrado ainda.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {Array.from(scorecardsByStage.entries()).map(([stageId, scs]) => (
                      <li key={stageId} className="pt-3 first:pt-0 pb-3 last:pb-0">
                        <StageBlock
                          scorecards={scs}
                          currentEmployeeId={currentEmployeeId}
                          isAdmin={isAdmin}
                          onEdit={openScorecardEdit}
                          onDelete={onDeleteScorecard}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="tasks" className="mt-0">
                {sortedTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    Nenhuma tarefa ainda.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sortedTasks.map((t) => (
                      <TaskRowItem
                        key={t.id}
                        task={t}
                        currentEmployeeId={currentEmployeeId}
                        isAdmin={isAdmin}
                        canManage={canGiveFeedback}
                        onEdit={() => openTaskEdit(t)}
                        onToggle={() => onToggleTask(t)}
                        onDelete={() => onDeleteTask(t.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer — CTAs (padrão Sheet do produto) */}
          {canGiveFeedback && (
            <div className="border-t px-6 py-4 flex items-center justify-end gap-2 bg-background">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTaskDialog({ open: true, initial: null })}
              >
                <ListChecks className="mr-1.5 h-4 w-4" /> Tarefa
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setScorecardSheet({ open: true, initial: null })}
              >
                <Star className="mr-1.5 h-4 w-4" /> Scorecard
              </Button>
              <Button
                size="sm"
                onClick={() => setFeedbackSheet({ open: true, initial: null })}
              >
                <MessageSquare className="mr-1.5 h-4 w-4" /> Dar feedback
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Sub-dialogs */}
      <FeedbackSheet
        open={feedbackSheet.open}
        onOpenChange={(v) => setFeedbackSheet((s) => ({ ...s, open: v, initial: v ? s.initial : null }))}
        context={feedbackContext}
        initial={feedbackSheet.initial}
      />
      <ScorecardSheet
        open={scorecardSheet.open}
        onOpenChange={(v) => setScorecardSheet((s) => ({ ...s, open: v, initial: v ? s.initial : null }))}
        context={scorecardContext}
        initial={scorecardSheet.initial}
      />
      <TaskDialog
        open={taskDialog.open}
        onOpenChange={(v) => setTaskDialog((s) => ({ ...s, open: v, initial: v ? s.initial : null }))}
        context={taskContext}
        initial={taskDialog.initial}
        defaultResponsibleId={currentEmployeeId}
        responsibleOptions={responsibleOptions}
      />
    </>
  );
}
