'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, TrendingUp } from 'lucide-react';
import { SetAppTopBar } from '@/features/shell/AppTopBarContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PlanRow } from '../queries';
import { PdiCard } from './PdiCard';
import { PdiSheet, type EmployeeOption, type CompetencyOption, type CycleOption } from './PdiSheet';
import { computePdiStatus } from '../utils';
import { PDI_STATUS_LABELS, type PdiComputedStatus } from '../schema';

type PeriodFilter = 'all' | '30d' | '90d' | '6m' | '1y';

interface Props {
  mine: PlanRow[];
  team: PlanRow[];
  all: PlanRow[];
  hasTeam: boolean;
  isAdmin: boolean;
  canSeeAll: boolean;
  canCreateAny: boolean;
  actorEmployeeId: string | null;
  employees: EmployeeOption[];
  competencies: CompetencyOption[];
  cycles: CycleOption[];
}

const PAGE_SIZE = 20;
const FILTER_STATUSES: PdiComputedStatus[] = [
  'concluido',
  'em_andamento',
  'atrasado',
  'cancelado',
  'nao_iniciado',
];

function filterByPeriod(rows: PlanRow[], period: PeriodFilter) {
  if (period === 'all') return rows;
  const days = { '30d': 30, '90d': 90, '6m': 183, '1y': 365 }[period];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return rows.filter((r) => new Date(r.due_date) >= cutoff);
}

export function PdisPage({
  mine, team, all, hasTeam, isAdmin, canSeeAll, canCreateAny, actorEmployeeId,
  employees, competencies, cycles,
}: Props) {
  const searchParams = useSearchParams();
  const initialStatusFilter = (() => {
    const raw = searchParams?.get('status');
    if (!raw) return [] as string[];
    const valid = FILTER_STATUSES as readonly string[];
    return valid.includes(raw) ? [raw] : [];
  })();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string[]>(initialStatusFilter);
  const [competencyFilter, setCompetencyFilter] = useState<string[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [nameSearch, setNameSearch] = useState('');

  const applyFilters = useMemo(() => (rows: PlanRow[]) => {
    let out = rows;
    const q = nameSearch.trim().toLowerCase();
    if (q) {
      out = out.filter((r) => (r.employee?.full_name.toLowerCase() ?? '').includes(q));
    }
    if (statusFilter.length) {
      out = out.filter((r) => statusFilter.includes(computePdiStatus(r)));
    }
    if (competencyFilter.length) {
      out = out.filter((r) => competencyFilter.includes(r.competency_id ?? '__none__'));
    }
    return filterByPeriod(out, period);
  }, [nameSearch, statusFilter, competencyFilter, period]);

  const filteredMine = useMemo(() => applyFilters(mine), [applyFilters, mine]);
  const filteredTeam = useMemo(() => applyFilters(team), [applyFilters, team]);
  const filteredAll = useMemo(() => applyFilters(all), [applyFilters, all]);

  return (
    <div>
      <SetAppTopBar
        title="PDIs"
        actions={
          canCreateAny ? (
            <Button onClick={() => setSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Novo PDI
            </Button>
          ) : null
        }
      />

      <div className="mb-4 flex w-full flex-wrap items-center justify-end gap-3">
        <div className="relative min-w-[200px] max-w-xs w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do colaborador…"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            className="pl-9"
            aria-label="Buscar por nome do colaborador"
          />
        </div>
        <MultiSelectFilter
          label="Status"
          options={FILTER_STATUSES.map((s) => ({ value: s, label: PDI_STATUS_LABELS[s] }))}
          value={statusFilter}
          onChange={setStatusFilter}
          width="w-44"
        />
        <MultiSelectFilter
          label="Competências"
          options={[
            { value: '__none__', label: 'Sem competência' },
            ...competencies.map((c) => ({ value: c.id, label: c.name })),
          ]}
          value={competencyFilter}
          onChange={setCompetencyFilter}
          width="w-52"
        />
        <Select
          value={period}
          onValueChange={(v) => setPeriod((v as PeriodFilter) ?? 'all')}
          items={[
            { value: 'all', label: 'Qualquer prazo' },
            { value: '30d', label: 'Próximos 30 dias' },
            { value: '90d', label: 'Próximos 90 dias' },
            { value: '6m', label: 'Próximos 6 meses' },
            { value: '1y', label: 'Próximo ano' },
          ]}
        >
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer prazo</SelectItem>
            <SelectItem value="30d">Próximos 30 dias</SelectItem>
            <SelectItem value="90d">Próximos 90 dias</SelectItem>
            <SelectItem value="6m">Próximos 6 meses</SelectItem>
            <SelectItem value="1y">Próximo ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">Meus PDIs</TabsTrigger>
          {hasTeam && <TabsTrigger value="team">Minha equipe</TabsTrigger>}
          {canSeeAll && <TabsTrigger value="all">Todos</TabsTrigger>}
        </TabsList>

        <TabsContent value="mine" className="mt-6">
          <PdiList
            items={filteredMine}
            emptyMessage="Você ainda não tem PDIs."
            showEmployee={false}
            onCreate={canCreateAny ? () => setSheetOpen(true) : undefined}
          />
        </TabsContent>

        {hasTeam && (
          <TabsContent value="team" className="mt-6">
            <PdiList
              items={filteredTeam}
              emptyMessage="Nenhum PDI na sua equipe."
              onCreate={canCreateAny ? () => setSheetOpen(true) : undefined}
            />
          </TabsContent>
        )}

        {canSeeAll && (
          <TabsContent value="all" className="mt-6">
            <PdiList
              items={filteredAll}
              emptyMessage="Nenhum PDI registrado."
              onCreate={canCreateAny ? () => setSheetOpen(true) : undefined}
            />
          </TabsContent>
        )}
      </Tabs>

      <PdiSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        employees={employees}
        competencies={competencies}
        cycles={cycles}
        isAdmin={isAdmin}
        actorEmployeeId={actorEmployeeId}
      />
    </div>
  );
}

function PdiList({
  items, emptyMessage, showEmployee = true, onCreate,
}: {
  items: PlanRow[];
  emptyMessage: string;
  showEmployee?: boolean;
  onCreate?: () => void;
}) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <TrendingUp className="h-8 w-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground mb-4">{emptyMessage}</p>
        {onCreate && (
          <Button variant="outline" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> Criar primeiro PDI
          </Button>
        )}
      </div>
    );
  }

  const slice = items.slice(0, visible);
  const hasMore = items.length > visible;

  return (
    <>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {slice.map((plan) => (
          <li key={plan.id}>
            <PdiCard plan={plan} showEmployee={showEmployee} />
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
            Carregar mais ({items.length - visible} restantes)
          </Button>
        </div>
      )}
    </>
  );
}
