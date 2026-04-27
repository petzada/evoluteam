'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, ExternalLink, UserX, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/date';
import type { CandidateRow } from '../queries/candidates';
import type { ApplicationRow, StageHistoryRow } from '../queries/applications';
import type { CandidateFeedbackRow } from '../queries/feedbacks';
import {
  APPLICATION_STATUS_LABELS, CANDIDATE_SOURCE_LABELS,
  type CandidateSource,
} from '../schema';
import { CandidateSheet } from './CandidateSheet';
import { FeedbacksSection } from './FeedbacksSection';
import { ScorecardsSection } from './ScorecardsSection';
import { TasksSection } from './TasksSection';
import type { ScorecardRow } from '../queries/scorecards';
import type { TaskRow } from '../queries/tasks';
import { archiveCandidate } from '../actions/candidates';

interface Props {
  candidate: CandidateRow;
  applications: ApplicationRow[];
  history: StageHistoryRow[];
  feedbacks: CandidateFeedbackRow[];
  scorecards: ScorecardRow[];
  tasks: TaskRow[];
  hiredEmployeeName: string | null;
  canManage: boolean;
  canGiveFeedback: boolean;
  currentEmployeeId: string | null;
  isAdmin: boolean;
  applicationsOwnedByCurrentGestor: Set<string>;
  responsibleOptions: { id: string; full_name: string }[];
}

function statusVariant(status: ApplicationRow['status']): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'hired') return 'default';
  if (status === 'rejected') return 'destructive';
  if (status === 'withdrawn') return 'secondary';
  if (status === 'in_progress') return 'default';
  return 'outline';
}

export function CandidateProfile({
  candidate, applications, history, feedbacks, scorecards, tasks,
  hiredEmployeeName, canManage, canGiveFeedback, currentEmployeeId, isAdmin,
  applicationsOwnedByCurrentGestor, responsibleOptions,
}: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const source = candidate.source as CandidateSource;
  const sourceLabel = source === 'outro' && candidate.source_other
    ? candidate.source_other
    : CANDIDATE_SOURCE_LABELS[source];
  const isHired = !!candidate.hired_employee_id;

  async function onArchive() {
    const result = await archiveCandidate(candidate.id);
    if ('error' in result && result.error) { toast.error(result.error); return; }
    toast.success('Candidato arquivado');
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title={candidate.name}
        description={candidate.email}
        actions={canManage && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Editar
            </Button>
            {!candidate.archived_at && !isHired && (
              <Button variant="outline" onClick={onArchive}>
                <UserX className="mr-2 h-4 w-4" /> Arquivar
              </Button>
            )}
          </div>
        )}
      />

      {isHired && (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-900">
              Contratado(a) — agora é o colaborador {hiredEmployeeName ?? candidate.name}
            </p>
            <p className="text-xs text-emerald-800">
              O histórico do processo seletivo fica preservado abaixo.
            </p>
          </div>
          <Link
            href={`/colaboradores/${candidate.hired_employee_id}`}
            className="text-sm text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 underline"
          >
            Abrir perfil do colaborador <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="aplicacoes">Aplicações</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
          <TabsTrigger value="feedbacks">Feedbacks</TabsTrigger>
          <TabsTrigger value="scorecards">Scorecards</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-6 max-w-3xl">
          <section className="rounded-md border bg-card shadow-card divide-y">
            <FieldRow label="Nome" value={candidate.name} />
            <FieldRow label="E-mail" value={candidate.email} />
            <FieldRow label="Telefone" value={candidate.phone ?? '—'} />
            <FieldRow label="Origem" value={sourceLabel} />
            <FieldRow
              label="LinkedIn"
              value={candidate.linkedin_url ? (
                <a href={candidate.linkedin_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  Abrir <ExternalLink className="h-3 w-3" />
                </a>
              ) : '—'}
            />
            <FieldRow
              label="Currículo"
              value={candidate.resume_url ? (
                <a href={candidate.resume_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  Abrir <ExternalLink className="h-3 w-3" />
                </a>
              ) : '—'}
            />
            <FieldRow label="Cadastrado em" value={formatDate(candidate.created_at)} />
            <FieldRow label="Total de aplicações" value={String(applications.length)} />
          </section>

          {candidate.notes && (
            <section className="rounded-md border bg-card p-4 mt-4 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Observações
              </p>
              <p className="text-sm whitespace-pre-wrap">{candidate.notes}</p>
            </section>
          )}
        </TabsContent>

        <TabsContent value="aplicacoes" className="mt-6">
          <p className="text-sm text-muted-foreground mb-3">
            {applications.length} aplicaç{applications.length === 1 ? 'ão' : 'ões'} no histórico do candidato
          </p>
          {applications.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Este candidato ainda não foi vinculado a nenhuma vaga.
            </p>
          ) : (
            <ul className="space-y-3">
              {applications.map((app) => (
                <li key={app.id} className="rounded-md border bg-card p-4 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/recrutamento/vagas/${app.job_opening_id}`}
                        className="font-medium hover:text-primary hover:underline"
                      >
                        {app.job_opening?.title ?? 'Vaga'}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Etapa: {app.current_stage?.name ?? '—'} · entrou em {formatDate(app.stage_entered_at)}
                      </p>
                    </div>
                    <Badge variant={statusVariant(app.status)}>
                      {APPLICATION_STATUS_LABELS[app.status]}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-6 max-w-3xl">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sem eventos registrados.</p>
          ) : (
            <ol className="space-y-3">
              {history.map((h) => (
                <li key={h.id} className="flex gap-3 rounded-md border bg-card p-3 text-sm shadow-card">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{describeHistoryEvent(h)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(h.changed_at)}
                    </p>
                    {h.reason_notes && (
                      <p className="text-xs text-muted-foreground italic mt-1">{h.reason_notes}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>

        <TabsContent value="tarefas" className="mt-6">
          <TasksSection
            applications={applications}
            tasks={tasks}
            currentEmployeeId={currentEmployeeId}
            isAdmin={isAdmin}
            canManageTasksForApp={(app) => {
              if (!canGiveFeedback) return false;
              if (isAdmin) return true;
              return applicationsOwnedByCurrentGestor.has(app.id);
            }}
            responsibleOptions={responsibleOptions}
          />
        </TabsContent>

        <TabsContent value="feedbacks" className="mt-6">
          <FeedbacksSection
            applications={applications}
            feedbacks={feedbacks}
            currentEmployeeId={currentEmployeeId}
            isAdmin={isAdmin}
            canGiveFeedbackForApp={(app) => {
              if (!canGiveFeedback) return false;
              if (isAdmin) return true;
              return applicationsOwnedByCurrentGestor.has(app.id);
            }}
          />
        </TabsContent>

        <TabsContent value="scorecards" className="mt-6">
          <ScorecardsSection
            applications={applications}
            scorecards={scorecards}
            currentEmployeeId={currentEmployeeId}
            isAdmin={isAdmin}
            canSubmitScorecardForApp={(app) => {
              if (!canGiveFeedback) return false;
              if (isAdmin) return true;
              return applicationsOwnedByCurrentGestor.has(app.id);
            }}
          />
        </TabsContent>
      </Tabs>

      {canManage && (
        <CandidateSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          initial={{
            id: candidate.id,
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            linkedinUrl: candidate.linkedin_url,
            resumeUrl: candidate.resume_url,
            source: candidate.source,
            sourceOther: candidate.source_other,
            notes: candidate.notes,
          }}
          redirectAfterCreate={false}
        />
      )}
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 py-3">
      <p className="w-40 shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground flex-1 min-w-0">{value}</div>
    </div>
  );
}

function describeHistoryEvent(h: StageHistoryRow): string {
  if (h.status_change) {
    const { to } = h.status_change;
    if (to === 'hired') return 'Candidato contratado';
    if (to === 'rejected') return 'Candidato reprovado';
    if (to === 'withdrawn') return 'Candidato desistente';
    if (to === 'frozen') return 'Candidatura congelada';
  }
  if (h.from_stage?.name && h.to_stage?.name) {
    return `Movido de ${h.from_stage.name} para ${h.to_stage.name}`;
  }
  if (h.to_stage?.name && !h.from_stage) {
    return `Cadastrado em ${h.to_stage.name}`;
  }
  return 'Evento de recrutamento';
}
