'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type CycleOption = {
  id: string;
  name: string;
  status: 'published' | 'closed' | 'archived';
};

type DepartmentOption = {
  id: string;
  name: string;
};

interface Props {
  cycles: CycleOption[];
  selectedCycleId: string | null;
  departments: DepartmentOption[];
  selectedDepartmentId: string | null;
  showDepartmentFilter: boolean;
}

const NO_CYCLE_VALUE = '__none__';
const ALL_CYCLES_VALUE = '__all__';
const ALL_DEPTS_VALUE = '__all__';

function labelForCycle(c: CycleOption) {
  const suffix = c.status === 'archived'
    ? ' (arquivado)'
    : c.status === 'closed'
      ? ' (encerrado)'
      : '';
  return `${c.name}${suffix}`;
}

export function DashboardFilters({
  cycles,
  selectedCycleId,
  departments,
  selectedDepartmentId,
  showDepartmentFilter,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function setParam(key: string, value: string | null) {
    const p = new URLSearchParams(searchParams?.toString() ?? '');
    if (value === null || value === '') p.delete(key);
    else p.set(key, value);
    startTransition(() => {
      router.replace(`/dashboard${p.toString() ? `?${p.toString()}` : ''}`);
    });
  }

  const hasCycles = cycles.length > 0;
  const cycleValue = selectedCycleId === 'all'
    ? ALL_CYCLES_VALUE
    : (selectedCycleId ?? (hasCycles ? cycles[0].id : NO_CYCLE_VALUE));

  const cycleItems = hasCycles
    ? [
        { value: ALL_CYCLES_VALUE, label: 'Todos os ciclos (consolidado)' },
        ...cycles.map((c) => ({ value: c.id, label: labelForCycle(c) })),
      ]
    : [{ value: NO_CYCLE_VALUE, label: 'Nenhum ciclo criado' }];

  const deptValue = selectedDepartmentId ?? ALL_DEPTS_VALUE;
  const deptItems = [
    { value: ALL_DEPTS_VALUE, label: 'Todos os departamentos' },
    ...departments.map((d) => ({ value: d.id, label: d.name })),
  ];

  return (
    <div
      className="flex w-full flex-wrap items-center justify-end gap-3"
      data-pending={pending ? '' : undefined}
    >
      <Select
        value={cycleValue}
        onValueChange={(v) => {
          if (!hasCycles || !v || v === NO_CYCLE_VALUE) return;
          if (v === ALL_CYCLES_VALUE) {
            setParam('cycle_id', 'all');
            return;
          }
          setParam('cycle_id', v);
        }}
        items={cycleItems}
        disabled={!hasCycles}
      >
        <SelectTrigger className="w-60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {cycleItems.map((it) => (
            <SelectItem key={it.value} value={it.value} disabled={it.value === NO_CYCLE_VALUE}>
              {it.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {showDepartmentFilter && (
        <Select
          value={deptValue}
          onValueChange={(v) => setParam('dept_id', v === ALL_DEPTS_VALUE ? null : (v ?? null))}
          items={deptItems}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {deptItems.map((it) => (
              <SelectItem key={it.value} value={it.value}>
                {it.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
