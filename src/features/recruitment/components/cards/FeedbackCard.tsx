'use client';

import { useEffect, useMemo, useState } from 'react';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/date';
import type { CandidateFeedbackRow } from '../../queries/feedbacks';
import {
  FEEDBACK_RECOMMENDATION_LABELS,
  FEEDBACK_EDIT_WINDOW_MINUTES,
  type FeedbackRecommendation,
} from '../../schema';

export function recommendationColor(rec: FeedbackRecommendation): string {
  if (rec === 'advance') return 'bg-emerald-100 text-emerald-800';
  if (rec === 'doubt') return 'bg-amber-100 text-amber-900';
  return 'bg-rose-100 text-rose-900';
}

function useNowClock() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const t0 = setTimeout(update, 0);
    const id = setInterval(update, 30_000);
    return () => {
      clearTimeout(t0);
      clearInterval(id);
    };
  }, []);
  return now;
}

interface Props {
  fb: CandidateFeedbackRow;
  currentEmployeeId: string | null;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function FeedbackCard({ fb, currentEmployeeId, isAdmin, onEdit, onDelete }: Props) {
  const isAuthor = fb.author_id === currentEmployeeId;
  const createdAt = useMemo(() => new Date(fb.created_at).getTime(), [fb.created_at]);
  const now = useNowClock();

  const canEditByWindow =
    isAuthor && now > 0 && (now - createdAt) < FEEDBACK_EDIT_WINDOW_MINUTES * 60 * 1000;
  const canDelete = canEditByWindow || isAdmin;
  const showKebab = canEditByWindow || canDelete;

  return (
    <div className="text-sm">
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
