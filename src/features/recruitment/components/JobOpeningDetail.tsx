'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MoreVertical, Pencil, Play, Pause, CheckCircle2, XCircle, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MultiSelectFilter } from '@/components/MultiSelectFilter';
import { statusClass } from '@/lib/status-colors';
import { recruitmentJobOpeningStatusToken } from '@/lib/status-mappers';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date';
import type { JobOpeningRow } from '../queries/jobOpenings';
import type { ApplicationRow } from '../queries/applications';
import type { PipelineSnapshotStage } from '../pipeline-snapshot';
import type { CandidateRow } from '../queries/candidates';
import type { TaskKanbanState, TaskRow } from '../queries/tasks';
import type { CandidateFeedbackRow } from '../queries/feedbacks';
import type { ScorecardRow } from '../queries/scorecards';
import {
  JOB_OPENING_STATUS_LABELS,
  JOB_OPENING_EMPLOYMENT_TYPE_LABELS,
  JOB_OPENING_WORKPLACE_TYPE_LABELS,
  CANDIDATE_SOURCE_LABELS,
  CANDIDATE_SOURCES,
  STALLED_THRESHOLD_DAYS,
} from '../schema';
import { Kanban } from './Kanban';
import { ArchivedApplicationsTable } from './ArchivedApplicationsTable';
import { AddCandidateSheet } from './AddCandidateSheet';
import { changeJobStatus } from '../actions/jobOpenings';

interface TaxonomyItem { id: string; name: string }
interface ManagerItem { id: string; full_name: string }

interface Props {
  job: JobOpeningRow;
  stages: PipelineSnapshotStage[];
  activeApplications: ApplicationRow[];
  archivedApplications: ApplicationRow[];
  canManage: boolean;
  canMove: boolean;
  canGiveFeedback: boolean;
  canHire: boolean;
  feedbackCounts: Map<string, number>;
  scorecardCounts: Map<string, number>;
  taskStates: Map<string, TaskKanbanState>;
  feedbacks: CandidateFeedbackRow[];
  scorecards: ScorecardRow[];
  tasks: TaskRow[];
  currentEmployeeId: string | null;
  isAdmin: boolean;
  positions: TaxonomyItem[];
  departments: TaxonomyItem[];
  managers: ManagerItem[];
  searchCandidatesAction: (query: string) => Promise<CandidateRow[]>;
}

export function JobOpeningDetail({
  job, stages, activeApplications, archivedApplications,
  canManage, canMove, canGiveFeedback, canHire,
  feedbackCounts, scorecardCounts, taskStates,
  feedbacks, scorecards, tasks, currentEmployeeId, isAdmin,
  positions, departments, managers,
  searchCandidatesAction,
}: Props) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [kanbanSearch, setKanbanSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [onlyStalled, setOnlyStalled] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!onlyStalled) return;
    const update = () => setNow(Date.now());
    const t0 = setTimeout(update, 0);
    const id = setInterval(update, 60_000);
    return () => { clearTimeout(t0); clearInterval(id); };
  }, [onlyStalled]);

  const sourceOptions = useMemo(
    () => CANDIDATE_SOURCES.map((s) => ({ value: s, label: CANDIDATE_SOURCE_LABELS[s] })),
    [],
  );

  const filteredActiveApplications = useMemo(() => {
    const q = kanbanSearch.trim().toLowerCase();
    const stalledMs = STALLED_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
    return activeApplications.filter((app) => {
      if (q) {
        const name = app.candidate?.name?.toLowerCase() ?? '';
        const email = app.candidate?.email?.toLowerCase() ?? '';
        if (!name.includes(q) && !email.includes(q)) return false;
      }
      if (sourceFilter.length > 0) {
        const source = app.candidate?.source;
        if (!source || !sourceFilter.includes(source)) return false;
      }
      if (onlyStalled && now > 0) {
        const entered = new Date(app.stage_entered_at).getTime();
        if (now - entered < stalledMs) return false;
      }
      return true;
    });
  }, [activeApplications, kanbanSearch, sourceFilter, onlyStalled, now]);

  const hasKanbanFilters =
    kanbanSearch.length > 0 || sourceFilter.length > 0 || onlyStalled;

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
        <Badge className={`${statusClass(recruitmentJobOpeningStatusToken(job.status))} hover:opacity-100`}>
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
        <span className="text-muted-foreground">·</span>
        <span
          className="text-xs text-muted-foreground"
          title="Esta vaga usa o funil de etapas de quando foi criada. Mudanças em /recrutamento/etapas afetam apenas vagas novas."
        >
          Funil congelado em {formatDate(job.created_at)}
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
            <div className="space-y-4">
              {activeApplications.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[220px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar candidato…"
                      value={kanbanSearch}
                      onChange={(e) => setKanbanSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>
                  <MultiSelectFilter
                    label="Origens"
                    options={sourceOptions}
                    value={sourceFilter}
                    onChange={setSourceFilter}
                    width="w-44"
                  />
                  <button
                    type="button"
                    onClick={() => setOnlyStalled((v) => !v)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md border px-3 h-9 text-sm transition-colors',
                      onlyStalled
                        ? 'border-amber-300 bg-amber-50 text-amber-900'
                        : 'border-input hover:bg-muted',
                    )}
                  >
                    {onlyStalled && '⚠ '}Parados &gt; {STALLED_THRESHOLD_DAYS}d
                  </button>
                  {hasKanbanFilters && (
                    <span className="text-xs text-muted-foreground">
                      {filteredActiveApplications.length} de {activeApplications.length}
                    </span>
                  )}
                </div>
              )}
              <Kanban
                stages={stages}
                applications={filteredActiveApplications}
                canMove={canMove}
                canGiveFeedback={canGiveFeedback}
                canHire={canHire}
                feedbackCounts={feedbackCounts}
                scorecardCounts={scorecardCounts}
                taskStates={taskStates}
                feedbacks={feedbacks}
                scorecards={scorecards}
                tasks={tasks}
                currentEmployeeId={currentEmployeeId}
                isAdmin={isAdmin}
                job={{
                  id: job.id,
                  title: job.title,
                  departmentId: job.department_id,
                  positionId: job.position_id,
                  hiringManagerId: job.hiring_manager_id,
                }}
                positions={positions}
                departments={departments}
                managers={managers}
              />
            </div>
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
