'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TaxonomyInputSchema, type TaxonomyInput } from '../schema';
import { createTaxonomy, updateTaxonomy } from '../actions';

type Kind = 'department' | 'position' | 'competency';
type Existing = { id: string; name: string } | null;

interface Props {
  kind: Kind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: Existing;
}

const LABELS: Record<Kind, { singular: string; create: string; edit: string; placeholder: string }> = {
  department: { singular: 'departamento', create: 'Novo departamento', edit: 'Editar departamento', placeholder: 'Ex: Engenharia' },
  position: { singular: 'cargo', create: 'Novo cargo', edit: 'Editar cargo', placeholder: 'Ex: Analista' },
  competency: { singular: 'competência', create: 'Nova competência', edit: 'Editar competência', placeholder: 'Ex: Comunicação' },
};

export function TaxonomySheet({ kind, open, onOpenChange, existing }: Props) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!existing;
  const labels = LABELS[kind];

  const form = useForm<TaxonomyInput>({
    resolver: zodResolver(TaxonomyInputSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ name: existing?.name ?? '' });
  }, [open, existing, form]);

  async function onSubmit(values: TaxonomyInput) {
    setLoading(true);
    const result = isEdit
      ? await updateTaxonomy(kind, existing!.id, values)
      : await createTaxonomy(kind, values);
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    toast.success(isEdit ? 'Atualizado!' : 'Criado!');
    onOpenChange(false);
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? labels.edit : labels.create}</DialogTitle>
          <DialogDescription>
            {kind === 'competency'
              ? 'A competência aparece em ciclos de avaliação, feedbacks e PDIs.'
              : 'O nome aparece em listagens e seleções de colaboradores.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="taxonomy-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input autoFocus placeholder={labels.placeholder} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="taxonomy-form" disabled={loading}>
            {loading ? 'Salvando…' : (isEdit ? 'Salvar' : `Criar ${labels.singular}`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
