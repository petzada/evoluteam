'use client';

import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomPeriodPopover } from './CustomPeriodPopover';

export type PeriodValue =
  | { kind: '7d' }
  | { kind: '30d' }
  | { kind: '90d' }
  | { kind: 'all' }
  | { kind: 'custom'; from: string; to: string };

interface Props {
  value: PeriodValue;
  onChange: (next: PeriodValue) => void;
}

const PRESETS: Array<{ key: '7d' | '30d' | '90d'; label: string }> = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
];

/**
 * Chips de período do dashboard de recrutamento (spec 16 §7.2).
 * Presets 7d/30d/90d + chip "📅 Personalizado" que abre popover com calendário duplo.
 * Chip "Tudo" vive dentro do popover Personalizado.
 */
export function PeriodChips({ value, onChange }: Props) {
  const activeKind = value.kind;

  function isActive(key: string) {
    return activeKind === key;
  }

  return (
    <div className="flex items-center gap-1.5">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange({ kind: p.key })}
          className={cn(
            'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors',
            isActive(p.key)
              ? 'bg-primary/10 text-primary border-primary/40'
              : 'bg-background text-muted-foreground border-border hover:bg-muted',
          )}
        >
          {p.label}
        </button>
      ))}
      <CustomPeriodPopover
        value={value.kind === 'custom' || value.kind === 'all' ? value : null}
        onApply={onChange}
        trigger={
          <button
            type="button"
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5',
              activeKind === 'custom' || activeKind === 'all'
                ? 'bg-primary/10 text-primary border-primary/40'
                : 'bg-background text-muted-foreground border-border hover:bg-muted',
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            {activeKind === 'all'
              ? 'Tudo'
              : activeKind === 'custom'
                ? formatRange(value as { from: string; to: string })
                : 'Personalizado'}
          </button>
        }
      />
    </div>
  );
}

function formatRange(v: { from: string; to: string }) {
  const from = new Date(v.from);
  const to = new Date(v.to);
  const f = from.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const t = to.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${f} – ${t}`;
}
