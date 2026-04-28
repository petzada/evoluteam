'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { PlanRow } from '../queries';
import { updatePdiHeader } from '../actions';

interface Props {
  plan: PlanRow;
  competencies: { id: string; name: string }[];
  cycles: { id: string; name: string; status: string }[];
  onClose: () => void;
}

export function PdiHeaderEditForm({ plan, competencies, cycles, onClose }: Props) {
  const router = useRouter();
  const [objective, setObjective] = useState(plan.objective);
  const [dueDate, setDueDate] = useState(plan.due_date);
  const [competencyId, setCompetencyId] = useState<string>(plan.competency_id ?? '__none__');
  const [cycleId, setCycleId] = useState<string>(plan.cycle_id ?? '__none__');
  const [saving, setSaving] = useState(false);

  const activeCycles = cycles.filter((c) => c.status === 'published' || c.status === 'closed');
  const availableCompetencies = competencies;

  async function handleSave() {
    const trimmedObjective = objective.trim();
    if (trimmedObjective.length < 10) {
      const remaining = 10 - trimmedObjective.length;
      toast.error(`Objetivo deve ter pelo menos 10 caracteres (faltam ${remaining}).`);
      return;
    }
    if (!dueDate) {
      toast.error('Informe o prazo do PDI.');
      return;
    }
    setSaving(true);
    const r = await updatePdiHeader(plan.id, {
      objective: trimmedObjective,
      dueDate,
      competencyId: competencyId === '__none__' ? null : competencyId,
      cycleId: cycleId === '__none__' ? null : cycleId,
      employeeId: plan.employee_id,
    });
    setSaving(false);
    if (r.error) { toast.error(r.error); return; }
    toast.success('PDI atualizado.');
    onClose();
    router.refresh();
  }

  return (
    <div className="mt-4 rounded-md border p-4 space-y-4 bg-muted/20">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Objetivo *</label>
        <Textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          rows={3}
          maxLength={500}
        />
        <p className="mt-1 text-xs text-muted-foreground text-right">{objective.length}/500</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Prazo *</label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Competência</label>
          <Select
            value={competencyId}
            onValueChange={(v) => setCompetencyId(v ?? '__none__')}
            items={[
              { value: '__none__', label: 'Nenhuma' },
              ...availableCompetencies.map((c) => ({ value: c.id, label: c.name })),
            ]}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Nenhuma</SelectItem>
              {availableCompetencies.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Ciclo</label>
          <Select
            value={cycleId}
            onValueChange={(v) => setCycleId(v ?? '__none__')}
            items={[
              { value: '__none__', label: 'Nenhum' },
              ...activeCycles.map((c) => ({ value: c.id, label: c.name })),
            ]}
          >
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Nenhum</SelectItem>
              {activeCycles.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}
