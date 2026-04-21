'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil, ExternalLink, UserX, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { archiveCandidate } from '../actions/candidates';

interface Props {
  candidate: CandidateRow;
  applications: ApplicationRow[];
  history: StageHistoryRow[];
  feedbacks: CandidateFeedbackRow[];
  hiredEmployeeName: string | null;
  canManage: boolean;
  canGiveFeedback: boolean;
  currentEmployeeId: string | null;
  isAdmin: boolean;
  applicationsOwnedByCurrentGestor: Set<string>;
}

function statusVariant(status: ApplicationRow['status']): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'hired') return 'default';
  if (status === 'rejected') return 'destructive';
  if (status === 'withdrawn') return 'secondary';
  if (status === 'in_progress') return 'default';
  return 'outline';
}

export function CandidateProfile({
  candidate, applications, history, feedbacks, hiredEmployeeName,
  canManage, canGiveFeedback, currentEmployeeId, isAdmin,
  applicationsOwnedByCurrentGestor,
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

      <div className="grid gap-4 md:grid-cols-[2fr_1fr] max-w-6xl">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold mb-3">Dados pessoais</h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Telefone" value={candidate.phone} />
                <Field label="Origem" value={sourceLabel} />
                <Field
                  label="LinkedIn"
                  value={candidate.linkedin_url ? (
                    <a href={candidate.linkedin_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                      Abrir <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                />
                <Field
                  label="Currículo"
                  value={candidate.resume_url ? (
                    <a href={candidate.resume_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                      Abrir <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                />
                <Field label="Cadastrado em" value={formatDate(candidate.created_at)} />
                <Field label="Total de aplicações" value={String(applications.length)} />
              </dl>
              {candidate.notes && (
                <>
                  <p className="text-xs text-muted-foreground mt-4 mb-1 uppercase tracking-wider">Observações</p>
                  <p className="text-sm whitespace-pre-wrap">{candidate.notes}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold mb-3">Aplicações</h3>
              {applications.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este candidato ainda não foi vinculado a nenhuma vaga.</p>
              ) : (
                <ul className="space-y-2">
                  {applications.map((app) => (
                    <li key={app.id} className="p-3 border rounded-md hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            href={`/recrutamento/vagas/${app.job_opening_id}`}
                            className="text-sm font-medium hover:underline"
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
            </CardContent>
          </Card>

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
        </div>

        <div>
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold mb-3">Histórico</h3>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem eventos registrados.</p>
              ) : (
                <ol className="space-y-3 text-xs">
                  {history.map((h) => (
                    <li key={h.id} className="relative pl-4 border-l">
                      <div className="absolute left-[-4px] top-1 h-2 w-2 rounded-full bg-primary" />
                      <p className="text-muted-foreground">{formatDate(h.changed_at)}</p>
                      <p className="mt-0.5">
                        {describeHistoryEvent(h)}
                      </p>
                      {h.reason_notes && (
                        <p className="mt-0.5 text-muted-foreground italic">{h.reason_notes}</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground uppercase tracking-wider">{label}</dt>
      <dd className="mt-0.5">{value || '—'}</dd>
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
