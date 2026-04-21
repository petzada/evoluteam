'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ChevronDown, MoreVertical, Pencil, Trash2, Plus, RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date';
import type { TaskRow } from '../queries/tasks';
import type { ApplicationRow } from '../queries/applications';
import { APPLICATION_STATUS_LABELS } from '../schema';
import {
  TaskDialog, type TaskContext, type TaskEditInitial,
} from './TaskDialog';
import { completeTask, reopenTask, deleteTask } from '../actions/tasks';

interface EmployeeOption { id: string; full_name: string }

interface Props {
  applications: ApplicationRow[];
  tasks: TaskRow[];
  currentEmployeeId: string | null;
  isAdmin: boolean;
  canManageTasksForApp: (app: ApplicationRow) => boolean;
  responsibleOptions: EmployeeOption[];
}

function statusVariant(status: ApplicationRow['status']): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'hired') return 'default';
  if (status === 'rejected') return 'destructive';
  if (status === 'withdrawn') return 'secondary';
  if (status === 'in_progress') return 'default';
  return 'outline';
}

function describeDue(task: TaskRow): { label: string; overdue: boolean } {
  if (task.completed_at) {
    return { label: `Concluída ${formatDate(task.completed_at)}`, overdue: false };
  }
  if (!task.due_date) return { label: 'Sem prazo', overdue: false };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(task.due_date + 'T00:00:00');
  const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `Venceu há ${Math.abs(diffDays)}d`, overdue: true };
  if (diffDays === 0) return { label: 'Hoje', overdue: false };
  if (diffDays === 1) return { label: 'Amanhã', overdue: false };
  return { label: `Em ${diffDays}d`, overdue: false };
}

export function TasksSection({
  applications, tasks, currentEmployeeId, isAdmin, canManageTasksForApp, responsibleOptions,
}: Props) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [context, setContext] = useState<TaskContext | null>(null);
  const [editInitial, setEditInitial] = useState<TaskEditInitial | null>(null);

  const byApp = useMemo(() => {
    const map = new Map<string, TaskRow[]>();
    for (const t of tasks) {
      const list = map.get(t.application_id) ?? [];
      list.push(t);
      map.set(t.application_id, list);
    }
    // Ordenar: pendentes primeiro (por prazo asc, nulls last), depois concluídas (desc)
    for (const [id, list] of map.entries()) {
      list.sort((a, b) => {
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
      map.set(id, list);
    }
    return map;
  }, [tasks]);

  function openNew(app: ApplicationRow) {
    setEditInitial(null);
    setContext({
      applicationId: app.id,
      candidateName: app.candidate?.name ?? 'Candidato',
      jobTitle: app.job_opening?.title ?? 'Vaga',
    });
    setDialogOpen(true);
  }

  function openEdit(t: TaskRow, app: ApplicationRow | null) {
    setEditInitial({
      id: t.id,
      title: t.title,
      due_date: t.due_date,
      responsible_id: t.responsible_id,
    });
    setContext({
      applicationId: t.application_id,
      candidateName: app?.candidate?.name ?? 'Candidato',
      jobTitle: app?.job_opening?.title ?? 'Vaga',
    });
    setDialogOpen(true);
  }

  async function onToggle(t: TaskRow) {
    const result = t.completed_at ? await reopenTask(t.id) : await completeTask(t.id);
    if ('error' in result && result.error) { toast.error(result.error); return; }
    router.refresh();
  }

  async function onDelete(id: string) {
    const result = await deleteTask(id);
    if ('error' in result && result.error) { toast.error(result.error); return; }
    toast.success('Tarefa removida');
    router.refresh();
  }

  if (applications.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Candidato ainda não foi vinculado a nenhuma vaga.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {applications.map((app) => {
          const appTasks = byApp.get(app.id) ?? [];
          return (
            <TaskAppGroup
              key={app.id}
              app={app}
              tasks={appTasks}
              defaultOpen={app.status === 'in_progress'}
              currentEmployeeId={currentEmployeeId}
              isAdmin={isAdmin}
              canManage={canManageTasksForApp(app)}
              onNew={() => openNew(app)}
              onEdit={(t) => openEdit(t, app)}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          );
        })}
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={(v) => { if (!v) { setContext(null); setEditInitial(null); } setDialogOpen(v); }}
        context={context}
        initial={editInitial}
        defaultResponsibleId={currentEmployeeId}
        responsibleOptions={responsibleOptions}
      />
    </>
  );
}

interface GroupProps {
  app: ApplicationRow;
  tasks: TaskRow[];
  defaultOpen: boolean;
  currentEmployeeId: string | null;
  isAdmin: boolean;
  canManage: boolean;
  onNew: () => void;
  onEdit: (t: TaskRow) => void;
  onToggle: (t: TaskRow) => void;
  onDelete: (id: string) => void;
}

function TaskAppGroup({
  app, tasks, defaultOpen, currentEmployeeId, isAdmin, canManage,
  onNew, onEdit, onToggle, onDelete,
}: GroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const pending = tasks.filter((t) => !t.completed_at).length;
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 py-1.5 hover:text-foreground transition-colors"
      >
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', !open && '-rotate-90')} />
        <span className="text-sm font-medium flex-1 text-left">{app.job_opening?.title ?? 'Vaga'}</span>
        <Badge variant={statusVariant(app.status)} className="text-[10px]">
          {APPLICATION_STATUS_LABELS[app.status]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {pending} pendente{pending === 1 ? '' : 's'} · {tasks.length} total
        </span>
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {canManage && (
            <Button size="sm" variant="ghost" onClick={onNew} className="justify-start text-primary px-0 hover:bg-transparent">
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar tarefa
            </Button>
          )}
          {tasks.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nenhuma tarefa ainda.</p>
          ) : (
            tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                currentEmployeeId={currentEmployeeId}
                isAdmin={isAdmin}
                canManage={canManage}
                onEdit={() => onEdit(t)}
                onToggle={() => onToggle(t)}
                onDelete={() => onDelete(t.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, currentEmployeeId, isAdmin, canManage, onEdit, onToggle, onDelete }: {
  task: TaskRow;
  currentEmployeeId: string | null;
  isAdmin: boolean;
  canManage: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const due = describeDue(task);
  const completed = !!task.completed_at;
  const isCreator = task.created_by === currentEmployeeId;
  const isResponsible = task.responsible_id === currentEmployeeId;
  const canToggle = canManage || isAdmin || isCreator || isResponsible;
  const canEdit = canManage || isAdmin || isCreator;
  const canDelete = canEdit;

  return (
    <div className={cn(
      'group flex items-center gap-2.5 rounded-md border bg-card px-2.5 py-2 text-xs',
      completed && 'bg-muted/30',
    )}>
      <button
        type="button"
        onClick={onToggle}
        disabled={!canToggle}
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
          completed ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40 hover:border-primary/60',
          !canToggle && 'cursor-not-allowed opacity-50',
        )}
        aria-label={completed ? 'Reabrir tarefa' : 'Concluir tarefa'}
      >
        {completed && '✓'}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn('font-medium truncate', completed && 'line-through text-muted-foreground')}>
          {task.title}
        </p>
        <p className="text-[10.5px] text-muted-foreground flex items-center gap-2">
          <span className={cn(due.overdue && 'text-destructive font-medium')}>
            {due.overdue && '⚠ '}{due.label}
          </span>
          <span>·</span>
          <span>{task.responsible?.full_name ?? '—'}</span>
        </p>
      </div>
      {(canEdit || canDelete) && (
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded p-0.5 hover:bg-muted opacity-0 group-hover:opacity-100" aria-label="Ações">
            <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {completed && canToggle && (
              <DropdownMenuItem onClick={onToggle}>
                <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reabrir
              </DropdownMenuItem>
            )}
            {canEdit && !completed && (
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
              </DropdownMenuItem>
            )}
            {canDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Remover
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
