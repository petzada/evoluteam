export type StatusToken =
  | 'neutral'
  | 'progress'
  | 'success'
  | 'warning'
  | 'danger'
  | 'muted'
  | 'archived';

const MAP: Record<StatusToken, string> = {
  neutral:  'bg-slate-200 text-slate-700',
  progress: 'bg-accent text-accent-foreground',
  success:  'bg-emerald-100 text-emerald-800',
  warning:  'bg-amber-100 text-amber-800',
  danger:   'bg-red-100 text-red-900',
  muted:    'bg-slate-200/70 text-slate-500',
  archived: 'bg-slate-300 text-slate-900',
};

export function statusClass(token: StatusToken): string {
  return MAP[token];
}
