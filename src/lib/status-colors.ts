export type StatusToken =
  | 'neutral'
  | 'progress'
  | 'success'
  | 'warning'
  | 'danger'
  | 'muted'
  | 'archived';

const MAP: Record<StatusToken, string> = {
  neutral:  'bg-slate-100 text-slate-700',
  progress: 'bg-blue-100 text-blue-900',
  success:  'bg-emerald-100 text-emerald-800',
  warning:  'bg-amber-100 text-amber-800',
  danger:   'bg-red-100 text-red-900',
  muted:    'bg-slate-100 text-slate-400',
  archived: 'bg-slate-200 text-slate-900',
};

export function statusClass(token: StatusToken): string {
  return MAP[token];
}
