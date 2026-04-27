'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/date';
import type { PlanCommentRow } from '../queries';
import { addComment, deleteComment } from '../actions';

interface Props {
  planId: string;
  comments: PlanCommentRow[];
  canComment: boolean;
  canDeleteAny: boolean;
  actorEmployeeId: string | null;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join('');
}

export function PdiCommentsSection({
  planId, comments, canComment, canDeleteAny, actorEmployeeId,
}: Props) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (body.trim().length === 0) return;
    setSaving(true);
    const r = await addComment(planId, { body: body.trim() });
    setSaving(false);
    if (r.error) {
      toast.error(r.error);
      return;
    }
    setBody('');
    router.refresh();
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Remover este comentário?')) return;
    const r = await deleteComment(commentId);
    if (r.error) {
      toast.error(r.error);
      return;
    }
    toast.success('Comentário removido.');
    router.refresh();
  }

  return (
    <section>
      <h2 className="text-base font-semibold mb-3">Comentários</h2>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground italic mb-4">Nenhum comentário ainda.</p>
      ) : (
        <ul className="space-y-3 mb-4">
          {comments.map((c) => {
            const isMine = actorEmployeeId && c.author_id === actorEmployeeId;
            const canDelete = isMine || canDeleteAny;
            return (
              <li key={c.id} className="rounded-md border bg-card p-3 shadow-card">
                <div className="flex items-start gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback>{c.author ? initials(c.author.full_name) : '?'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium truncate">{c.author?.full_name ?? '—'}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-muted-foreground">{formatDateTime(c.created_at)}</span>
                        {canDelete && (
                          <button
                            type="button"
                            className="text-muted-foreground hover:text-destructive p-0.5"
                            onClick={() => handleDelete(c.id)}
                            aria-label="Remover comentário"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canComment ? (
        <div className="rounded-md border p-3 bg-muted/20">
          <Textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Escreva um comentário de acompanhamento…"
            maxLength={2000}
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{body.length}/2000</p>
            <Button size="sm" onClick={handleSubmit} disabled={saving || body.trim().length === 0}>
              {saving ? 'Enviando…' : 'Comentar'}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic">Visualização somente leitura.</p>
      )}
    </section>
  );
}
