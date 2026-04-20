'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updatePublishedCycleMetadata } from '../actions';

interface Props {
  cycleId: string;
  initialDescription: string | null;
  initialResponseEnd: string;
  responseStart: string;
}

export function PublishedCycleEditForm({
  cycleId, initialDescription, initialResponseEnd, responseStart,
}: Props) {
  const router = useRouter();
  const [description, setDescription] = useState(initialDescription ?? '');
  const [responseEnd, setResponseEnd] = useState(initialResponseEnd);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (responseEnd < responseStart) {
      toast.error('Prazo final não pode ser anterior ao início.');
      return;
    }
    setLoading(true);
    const result = await updatePublishedCycleMetadata(cycleId, {
      description: description.trim() || null,
      responseEnd,
    });
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Alterações salvas.');
    router.push(`/avaliacoes/${cycleId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-xl">
      <div className="rounded-md border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
        Ciclo publicado — apenas <strong>descrição</strong> e <strong>prazo final de resposta</strong> podem ser ajustados.
        Para mudar participantes ou formulário, crie um novo ciclo.
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Contexto do ciclo, orientações aos avaliadores, etc."
        />
        <p className="text-xs text-muted-foreground">{description.length} / 500</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="responseEnd">Prazo final de resposta *</Label>
        <Input
          id="responseEnd"
          type="date"
          value={responseEnd}
          min={responseStart}
          onChange={(e) => setResponseEnd(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          Início já definido: {responseStart}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando…' : 'Salvar alterações'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(`/avaliacoes/${cycleId}`)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
