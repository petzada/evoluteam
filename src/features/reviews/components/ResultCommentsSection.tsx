'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/date';
import {
  createResultComment, updateResultComment, deleteResultComment,
} from '../actions';
import type { ResultLeadershipComment } from '../queries';

interface Props {
  cycleId: string;
  revieweeEmployeeId: string;
  comments: ResultLeadershipComment[];
  canComment: boolean;
  canDeleteAny: boolean;     // admin_rh pode deletar qualquer um
  currentEmployeeId: string | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase();
}

const ROLE_TAG_STYLES: Record<string, string> = {
  admin_rh: 'bg-destructive/10 text-destructive border-destructive/30',
  director: 'bg-blue-500/10 text-blue-700 border-blue-500/30',
  manager: 'bg-primary/10 text-primary border-primary/30',
  rh: 'bg-secondary/10 text-secondary border-secondary/30',
};
const ROLE_TAG_LABELS: Record<string, string> = {
  admin_rh: 'Administrador',
  director: 'Diretor',
  manager: 'Gestor direto',
  rh: 'RH',
};

export function ResultCommentsSection({
  cycleId, revieweeEmployeeId, comments, canComment, canDeleteAny, currentEmployeeId,
}: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Se nao ha comentarios e nao pode comentar, oculta secao toda.
  if (comments.length === 0 && !canComment) return null;

  function handleSubmit() {
    const content = draft.trim();
    if (!content) return;
    startTransition(async () => {
      const r = await createResultComment({ cycleId, revieweeEmployeeId, content });
      if ('error' in r) {
        toast.error(r.error);
        return;
      }
      setDraft('');
      toast.success('Comentario publicado.');
      router.refresh();
    });
  }

  function startEdit(c: ResultLeadershipComment) {
    setEditingId(c.id);
    setEditDraft(c.content);
  }

  function handleEditSave() {
    if (!editingId) return;
    const content = editDraft.trim();
    if (!content) return;
    startTransition(async () => {
      const r = await updateResultComment({ commentId: editingId, content });
      if ('error' in r) {
        toast.error(r.error);
        return;
      }
      setEditingId(null);
      setEditDraft('');
      toast.success('Comentario atualizado.');
      router.refresh();
    });
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      const r = await deleteResultComment({ commentId });
      if ('error' in r) {
        toast.error(r.error);
        return;
      }
      setConfirmDelete(null);
      toast.success('Comentario removido.');
      router.refresh();
    });
  }

  return (
    <section>
      <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
        Comentários da liderança
        {comments.length > 0 && (
          <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        )}
      </h2>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground italic mb-3">
          {canComment
            ? 'Seja o primeiro a comentar neste resultado.'
            : 'Sem comentários.'}
        </p>
      ) : (
        <ul className="space-y-0">
          {comments.map((c) => {
            const isMine = !!currentEmployeeId && c.authorEmployeeId === currentEmployeeId;
            // Janela de 2h eh validada no server action (RLS + app). Aqui mostramos
            // o menu se e autor ou admin — backend rejeita se fora da janela.
            const canEditThis = isMine;
            const canDeleteThis = canDeleteAny || isMine;
            const roleKey = c.authorIsManagerOfReviewee
              ? 'manager'
              : (c.authorRole ?? '');

            return (
              <li key={c.id} className="flex gap-3 py-3 border-t first:border-t-0">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="text-[11px]">{initials(c.authorFullName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold">{c.authorFullName}</span>
                    {roleKey && ROLE_TAG_LABELS[roleKey] && (
                      <span className={cn(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded border',
                        ROLE_TAG_STYLES[roleKey] ?? 'bg-muted text-muted-foreground border-border',
                      )}>
                        {ROLE_TAG_LABELS[roleKey]}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto shrink-0">
                      {formatDateTime(c.createdAt)}
                    </span>
                    {(canEditThis || canDeleteThis) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="size-6">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end">
                          {canEditThis && (
                            <DropdownMenuItem onClick={() => startEdit(c)}>
                              <Pencil className="size-3.5 mr-2" /> Editar
                            </DropdownMenuItem>
                          )}
                          {canDeleteThis && (
                            <DropdownMenuItem onClick={() => setConfirmDelete(c.id)} className="text-destructive">
                              <Trash2 className="size-3.5 mr-2" /> Remover
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  {editingId === c.id ? (
                    <div className="mt-1.5 space-y-2">
                      <Textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleEditSave} disabled={pending}>
                          Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm whitespace-pre-wrap leading-relaxed">{c.content}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {canComment && (
        <div className="mt-3 rounded-md border p-3 bg-muted/30">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Escreva um comentário visível para esta pessoa, a cadeia de gestão e o RH…"
            className="min-h-[64px] bg-background text-sm"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">
              Visível para: a pessoa avaliada · cadeia de gestão · Administrador · Diretores
            </span>
            <Button size="sm" onClick={handleSubmit} disabled={pending || !draft.trim()}>
              {pending ? 'Publicando…' : 'Publicar'}
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover comentário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && handleDelete(confirmDelete)}>
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
