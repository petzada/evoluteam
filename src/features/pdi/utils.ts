import type {
  PdiStatus, PdiActionStatus, PdiComputedStatus, PdiActionComputedStatus,
} from './schema';
import { statusClass, type StatusToken } from '@/lib/status-colors';

function isPastDate(dateStr: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr < today;
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

function pdiStatusToken(status: PdiComputedStatus): StatusToken {
  switch (status) {
    case 'em_andamento': return 'progress';
    case 'atrasado':     return 'warning';
    case 'concluido':    return 'success';
    case 'cancelado':    return 'muted';
    case 'nao_iniciado':
    default:             return 'neutral';
  }
}

function actionStatusToken(status: PdiActionComputedStatus): StatusToken {
  switch (status) {
    case 'em_andamento': return 'progress';
    case 'atrasada':     return 'warning';
    case 'concluida':    return 'success';
    case 'cancelada':    return 'muted';
    case 'pendente':
    default:             return 'neutral';
  }
}

export function pdiStatusColor(status: PdiComputedStatus): string {
  return statusClass(pdiStatusToken(status));
}

export function actionStatusColor(status: PdiActionComputedStatus): string {
  return statusClass(actionStatusToken(status));
}
