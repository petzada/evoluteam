'use client';

import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import type { PeriodValue } from './PeriodChips';

interface Props {
  /** Valor atual quando modo é custom ou all (para popular calendário). */
  value: PeriodValue | null;
  onApply: (next: PeriodValue) => void;
  trigger: React.ReactElement;
}

/**
 * Popover com calendário duplo em mode="range" + botões Tudo / Aplicar.
 * Spec 16 §7.2: primeiro clique define "de"; segundo define "até"; range
 * é pintado entre eles. "Aplicar" desabilitado se range incompleto.
 */
export function CustomPeriodPopover({ value, onApply, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(() => {
    if (value && value.kind === 'custom') {
      return { from: new Date(value.from), to: new Date(value.to) };
    }
    return undefined;
  });

  function handleApply() {
    if (!range?.from || !range?.to) return;
    onApply({
      kind: 'custom',
      from: toYMD(range.from),
      to: toYMD(range.to),
    });
    setOpen(false);
  }

  function handleAll() {
    onApply({ kind: 'all' });
    setRange(undefined);
    setOpen(false);
  }

  const canApply = !!(range?.from && range?.to && range.from <= range.to);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="range"
          selected={range}
          onSelect={setRange}
          numberOfMonths={2}
          defaultMonth={range?.from ?? new Date()}
          disabled={{ after: new Date() }}
        />
        <div className="flex items-center justify-between border-t px-3 py-2 bg-muted/30">
          <Button type="button" variant="ghost" size="sm" onClick={handleAll}>
            Tudo
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={!canApply}
          >
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
