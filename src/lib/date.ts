const PT_BR_LOCALE = 'pt-BR';
const SAO_PAULO_TZ = 'America/Sao_Paulo';

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat(PT_BR_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: SAO_PAULO_TZ,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat(PT_BR_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: SAO_PAULO_TZ,
  }).format(new Date(date));
}

export function formatRelative(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 7) return `${days} dias atrás`;
  return formatDate(d);
}
