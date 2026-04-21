'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/PageHeader';
import { EmptyState } from '@/components/EmptyState';
import { formatDate } from '@/lib/date';
import { JobOpeningSheet, type JobOpeningInitial } from './JobOpeningSheet';
import type { JobOpeningRow } from '../queries/jobOpenings';
import { JOB_OPENING_STATUS_LABELS, JOB_OPENING_EMPLOYMENT_TYPE_LABELS, JOB_OPENING_WORKPLACE_TYPE_LABELS } from '../schema';

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
              {jobs.map((job) => (
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
