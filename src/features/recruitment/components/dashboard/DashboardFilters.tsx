'use client';

import { useCallback, useEffect, useMemo, useRef, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { cn } from '@/lib/utils';
import type { JobOption, EmployeeOption } from '../../queries/metrics';

interface Props {
  jobs: JobOption[];
  employees: EmployeeOption[];
  /** Se gestor, não mostra MultiSelect de Responsável. */
  hideManagerFilter?: boolean;
  /** `toolbar`: linha com mb-4 (legado). `dialog`: coluna para uso dentro do modal. */
  variant?: 'toolbar' | 'dialog';
}

/**
 * Filtros avançados do dashboard de recrutamento (spec 16 §7.3): busca + vagas +
 * responsáveis. Chips de período ficam fora, em <DashboardPeriodChips/>.
 */
export function DashboardFilters({
  jobs,
  employees,
  hideManagerFilter,
  variant = 'toolbar',
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const jobIds = readList(searchParams, 'job_ids');
  const ownerIds = readList(searchParams, 'owner_ids');
  const initialQ = searchParams.get('q') ?? '';
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, []);

  const onSearchChange = useCallback(
    (next: string) => {
      const value = next.trim();
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (value === initialQ) return;

      searchTimerRef.current = setTimeout(() => {
        push((sp) => {
          if (value) sp.set('q', value);
          else sp.delete('q');
        });
      }, 300);
    },
    [initialQ, push],
  );

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

  const isDialog = variant === 'dialog';
  const wrapClass = isDialog
    ? 'flex flex-col gap-4'
    : 'mb-4 flex w-full flex-wrap items-center justify-end gap-3';

  return (
    <div className={wrapClass}>
      <div
        className={cn(
          'relative min-w-0',
          isDialog ? 'w-full' : 'min-w-[200px] max-w-xs w-full sm:w-72',
        )}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          key={initialQ}
          placeholder="Buscar candidato por nome ou e-mail…"
          defaultValue={initialQ}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <MultiSelectFilter
        label="Vagas"
        placeholder="Todas as vagas"
        options={jobOptions}
        value={jobIds}
        onChange={onJobsChange}
        width={isDialog ? 'w-full' : 'w-48'}
        emptyText="Nenhuma vaga"
      />
      {!hideManagerFilter && (
        <MultiSelectFilter
          label="Responsáveis"
          placeholder="Todos responsáveis"
          options={empOptions}
          value={ownerIds}
          onChange={onOwnersChange}
          width={isDialog ? 'w-full' : 'w-48'}
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
