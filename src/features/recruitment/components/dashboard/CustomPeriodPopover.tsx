'use client';

import { useEffect, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { PeriodValue } from './PeriodChips';

interface Props {
  /** Valor atual quando modo é custom ou all (para popular os inputs). */
  value: PeriodValue | null;
  onApply: (next: PeriodValue) => void;
  trigger: React.ReactElement;
}

/**
 * Popover com 2 inputs de data (máscara dd/mm/aaaa) + botões Tudo / Aplicar
 * alinhados à direita. Substitui o calendário duplo react-day-picker.
 */
export function CustomPeriodPopover({ value, onApply, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [fromText, setFromText] = useState<string>('');
  const [toText, setToText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fromInputRef = useRef<HTMLInputElement | null>(null);

  // Hidrata inputs quando popover abre com valor existente.
  // setTimeout(0) pra sair do tick síncrono do effect (evita cascading renders).
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      if (value && value.kind === 'custom') {
        setFromText(ymdToBr(value.from));
        setToText(ymdToBr(value.to));
      } else {
        setFromText('');
        setToText('');
      }
      setError(null);
      fromInputRef.current?.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open, value]);

  function handleApply() {
    const fromYmd = brToYmd(fromText);
    const toYmd = brToYmd(toText);
    if (!fromYmd || !toYmd) {
      setError('Informe as duas datas no formato dd/mm/aaaa.');
      return;
    }
    const fromDate = new Date(fromYmd);
    const toDate = new Date(toYmd);
    if (fromDate > toDate) {
      setError('A data inicial não pode ser maior que a final.');
      return;
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (fromDate > today || toDate > today) {
      setError('Datas no futuro não são permitidas.');
      return;
    }
    onApply({ kind: 'custom', from: fromYmd, to: toYmd });
    setOpen(false);
  }

  function handleAll() {
    onApply({ kind: 'all' });
    setFromText('');
    setToText('');
    setError(null);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent className="w-72 p-0" align="end">
        <div className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="period-from" className="text-xs text-muted-foreground">
              Data início
            </Label>
            <Input
              id="period-from"
              ref={fromInputRef}
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              maxLength={10}
              value={fromText}
              onChange={(e) => {
                setError(null);
                setFromText(formatDateMask(e.target.value));
              }}
              onKeyDown={handleKeyDown}
              className={cn(error && 'border-destructive')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="period-to" className="text-xs text-muted-foreground">
              Data fim
            </Label>
            <Input
              id="period-to"
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              maxLength={10}
              value={toText}
              onChange={(e) => {
                setError(null);
                setToText(formatDateMask(e.target.value));
              }}
              onKeyDown={handleKeyDown}
              className={cn(error && 'border-destructive')}
            />
          </div>
          {error && (
            <p className="text-[11px] text-destructive">{error}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-3 py-2 bg-muted/30">
          <Button type="button" variant="ghost" size="sm" onClick={handleAll}>
            Tudo
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            disabled={fromText.length !== 10 || toText.length !== 10}
          >
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Aplica máscara dd/mm/aaaa durante digitação. */
function formatDateMask(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** "dd/mm/aaaa" → "YYYY-MM-DD" (ou null se inválido). */
function brToYmd(br: string): string | null {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = Number(dd), mo = Number(mm), y = Number(yyyy);
  if (mo < 1 || mo > 12) return null;
  if (d < 1 || d > 31) return null;
  // valida que o Date realmente coincide (ex.: 31/02 vira 03/03 se não validado)
  const date = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  if (date.getUTCFullYear() !== y || date.getUTCMonth() + 1 !== mo || date.getUTCDate() !== d) {
    return null;
  }
  return `${yyyy}-${mm}-${dd}`;
}

/** "YYYY-MM-DD" → "dd/mm/aaaa". */
function ymdToBr(ymd: string): string {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';
  return `${m[3]}/${m[2]}/${m[1]}`;
}
