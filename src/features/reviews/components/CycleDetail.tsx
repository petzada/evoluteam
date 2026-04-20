'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Archive, MoreHorizontal, RefreshCw, Send, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDate } from '@/lib/date';
import {
  closeCycle, archiveCycle, cancelAssignment, removeParticipantAction,
  sendReminders, publishCycle,
} from '../actions';

type CycleDetailData = {
  id: string;
  name: string;
  description: string | null;
  period_start: string;
  period_end: string;
  response_start: string;
  response_end: string;
  status: 'draft' | 'published' | 'closed' | 'archived';
  include_self: boolean;
  include_manager: boolean;
  published_at: string | null;
  closed_at: string | null;
};

type Participant = {
  id: string;
  employee_id: string;
  employee: {
    id: string;
    full_name: string;
    email: string;
    status: string;
    position: { id: string; name: string } | null;
    department: { id: string; name: string } | null;
    manager: { id: string; full_name: string } | null;
  } | null;
};

type Assignment = {
  id: string;
  reviewee_id: string;
  reviewer_id: string;
  type: string;
  status: string;
  submitted_at: string | null;
  cancelled_at: string | null;
  reviewee: { id: string; full_name: string; email: string } | null;
  reviewer: { id: string; full_name: string; email: string; user_id: string | null } | null;
};

type Question = {
  id: string;
  competency_id: string | null;
  question_order: number;
  type: string;
  question_text: string;
  is_required: boolean;
};

interface Props {
  cycle: CycleDetailData;
  participants: Participant[];
  assignments: Assignment[];
  questions: Question[];
  competencies: { id: string; name: string }[];
  isAdmin: boolean;
  deriveLabel: string;
}

export function CycleDetail({
  cycle, participants, assignments, questions, competencies, isAdmin, deriveLabel,
}: Props) {
  const router = useRouter();
  const [confirmPublish, setConfirmPublish] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [busy, setBusy] = useState(false);

  const activeParticipantsCount = participants.filter((p) => p.employee?.status === 'active').length;
  const questionCount = questions.length;

  const kpis = useMemo(() => {
    const participantsActive = participants.filter((p) => p.employee?.status !== 'terminated').length;
    const assignedByStatus = assignments.reduce<Record<string, number>>((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, {});
    const submitted = assignedByStatus['submitted'] ?? 0;
    const pending = (assignedByStatus['pending'] ?? 0) + (assignedByStatus['in_progress'] ?? 0);
    const total = submitted + pending;
    const progress = total > 0 ? Math.round((submitted / total) * 100) : 0;
    const atrasadas = assignments.filter((a) =>
      ['pending', 'in_progress'].includes(a.status)
      && new Date(cycle.response_end) < new Date()
    ).length;
    return { participants: participantsActive, assignments: total, progress, atrasadas };
  }, [participants, assignments, cycle.response_end]);

  // Map reviewee_id → { self?: Assignment, manager?: Assignment }
  const grouped = useMemo(() => {
    const map = new Map<string, { self?: Assignment; manager?: Assignment; employee: Participant['employee'] }>();
    for (const p of participants) {
      if (!p.employee) continue;
      map.set(p.employee_id, { employee: p.employee });
    }
    for (const a of assignments) {
      const entry = map.get(a.reviewee_id) ?? { employee: null };
      if (a.type === 'self') entry.self = a;
      if (a.type === 'manager') entry.manager = a;
      map.set(a.reviewee_id, entry);
    }
    return Array.from(map.entries());
  }, [participants, assignments]);

  async function handlePublish() {
    setBusy(true);
    const r = await publishCycle(cycle.id);
    setBusy(false);
    if (r.error) toast.error(r.error);
    else {
      toast.success(`Ciclo publicado! ${r.assignments ?? 0} avaliação(ões) gerada(s).`);
      router.refresh();
    }
    setConfirmPublish(false);
  }
  async function handleClose() {
    setBusy(true);
    const r = await closeCycle(cycle.id);
    setBusy(false);
    if (r.error) toast.error(r.error);
    else { toast.success('Ciclo encerrado.'); router.refresh(); }
    setConfirmClose(false);
  }
  async function handleArchive() {
    setBusy(true);
    const r = await archiveCycle(cycle.id);
    setBusy(false);
    if (r.error) toast.error(r.error);
    else { toast.success('Ciclo arquivado.'); router.push('/avaliacoes'); }
    setConfirmArchive(false);
  }
  async function handleCancelAssignment(id: string) {
    const r = await cancelAssignment(id);
    if (r.error) toast.error(r.error);
    else { toast.success('Assignment cancelado.'); router.refresh(); }
  }
  async function handleRemoveParticipant(employeeId: string) {
    const r = await removeParticipantAction(cycle.id, employeeId);
    if (r.error) toast.error(r.error);
    else { toast.success('Participante removido.'); router.refresh(); }
  }
  async function handleRemindAll() {
    const r = await sendReminders(cycle.id);
    if (r.error) toast.error(r.error);
    else toast.success(`${r.sent ?? 0} lembrete(s) enviado(s).`);
  }
  async function handleRemindOne(reviewerEmployeeId: string) {
    const r = await sendReminders(cycle.id, reviewerEmployeeId);
    if (r.error) toast.error(r.error);
    else toast.success('Lembrete enviado.');
  }

  const canShowResults = cycle.status === 'closed' || cycle.status === 'archived';

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6 pb-4 border-b">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
            <Link href="/avaliacoes" className="hover:text-foreground">Avaliações</Link>
            <span>›</span>
            <span className="text-foreground">{cycle.name}</span>
          </div>
          <h1 className="text-xl font-semibold">{cycle.name}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Período: {formatDate(cycle.period_start)} – {formatDate(cycle.period_end)}
            {' · '}
            Resposta: {formatDate(cycle.response_start)} – {formatDate(cycle.response_end)}
          </p>
          {cycle.description && (
            <p className="text-sm mt-2 max-w-2xl">{cycle.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge>{deriveLabel}</Badge>
          {isAdmin && cycle.status === 'draft' && (
            <Button
              onClick={() => setConfirmPublish(true)}
              disabled={activeParticipantsCount === 0 || questionCount === 0}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Publicar ciclo
            </Button>
          )}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-md border hover:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {cycle.status === 'published' && (
                  <DropdownMenuItem onClick={() => setConfirmClose(true)}>
                    Encerrar ciclo
                  </DropdownMenuItem>
                )}
                {cycle.status !== 'archived' && (
                  <DropdownMenuItem onClick={() => setConfirmArchive(true)}>
                    Arquivar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Participantes" value={kpis.participants} />
        <KpiCard label="Avaliações" value={kpis.assignments} />
        <KpiCard label="Progresso" value={`${kpis.progress}%`} />
        <KpiCard label="Atrasadas" value={kpis.atrasadas} warn={kpis.atrasadas > 0} />
      </div>

      <Tabs defaultValue="progresso">
        <TabsList>
          <TabsTrigger value="progresso">Progresso</TabsTrigger>
          <TabsTrigger value="participantes">Participantes</TabsTrigger>
          <TabsTrigger value="formulario">Formulário</TabsTrigger>
          <TabsTrigger value="resultados" disabled={!canShowResults}>
            Resultados {canShowResults ? '' : '(disponível após encerrar)'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progresso" className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-muted-foreground">
              Acompanhe quem já enviou e quem está pendente.
            </p>
            {isAdmin && cycle.status === 'published' && (
              <Button variant="outline" size="sm" onClick={handleRemindAll}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Lembrar todos pendentes
              </Button>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avaliado</TableHead>
                  {cycle.include_self && <TableHead>Autoavaliação</TableHead>}
                  {cycle.include_manager && <TableHead>Avaliação do gestor</TableHead>}
                  {isAdmin && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped.map(([empId, g]) => (
                  <TableRow key={empId}>
                    <TableCell>
                      <div>
                        <Link href={`/colaboradores/${empId}`} className="font-medium hover:underline">
                          {g.employee?.full_name ?? '—'}
                        </Link>
                        {g.employee?.position && (
                          <p className="text-xs text-muted-foreground">{g.employee.position.name}</p>
                        )}
                      </div>
                    </TableCell>
                    {cycle.include_self && (
                      <TableCell>
                        <AssignmentStatusCell a={g.self} isAdmin={isAdmin} onCancel={handleCancelAssignment} onRemind={handleRemindOne} />
                      </TableCell>
                    )}
                    {cycle.include_manager && (
                      <TableCell>
                        <AssignmentStatusCell a={g.manager} isAdmin={isAdmin} onCancel={handleCancelAssignment} onRemind={handleRemindOne} />
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted">
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/colaboradores/${empId}`)}>
                              Ver perfil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {grouped.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      Nenhum participante ativo.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="participantes" className="mt-6">
          <ParticipantsPanel
            cycleId={cycle.id}
            participants={participants}
            isAdmin={isAdmin}
            onRemove={handleRemoveParticipant}
          />
        </TabsContent>

        <TabsContent value="formulario" className="mt-6">
          <FormPanel questions={questions} competencies={competencies} />
        </TabsContent>

        <TabsContent value="resultados" className="mt-6">
          {canShowResults && (
            <div className="rounded-md border p-6">
              <p className="text-sm text-muted-foreground mb-3">
                Ciclo encerrado. Os resultados consolidados estão disponíveis.
              </p>
              <Link href={`/avaliacoes/${cycle.id}/resultados`}>
                <Button>Ver resultados consolidados</Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmPublish} onOpenChange={setConfirmPublish}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publicar ciclo?</AlertDialogTitle>
            <AlertDialogDescription>
              {activeParticipantsCount} colaborador(es) receberão avaliações.
              Após publicar, apenas descrição e prazo de resposta poderão ser alterados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublish} disabled={busy}>
              {busy ? 'Publicando…' : 'Publicar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar ciclo?</AlertDialogTitle>
            <AlertDialogDescription>
              Colaboradores não poderão mais enviar respostas. Resultados ficam disponíveis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose} disabled={busy}>Encerrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmArchive} onOpenChange={setConfirmArchive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar ciclo?</AlertDialogTitle>
            <AlertDialogDescription>
              O ciclo deixa de aparecer na listagem padrão mas é mantido para histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={busy}>
              <Archive className="h-3.5 w-3.5 mr-1.5" /> Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function KpiCard({ label, value, warn }: { label: string; value: number | string; warn?: boolean }) {
  return (
    <div className="rounded-md border p-4">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${warn ? 'text-destructive' : ''}`}>{value}</p>
    </div>
  );
}

function AssignmentStatusCell({
  a, isAdmin, onCancel, onRemind,
}: {
  a: Assignment | undefined;
  isAdmin: boolean;
  onCancel: (id: string) => void;
  onRemind: (reviewerId: string) => void;
}) {
  if (!a) return <span className="text-muted-foreground text-sm">—</span>;
  const label = STATUS_LABEL[a.status] ?? a.status;
  const variant = STATUS_VARIANT[a.status] ?? 'outline';
  return (
    <div className="flex items-center gap-2">
      <Badge variant={variant}>{label}</Badge>
      <span className="text-xs text-muted-foreground">
        Rev: {a.reviewer?.full_name ?? '—'}
      </span>
      {isAdmin && (a.status === 'pending' || a.status === 'in_progress') && (
        <DropdownMenu>
          <DropdownMenuTrigger className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted">
            <MoreHorizontal className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onRemind(a.reviewer_id)}>
              Reenviar lembrete
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onCancel(a.id)} className="text-destructive focus:text-destructive">
              <X className="h-3.5 w-3.5 mr-1.5" /> Cancelar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em progresso',
  submitted: 'Enviado',
  cancelled: 'Cancelado',
};
const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  in_progress: 'secondary',
  submitted: 'default',
  cancelled: 'outline',
};

function ParticipantsPanel({
  participants, isAdmin, onRemove,
}: {
  cycleId: string;
  participants: Participant[];
  isAdmin: boolean;
  onRemove: (employeeId: string) => void;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        {participants.length} colaborador(es) incluídos no ciclo.
      </p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Gestor</TableHead>
              {isAdmin && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <Link href={`/colaboradores/${p.employee_id}`} className="hover:underline">
                    {p.employee?.full_name ?? '—'}
                  </Link>
                </TableCell>
                <TableCell>{p.employee?.position?.name ?? '—'}</TableCell>
                <TableCell>{p.employee?.department?.name ?? '—'}</TableCell>
                <TableCell>{p.employee?.manager?.full_name ?? '—'}</TableCell>
                {isAdmin && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onRemove(p.employee_id)}
                          className="text-destructive focus:text-destructive"
                        >
                          Remover do ciclo
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FormPanel({ questions, competencies }: {
  questions: Question[];
  competencies: { id: string; name: string }[];
}) {
  if (questions.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma pergunta cadastrada.</p>;
  }
  return (
    <ol className="space-y-3">
      {questions
        .slice()
        .sort((a, b) => a.question_order - b.question_order)
        .map((q, i) => (
          <li key={q.id} className="rounded-md border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-semibold text-muted-foreground">{i + 1}.</span>
              <Badge variant={q.type === 'scale' ? 'default' : 'secondary'}>
                {q.type === 'scale' ? 'Nota 1-5' : 'Texto'}
              </Badge>
              {q.competency_id && (
                <Badge variant="outline">
                  {competencies.find((c) => c.id === q.competency_id)?.name ?? 'Competência'}
                </Badge>
              )}
              {q.is_required && <Badge variant="destructive">Obrigatória</Badge>}
            </div>
            <p className="text-sm">{q.question_text}</p>
          </li>
        ))}
    </ol>
  );
}
