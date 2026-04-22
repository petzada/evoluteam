import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatDeadlineDate(date: Date): string {
  return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function daysUntil(date: Date): number {
  const diffMs = date.getTime() - Date.now();
  return Math.ceil(diffMs / 86_400_000);
}
