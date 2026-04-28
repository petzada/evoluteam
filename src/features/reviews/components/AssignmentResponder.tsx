'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { Check, ChevronLeft, CircleCheck, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date';
import { saveAnswerDraft, submitAssignment } from '../actions';
import type { FeedbackRow } from '@/features/feedbacks/queries';
import {
  FEEDBACK_TYPE_LABELS, type FeedbackType,
} from '@/features/feedbacks/schema';

type Question = {
  id: string;
  question_order: number;
  type: string;
  question_text: string;
  is_required: boolean;
  competency_id: string | null;
  scale_min: number | null;
  scale_max: number | null;
};

type Assignment = {
  id: string;
  cycle_id: string;
  type: string;
  status: string;
  reviewee: {
    id: string;
    full_name: string;
    email: string;
    hire_date: string;
    position: { id: string; name: string } | null;
    department: { id: string; name: string } | null;
    manager: { id: string; full_name: string } | null;
  } | null;
  cycle: { id: string; name: string; response_end: string; status: string } | null;
};

interface Props {
  assignment: Assignment;
  questions: Question[];
  existingAnswers: { question_id: string; scale_value: number | null; text_value: string | null }[];
  competencies: { id: string; name: string }[];
  directReports: { id: string; full_name: string }[];
  feedbacks: FeedbackRow[];
}

type AnswerState = { scaleValue: number | null; textValue: string };

function initAnswers(
  questions: Question[],
  existing: Props['existingAnswers'],
): Record<string, AnswerState> {
  const map: Record<string, AnswerState> = {};
  for (const q of questions) map[q.id] = { scaleValue: null, textValue: '' };
  for (const a of existing) {
    map[a.question_id] = {
      scaleValue: a.scale_value ?? null,
      textValue: a.text_value ?? '',
    };
  }
  return map;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('');
}

const SCALE_LABEL_LEFT = 'Precisa melhorar';
const SCALE_LABEL_RIGHT = 'Excelente';

export function AssignmentResponder({
  assignment, questions, existingAnswers, competencies, directReports, feedbacks,
}: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() =>
    initAnswers(questions, existingAnswers),
  );
  const [savingCount, setSavingCount] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const debouncersRef = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});

  useEffect(() => {
    const ref = debouncersRef.current;
    return () => {
      for (const key of Object.keys(ref)) {
        const t = ref[key];
        if (t) clearTimeout(t);
      }
    };
  }, []);

  async function persist(questionId: string, state: AnswerState) {
    const q = questions.find((x) => x.id === questionId);
    if (!q) return;
    const payload = q.type === 'scale'
      ? { questionId, scaleValue: state.scaleValue, textValue: null }
      : { questionId, scaleValue: null, textValue: state.textValue };

    setSavingCount((c) => c + 1);
    const r = await saveAnswerDraft(assignment.id, payload);
    setSavingCount((c) => c - 1);
    if (r.error) {
      toast.error(r.error);
      return;
    }
    setLastSavedAt(new Date());
  }

  function schedulePersist(questionId: string, state: AnswerState, immediate = false) {
    const prev = debouncersRef.current[questionId];
    if (prev) clearTimeout(prev);
    if (immediate) {
      void persist(questionId, state);
      debouncersRef.current[questionId] = null;
      return;
    }
    debouncersRef.current[questionId] = setTimeout(() => {
      void persist(questionId, state);
      debouncersRef.current[questionId] = null;
    }, 1500);
  }

  function setScale(questionId: string, value: number) {
    const next: AnswerState = { ...answers[questionId], scaleValue: value, textValue: '' };
    setAnswers({ ...answers, [questionId]: next });
    schedulePersist(questionId, next, true);
  }

  function setText(questionId: string, value: string) {
    const next: AnswerState = { ...answers[questionId], textValue: value };
    setAnswers({ ...answers, [questionId]: next });
    schedulePersist(questionId, next, false);
  }

  function blurPersist(questionId: string) {
    const prev = debouncersRef.current[questionId];
    if (prev) {
      clearTimeout(prev);
      void persist(questionId, answers[questionId]);
      debouncersRef.current[questionId] = null;
    }
  }

  const missingRequired = questions.filter((q) => {
    if (!q.is_required) return false;
    const a = answers[q.id];
    if (!a) return true;
    if (q.type === 'scale') return a.scaleValue === null;
    return !a.textValue.trim();
  });

  async function handleSubmit() {
    if (missingRequired.length > 0) {
      toast.error(
        `Existem ${missingRequired.length} pergunta${missingRequired.length === 1 ? '' : 's'} obrigatória${missingRequired.length === 1 ? '' : 's'} pendente${missingRequired.length === 1 ? '' : 's'}.`,
      );
      return;
    }
    setSubmitting(true);
    // Force flush pendentes
    for (const q of questions) {
      const t = debouncersRef.current[q.id];
      if (t) {
        clearTimeout(t);
        await persist(q.id, answers[q.id]);
        debouncersRef.current[q.id] = null;
      }
    }
    const r = await submitAssignment(assignment.id);
    setSubmitting(false);
    if (r.error) {
      toast.error(r.error);
      return;
    }
    toast.success('Avaliação enviada!');
    router.push('/avaliacoes');
  }

  const reviewee = assignment.reviewee;
  const typeLabel = assignment.type === 'self' ? 'Autoavaliação' : 'Avaliação do gestor';
  const headingName = assignment.type === 'self' ? 'você mesmo' : reviewee?.full_name ?? '—';

  return (
    <div>
      <div className="mb-4">
        <Link
          href={`/avaliacoes/${assignment.cycle_id}`}
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Voltar ao ciclo
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="space-y-4">
          <div className="rounded-md border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <Avatar size="lg" className="size-12">
                <AvatarFallback>{reviewee ? initials(reviewee.full_name) : '?'}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium truncate">{reviewee?.full_name ?? '—'}</p>
                <p className="text-xs text-muted-foreground">
                  {reviewee?.position?.name ?? '—'}
                </p>
              </div>
            </div>
            <Badge variant={assignment.type === 'self' ? 'secondary' : 'default'}>
              {typeLabel}
            </Badge>
          </div>

          <div className="rounded-md border bg-card p-4 space-y-2 text-sm shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Contexto
            </p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Admissão</span>
              <span>{reviewee?.hire_date ? formatDate(reviewee.hire_date) : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Departamento</span>
              <span>{reviewee?.department?.name ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gestor</span>
              <span>{reviewee?.manager?.full_name ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Liderados</span>
              <span>{directReports.length}</span>
            </div>
          </div>

          <div className="rounded-md border bg-card p-4 text-sm shadow-card">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Feedbacks no período
            </p>
            {feedbacks.length === 0 ? (
              <p className="text-muted-foreground italic text-xs">
                Nenhum feedback visível no período avaliado.
              </p>
            ) : (
              <ul className="space-y-2">
                {feedbacks.slice(0, 10).map((fb) => (
                  <li key={fb.id} className="text-xs">
                    <Badge variant="outline" className="mr-1.5">
                      {FEEDBACK_TYPE_LABELS[fb.type as FeedbackType]}
                    </Badge>
                    <span className="text-muted-foreground line-clamp-2">
                      {fb.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {feedbacks.length > 0 && assignment.reviewee && (
              <Link
                href={`/colaboradores/${assignment.reviewee.id}?tab=feedbacks`}
                className="mt-2 inline-block text-[11px] text-primary hover:underline"
              >
                Ver todos no perfil →
              </Link>
            )}
          </div>

          <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3 text-sm">
            <p className="font-medium">Prazo</p>
            <p className="text-xs text-muted-foreground">
              {assignment.cycle?.response_end ? formatDate(assignment.cycle.response_end) : '—'}
            </p>
          </div>
        </aside>

        <main>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h1 className="text-xl font-semibold">Responda sobre {headingName}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Suas respostas são salvas automaticamente. Você pode sair e voltar sem perder o progresso.
              </p>
            </div>
            <SaveIndicator savingCount={savingCount} lastSavedAt={lastSavedAt} />
          </div>

          <div className="space-y-5">
            {questions
              .slice()
              .sort((a, b) => a.question_order - b.question_order)
              .map((q, idx) => {
                const answer = answers[q.id];
                const compName = q.competency_id
                  ? competencies.find((c) => c.id === q.competency_id)?.name
                  : null;
                return (
                  <div key={q.id} className="rounded-md border bg-card p-4 shadow-card">
                    <div className="flex items-center gap-1.5 mb-2 text-xs">
                      <span className="font-semibold text-muted-foreground">{idx + 1}.</span>
                      <Badge variant={q.type === 'scale' ? 'default' : 'secondary'}>
                        {q.type === 'scale' ? 'Nota 1-5' : 'Texto'}
                      </Badge>
                      {compName && <Badge variant="outline">{compName}</Badge>}
                      {q.is_required && <Badge variant="destructive">Obrigatória</Badge>}
                    </div>
                    <p className="text-sm font-medium mb-3">{q.question_text}</p>

                    {q.type === 'scale' ? (
                      <div>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setScale(q.id, n)}
                              className={cn(
                                'h-10 w-10 rounded-md border text-sm font-semibold transition-colors',
                                answer?.scaleValue === n
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'hover:bg-muted',
                              )}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between mt-1 text-[11px] text-muted-foreground">
                          <span>{SCALE_LABEL_LEFT}</span>
                          <span>{SCALE_LABEL_RIGHT}</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Textarea
                          rows={4}
                          placeholder="Escreva sua resposta…"
                          value={answer?.textValue ?? ''}
                          onChange={(e) => setText(q.id, e.target.value)}
                          onBlur={() => blurPersist(q.id)}
                          maxLength={2000}
                        />
                        <p className="mt-1 text-xs text-muted-foreground text-right">
                          {answer?.textValue.length ?? 0}/2000
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>

          <div className="sticky bottom-4 mt-6 flex items-center justify-between gap-3 rounded-md border bg-background p-3 shadow-sm">
            <div className="text-sm">
              {missingRequired.length > 0 ? (
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{missingRequired.length}</span> pergunta(s) obrigatória(s) pendente(s)
                </span>
              ) : (
                <span className="text-emerald-700 inline-flex items-center gap-1">
                  <CircleCheck className="h-4 w-4" /> Tudo pronto para enviar
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/avaliacoes')}>
                Salvar e sair
              </Button>
              <Button
                onClick={() => {
                  if (missingRequired.length > 0) {
                    toast.error(
                      `Existem ${missingRequired.length} pergunta${missingRequired.length === 1 ? '' : 's'} obrigatória${missingRequired.length === 1 ? '' : 's'} pendente${missingRequired.length === 1 ? '' : 's'}.`,
                    );
                    return;
                  }
                  setConfirmOpen(true);
                }}
                disabled={submitting}
              >
                Enviar avaliação
              </Button>
            </div>
          </div>
        </main>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar avaliação?</AlertDialogTitle>
            <AlertDialogDescription>
              Após enviar, você não poderá alterar suas respostas. Continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Enviando…' : 'Enviar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SaveIndicator({ savingCount, lastSavedAt }: { savingCount: number; lastSavedAt: Date | null }) {
  if (savingCount > 0) {
    return (
      <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando…
      </span>
    );
  }
  if (lastSavedAt) {
    return (
      <span className="text-xs text-emerald-700 inline-flex items-center gap-1.5">
        <Check className="h-3.5 w-3.5" /> Rascunho salvo
      </span>
    );
  }
  return null;
}
