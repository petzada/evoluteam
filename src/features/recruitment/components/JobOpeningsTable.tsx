'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { formatDate } from '@/lib/date';
import { JobOpeningSheet, type JobOpeningInitial } from './JobOpeningSheet';
import type { JobOpeningRow } from '../queries/jobOpenings';
import {
  JOB_OPENING_STATUS_LABELS,
  JOB_OPENING_STATUSES,
  JOB_OPENING_EMPLOYMENT_TYPE_LABELS,
  JOB_OPENING_WORKPLACE_TYPE_LABELS,
} from '../schema';

interface TaxonomyItem { id: string; name: string }
interface ManagerItem { id: string; full_name: string }

interface Props {
  jobs: JobOpeningRow[];
  departments: TaxonomyItem[];
  positions: TaxonomyItem[];
  managers: ManagerItem[];
  canCreate: boolean;
}

export function JobOpeningsTable({ jobs, departments, positions, managers, canCreate }: Props) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string[]>(['open']);
  const [deptFilter, setDeptFilter] = useState<string[]>([]);
  const [managerFilter, setManagerFilter] = useState<string[]>([]);

  const statusOptions = useMemo(
    () => JOB_OPENING_STATUSES.map((s) => ({ value: s, label: JOB_OPENING_STATUS_LABELS[s] })),
    [],
  );
  const deptOptions = useMemo(
    () => departments.map((d) => ({ value: d.id, label: d.name })),
    [departments],
  );
  const managerOptions = useMemo(
    () => managers.map((m) => ({ value: m.id, label: m.full_name })),
    [managers],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (q && !job.title.toLowerCase().includes(q)) return false;
      if (statusFilter.length > 0 && !statusFilter.includes(job.status)) return false;
      if (deptFilter.length > 0 && (!job.department_id || !deptFilter.includes(job.department_id))) return false;
      if (managerFilter.length > 0 && (!job.hiring_manager_id || !managerFilter.includes(job.hiring_manager_id))) return false;
      return true;
    });
  }, [jobs, search, statusFilter, deptFilter, managerFilter]);

  const hasFilters =
    search.length > 0 || statusFilter.length > 0 || deptFilter.length > 0 || managerFilter.length > 0;

  return (
    <div>
      <PageHeader
        title="Vagas"
        description="Gerencie as vagas em aberto do seu processo seletivo."
        actions={canCreate && (
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova vaga
          </Button>
        )}
      />

      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Nenhuma vaga cadastrada"
          description="Crie a primeira vaga para começar o processo seletivo."
          action={canCreate && (
            <Button onClick={() => setSheetOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Nova vaga
            </Button>
          )}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[240px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <MultiSelectFilter
              label="Status"
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              width="w-40"
            />
            <MultiSelectFilter
              label="Departamentos"
              options={deptOptions}
              value={deptFilter}
              onChange={setDeptFilter}
              width="w-48"
            />
            <MultiSelectFilter
              label="Responsáveis"
              options={managerOptions}
              value={managerFilter}
              onChange={setManagerFilter}
              width="w-48"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Nenhuma vaga encontrada"
              description={hasFilters ? 'Tente outros filtros.' : 'Crie a primeira vaga.'}
            />
          ) : (
            <div className="rounded-md border bg-card shadow-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Departamento</TableHead>
                    <TableHead>Gestor</TableHead>
                    <TableHead>Tipo · Modalidade</TableHead>
                    <TableHead className="text-right">Candidatos ativos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criada em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((job) => (
                    <TableRow
                      key={job.id}
                      className="hover:bg-muted/40 cursor-pointer"
                      onClick={() => router.push(`/recrutamento/vagas/${job.id}`)}
                    >
                      <TableCell className="font-medium text-foreground">
                        {job.title}
                      </TableCell>
                      <TableCell>{job.department?.name ?? '—'}</TableCell>
                      <TableCell>{job.hiring_manager?.full_name ?? '—'}</TableCell>
                      <TableCell className="text-sm">
                        {JOB_OPENING_EMPLOYMENT_TYPE_LABELS[job.employment_type]} · {JOB_OPENING_WORKPLACE_TYPE_LABELS[job.workplace_type]}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {job.active_candidates_count}
                      </TableCell>
                      <TableCell>
                        <Badge variant={job.status === 'open' ? 'default' : 'outline'}>
                          {JOB_OPENING_STATUS_LABELS[job.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(job.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {canCreate && (
        <JobOpeningSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          departments={departments}
          positions={positions}
          managers={managers}
          initial={null}
        />
      )}
    </div>
  );
}

export function JobOpeningEditSheetWrapper(props: Props & { editInitial: JobOpeningInitial }) {
  const [open, setOpen] = useState(true);
  const { editInitial, ...rest } = props;
  return (
    <JobOpeningSheet
      open={open}
      onOpenChange={setOpen}
      departments={rest.departments}
      positions={rest.positions}
      managers={rest.managers}
      initial={editInitial}
    />
  );
}
