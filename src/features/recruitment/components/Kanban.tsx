'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDraggable, useDroppable,
  closestCenter,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import { MoreVertical, ArrowUp, ArrowDown, X, Snowflake } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { moveApplicationStage } from '../actions/applications';
import {
  STALLED_THRESHOLD_DAYS,
  CANDIDATE_SOURCE_LABELS,
  type CandidateSource,
} from '../schema';
import type { ApplicationRow } from '../queries/applications';
import type { StageRow } from '../queries/stages';
import { ArchiveReasonDialog, type ArchiveAction } from './ArchiveReasonDialog';

interface Props {
  stages: StageRow[];
  applications: ApplicationRow[];
  canMove: boolean;
}

function daysSince(iso: string): number {
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function Kanban({ stages, applications, canMove }: Props) {
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeApp, setActiveApp] = useState<ApplicationRow | null>(null);
  const [archiveState, setArchiveState] = useState<{
    open: boolean;
    action: ArchiveAction | null;
    applicationId: string | null;
    candidateName: string;
  }>({ open: false, action: null, applicationId: null, candidateName: '' });

  const byStage = useMemo(() => {
    const map = new Map<string, ApplicationRow[]>();
    for (const stage of stages) map.set(stage.id, []);
    for (const app of applications) {
      const list = map.get(app.current_stage_id);
      if (list) list.push(app);
    }
    return map;
  }, [stages, applications]);

  function onDragStart(e: DragStartEvent) {
    const app = applications.find((a) => a.id === e.active.id);
    if (app) setActiveApp(app);
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveApp(null);
    const appId = String(e.active.id);
    const targetStageId = e.over?.id ? String(e.over.id) : null;
    if (!targetStageId) return;
    const app = applications.find((a) => a.id === appId);
    if (!app || app.current_stage_id === targetStageId) return;
    const targetStage = stages.find((s) => s.id === targetStageId);
    if (targetStage?.kind === 'hired_terminal') {
      toast.info('Contratação disponível em breve.');
      return;
    }
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

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
          {stages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              applications={byStage.get(stage.id) ?? []}
              canMove={canMove}
              onArchiveAction={openArchive}
              onMoveTo={async (appId, targetId) => {
                if (targetId === stage.id) return;
                const target = stages.find((s) => s.id === targetId);
                if (target?.kind === 'hired_terminal') {
                  toast.info('Contratação disponível em breve.');
                  return;
                }
                const result = await moveApplicationStage(appId, targetId);
                if ('error' in result && result.error) {
                  toast.error(result.error);
                } else {
                  router.refresh();
                }
              }}
              stages={stages}
            />
          ))}
        </div>
        <DragOverlay>
          {activeApp && <CandidateCard app={activeApp} isDragging stageKind="intermediate" />}
        </DragOverlay>
      </DndContext>

      <ArchiveReasonDialog
        open={archiveState.open}
        onOpenChange={(v) => setArchiveState((s) => ({ ...s, open: v }))}
        action={archiveState.action}
        applicationId={archiveState.applicationId}
        candidateName={archiveState.candidateName}
      />
    </>
  );
}

interface ColumnProps {
  stage: StageRow;
  applications: ApplicationRow[];
  canMove: boolean;
  onArchiveAction: (action: ArchiveAction, app: ApplicationRow) => void;
  onMoveTo: (appId: string, targetStageId: string) => void | Promise<void>;
  stages: StageRow[];
}

function KanbanColumn({ stage, applications, canMove, onArchiveAction, onMoveTo, stages }: ColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id, disabled: !canMove });
  const isHired = stage.kind === 'hired_terminal';
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[280px] flex-col rounded-md border bg-muted/30 p-2 transition-colors',
        isOver && !isHired && 'bg-primary/5 border-primary/30',
        isHired && 'bg-emerald-50/50 border-emerald-200/60',
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
            onArchiveAction={onArchiveAction}
            onMoveTo={onMoveTo}
          />
        ))}
        {isHired && applications.length === 0 && (
          <p className="text-[10px] text-muted-foreground/70 text-center py-4 px-2 italic">
            Contratação chega na Onda 2.
          </p>
        )}
      </div>
    </div>
  );
}

interface DraggableCardProps {
  app: ApplicationRow;
  stage: StageRow;
  stages: StageRow[];
  canMove: boolean;
  onArchiveAction: (action: ArchiveAction, app: ApplicationRow) => void;
  onMoveTo: (appId: string, targetStageId: string) => void | Promise<void>;
}

function DraggableCardWithMenu({
  app, stage, stages, canMove, onArchiveAction, onMoveTo,
}: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: app.id,
    disabled: !canMove,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const sortedStages = [...stages].sort((a, b) => a.position - b.position);
  const currentIdx = sortedStages.findIndex((s) => s.id === stage.id);
  const prev = currentIdx > 0 ? sortedStages[currentIdx - 1] : null;
  const next = currentIdx >= 0 && currentIdx < sortedStages.length - 1 ? sortedStages[currentIdx + 1] : null;

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && 'opacity-30')}>
      <div className="relative group bg-card border rounded-md shadow-sm">
        <div
          {...attributes}
          {...listeners}
          className={cn('px-2.5 py-2', canMove && 'cursor-grab active:cursor-grabbing')}
        >
          <CandidateCard app={app} stageKind={stage.kind} />
        </div>
        {canMove && (
          <div className="absolute right-1 top-1">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-muted transition"
                aria-label="Ações"
              >
                <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {prev && (
                  <DropdownMenuItem onClick={() => onMoveTo(app.id, prev.id)}>
                    <ArrowUp className="mr-2 h-4 w-4" /> Mover p/ {prev.name}
                  </DropdownMenuItem>
                )}
                {next && next.kind !== 'hired_terminal' && (
                  <DropdownMenuItem onClick={() => onMoveTo(app.id, next.id)}>
                    <ArrowDown className="mr-2 h-4 w-4" /> Mover p/ {next.name}
                  </DropdownMenuItem>
                )}
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
  stageKind: StageRow['kind'];
  isDragging?: boolean;
}

function CandidateCard({ app, isDragging }: CardProps) {
  const days = daysSince(app.stage_entered_at);
  const stalled = days >= STALLED_THRESHOLD_DAYS;
  const source = app.candidate?.source as CandidateSource | undefined;
  const sourceLabel = source === 'outro' && app.candidate?.source_other
    ? app.candidate.source_other
    : source ? CANDIDATE_SOURCE_LABELS[source] : null;
  return (
    <div className={cn(isDragging && 'rotate-1 shadow-lg')}>
      <p className="text-[12px] font-medium text-foreground truncate">{app.candidate?.name}</p>
      <p className="text-[10.5px] text-muted-foreground truncate">{app.candidate?.email}</p>
      <div className="mt-1.5 flex items-center gap-2 text-[10px]">
        {sourceLabel && (
          <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{sourceLabel}</span>
        )}
        <span className={cn('tabular-nums', stalled ? 'text-amber-700 font-medium' : 'text-muted-foreground')}>
          {stalled && '⚠ '}{days}d
        </span>
      </div>
    </div>
  );
}
