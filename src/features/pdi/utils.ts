import type {
  PdiStatus, PdiActionStatus, PdiComputedStatus, PdiActionComputedStatus,
} from './schema';

function isPastDate(dateStr: string): boolean {
  const d = new Date(dateStr + 'T23:59:59');
  return d.getTime() < Date.now();
}

export function computePdiStatus(plan: { status: PdiStatus | string; due_date: string }): PdiComputedStatus {
  const s = plan.status as PdiStatus;
  if (s === 'concluido' || s === 'cancelado') return s;
  if (isPastDate(plan.due_date)) return 'atrasado';
  return s;
}

export function computeActionStatus(action: { status: PdiActionStatus | string; due_date: string }): PdiActionComputedStatus {
  const s = action.status as PdiActionStatus;
  if (s === 'concluida' || s === 'cancelada') return s;
  if (isPastDate(action.due_date)) return 'atrasada';
  return s;
}

export function progressFor(actions: { status: string }[]): { done: number; total: number } {
  const total = actions.length;
  const done = actions.filter((a) => a.status === 'concluida').length;
  return { done, total };
}

export function pdiStatusColor(status: PdiComputedStatus): string {
  switch (status) {
    case 'em_andamento': return 'bg-amber-100 text-amber-900 border-amber-200';
    case 'atrasado': return 'bg-red-100 text-red-900 border-red-200';
    case 'concluido': return 'bg-emerald-100 text-emerald-900 border-emerald-200';
    case 'cancelado': return 'bg-muted text-muted-foreground border-muted';
    case 'nao_iniciado':
    default:
      return 'bg-muted text-muted-foreground border-muted';
  }
}

export function actionStatusColor(status: PdiActionComputedStatus): string {
  switch (status) {
    case 'em_andamento': return 'bg-amber-100 text-amber-900 border-amber-200';
    case 'atrasada': return 'bg-red-100 text-red-900 border-red-200';
    case 'concluida': return 'bg-emerald-100 text-emerald-900 border-emerald-200';
    case 'cancelada': return 'bg-muted text-muted-foreground border-muted';
    case 'pendente':
    default:
      return 'bg-muted text-muted-foreground border-muted';
  }
}
