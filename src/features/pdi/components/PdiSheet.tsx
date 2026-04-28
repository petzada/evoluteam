'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import {
  Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { onInvalidToast } from '@/lib/form';
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
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: EMPTY_DEFAULTS,
  });

  const employeeId = useWatch({ control: form.control, name: 'employeeId' });
  const objective = useWatch({ control: form.control, name: 'objective' });

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

  const activeCycles = cycles.filter((c) => c.status === 'published' || c.status === 'closed');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold">Novo PDI</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Defina o objetivo e o prazo. Ações serão adicionadas depois, na página do PDI.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <Form {...form}>
            <form id="pdi-form" onSubmit={form.handleSubmit(onSubmit, onInvalidToast(undefined, () => form.getValues()))} className="space-y-5">
              <FormField control={form.control} name="employeeId" render={({ field }) => (
                <FormItem className="min-w-0">
                  <FormLabel>Colaborador *</FormLabel>
                  {selected ? (
                    <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{selected.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {selected.position?.name ?? selected.email}
                        </p>
                      </div>
                      {!presetEmployeeId && (
                        <button
                          type="button"
                          onClick={() => field.onChange('')}
                          className="text-xs text-muted-foreground hover:text-foreground shrink-0"
                        >
                          Trocar
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 min-w-0">
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
                        <ul className="max-h-48 overflow-y-auto rounded-md border">
                          {filteredEmployees.map((e) => (
                            <li key={e.id}>
                              <button
                                type="button"
                                onClick={() => field.onChange(e.id)}
                                className="w-full min-w-0 flex items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
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
        </SheetBody>

        <SheetFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="pdi-form" disabled={loading}>
            {loading ? 'Criando…' : 'Criar PDI'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
