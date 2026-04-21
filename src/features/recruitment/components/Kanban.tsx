'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDraggable, useDroppable,
  closestCenter,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import {
  MoreVertical, ArrowUp, ArrowDown, X, Snowflake,
  CheckCircle2, MessageSquare, Star,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { moveApplicationStage } from '../actions/applications';
import { checkHireEligibility } from '../actions/hire';
import {
  STALLED_THRESHOLD_DAYS,
  CANDIDATE_SOURCE_LABELS,
  type CandidateSource,
} from '../schema';
import type { ApplicationRow } from '../queries/applications';
import type { StageRow } from '../queries/stages';
import type { TaskKanbanState } from '../queries/tasks';
import { ArchiveReasonDialog, type ArchiveAction } from './ArchiveReasonDialog';
import { FeedbackSheet, type FeedbackContext } from './FeedbackSheet';
import {
  HireCandidateDialog, type HireContext,
} from './HireCandidateDialog';
import type { HireEligibility } from '../actions/hire';

interface TaxonomyItem { id: string; name: string }
interface ManagerItem { id: string; full_name: string }

interface JobContext {
  id: string;
  title: string;
  departmentId: string | null;
  positionId: string | null;
  hiringManagerId: string | null;
}

interface Props {
  stages: StageRow[];
  applications: ApplicationRow[];
  canMove: boolean;
  canGiveFeedback: boolean;
  canHire: boolean;
  feedbackCounts: Map<string, number>;
  scorecardCounts: Map<string, number>;
  taskStates: Map<string, TaskKanbanState>;
  job: JobContext;
  positions: TaxonomyItem[];
  departments: TaxonomyItem[];
  managers: ManagerItem[];
}

function daysSince(iso: string): number {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function Kanban({
  stages, applications, canMove, canGiveFeedback, canHire,
  feedbackCounts, scorecardCounts, taskStates,
  job, positions, departments, managers,
}: Props) {
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeApp, setActiveApp] = useState<ApplicationRow | null>(null);
  const [archiveState, setArchiveState] = useState<{
    open: boolean;
    action: ArchiveAction | null;
    applicationId: string | null;
    candidateName: string;
  }>({ open: false, action: null, applicationId: null, candidateName: '' });
  const [feedbackState, setFeedbackState] = useState<{
    open: boolean;
    context: FeedbackContext | null;
  }>({ open: false, context: null });
  const [hireState, setHireState] = useState<{
    open: boolean;
    eligibility: HireEligibility | null;
    context: HireContext | null;
  }>({ open: false, eligibility: null, context: null });

  const byStage = useMemo(() => {
    const map = new Map<string, ApplicationRow[]>();
    for (const stage of stages) map.set(stage.id, []);
    for (const app of applications) {
      const list = map.get(app.current_stage_id);
      if (list) list.push(app);
    }
    return map;
  }, [stages, applications]);

  async function triggerHire(app: ApplicationRow) {
    if (!canHire) {
      toast.info('Contratação disponível apenas para admin RH.');
      return;
    }
    const eligibility = await checkHireEligibility(app.id);
    const otherActive = applications
      .filter((a) => a.candidate_id === app.candidate_id && a.id !== app.id && a.status === 'in_progress')
      .map((a) => ({ id: a.id, jobTitle: a.job_opening?.title ?? 'Outra vaga' }));
    setHireState({
      open: true,
      eligibility,
      context: {
        applicationId: app.id,
        candidate: {
          id: app.candidate_id,
          name: app.candidate?.name ?? '',
          email: app.candidate?.email ?? '',
          phone: null,
        },
        job: {
          id: job.id,
          title: job.title,
          departmentId: job.departmentId,
          positionId: job.positionId,
          hiringManagerId: job.hiringManagerId,
        },
        otherActiveApplications: otherActive,
      },
    });
  }

  function onDragStart(e: DragStartEvent) {
    const app = applications.find((a) => a.id === e.active.id);
    if (app) setActiveApp(app);
  }

  async function onDragEnd(e: DragEndEvent) {
    const draggedApp = activeApp;
    setActiveApp(null);
    const appId = String(e.active.id);
    const targetStageId = e.over?.id ? String(e.over.id) : null;
    if (!targetStageId) return;
    const app = applications.find((a) => a.id === appId);
    if (!app || app.current_stage_id === targetStageId) return;
    const targetStage = stages.find((s) => s.id === targetStageId);
    if (targetStage?.kind === 'hired_terminal') {
      await triggerHire(app);
      return;
    }
    void draggedApp;
    const result = await moveApplicationStage(appId, targetStageId);
    if ('error' in result && result.error) {
      toast.error(result.error);
    } else {
      router.refresh();
    }
  }

  function openArchive(action: ArchiveAction, app: ApplicationRow) {
    setArchiveState({
      open: true,
      action,
      applicationId: app.id,
      candidateName: app.candidate?.name ?? 'Candidato',
    });
  }

  function openFeedback(app: ApplicationRow) {
    setFeedbackState({
      open: true,
      context: {
        applicationId: app.id,
        candidateName: app.candidate?.name ?? 'Candidato',
        candidateEmail: app.candidate?.email ?? null,
        jobTitle: job.title,
        stageName: app.current_stage?.name ?? '—',
      },
    });
  }

  async function onMoveTo(appId: string, targetStageId: string) {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;
    const target = stages.find((s) => s.id === targetStageId);
    if (target?.kind === 'hired_terminal') {
      await triggerHire(app);
      return;
    }
    const result = await moveApplicationStage(appId, targetStageId);
    if ('error' in result && result.error) {
      toast.error(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}
        >
          {stages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              applications={byStage.get(stage.id) ?? []}
              canMove={canMove}
              canGiveFeedback={canGiveFeedback}
              canHire={canHire}
              feedbackCounts={feedbackCounts}
              scorecardCounts={scorecardCounts}
              taskStates={taskStates}
              onArchiveAction={openArchive}
              onFeedbackAction={openFeedback}
              onHireAction={triggerHire}
              onMoveTo={onMoveTo}
              stages={stages}
            />
          ))}
        </div>
        <DragOverlay>
          {activeApp && (
            <CandidateCard
              app={activeApp}
              feedbackCount={feedbackCounts.get(activeApp.id) ?? 0}
              scorecardCount={scorecardCounts.get(activeApp.id) ?? 0}
              taskState={taskStates.get(activeApp.id) ?? null}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      <ArchiveReasonDialog
        open={archiveState.open}
        onOpenChange={(v) => setArchiveState((s) => ({ ...s, open: v }))}
        action={archiveState.action}
        applicationId={archiveState.applicationId}
        candidateName={archiveState.candidateName}
      />
      <FeedbackSheet
        open={feedbackState.open}
        onOpenChange={(v) => setFeedbackState((s) => ({ ...s, open: v, context: v ? s.context : null }))}
        context={feedbackState.context}
      />
      <HireCandidateDialog
        open={hireState.open}
        onOpenChange={(v) => setHireState((s) => ({ ...s, open: v }))}
        eligibility={hireState.eligibility}
        context={hireState.context}
        positions={positions}
        departments={departments}
        managers={managers}
      />
    </>
  );
}

interface ColumnProps {
  stage: StageRow;
  applications: ApplicationRow[];
  canMove: boolean;
  canGiveFeedback: boolean;
  canHire: boolean;
  feedbackCounts: Map<string, number>;
  scorecardCounts: Map<string, number>;
  taskStates: Map<string, TaskKanbanState>;
  onArchiveAction: (action: ArchiveAction, app: ApplicationRow) => void;
  onFeedbackAction: (app: ApplicationRow) => void;
  onHireAction: (app: ApplicationRow) => void;
  onMoveTo: (appId: string, targetStageId: string) => void | Promise<void>;
  stages: StageRow[];
}

function KanbanColumn({
  stage, applications, canMove, canGiveFeedback, canHire,
  feedbackCounts, scorecardCounts, taskStates,
  onArchiveAction, onFeedbackAction, onHireAction, onMoveTo, stages,
}: ColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: stage.id,
    disabled: !canMove || (stage.kind === 'hired_terminal' && !canHire),
  });
  const isHired = stage.kind === 'hired_terminal';
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[280px] flex-col rounded-md border bg-muted/30 p-2 transition-colors',
        isOver && !isHired && 'bg-primary/5 border-primary/30',
        isOver && isHired && 'bg-emerald-100 border-emerald-300',
        isHired && !isOver && 'bg-emerald-50/50 border-emerald-200/60',
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {stage.name}
        </h4>
        <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">
          {applications.length}
        </Badge>
      </div>
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {applications.map((app) => (
          <DraggableCardWithMenu
            key={app.id}
            app={app}
            stage={stage}
            stages={stages}
            canMove={canMove}
            canGiveFeedback={canGiveFeedback}
            canHire={canHire}
            feedbackCount={feedbackCounts.get(app.id) ?? 0}
            scorecardCount={scorecardCounts.get(app.id) ?? 0}
            taskState={taskStates.get(app.id) ?? null}
            onArchiveAction={onArchiveAction}
            onFeedbackAction={onFeedbackAction}
            onHireAction={onHireAction}
            onMoveTo={onMoveTo}
          />
        ))}
      </div>
    </div>
  );
}

interface DraggableCardProps {
  app: ApplicationRow;
  stage: StageRow;
  stages: StageRow[];
  canMove: boolean;
  canGiveFeedback: boolean;
  canHire: boolean;
  feedbackCount: number;
  scorecardCount: number;
  taskState: TaskKanbanState | null;
  onArchiveAction: (action: ArchiveAction, app: ApplicationRow) => void;
  onFeedbackAction: (app: ApplicationRow) => void;
  onHireAction: (app: ApplicationRow) => void;
  onMoveTo: (appId: string, targetStageId: string) => void | Promise<void>;
}

function DraggableCardWithMenu({
  app, stage, stages, canMove, canGiveFeedback, canHire,
  feedbackCount, scorecardCount, taskState,
  onArchiveAction, onFeedbackAction, onHireAction, onMoveTo,
}: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app.id,
    disabled: !canMove,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const sortedStages = [...stages]
    .filter((s) => s.kind !== 'hired_terminal' || canHire)
    .sort((a, b) => a.position - b.position);
  const currentIdx = sortedStages.findIndex((s) => s.id === stage.id);
  const prev = currentIdx > 0 ? sortedStages[currentIdx - 1] : null;
  const next = currentIdx >= 0 && currentIdx < sortedStages.length - 1 ? sortedStages[currentIdx + 1] : null;

  const hasAnyAction = canMove || canGiveFeedback;

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-30')}>
      <div className="relative group bg-card border rounded-md shadow-sm">
        <div
          {...attributes}
          {...listeners}
          className={cn('px-2.5 py-2', canMove && 'cursor-grab active:cursor-grabbing')}
        >
          <CandidateCard
            app={app}
            feedbackCount={feedbackCount}
            scorecardCount={scorecardCount}
            taskState={taskState}
          />
        </div>
        {hasAnyAction && (
          <div className="absolute right-1 top-1">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-muted transition"
                aria-label="Ações"
              >
                <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {canMove && prev && (
                  <DropdownMenuItem onClick={() => onMoveTo(app.id, prev.id)}>
                    <ArrowUp className="mr-2 h-4 w-4" /> Mover p/ {prev.name}
                  </DropdownMenuItem>
                )}
                {canMove && next && next.kind !== 'hired_terminal' && (
                  <DropdownMenuItem onClick={() => onMoveTo(app.id, next.id)}>
                    <ArrowDown className="mr-2 h-4 w-4" /> Mover p/ {next.name}
                  </DropdownMenuItem>
                )}
                {canGiveFeedback && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onFeedbackAction(app)}>
                      <MessageSquare className="mr-2 h-4 w-4" /> Dar feedback
                    </DropdownMenuItem>
                  </>
                )}
                {canMove && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onArchiveAction('withdrawn', app)}>
                      <X className="mr-2 h-4 w-4" /> Marcar desistente
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onArchiveAction('rejected', app)}>
                      <X className="mr-2 h-4 w-4" /> Marcar reprovado
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onArchiveAction('frozen', app)}>
                      <Snowflake className="mr-2 h-4 w-4" /> Congelar
                    </DropdownMenuItem>
                  </>
                )}
                {canHire && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onHireAction(app)}>
                      <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-600" /> Marcar contratado
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}

interface CardProps {
  app: ApplicationRow;
  feedbackCount: number;
  scorecardCount: number;
  taskState: TaskKanbanState | null;
  isDragging?: boolean;
}

function CandidateCard({ app, feedbackCount, scorecardCount, taskState, isDragging }: CardProps) {
  const days = daysSince(app.stage_entered_at);
  const stalled = days >= STALLED_THRESHOLD_DAYS;
  const source = app.candidate?.source as CandidateSource | undefined;
  const sourceLabel = source === 'outro' && app.candidate?.source_other
    ? app.candidate.source_other
    : source ? CANDIDATE_SOURCE_LABELS[source] : null;

  const taskPill = renderTaskPill(taskState);

  return (
    <div className={cn(isDragging && 'rotate-1 shadow-lg')}>
      <p className="text-[12px] font-medium text-foreground truncate">{app.candidate?.name}</p>
      <p className="text-[10.5px] text-muted-foreground truncate">{app.candidate?.email}</p>
      <div className="mt-1.5 flex items-center gap-2 text-[10px] flex-wrap">
        {sourceLabel && (
          <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{sourceLabel}</span>
        )}
        <span className={cn('tabular-nums', stalled ? 'text-amber-700 font-medium' : 'text-muted-foreground')}>
          {stalled && '⚠ '}{days}d
        </span>
        {feedbackCount > 0 && (
          <span className="bg-orange-100 text-orange-800 rounded-full px-1.5 py-0.5 inline-flex items-center gap-1 font-medium">
            <MessageSquare className="h-2.5 w-2.5" /> {feedbackCount}
          </span>
        )}
        {scorecardCount > 0 && (
          <span className="bg-blue-100 text-blue-800 rounded-full px-1.5 py-0.5 inline-flex items-center gap-1 font-medium">
            <Star className="h-2.5 w-2.5" /> {scorecardCount}
          </span>
        )}
        {taskPill}
      </div>
    </div>
  );
}

function renderTaskPill(state: TaskKanbanState | null): React.ReactNode {
  if (!state || state.total === 0) return null;
  if (state.overdue > 0) {
    return (
      <span className="bg-rose-100 text-rose-800 rounded-full px-1.5 py-0.5 font-medium">
        ⚠ {state.overdue} atras.
      </span>
    );
  }
  if (state.pending === 0) {
    return (
      <span className="bg-emerald-100 text-emerald-800 rounded-full px-1.5 py-0.5 font-medium">
        ✓ {state.completed}/{state.total}
      </span>
    );
  }
  return (
    <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
      {state.pending} pend.
    </span>
  );
}
