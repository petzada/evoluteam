'use client';

import { MoreVertical, Pencil, Trash2, RotateCcw } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date';
import type { TaskRow as TaskRowType } from '../../queries/tasks';

export function describeDue(task: TaskRowType): { label: string; overdue: boolean } {
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

interface Props {
  task: TaskRowType;
  currentEmployeeId: string | null;
  isAdmin: boolean;
  canManage: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}

export function TaskRowItem({
  task, currentEmployeeId, isAdmin, canManage, onEdit, onToggle, onDelete,
}: Props) {
  const due = describeDue(task);
  const completed = !!task.completed_at;
  const isCreator = task.created_by === currentEmployeeId;
  const isResponsible = task.responsible_id === currentEmployeeId;
  const canToggle = canManage || isAdmin || isCreator || isResponsible;
  const canEdit = canManage || isAdmin || isCreator;
  const canDelete = canEdit;

  return (
    <div className={cn(
      'group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs',
      completed ? 'bg-muted/40' : 'bg-muted/20',
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
