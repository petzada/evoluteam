'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowUpDown, ChevronLeft, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { cn } from '@/lib/utils';
import { releaseResult, hideResult } from '../actions';
import type { CycleResultRow } from '../queries';

interface Props {
  cycleId: string;
  cycleName: string;
  rows: CycleResultRow[];
  isAdmin: boolean;
  departments: { id: string; name: string }[];
  managers: { id: string; full_name: string }[];
}

type SortDir = 'asc' | 'desc';

export function CycleResults({
  cycleId, cycleName, rows, isAdmin, departments, managers,
}: Props) {
  const router = useRouter();
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [managerFilter, setManagerFilter] = useState<string[]>([]);
  const [releaseFilter, setReleaseFilter] = useState<'all' | 'released' | 'locked'>('all');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const filtered = useMemo(() => {
    return rows
      .filter((r) => {
        if (departmentFilter.length && !departmentFilter.includes(r.department?.id ?? '__none__')) return false;
        if (managerFilter.length && !managerFilter.includes(r.managerId ?? '__none__')) return false;
        if (releaseFilter === 'released' && !r.isReleased) return false;
        if (releaseFilter === 'locked' && r.isReleased) return false;
        return true;
      })
      .sort((a, b) => {
        const av = a.avgOverall ?? -1;
        const bv = b.avgOverall ?? -1;
        return sortDir === 'asc' ? av - bv : bv - av;
      });
  }, [rows, departmentFilter, managerFilter, releaseFilter, sortDir]);

  async function handleToggleRelease(row: CycleResultRow) {
    const fn = row.isReleased ? hideResult : releaseResult;
    const r = await fn(cycleId, row.employeeId);
    if (r.error) toast.error(r.error);
    else {
      toast.success(row.isReleased ? 'Resultado ocultado.' : 'Resultado liberado.');
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href={`/avaliacoes/${cycleId}`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Voltar ao ciclo
        </Link>
      </div>

      <div className="mb-6 pb-4 border-b">
        <p className="text-sm text-muted-foreground">Ciclo</p>
        <h1 className="text-xl font-semibold">{cycleName} — Resultados</h1>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <MultiSelectFilter
          label="Departamentos"
          options={[{ value: '__none__', label: 'Sem departamento' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]}
          value={departmentFilter}
          onChange={setDepartmentFilter}
          width="w-52"
        />
        <MultiSelectFilter
          label="Gestores"
          options={[{ value: '__none__', label: 'Sem gestor' }, ...managers.map((m) => ({ value: m.id, label: m.full_name }))]}
          value={managerFilter}
          onChange={setManagerFilter}
          width="w-48"
        />
        <Select
          value={releaseFilter}
          onValueChange={(v) => setReleaseFilter((v as typeof releaseFilter) ?? 'all')}
          items={[
            { value: 'all', label: 'Todos' },
            { value: 'released', label: 'Liberados' },
            { value: 'locked', label: 'Não liberados' },
          ]}
        >
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="released">Liberados</SelectItem>
            <SelectItem value="locked">Não liberados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>
                <button
                  type="button"
                  onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
                  className="inline-flex items-center gap-1"
                >
                  Média <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Liberado?</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  Nenhum resultado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.employeeId}>
                  <TableCell className="font-medium">{r.fullName}</TableCell>
                  <TableCell>{r.position?.name ?? '—'}</TableCell>
                  <TableCell>{r.department?.name ?? '—'}</TableCell>
                  <TableCell>
                    <AvgBadge value={r.avgOverall} />
                  </TableCell>
                  <TableCell>
                    {r.isReleased
                      ? <span className="inline-flex items-center gap-1 text-emerald-700"><Unlock className="h-3.5 w-3.5" /> Liberado</span>
                      : <span className="inline-flex items-center gap-1 text-muted-foreground"><Lock className="h-3.5 w-3.5" /> Não</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleRelease(r)}
                        >
                          {r.isReleased
                            ? <><EyeOff className="h-3.5 w-3.5 mr-1.5" /> Ocultar</>
                            : <><Eye className="h-3.5 w-3.5 mr-1.5" /> Liberar</>}
                        </Button>
                      )}
                      <Link href={`/avaliacoes/${cycleId}/resultados/${r.employeeId}`}>
                        <Button variant="ghost" size="sm">Ver resultado</Button>
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AvgBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  const formatted = value.toFixed(1);
  const color = value >= 4
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : value >= 3
      ? 'text-amber-700 bg-amber-50 border-amber-200'
      : 'text-destructive bg-destructive/10 border-destructive/20';
  return (
    <span className={cn('inline-block rounded-md border px-2 py-0.5 text-sm font-semibold', color)}>
      {formatted}
    </span>
  );
}
