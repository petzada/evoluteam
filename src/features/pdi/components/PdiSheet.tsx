'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import {
  Sheet, SheetContent, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PdiInputSchema, type PdiInput } from '../schema';
import { createPdi } from '../actions';

export interface EmployeeOption {
  id: string;
  full_name: string;
  email: string;
  status: string;
  manager_id: string | null;
  position: { id: string; name: string } | null;
}

export interface CompetencyOption {
  id: string;
  name: string;
}

export interface CycleOption {
  id: string;
  name: string;
  status: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: EmployeeOption[];
  competencies: CompetencyOption[];
  cycles: CycleOption[];
  isAdmin: boolean;
  actorEmployeeId: string | null;
  presetEmployeeId?: string | null;
  presetCycleId?: string | null;
  presetCompetencyId?: string | null;
}

const EMPTY_DEFAULTS: PdiInput = {
  employeeId: '' as unknown as string,
  objective: '',
  competencyId: null,
  cycleId: null,
  dueDate: '',
};

export function PdiSheet({
  open, onOpenChange, employees, competencies, cycles, isAdmin, actorEmployeeId,
  presetEmployeeId, presetCycleId, presetCompetencyId,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState('');

  const form = useForm<PdiInput>({
    resolver: zodResolver(PdiInputSchema),
    defaultValues: EMPTY_DEFAULTS,
  });

  const employeeId = useWatch({ control: form.control, name: 'employeeId' });
  const objective = useWatch({ control: form.control, name: 'objective' });
  const dueDate = useWatch({ control: form.control, name: 'dueDate' });

  useEffect(() => {
    if (!open) return;
    form.reset({
      ...EMPTY_DEFAULTS,
      employeeId: (presetEmployeeId ?? '') as PdiInput['employeeId'],
      cycleId: presetCycleId ?? null,
      competencyId: presetCompetencyId ?? null,
    });
    // Reset do estado auxiliar de busca ao abrir o sheet — intencional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmployeeSearch('');
  }, [open, presetEmployeeId, presetCycleId, presetCompetencyId, form]);

  const availableEmployees = useMemo(() => {
    const base = employees.filter((e) => e.status !== 'terminated');
    if (isAdmin) return base;
    if (!actorEmployeeId) return [];
    return base.filter(
      (e) => e.id === actorEmployeeId || e.manager_id === actorEmployeeId,
    );
  }, [employees, isAdmin, actorEmployeeId]);

  const filteredEmployees = useMemo(() => {
    const lower = employeeSearch.trim().toLowerCase();
    const base = availableEmployees;
    if (!lower) return base.slice(0, 20);
    return base.filter((e) =>
      e.full_name.toLowerCase().includes(lower) || e.email.toLowerCase().includes(lower),
    ).slice(0, 20);
  }, [availableEmployees, employeeSearch]);

  const selected = availableEmployees.find((e) => e.id === employeeId);

  async function onSubmit(values: PdiInput) {
    setLoading(true);
    const result = await createPdi(values);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('PDI criado.');
    onOpenChange(false);
    if (result.id) {
      router.push(`/pdi/${result.id}`);
    } else {
      router.refresh();
    }
  }

  const canSubmit =
    !!employeeId
    && objective.trim().length >= 10
    && dueDate.length > 0;

  const activeCycles = cycles.filter((c) => c.status === 'published' || c.status === 'closed');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:max-w-[440px] p-0 gap-0 flex flex-col">
        <div className="px-6 py-5 border-b">
          <SheetTitle className="text-base font-semibold">Novo PDI</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground mt-1">
            Defina o objetivo e o prazo. Ações serão adicionadas depois, na página do PDI.
          </SheetDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <Form {...form}>
            <form id="pdi-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField control={form.control} name="employeeId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Colaborador *</FormLabel>
                  {selected ? (
                    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{selected.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {selected.position?.name ?? selected.email}
                        </p>
                      </div>
                      {!presetEmployeeId && (
                        <button
                          type="button"
                          onClick={() => field.onChange('')}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Trocar
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar colaborador…"
                          value={employeeSearch}
                          onChange={(e) => setEmployeeSearch(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      {filteredEmployees.length > 0 && (
                        <ul className="max-h-48 overflow-auto rounded-md border">
                          {filteredEmployees.map((e) => (
                            <li key={e.id}>
                              <button
                                type="button"
                                onClick={() => field.onChange(e.id)}
                                className="w-full flex items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">{e.full_name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {e.position?.name ? `${e.position.name} · ` : ''}{e.email}
                                  </p>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {filteredEmployees.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          {isAdmin ? 'Nenhum colaborador encontrado.' : 'Nenhum colaborador disponível no seu escopo.'}
                        </p>
                      )}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="objective" render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Qual é o foco de desenvolvimento deste PDI?"
                      {...field}
                    />
                  </FormControl>
                  <p className="mt-1 text-xs text-muted-foreground text-right">
                    {objective.length}/500
                  </p>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="competencyId" render={({ field }) => {
                const items = [
                  { value: '__none__', label: 'Nenhuma' },
                  ...competencies.map((c) => ({ value: c.id, label: c.name })),
                ];
                return (
                  <FormItem>
                    <FormLabel>Competência</FormLabel>
                    <Select
                      value={field.value ?? '__none__'}
                      onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                      items={items}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.map((it) => (
                          <SelectItem key={it.value} value={it.value}>{it.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }} />

              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo geral *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="cycleId" render={({ field }) => {
                const items = [
                  { value: '__none__', label: 'Nenhum ciclo' },
                  ...activeCycles.map((c) => ({ value: c.id, label: c.name })),
                ];
                return (
                  <FormItem>
                    <FormLabel>Ciclo de avaliação</FormLabel>
                    <Select
                      value={field.value ?? '__none__'}
                      onValueChange={(v) => field.onChange(v === '__none__' ? null : v)}
                      items={items}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Nenhum ciclo" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.map((it) => (
                          <SelectItem key={it.value} value={it.value}>{it.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }} />
            </form>
          </Form>
        </div>

        <div className="px-6 py-4 border-t bg-muted/30 flex gap-2 justify-end">
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="pdi-form" disabled={loading || !canSubmit}>
            {loading ? 'Criando…' : 'Criar PDI'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
