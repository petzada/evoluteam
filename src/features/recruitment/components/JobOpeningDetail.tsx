'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreVertical, Pencil, Play, Pause, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/date';
import type { JobOpeningRow } from '../queries/jobOpenings';
import type { ApplicationRow } from '../queries/applications';
import type { StageRow } from '../queries/stages';
import type { CandidateRow } from '../queries/candidates';
import {
  JOB_OPENING_STATUS_LABELS,
  JOB_OPENING_EMPLOYMENT_TYPE_LABELS,
  JOB_OPENING_WORKPLACE_TYPE_LABELS,
} from '../schema';
import { Kanban } from './Kanban';
import { ArchivedApplicationsTable } from './ArchivedApplicationsTable';
import { AddCandidateSheet } from './AddCandidateSheet';
import { changeJobStatus } from '../actions/jobOpenings';

interface Props {
  job: JobOpeningRow;
  stages: StageRow[];
  activeApplications: ApplicationRow[];
  archivedApplications: ApplicationRow[];
  canManage: boolean;
  canMove: boolean;
  searchCandidatesAction: (query: string) => Promise<CandidateRow[]>;
}

export function JobOpeningDetail({
  job, stages, activeApplications, archivedApplications, canManage, canMove, searchCandidatesAction,
}: Props) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);

  async function onChangeStatus(status: 'open' | 'paused' | 'closed' | 'cancelled') {
    const result = await changeJobStatus(job.id, status);
    if ('error' in result && result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Status atualizado');
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title={job.title}
        description={job.description ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {canManage && (
              <>
                <Button onClick={() => setAddOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Adicionar candidato
                </Button>
                <Link href={`/recrutamento/vagas/${job.id}/editar`}>
                  <Button variant="outline">
                    <Pencil className="mr-2 h-4 w-4" /> Editar
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input hover:bg-muted">
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {job.status !== 'open' && (
                      <DropdownMenuItem onClick={() => onChangeStatus('open')}>
                        <Play className="mr-2 h-4 w-4" /> Reabrir vaga
                      </DropdownMenuItem>
                    )}
                    {job.status === 'open' && (
                      <DropdownMenuItem onClick={() => onChangeStatus('paused')}>
                        <Pause className="mr-2 h-4 w-4" /> Pausar vaga
                      </DropdownMenuItem>
                    )}
                    {(job.status === 'open' || job.status === 'paused') && (
                      <>
                        <DropdownMenuItem onClick={() => onChangeStatus('closed')}>
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Fechar vaga
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onChangeStatus('cancelled')}>
                          <XCircle className="mr-2 h-4 w-4" /> Cancelar vaga
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <Badge variant={job.status === 'open' ? 'default' : 'outline'}>
          {JOB_OPENING_STATUS_LABELS[job.status]}
        </Badge>
        {job.department && <span className="text-muted-foreground">{job.department.name}</span>}
        {job.hiring_manager && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">Gestor: {job.hiring_manager.full_name}</span>
          </>
        )}
        <span className="text-muted-foreground">·</span>
        <Badge variant="outline">{JOB_OPENING_EMPLOYMENT_TYPE_LABELS[job.employment_type]}</Badge>
        <Badge variant="outline">{JOB_OPENING_WORKPLACE_TYPE_LABELS[job.workplace_type]}</Badge>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          {job.open_positions} {job.open_positions === 1 ? 'posição' : 'posições'}
        </span>
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">Kanban ({activeApplications.length})</TabsTrigger>
          <TabsTrigger value="finalizados">Finalizados ({archivedApplications.length})</TabsTrigger>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
        </TabsList>
        <TabsContent value="kanban" className="mt-4">
          {stages.length === 0 ? (
            <div className="rounded-md border border-dashed p-10 text-center text-sm text-muted-foreground">
              Nenhuma etapa ativa. Configure as etapas em Recrutamento → Etapas.
            </div>
          ) : (
            <Kanban stages={stages} applications={activeApplications} canMove={canMove} />
          )}
        </TabsContent>
        <TabsContent value="finalizados" className="mt-4">
          <ArchivedApplicationsTable applications={archivedApplications} />
        </TabsContent>
        <TabsContent value="detalhes" className="mt-4 space-y-3 max-w-2xl">
          <Section label="Descrição">
            {job.description
              ? <p className="text-sm whitespace-pre-wrap">{job.description}</p>
              : <p className="text-sm text-muted-foreground">Sem descrição.</p>}
          </Section>
          <Section label="Localidade">
            <p className="text-sm">{job.location ?? '—'}</p>
          </Section>
          <Section label="Cargo vinculado">
            <p className="text-sm">{job.position?.name ?? '—'}</p>
          </Section>
          <Section label="Criada em">
            <p className="text-sm">{formatDate(job.created_at)}</p>
          </Section>
          {job.closed_at && (
            <Section label="Fechada em">
              <p className="text-sm">{formatDate(job.closed_at)}</p>
            </Section>
          )}
        </TabsContent>
      </Tabs>

      {canManage && (
        <AddCandidateSheet
          open={addOpen}
          onOpenChange={setAddOpen}
          jobOpeningId={job.id}
          searchCandidatesAction={searchCandidatesAction}
        />
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <div>{children}</div>
    </div>
  );
}
