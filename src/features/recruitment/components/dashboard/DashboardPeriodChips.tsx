'use client';

import { useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PeriodChips, type PeriodValue } from './PeriodChips';

/**
 * Wrapper standalone dos chips de período para ser usado no slot `actions`
 * do PageHeader. Lê e escreve searchParams diretamente — não precisa estar
 * dentro do DashboardFilters.
 */
export function DashboardPeriodChips() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const push = useCallback(
    (mutator: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(searchParams.toString());
      mutator(sp);
      startTransition(() => {
        router.replace(`?${sp.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  function onPeriodChange(next: PeriodValue) {
    push((sp) => {
      sp.delete('from');
      sp.delete('to');
      sp.delete('period');
      if (next.kind === 'custom') {
        sp.set('from', next.from);
        sp.set('to', next.to);
      } else {
        sp.set('period', next.kind);
      }
    });
  }

  const period = readPeriod(searchParams);
  return <PeriodChips value={period} onChange={onPeriodChange} />;
}

function readPeriod(sp: URLSearchParams | null): PeriodValue {
  if (!sp) return { kind: '30d' };
  const from = sp.get('from');
  const to = sp.get('to');
  if (from && to) return { kind: 'custom', from, to };
  const preset = sp.get('period');
  if (preset === '7d' || preset === '90d' || preset === 'all') return { kind: preset };
  return { kind: '30d' };
}
