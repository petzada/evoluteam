import type {
  PdiStatus, PdiActionStatus, PdiComputedStatus, PdiActionComputedStatus,
} from './schema';
import { statusClass } from '@/lib/status-colors';
import { pdiActionStatusToken, pdiStatusToken } from '@/lib/status-mappers';

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

export function pdiStatusColor(status: PdiComputedStatus): string {
  return statusClass(pdiStatusToken(status));
}

export function actionStatusColor(status: PdiActionComputedStatus): string {
  return statusClass(pdiActionStatusToken(status));
}
