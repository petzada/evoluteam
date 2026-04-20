'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronLeft, MoreHorizontal, Ban, Check, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDate } from '@/lib/date';
import { cn } from '@/lib/utils';
import { cancelPdi, concludePdi, deletePdi } from '../actions';
import type { PlanRow, PlanActionRow, PlanCommentRow } from '../queries';
import { computePdiStatus, pdiStatusColor } from '../utils';
import { PDI_STATUS_LABELS } from '../schema';
import { PdiActionsSection } from './PdiActionsSection';
import { PdiCommentsSection } from './PdiCommentsSection';
import { PdiHeaderEditForm } from './PdiHeaderEditForm';

interface EmployeeOption {
  id: string;
  full_name: string;
  email: string;
  status: string;
  position: { id: string; name: string } | null;
}

interface Props {
  plan: PlanRow;
  actions: PlanActionRow[];
  comments: PlanCommentRow[];
  employees: EmployeeOption[];
  competencies: { id: string; name: string }[];
  cycles: { id: string; name: string; status: string }[];
  actorUserId: string;
  actorEmployeeId: string | null;
  isAdmin: boolean;
  isDirector: boolean;
}

export function PdiDetail({
  plan, actions, comments, employees, competencies, cycles,
  actorUserId, actorEmployeeId, isAdmin, isDirector,
}: Props) {
  const router = useRouter();
  const [confirmConclude, setConfirmConclude] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);

  const computed = computePdiStatus(plan);
  const isClosed = computed === 'concluido' || computed === 'cancelado';
  const isOverdue = computed === 'atrasado';

  const isCreator = plan.created_by === actorUserId;
  const canEdit = isAdmin || isCreator;
  const canConclude = (isAdmin || isCreator) && !isClosed;
  const canCancel = (isAdmin || isCreator) && !isClosed;
  const canDelete = isAdmin;
  const canAddActions = canEdit && !isClosed;
  const canComment = !isDirector && (
    isAdmin
    || (actorEmployeeId && plan.employee_id === actorEmployeeId)
    || isCreator
  );

  const openActionsCount = actions.filter(
    (a) => a.status !== 'concluida' && a.status !== 'cancelada',
  ).length;

  async function handleConclude() {
    const r = await concludePdi(plan.id);
    if (r.error) { toast.error(r.error); return; }
    toast.success('PDI concluído.');
    setConfirmConclude(false);
    router.refresh();
  }
  async function handleCancel() {
    const r = await cancelPdi(plan.id);
    if (r.error) { toast.error(r.error); return; }
    toast.success('PDI cancelado.');
    setConfirmCancel(false);
    router.refresh();
  }
  async function handleDelete() {
    const r = await deletePdi(plan.id);
    if (r.error) { toast.error(r.error); return; }
    toast.success('PDI removido.');
    setConfirmDelete(false);
    router.push('/pdi');
  }

  return (
    <div>
      <Link
        href="/pdi"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-3.5 w-3.5" /> Voltar aos PDIs
      </Link>

      <div className="mb-6 pb-6 border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {plan.employee && (
                <Link
                  href={`/colaboradores/${plan.employee.id}?tab=pdi`}
                  className="font-semibold text-lg hover:underline"
                >
                  {plan.employee.full_name}
                </Link>
              )}
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                  pdiStatusColor(computed),
                )}
              >
                {PDI_STATUS_LABELS[computed]}
              </span>
            </div>
            {plan.employee?.position && (
              <p className="text-xs text-muted-foreground mb-3">{plan.employee.position.name}</p>
            )}
            <p className="text-sm text-foreground whitespace-pre-wrap">{plan.objective}</p>

            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              <span className={cn(
                'inline-flex items-center rounded-md border px-2 py-0.5',
                isOverdue ? 'border-red-200 text-red-700' : 'text-muted-foreground',
              )}>
                Prazo: {formatDate(plan.due_date)}
              </span>
              {plan.competency && (
                <Badge variant="outline" className="text-xs">
                  {plan.competency.name}
                  {plan.competency.is_archived && <span className="ml-1 text-muted-foreground">(arquivada)</span>}
                </Badge>
              )}
              {plan.cycle && (
                <Link
                  href={`/avaliacoes/${plan.cycle.id}`}
                  className="inline-flex items-center rounded-md border px-2 py-0.5 text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  Ciclo: {plan.cycle.name}
                </Link>
              )}
            </div>
          </div>

          {(canEdit || canConclude || canCancel || canDelete) && (
            <div className="flex items-center gap-2 shrink-0">
              {canEdit && !isClosed && (
                <Button variant="outline" onClick={() => setEditing((v) => !v)}>
                  <Pencil className="h-4 w-4 mr-1.5" /> Editar
                </Button>
              )}
              {canConclude && (
                <Button onClick={() => setConfirmConclude(true)}>
                  <Check className="h-4 w-4 mr-1.5" /> Encerrar PDI
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-md border hover:bg-muted">
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canCancel && (
                    <DropdownMenuItem onClick={() => setConfirmCancel(true)}>
                      <Ban className="h-4 w-4 mr-2" /> Cancelar PDI
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setConfirmDelete(true)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Remover PDI
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {editing && canEdit && (
          <PdiHeaderEditForm
            plan={plan}
            competencies={competencies}
            cycles={cycles}
            onClose={() => setEditing(false)}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <PdiActionsSection
            planId={plan.id}
            actions={actions}
            employees={employees}
            defaultResponsibleId={plan.employee_id}
            canAddActions={canAddActions}
            actorEmployeeId={actorEmployeeId}
            isAdmin={isAdmin}
            isCreator={isCreator}
          />

          <PdiCommentsSection
            planId={plan.id}
            comments={comments}
            canComment={!!canComment}
            canDeleteAny={isAdmin}
            actorEmployeeId={actorEmployeeId}
          />
        </div>

        <aside className="space-y-4">
          <section className="rounded-md border p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Progresso
            </p>
            <Progress done={plan.actions_done} total={plan.actions_count} />
            <p className="mt-2 text-xs text-muted-foreground">
              {plan.actions_done} de {plan.actions_count} ações concluídas
            </p>
          </section>
          <section className="rounded-md border p-4 text-xs">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Detalhes
            </p>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Criado em</dt>
                <dd>{formatDate(plan.created_at)}</dd>
              </div>
              {plan.concluded_at && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Concluído em</dt>
                  <dd>{formatDate(plan.concluded_at)}</dd>
                </div>
              )}
              {plan.cancelled_at && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Cancelado em</dt>
                  <dd>{formatDate(plan.cancelled_at)}</dd>
                </div>
              )}
            </dl>
          </section>
        </aside>
      </div>

      <AlertDialog open={confirmConclude} onOpenChange={setConfirmConclude}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar PDI?</AlertDialogTitle>
            <AlertDialogDescription>
              {openActionsCount > 0
                ? `Existem ${openActionsCount} ${openActionsCount === 1 ? 'ação aberta' : 'ações abertas'}. Deseja encerrar o PDI mesmo assim?`
                : 'O PDI será marcado como concluído. Esta ação registra um evento de auditoria.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConclude}>Encerrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar PDI?</AlertDialogTitle>
            <AlertDialogDescription>
              O PDI será marcado como cancelado. Ações permanecerão visíveis no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Cancelar PDI</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover PDI?</AlertDialogTitle>
            <AlertDialogDescription>
              O PDI será removido das listagens e permanecerá em auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Progress({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            pct === 100 ? 'bg-emerald-500' : 'bg-primary',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
