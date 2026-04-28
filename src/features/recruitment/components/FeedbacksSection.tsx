'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDown, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { statusClass } from '@/lib/status-colors';
import { recruitmentApplicationStatusToken } from '@/lib/status-mappers';
import { cn } from '@/lib/utils';
import type { CandidateFeedbackRow } from '../queries/feedbacks';
import type { ApplicationRow } from '../queries/applications';
import { APPLICATION_STATUS_LABELS } from '../schema';
import { FeedbackSheet, type FeedbackContext, type FeedbackEditInitial } from './FeedbackSheet';
import { deleteFeedback } from '../actions/feedbacks';
import { FeedbackCard } from './cards/FeedbackCard';

interface Props {
  applications: ApplicationRow[];
  feedbacks: CandidateFeedbackRow[];
  currentEmployeeId: string | null;
  isAdmin: boolean;
  canGiveFeedbackForApp: (app: ApplicationRow) => boolean;
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
      <p className="text-sm text-muted-foreground italic">
        Este candidato ainda não foi vinculado a nenhuma vaga.
      </p>
    );
  }

  return (
    <>
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
    <div className="rounded-md border bg-card p-4 shadow-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 hover:text-foreground transition-colors"
      >
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', !open && '-rotate-90')} />
        <span className="text-sm font-medium flex-1 text-left">{app.job_opening?.title ?? 'Vaga'}</span>
        <Badge
          className={cn(
            'text-[10px] hover:opacity-100',
            statusClass(recruitmentApplicationStatusToken(app.status)),
          )}
        >
          {APPLICATION_STATUS_LABELS[app.status]}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {feedbacks.length} {feedbacks.length === 1 ? 'feedback' : 'feedbacks'}
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {canGiveFeedback && (
            <button
              type="button"
              onClick={onNewFeedback}
              className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1.5"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Dar feedback nesta aplicação
            </button>
          )}
          {feedbacks.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Nenhum feedback registrado ainda.</p>
          ) : (
            <ul className="divide-y">
              {feedbacks.map((fb) => (
                <li key={fb.id} className="pt-3 first:pt-0">
                  <FeedbackCard
                    fb={fb}
                    currentEmployeeId={currentEmployeeId}
                    isAdmin={isAdmin}
                    onEdit={() => onEditFeedback(fb)}
                    onDelete={() => onDeleteFeedback(fb.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

