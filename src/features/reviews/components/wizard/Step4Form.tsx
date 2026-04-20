'use client';

import { useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { DEFAULT_QUESTION_TEMPLATE, type QuestionInput } from '../../schema';

interface Props {
  competencies: { id: string; name: string }[];
  value: QuestionInput[];
  onChange: (v: QuestionInput[]) => void;
  onBack: () => void;
  onNext: () => void;
}

type TemplateChoice = 'default' | 'blank' | 'copy';

export function Step4Form({ competencies, value, onChange, onBack, onNext }: Props) {
  const [template, setTemplate] = useState<TemplateChoice>('default');
  const [editing, setEditing] = useState<{ index: number; draft: QuestionInput } | null>(null);

  function applyTemplate(t: TemplateChoice) {
    setTemplate(t);
    if (t === 'default') onChange(DEFAULT_QUESTION_TEMPLATE.map((q) => ({ ...q })));
    if (t === 'blank') onChange([]);
  }

  function move(idx: number, dir: -1 | 1) {
    const next = [...value];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next.map((q, i) => ({ ...q, questionOrder: i })));
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx).map((q, i) => ({ ...q, questionOrder: i })));
  }

  function addQuestion(type: 'scale' | 'text') {
    const newQ: QuestionInput = {
      questionOrder: value.length,
      type,
      questionText: '',
      isRequired: true,
      competencyId: null,
      scaleMin: type === 'scale' ? 1 : null,
      scaleMax: type === 'scale' ? 5 : null,
    };
    setEditing({ index: value.length, draft: newQ });
  }

  function saveEditing() {
    if (!editing) return;
    if (editing.draft.questionText.trim().length < 3) return;
    const next = [...value];
    next[editing.index] = editing.draft;
    onChange(next.map((q, i) => ({ ...q, questionOrder: i })));
    setEditing(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Formulário</h2>
        <p className="text-sm text-muted-foreground">
          Escolha o ponto de partida e ajuste as perguntas conforme necessário.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => applyTemplate('default')}
          className={`rounded-md border px-3 py-2 text-sm text-left flex-1 ${template === 'default' ? 'border-primary bg-primary/5' : ''}`}
        >
          <p className="font-medium">Template padrão</p>
          <p className="text-xs text-muted-foreground">7 perguntas de nota + 2 de texto.</p>
        </button>
        <button
          type="button"
          onClick={() => applyTemplate('blank')}
          className={`rounded-md border px-3 py-2 text-sm text-left flex-1 ${template === 'blank' ? 'border-primary bg-primary/5' : ''}`}
        >
          <p className="font-medium">Em branco</p>
          <p className="text-xs text-muted-foreground">Criar as perguntas do zero.</p>
        </button>
        <button
          type="button"
          disabled
          className="rounded-md border px-3 py-2 text-sm text-left flex-1 opacity-50 cursor-not-allowed"
        >
          <p className="font-medium">Copiar de ciclo anterior</p>
          <p className="text-xs text-muted-foreground">Em breve.</p>
        </button>
      </div>

      <div className="space-y-2">
        {value.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-6 text-center">
            Nenhuma pergunta ainda. Adicione abaixo.
          </p>
        ) : (
          value.map((q, idx) => (
            <div key={idx} className="rounded-md border p-3 flex items-start gap-3">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(idx, -1)} className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center disabled:opacity-30" disabled={idx === 0}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => move(idx, +1)} className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center disabled:opacity-30" disabled={idx === value.length - 1}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge variant={q.type === 'scale' ? 'default' : 'secondary'}>
                    {q.type === 'scale' ? 'Nota 1-5' : 'Texto'}
                  </Badge>
                  {q.competencyId && (
                    <Badge variant="outline">
                      {competencies.find((c) => c.id === q.competencyId)?.name ?? 'Competência'}
                    </Badge>
                  )}
                  {q.isRequired && <Badge variant="destructive">Obrigatória</Badge>}
                </div>
                <p className="text-sm">{q.questionText || <span className="text-muted-foreground italic">(sem texto)</span>}</p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setEditing({ index: idx, draft: { ...q } })}
                  className="h-8 w-8 rounded hover:bg-muted flex items-center justify-center"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  className="h-8 w-8 rounded hover:bg-muted flex items-center justify-center text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => addQuestion('scale')}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Pergunta de nota
        </Button>
        <Button variant="outline" size="sm" onClick={() => addQuestion('text')}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Pergunta de texto
        </Button>
      </div>

      <div className="flex justify-between gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onBack}>Voltar</Button>
        <Button disabled={value.length === 0} onClick={onNext}>Próximo</Button>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.index !== undefined && value[editing.index] ? 'Editar pergunta' : 'Nova pergunta'}</DialogTitle>
            <DialogDescription>
              {editing?.draft.type === 'scale' ? 'Nota de 1 a 5.' : 'Resposta livre em texto.'}
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="q-text">Pergunta *</Label>
                <Textarea
                  id="q-text"
                  rows={2}
                  value={editing.draft.questionText}
                  onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, questionText: e.target.value } })}
                  placeholder={editing.draft.type === 'scale'
                    ? 'Ex: Entrega os compromissos dentro do prazo.'
                    : 'Ex: Quais pontos de desenvolvimento você sugere?'}
                />
              </div>
              <div>
                <Label>Competência (opcional)</Label>
                <Select
                  value={editing.draft.competencyId ?? '__none__'}
                  onValueChange={(v) => setEditing({
                    ...editing,
                    draft: { ...editing.draft, competencyId: v === '__none__' ? null : v },
                  })}
                  items={[{ value: '__none__', label: 'Sem competência' }, ...competencies.map((c) => ({ value: c.id, label: c.name }))]}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sem competência</SelectItem>
                    {competencies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editing.draft.isRequired}
                  onChange={(e) => setEditing({ ...editing, draft: { ...editing.draft, isRequired: e.target.checked } })}
                />
                <span className="text-sm">Resposta obrigatória</span>
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            <Button onClick={saveEditing} disabled={!editing?.draft.questionText.trim() || editing.draft.questionText.trim().length < 3}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
