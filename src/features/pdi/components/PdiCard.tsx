import Link from 'next/link';
import { formatDate } from '@/lib/date';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PlanRow } from '../queries';
import { computePdiStatus, pdiStatusColor } from '../utils';
import { PDI_STATUS_LABELS } from '../schema';

export function PdiCard({ plan, showEmployee = true }: { plan: PlanRow; showEmployee?: boolean }) {
  const computed = computePdiStatus(plan);
  const done = plan.actions_done;
  const total = plan.actions_count;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const label = PDI_STATUS_LABELS[computed] ?? computed;
  const isOverdue = computed === 'atrasado';

  return (
    <Link
      href={`/pdi/${plan.id}`}
      className="block rounded-md border p-4 text-sm hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          {showEmployee && (
            <p className="font-medium truncate">
              {plan.employee?.full_name ?? '—'}
              {plan.employee?.status === 'terminated' && (
                <span className="ml-2 text-xs text-muted-foreground">(desligado)</span>
              )}
            </p>
          )}
          {plan.employee?.position && (
            <p className="text-xs text-muted-foreground truncate">{plan.employee.position.name}</p>
          )}
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium',
            pdiStatusColor(computed),
          )}
        >
          {label}
        </span>
      </div>

      <p className="line-clamp-2 text-foreground mb-3">{plan.objective}</p>

      <div className="mb-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
          <span>{done} de {total} ações concluídas</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              computed === 'concluido' ? 'bg-emerald-500'
                : isOverdue ? 'bg-amber-500'
                : 'bg-primary',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
        <span
          className={cn(
            'inline-flex items-center rounded-md border px-2 py-0.5',
            isOverdue ? 'border-amber-200 text-amber-700' : 'text-muted-foreground',
          )}
        >
          Prazo: {formatDate(plan.due_date)}
        </span>
        {plan.competency && (
          <Badge variant="outline" className="text-[11px]">
            {plan.competency.name}
            {plan.competency.is_archived && <span className="ml-1 text-muted-foreground">(arquivada)</span>}
          </Badge>
        )}
        {plan.cycle && (
          <Badge variant="secondary" className="text-[11px]">Ciclo: {plan.cycle.name}</Badge>
        )}
      </div>
    </Link>
  );
}
