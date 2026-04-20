'use client';

import { Button } from '@/components/ui/button';
import type { CycleTypesInput } from '../../schema';

interface Props {
  value: CycleTypesInput;
  onChange: (v: CycleTypesInput) => void;
  onBack: () => void;
  onNext: () => void;
}

export function Step3Types({ value, onChange, onBack, onNext }: Props) {
  const canNext = value.includeSelf || value.includeManager;
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Tipos de avaliação</h2>
        <p className="text-sm text-muted-foreground">
          Quais perspectivas de avaliação estarão presentes no ciclo.
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/30">
          <input
            type="checkbox"
            checked={value.includeSelf}
            onChange={(e) => onChange({ ...value, includeSelf: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <div>
            <p className="font-medium">Autoavaliação</p>
            <p className="text-sm text-muted-foreground">O próprio colaborador responde sobre si mesmo.</p>
          </div>
        </label>

        <label className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/30">
          <input
            type="checkbox"
            checked={value.includeManager}
            onChange={(e) => onChange({ ...value, includeManager: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <div>
            <p className="font-medium">Avaliação do gestor direto</p>
            <p className="text-sm text-muted-foreground">O gestor responde sobre o liderado.</p>
          </div>
        </label>

        <p className="text-xs text-muted-foreground italic">
          Avaliações por pares e 360° virão em versão futura.
        </p>
      </div>

      <div className="flex justify-between gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onBack}>Voltar</Button>
        <Button disabled={!canNext} onClick={onNext}>Próximo</Button>
      </div>
    </div>
  );
}
