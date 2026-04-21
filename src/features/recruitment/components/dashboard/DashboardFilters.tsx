'use client';

import { useMemo, useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { PeriodChips, type PeriodValue } from './PeriodChips';
import type { JobOption, EmployeeOption } from '../../queries/metrics';

interface Props {
  jobs: JobOption[];
  employees: EmployeeOption[];
  /** Se gestor, não mostra MultiSelect de Responsável. */
  hideManagerFilter?: boolean;
}

/**
 * Barra completa de filtros do dashboard (spec 16 §7.2, §7.3).
 * Lê/escreve searchParams: period=7d|30d|90d|all, from/to (YYYY-MM-DD),
 * job_ids=a,b,  owner_ids=c,d, q=texto.
 */
export function DashboardFilters({ jobs, employees, hideManagerFilter }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const period = readPeriod(searchParams);
  const jobIds = readList(searchParams, 'job_ids');
  const ownerIds = readList(searchParams, 'owner_ids');
  const initialQ = searchParams.get('q') ?? '';

  const [searchText, setSearchText] = useState(initialQ);

  const push = useCallback(
    (mutator: (sp: URLSearchParams) => void) => {
      const sp = new URLSearchParams(searchParams.toString());
      mutator(sp);
      startTransition(() => {
        router.replace(`?${sp.toString()}`, { scroll: false });
      });
    },
    [router, searchParams, startTransition],
  );

  // Debounce da busca
  useEffect(() => {
    if (searchText === initialQ) return;
    const t = setTimeout(() => {
      push((sp) => {
        if (searchText.trim()) sp.set('q', searchText.trim());
        else sp.delete('q');
      });
    }, 300);
    return () => clearTimeout(t);
  }, [searchText, initialQ, push]);

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

  function onJobsChange(next: string[]) {
    push((sp) => {
      if (next.length > 0) sp.set('job_ids', next.join(','));
      else sp.delete('job_ids');
    });
  }

  function onOwnersChange(next: string[]) {
    push((sp) => {
      if (next.length > 0) sp.set('owner_ids', next.join(','));
      else sp.delete('owner_ids');
    });
  }

  const jobOptions = useMemo(
    () => jobs.map((j) => ({ value: j.id, label: j.title })),
    [jobs],
  );
  const empOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: e.name })),
    [employees],
  );

  return (
    <div className="mb-4">
      {/* Chips de período no topo direito dentro do mesmo card do header */}
      <div className="mb-3 flex justify-end">
        <PeriodChips value={period} onChange={onPeriodChange} />
      </div>

      {/* Barra de filtros */}
      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
        <div className="flex flex-col gap-1">
          <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Buscar candidato</span>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Nome ou e-mail…"
              className="w-56 pl-8 h-8 text-xs"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Vaga</span>
          <MultiSelectFilter
            label="vagas"
            placeholder="Todas as vagas"
            options={jobOptions}
            value={jobIds}
            onChange={onJobsChange}
            emptyText="Nenhuma vaga"
          />
        </div>

        {!hideManagerFilter && (
          <div className="flex flex-col gap-1">
            <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Responsável</span>
            <MultiSelectFilter
              label="responsáveis"
              placeholder="Todos responsáveis"
              options={empOptions}
              value={ownerIds}
              onChange={onOwnersChange}
              emptyText="Nenhum responsável"
            />
          </div>
        )}
      </div>
    </div>
  );
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

function readList(sp: URLSearchParams | null, key: string): string[] {
  if (!sp) return [];
  const v = sp.get(key);
  if (!v) return [];
  return v.split(',').filter(Boolean);
}
