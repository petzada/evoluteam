'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDown, MessageSquare, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date';
import type { CandidateFeedbackRow } from '../queries/feedbacks';
import type { ApplicationRow } from '../queries/applications';
import {
  FEEDBACK_RECOMMENDATION_LABELS, APPLICATION_STATUS_LABELS,
  FEEDBACK_EDIT_WINDOW_MINUTES, type FeedbackRecommendation,
} from '../schema';
import { FeedbackSheet, type FeedbackContext, type FeedbackEditInitial } from './FeedbackSheet';
import { deleteFeedback } from '../actions/feedbacks';

interface Props {
  applications: ApplicationRow[];
  feedbacks: CandidateFeedbackRow[];
  currentEmployeeId: string | null;
  isAdmin: boolean;
  canGiveFeedbackForApp: (app: ApplicationRow) => boolean;
}

function recommendationColor(rec: FeedbackRecommendation): string {
  if (rec === 'advance') return 'bg-emerald-100 text-emerald-800';
  if (rec === 'doubt') return 'bg-amber-100 text-amber-900';
  return 'bg-rose-100 text-rose-900';
}

function statusVariant(status: ApplicationRow['status']): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (status === 'hired') return 'default';
  if (status === 'rejected') return 'destructive';
  if (status === 'withdrawn') return 'secondary';
  if (status === 'in_progress') return 'default';
  return 'outline';
}

export function FeedbacksSection({
  applications, feedbacks, currentEmployeeId, isAdmin, canGiveFeedbackForApp,
}: Props) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [context, setContext] = useState<FeedbackContext | null>(null);
  const [editInitial, setEditInitial] = useState<FeedbackEditInitial | null>(null);

  // Agrupar feedbacks por application
  const byApp = useMemo(() => {
    const map = new Map<string, CandidateFeedbackRow[]>();
    for (const fb of feedbacks) {
      const list = map.get(fb.application_id) ?? [];
      list.push(fb);
      map.set(fb.application_id, list);
    }
    return map;
  }, [feedbacks]);

  function openNew(app: ApplicationRow) {
    setEditInitial(null);
    setContext({
      applicationId: app.id,
      candidateName: app.candidate?.name ?? 'Candidato',
      jobTitle: app.job_opening?.title ?? 'Vaga',
      stageName: app.current_stage?.name ?? '—',
    });
    setSheetOpen(true);
  }

  function openEdit(fb: CandidateFeedbackRow, app: ApplicationRow | null) {
    setEditInitial({
      id: fb.id,
      content: fb.content,
      recommendation: fb.recommendation,
    });
    setContext({
      applicationId: fb.application_id,
      candidateName: app?.candidate?.name ?? 'Candidato',
      jobTitle: app?.job_opening?.title ?? 'Vaga',
      stageName: fb.stage?.name ?? app?.current_stage?.name ?? '—',
    });
    setSheetOpen(true);
  }

  async function onDelete(id: string) {
    const result = await deleteFeedback(id);
    if ('error' in result && result.error) { toast.error(result.error); return; }
    toast.success('Feedback removido');
    router.refresh();
  }

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-3">Feedbacks</h3>
          <p className="text-sm text-muted-foreground">
            Este candidato ainda não foi vinculado a nenhuma vaga.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold mb-3">Feedbacks</h3>
          <div className="space-y-3">
            {applications.map((app) => {
              const appFeedbacks = byApp.get(app.id) ?? [];
              const isActive = app.status === 'in_progress';
              return (
                <FeedbackGroup
                  key={app.id}
                  app={app}
                  feedbacks={appFeedbacks}
                  defaultOpen={isActive}
                  currentEmployeeId={currentEmployeeId}
                  isAdmin={isAdmin}
                  canGiveFeedback={canGiveFeedbackForApp(app)}
                  onNewFeedback={() => openNew(app)}
                  onEditFeedback={(fb) => openEdit(fb, app)}
                  onDeleteFeedback={onDelete}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      <FeedbackSheet
        open={sheetOpen}
        onOpenChange={(v) => { if (!v) { setContext(null); setEditInitial(null); } setSheetOpen(v); }}
        context={context}
        initial={editInitial}
      />
    </>
  );
}

interface GroupProps {
  app: ApplicationRow;
  feedbacks: CandidateFeedbackRow[];
  defaultOpen: boolean;
  currentEmployeeId: string | null;
  isAdmin: boolean;
  canGiveFeedback: boolean;
  onNewFeedback: () => void;
  onEditFeedback: (fb: CandidateFeedbackRow) => void;
  onDeleteFeedback: (id: string) => void;
}

function FeedbackGroup({
  app, feedbacks, defaultOpen, currentEmployeeId, isAdmin, canGiveFeedback,
  onNewFeedback, onEditFeedback, onDeleteFeedback,
}: GroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-md border bg-muted/20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted/30 transition-colors rounded-t-md"
      >
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', !open && '-rotate-90')} />
        <span className="text-sm font-medium flex-1 text-left">{app.job_opening?.title ?? 'Vaga'}</span>
        <Badge variant={statusVariant(app.status)} className="text-[10px]">
          {APPLICATION_STATUS_LABELS[app.status]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {feedbacks.length} {feedbacks.length === 1 ? 'feedback' : 'feedbacks'}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 space-y-2">
          {canGiveFeedback && (
            <button
              type="button"
              onClick={onNewFeedback}
              className="w-full text-xs text-primary hover:text-primary/80 flex items-center gap-1.5 py-1.5"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Dar feedback nesta aplicação
            </button>
          )}
          {feedbacks.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Nenhum feedback registrado ainda.</p>
          ) : (
            feedbacks.map((fb) => (
              <FeedbackCard
                key={fb.id}
                fb={fb}
                currentEmployeeId={currentEmployeeId}
                isAdmin={isAdmin}
                onEdit={() => onEditFeedback(fb)}
                onDelete={() => onDeleteFeedback(fb.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface CardProps {
  fb: CandidateFeedbackRow;
  currentEmployeeId: string | null;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function subscribeToTick(callback: () => void) {
  const id = setInterval(callback, 30_000);
  return () => clearInterval(id);
}

function FeedbackCard({ fb, currentEmployeeId, isAdmin, onEdit, onDelete }: CardProps) {
  const isAuthor = fb.author_id === currentEmployeeId;
  const createdAt = useMemo(() => new Date(fb.created_at).getTime(), [fb.created_at]);

  // Clock via useSyncExternalStore — padrão recomendado para ler Date.now()
  // de forma reativa sem setState em effect.
  const now = useSyncExternalStore(
    subscribeToTick,
    () => Date.now(),
    () => 0, // SSR snapshot: sem janela ativa; só client calcula.
  );

  const canEditByWindow =
    isAuthor && now > 0 && (now - createdAt) < FEEDBACK_EDIT_WINDOW_MINUTES * 60 * 1000;
  const canDelete = canEditByWindow || isAdmin;
  const showKebab = canEditByWindow || canDelete;

  return (
    <div className="rounded-md bg-card border p-3 text-sm">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium">{fb.author?.full_name ?? '—'}</span>
          {fb.stage && (
            <Badge variant="outline" className="text-[9px] py-0">{fb.stage.name}</Badge>
          )}
          <span className="text-xs text-muted-foreground">· {formatDate(fb.created_at)}</span>
        </div>
        {showKebab && (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded p-0.5 hover:bg-muted" aria-label="Ações">
              <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEditByWindow && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Remover
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{fb.content}</p>
      {fb.recommendation && (
        <div className="mt-2">
          <span className={cn('inline-block text-[10.5px] font-medium rounded-full px-2 py-0.5', recommendationColor(fb.recommendation))}>
            {FEEDBACK_RECOMMENDATION_LABELS[fb.recommendation]}
          </span>
        </div>
      )}
    </div>
  );
}
