'use client';

import Link from 'next/link';
import { toast } from 'sonner';
import { Lock, MoreHorizontal, Shield, Users as UsersIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import {
  FEEDBACK_TYPE_LABELS, FEEDBACK_VISIBILITY_LABELS,
  type FeedbackType, type FeedbackVisibility,
} from '../schema';
import { deleteFeedback } from '../actions';
import type { FeedbackRow } from '../queries';

interface Props {
  feedback: FeedbackRow;
  perspective: 'received' | 'sent' | 'team';
  isAdmin: boolean;
  unread?: boolean;
}

const TYPE_BADGE: Record<FeedbackType, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  elogio: 'default',
  reconhecimento: 'default',
  ponto_de_melhoria: 'secondary',
  orientacao: 'secondary',
  observacao_privada: 'outline',
};

const VISIBILITY_ICON: Record<FeedbackVisibility, typeof Lock> = {
  privado: Lock,
  visivel_para_gestor: UsersIcon,
  visivel_para_rh: Shield,
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('');
}

export function FeedbackCard({ feedback, perspective, isAdmin, unread }: Props) {
  const router = useRouter();

  // Perspective decides whose identity is shown in the header
  const focus =
    perspective === 'sent' ? feedback.recipient
      : perspective === 'received' ? feedback.sender
      : feedback.recipient; // team lista com recipient em foco
  const label =
    perspective === 'sent' ? 'Para' :
    perspective === 'received' ? 'De' : 'Para';

  const type = feedback.type as FeedbackType;
  const visibility = feedback.visibility as FeedbackVisibility;
  const VisibilityIcon = VISIBILITY_ICON[visibility];

  async function handleDelete() {
    if (!confirm('Deletar este feedback? A ação fica registrada em auditoria.')) return;
    const r = await deleteFeedback(feedback.id);
    if (r.error) toast.error(r.error);
    else { toast.success('Feedback deletado.'); router.refresh(); }
  }

  return (
    <article
      className={cn(
        'rounded-md border p-4 text-sm',
        unread && 'border-primary/40 bg-primary/5',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="size-9">
            <AvatarFallback>{focus ? initials(focus.full_name) : '?'}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            {focus ? (
              <Link
                href={`/colaboradores/${focus.id}`}
                className="font-medium hover:underline truncate block"
              >
                {focus.full_name}
                {focus.status === 'terminated' && (
                  <span className="ml-2 text-xs text-muted-foreground">(desligado)</span>
                )}
                {focus.status === 'inactive' && (
                  <span className="ml-2 text-xs text-muted-foreground">(inativo)</span>
                )}
              </Link>
            ) : (
              <p className="font-medium text-muted-foreground">—</p>
            )}
            <p className="text-xs text-muted-foreground">{formatDateTime(feedback.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {unread && (
            <span className="inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
              Novo
            </span>
          )}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted">
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <Badge variant={TYPE_BADGE[type]}>{FEEDBACK_TYPE_LABELS[type]}</Badge>
        {feedback.competency && (
          <Badge variant="outline">{feedback.competency.name}</Badge>
        )}
        <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] text-muted-foreground">
          <VisibilityIcon className="h-3 w-3" />
          {FEEDBACK_VISIBILITY_LABELS[visibility]}
        </span>
      </div>

      <p className="whitespace-pre-wrap text-foreground">{feedback.message}</p>
    </article>
  );
}
