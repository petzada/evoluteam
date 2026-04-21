'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Sheet, SheetContent, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  JobOpeningInputSchema, type JobOpeningInput,
  JOB_OPENING_EMPLOYMENT_TYPES, JOB_OPENING_WORKPLACE_TYPES,
  JOB_OPENING_EMPLOYMENT_TYPE_LABELS, JOB_OPENING_WORKPLACE_TYPE_LABELS,
} from '../schema';
import { createJobOpening, updateJobOpening } from '../actions/jobOpenings';

interface TaxonomyItem { id: string; name: string }
interface ManagerItem { id: string; full_name: string }

export interface JobOpeningInitial {
  id: string;
  title: string;
  description: string | null;
  departmentId: string | null;
  positionId: string | null;
  hiringManagerId: string | null;
  employmentType: JobOpeningInput['employmentType'];
  workplaceType: JobOpeningInput['workplaceType'];
  location: string | null;
  openPositions: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: TaxonomyItem[];
  positions: TaxonomyItem[];
  managers: ManagerItem[];
  initial?: JobOpeningInitial | null;
}

const NONE = '__none__';

function defaultsFor(initial: JobOpeningInitial | null | undefined): JobOpeningInput {
  return {
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    departmentId: initial?.departmentId ?? null,
    positionId: initial?.positionId ?? null,
    hiringManagerId: initial?.hiringManagerId ?? null,
    employmentType: initial?.employmentType ?? 'clt',
    workplaceType: initial?.workplaceType ?? 'presencial',
    location: initial?.location ?? '',
    openPositions: initial?.openPositions ?? 1,
  };
}

export function JobOpeningSheet({ open, onOpenChange, departments, positions, managers, initial }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initial;

  const form = useForm<JobOpeningInput>({
    resolver: zodResolver(JobOpeningInputSchema),
    defaultValues: defaultsFor(initial),
  });

  async function onSubmit(values: JobOpeningInput) {
    setLoading(true);
    try {
      const result = isEdit && initial
        ? await updateJobOpening(initial.id, values)
        : await createJobOpening(values);
      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? 'Vaga atualizada' : 'Vaga criada');
      onOpenChange(false);
      if (!isEdit && 'id' in result && result.id) {
        router.push(`/recrutamento/vagas/${result.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:max-w-[440px] p-0 flex flex-col">
        <div className="p-6 pb-4 border-b">
          <SheetTitle>{isEdit ? 'Editar vaga' : 'Nova vaga'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os detalhes da vaga.' : 'Cadastre uma nova vaga aberta.'}
          </SheetDescription>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Analista de Suporte Jr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Responsabilidades, requisitos, benefícios…"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => {
                const items = [
                  { value: NONE, label: 'Nenhum' },
                  ...departments.map((d) => ({ value: d.id, label: d.name })),
                ];
                return (
                  <FormItem>
                    <FormLabel>Departamento</FormLabel>
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                      items={items}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.map((d) => (
                          <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="positionId"
              render={({ field }) => {
                const items = [
                  { value: NONE, label: 'Nenhum' },
                  ...positions.map((p) => ({ value: p.id, label: p.name })),
                ];
                return (
                  <FormItem>
                    <FormLabel>Cargo</FormLabel>
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                      items={items}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="hiringManagerId"
              render={({ field }) => {
                const items = [
                  { value: NONE, label: 'Sem gestor' },
                  ...managers.map((m) => ({ value: m.id, label: m.full_name })),
                ];
                return (
                  <FormItem>
                    <FormLabel>Gestor responsável</FormLabel>
                    <Select
                      value={field.value ?? NONE}
                      onValueChange={(v) => field.onChange(v === NONE ? null : v)}
                      items={items}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Sem gestor atribuído" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="employmentType"
              render={({ field }) => {
                const items = JOB_OPENING_EMPLOYMENT_TYPES.map((t) => ({
                  value: t, label: JOB_OPENING_EMPLOYMENT_TYPE_LABELS[t],
                }));
                return (
                  <FormItem>
                    <FormLabel>Tipo de contrato *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} items={items}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {items.map((it) => (
                          <SelectItem key={it.value} value={it.value}>{it.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="workplaceType"
              render={({ field }) => {
                const items = JOB_OPENING_WORKPLACE_TYPES.map((t) => ({
                  value: t, label: JOB_OPENING_WORKPLACE_TYPE_LABELS[t],
                }));
                return (
                  <FormItem>
                    <FormLabel>Modalidade *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} items={items}>
                      <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {items.map((it) => (
                          <SelectItem key={it.value} value={it.value}>{it.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localidade</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: São Paulo — SP"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="openPositions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Posições abertas *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2 border-t -mx-6 px-6 py-4 mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando…' : isEdit ? 'Salvar' : 'Criar vaga'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
