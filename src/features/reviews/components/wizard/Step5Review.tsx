'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatDate } from '@/lib/date';
import type {
  CycleBasicsInput, CycleTypesInput, ParticipantsSelection, QuestionInput,
} from '../../schema';
import type { WizardDependencies } from '../ReviewCycleWizard';

interface Props {
  deps: WizardDependencies;
  basics: CycleBasicsInput;
  participants: ParticipantsSelection;
  resolvedIds: string[];
  types: CycleTypesInput;
  questions: QuestionInput[];
  loading: boolean;
  onBack: () => void;
  onEdit: (step: 1 | 2 | 3 | 4) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export function Step5Review({
  deps, basics, participants, resolvedIds, types, questions, loading,
  onBack, onEdit, onSaveDraft, onPublish,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const withoutManager = deps.employees
    .filter((e) => resolvedIds.includes(e.id) && !e.manager_id).length;
  const scaleCount = questions.filter((q) => q.type === 'scale').length;
  const textCount = questions.filter((q) => q.type === 'text').length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Revisar e publicar</h2>
        <p className="text-sm text-muted-foreground">
          Confira os dados do ciclo. Publicar gera as avaliações automaticamente.
        </p>
      </div>

      <ReviewCard title="1. Dados básicos" onEdit={() => onEdit(1)}>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Nome</dt>
          <dd>{basics.name || '—'}</dd>
          <dt className="text-muted-foreground">Período avaliado</dt>
          <dd>{basics.periodStart && basics.periodEnd ? `${formatDate(basics.periodStart)} – ${formatDate(basics.periodEnd)}` : '—'}</dd>
          <dt className="text-muted-foreground">Prazo de resposta</dt>
          <dd>{basics.responseStart && basics.responseEnd ? `${formatDate(basics.responseStart)} – ${formatDate(basics.responseEnd)}` : '—'}</dd>
          {basics.description && (<>
            <dt className="text-muted-foreground">Descrição</dt>
            <dd>{basics.description}</dd>
          </>)}
        </dl>
      </ReviewCard>

      <ReviewCard title="2. Participantes" onEdit={() => onEdit(2)}>
        <p className="text-sm">
          <span className="font-medium">{resolvedIds.length}</span> colaborador(es) serão avaliados.
        </p>
        {participants.mode === 'filters' && (
          <p className="text-xs text-muted-foreground mt-1">
            {participants.departmentIds.length} departamento(s), {participants.positionIds.length} cargo(s), {participants.manualEmployeeIds.length} seleção manual, {participants.excludedEmployeeIds.length} excluído(s).
          </p>
        )}
        {withoutManager > 0 && types.includeManager && (
          <p className="text-xs text-amber-700 mt-2">
            ⚠️ {withoutManager} colaborador(es) sem gestor não receberão avaliação do gestor.
          </p>
        )}
      </ReviewCard>

      <ReviewCard title="3. Tipos de avaliação" onEdit={() => onEdit(3)}>
        <ul className="text-sm space-y-1">
          <li>{types.includeSelf ? '✓' : '·'} Autoavaliação</li>
          <li>{types.includeManager ? '✓' : '·'} Avaliação do gestor</li>
        </ul>
      </ReviewCard>

      <ReviewCard title="4. Formulário" onEdit={() => onEdit(4)}>
        <p className="text-sm">
          {questions.length} pergunta(s): {scaleCount} de nota, {textCount} de texto.
        </p>
        <ol className="mt-2 space-y-1 text-sm text-muted-foreground">
          {questions.map((q, i) => (
            <li key={i}>{i + 1}. {q.questionText}</li>
          ))}
        </ol>
      </ReviewCard>

      <div className="flex justify-between gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onBack} disabled={loading}>Voltar</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSaveDraft} disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar rascunho'}
          </Button>
          <Button onClick={() => setConfirmOpen(true)} disabled={loading || resolvedIds.length === 0 || questions.length === 0}>
            Publicar agora
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publicar ciclo?</AlertDialogTitle>
            <AlertDialogDescription>
              Ao publicar, {resolvedIds.length} colaborador(es) receberão avaliações.
              Após publicação, apenas descrição e prazo de resposta poderão ser alterados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onPublish} disabled={loading}>
              {loading ? 'Publicando…' : 'Publicar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ReviewCard({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <section className="rounded-md border p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <button type="button" onClick={onEdit} className="text-xs text-primary hover:underline flex items-center gap-1">
          <Pencil className="h-3 w-3" /> Editar
        </button>
      </div>
      {children}
    </section>
  );
}
