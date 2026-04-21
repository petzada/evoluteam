'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, GripVertical, Archive, Pencil, Check, X, RotateCcw, Info } from 'lucide-react';
import {
  DndContext, DragEndEvent, PointerSensor, useSensor, useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { StageRow } from '../queries/stages';
import {
  createRecruitmentStage, updateRecruitmentStage,
  archiveRecruitmentStage, reactivateRecruitmentStage,
  reorderRecruitmentStages,
} from '../actions/stages';

interface Props {
  stages: StageRow[];
}

const KIND_LABELS = {
  entry: 'Entrada',
  intermediate: 'Intermediária',
  hired_terminal: 'Contratação',
} as const;

export function RecruitmentStagesManager({ stages: initialStages }: Props) {
  const router = useRouter();
  const [stages, setStages] = useState<StageRow[]>(initialStages);
  useEffect(() => { setStages(initialStages); }, [initialStages]);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function onCreate() {
    if (!newName.trim()) { toast.error('Informe o nome.'); return; }
    setCreating(true);
    try {
      const result = await createRecruitmentStage({ name: newName.trim() });
      if ('error' in result && result.error) { toast.error(result.error); return; }
      toast.success('Etapa criada');
      setCreateOpen(false);
      setNewName('');
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  async function onSaveEdit(id: string) {
    if (!editingName.trim()) { toast.error('Nome obrigatório.'); return; }
    const result = await updateRecruitmentStage(id, { name: editingName.trim() });
    if ('error' in result && result.error) { toast.error(result.error); return; }
    toast.success('Etapa atualizada');
    setEditingId(null);
    setEditingName('');
    router.refresh();
  }

  async function onToggleNotify(id: string, next: boolean) {
    // Optimistic: reflete imediatamente
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, notifies_hiring_manager: next } : s)));
    const result = await updateRecruitmentStage(id, { notifiesHiringManager: next });
    if ('error' in result && result.error) {
      toast.error(result.error);
      setStages(initialStages);
      return;
    }
    toast.success(next ? 'Notificação ligada' : 'Notificação desligada');
    router.refresh();
  }

  async function onArchive(id: string) {
    const result = await archiveRecruitmentStage(id);
    if ('error' in result && result.error) { toast.error(result.error); return; }
    toast.success('Etapa arquivada');
    router.refresh();
  }

  async function onReactivate(id: string) {
    const result = await reactivateRecruitmentStage(id);
    if ('error' in result && result.error) { toast.error(result.error); return; }
    toast.success('Etapa reativada');
    router.refresh();
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = stages.findIndex((s) => s.id === active.id);
    const newIdx = stages.findIndex((s) => s.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    const next = arrayMove(stages, oldIdx, newIdx);
    setStages(next);
    const result = await reorderRecruitmentStages(next.map((s) => s.id));
    if ('error' in result && result.error) {
      toast.error(result.error);
      setStages(initialStages);
      return;
    }
    router.refresh();
  }

  const activeStages = stages.filter((s) => !s.archived_at);
  const archivedStages = stages.filter((s) => s.archived_at);

  return (
    <div>
      <PageHeader
        title="Etapas de recrutamento"
        description="Personalize as etapas do funil usado em vagas novas."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova etapa
          </Button>
        }
      />

      <div className="mb-4 flex items-start gap-2 rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-foreground/60" />
        <p>
          Mudanças aqui se aplicam apenas a <span className="font-medium text-foreground">vagas novas</span>.
          As vagas abertas hoje mantêm o funil de quando foram criadas, para preservar o histórico e os relatórios.
        </p>
      </div>

      <div className="rounded-md border bg-card shadow-card">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={activeStages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ul className="divide-y">
              {activeStages.map((stage) => (
                <StageRowItem
                  key={stage.id}
                  stage={stage}
                  isEditing={editingId === stage.id}
                  editingName={editingName}
                  onStartEdit={() => { setEditingId(stage.id); setEditingName(stage.name); }}
                  onChangeEditingName={setEditingName}
                  onSaveEdit={() => onSaveEdit(stage.id)}
                  onCancelEdit={() => { setEditingId(null); setEditingName(''); }}
                  onArchive={() => onArchive(stage.id)}
                  onToggleNotify={(next) => onToggleNotify(stage.id, next)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      {archivedStages.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Arquivadas</h3>
          <ul className="rounded-md border bg-card shadow-card divide-y">
            {archivedStages.map((stage) => (
              <li key={stage.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-sm font-medium text-muted-foreground">{stage.name}</span>
                <Badge variant="outline" className="text-xs">{KIND_LABELS[stage.kind]}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-auto"
                  onClick={() => onReactivate(stage.id)}
                >
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  Reativar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova etapa</DialogTitle>
            <DialogDescription>
              A nova etapa será intermediária e inserida antes de Contratado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Dinâmica em grupo" autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={onCreate} disabled={creating}>
              {creating ? 'Criando…' : 'Criar etapa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StageItemProps {
  stage: StageRow;
  isEditing: boolean;
  editingName: string;
  onStartEdit: () => void;
  onChangeEditingName: (s: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onArchive: () => void;
  onToggleNotify: (next: boolean) => void;
}

function StageRowItem({
  stage, isEditing, editingName, onStartEdit, onChangeEditingName, onSaveEdit, onCancelEdit, onArchive, onToggleNotify,
}: StageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: stage.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const isFixed = stage.kind === 'entry' || stage.kind === 'hired_terminal';
  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-3 px-4 py-3 bg-card">
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={isFixed}
        className="text-muted-foreground disabled:opacity-30 cursor-grab active:cursor-grabbing"
        aria-label="Reordenar"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-xs text-muted-foreground tabular-nums w-6">{stage.position}</span>
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={editingName}
            onChange={(e) => onChangeEditingName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit();
              if (e.key === 'Escape') onCancelEdit();
            }}
          />
          <Button size="icon" variant="ghost" onClick={onSaveEdit} aria-label="Salvar">
            <Check className="h-4 w-4 text-primary" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onCancelEdit} aria-label="Cancelar">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <span className="text-sm font-medium flex-1">{stage.name}</span>
          <Badge variant="outline" className="text-[10px]">{KIND_LABELS[stage.kind]}</Badge>
          <label
            className={`flex items-center gap-1.5 text-xs text-muted-foreground ${isFixed ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            title={isFixed ? 'Apenas etapas intermediárias podem notificar o gestor.' : 'Notifica o gestor da vaga quando candidato entra nesta etapa.'}
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5 accent-primary"
              checked={stage.notifies_hiring_manager}
              disabled={isFixed}
              onChange={(e) => onToggleNotify(e.target.checked)}
            />
            Notifica gestor
          </label>
          <Button size="icon" variant="ghost" onClick={onStartEdit} aria-label="Renomear">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {!isFixed && (
            <Button size="icon" variant="ghost" onClick={onArchive} aria-label="Arquivar">
              <Archive className="h-3.5 w-3.5" />
            </Button>
          )}
        </>
      )}
    </li>
  );
}
