'use client';

import { useMemo, useState, useTransition, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import type { JobOption, EmployeeOption } from '../../queries/metrics';

interface Props {
  jobs: JobOption[];
  employees: EmployeeOption[];
  /** Se gestor, não mostra MultiSelect de Responsável. */
  hideManagerFilter?: boolean;
}

/**
 * Barra de filtros do dashboard (spec 16 §7.3). Busca + MultiSelect Vaga +
 * MultiSelect Responsável. Os chips de período vão no slot actions do
 * PageHeader via <DashboardPeriodChips/>.
 * Padrão visual alinhado com EmployeesList: sem card wrapping.
 */
export function DashboardFilters({ jobs, employees, hideManagerFilter }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

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
    <div className="flex flex-wrap gap-3 mb-4">
      <div className="relative flex-1 min-w-[240px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar candidato por nome ou e-mail…"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-9"
        />
      </div>
      <MultiSelectFilter
        label="Vagas"
        placeholder="Todas as vagas"
        options={jobOptions}
        value={jobIds}
        onChange={onJobsChange}
        width="w-48"
        emptyText="Nenhuma vaga"
      />
      {!hideManagerFilter && (
        <MultiSelectFilter
          label="Responsáveis"
          placeholder="Todos responsáveis"
          options={empOptions}
          value={ownerIds}
          onChange={onOwnersChange}
          width="w-48"
          emptyText="Nenhum responsável"
        />
      )}
    </div>
  );
}

function readList(sp: URLSearchParams | null, key: string): string[] {
  if (!sp) return [];
  const v = sp.get(key);
  if (!v) return [];
  return v.split(',').filter(Boolean);
}
