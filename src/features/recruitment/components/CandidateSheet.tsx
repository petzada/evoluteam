'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
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
  CandidateInputSchema, type CandidateInput,
  CANDIDATE_SOURCES, CANDIDATE_SOURCE_LABELS,
} from '../schema';
import { createCandidate, updateCandidate } from '../actions/candidates';

export interface CandidateInitial {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  resumeUrl: string | null;
  source: CandidateInput['source'];
  sourceOther: string | null;
  notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: CandidateInitial | null;
  redirectAfterCreate?: boolean;
}

function defaultsFor(initial: CandidateInitial | null | undefined): CandidateInput {
  return {
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    linkedinUrl: initial?.linkedinUrl ?? '',
    resumeUrl: initial?.resumeUrl ?? '',
    source: initial?.source ?? 'manual',
    sourceOther: initial?.sourceOther ?? '',
    notes: initial?.notes ?? '',
  };
}

export function CandidateSheet({ open, onOpenChange, initial, redirectAfterCreate = true }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!initial;

  const form = useForm<CandidateInput>({
    resolver: zodResolver(CandidateInputSchema),
    defaultValues: defaultsFor(initial),
  });

  const source = useWatch({ control: form.control, name: 'source' });

  async function onSubmit(values: CandidateInput) {
    setLoading(true);
    try {
      const result = isEdit && initial
        ? await updateCandidate(initial.id, values)
        : await createCandidate(values);
      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? 'Candidato atualizado' : 'Candidato cadastrado');
      onOpenChange(false);
      if (!isEdit && redirectAfterCreate && 'id' in result && result.id) {
        router.push(`/recrutamento/candidatos/${result.id}`);
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
          <SheetTitle>{isEdit ? 'Editar candidato' : 'Novo candidato'}</SheetTitle>
          <SheetDescription>
            {isEdit ? 'Atualize os dados do candidato.' : 'Cadastre um candidato no banco global.'}
          </SheetDescription>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl><Input placeholder="Nome completo" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail *</FormLabel>
                <FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 91234-5678" value={field.value ?? ''} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>LinkedIn</FormLabel>
                <FormControl>
                  <Input placeholder="https://linkedin.com/in/…" value={field.value ?? ''} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="resumeUrl" render={({ field }) => (
              <FormItem>
                <FormLabel>Currículo (URL)</FormLabel>
                <FormControl>
                  <Input placeholder="https://…" value={field.value ?? ''} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="source" render={({ field }) => (
              <FormItem>
                <FormLabel>Origem *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {CANDIDATE_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>{CANDIDATE_SOURCE_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            {source === 'outro' && (
              <FormField control={form.control} name="sourceOther" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descreva a origem *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: TikTok, Feira de Carreiras" value={field.value ?? ''} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Observações internas</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Anotações internas…" value={field.value ?? ''} onChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2 pt-2 border-t -mx-6 px-6 py-4 mt-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando…' : isEdit ? 'Salvar' : 'Cadastrar candidato'}
              </Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
