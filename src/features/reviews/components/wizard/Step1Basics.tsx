'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CycleBasicsSchema, type CycleBasicsInput } from '../../schema';
import { useState } from 'react';

interface Props {
  value: CycleBasicsInput;
  onChange: (v: CycleBasicsInput) => void;
  onNext: () => void;
}

export function Step1Basics({ value, onChange, onNext }: Props) {
  const [error, setError] = useState<string | null>(null);

  function handleNext() {
    const parsed = CycleBasicsSchema.safeParse(value);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Dados inválidos.');
      return;
    }
    setError(null);
    onNext();
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Dados básicos</h2>
        <p className="text-sm text-muted-foreground">
          Nomeie o ciclo e defina o período avaliado e o prazo para os participantes responderem.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome do ciclo *</Label>
          <Input
            id="name"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="Ex: Avaliação 1º semestre 2026"
            autoFocus
          />
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            rows={3}
            value={value.description ?? ''}
            onChange={(e) => onChange({ ...value, description: e.target.value })}
            placeholder="Contexto ou instruções para os participantes."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ps">Período avaliado — início *</Label>
            <Input
              id="ps" type="date"
              value={value.periodStart}
              onChange={(e) => onChange({ ...value, periodStart: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="pe">Período avaliado — fim *</Label>
            <Input
              id="pe" type="date"
              value={value.periodEnd}
              onChange={(e) => onChange({ ...value, periodEnd: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="rs">Resposta — início *</Label>
            <Input
              id="rs" type="date"
              value={value.responseStart}
              onChange={(e) => onChange({ ...value, responseStart: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="re">Resposta — prazo *</Label>
            <Input
              id="re" type="date"
              value={value.responseEnd}
              onChange={(e) => onChange({ ...value, responseEnd: e.target.value })}
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button onClick={handleNext}>Próximo</Button>
      </div>
    </div>
  );
}
