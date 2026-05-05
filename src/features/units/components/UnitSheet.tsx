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
import { onInvalidToast } from '@/lib/form';
import { BusinessUnitSchema, type BusinessUnitInput } from '../schema';
import { createUnit, updateUnit } from '../actions';

type Existing = { id: string; name: string } | null;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: Existing;
}

export function UnitSheet({ open, onOpenChange, existing }: Props) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!existing;

  const form = useForm<BusinessUnitInput>({
    resolver: zodResolver(BusinessUnitSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ name: existing?.name ?? '' });
  }, [open, existing, form]);

  async function onSubmit(values: BusinessUnitInput) {
    setLoading(true);
    const result = isEdit
      ? await updateUnit(existing!.id, values)
      : await createUnit(values);
    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    toast.success(isEdit ? 'Unidade atualizada!' : 'Unidade criada!');
    onOpenChange(false);
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar unidade' : 'Nova unidade'}</DialogTitle>
          <DialogDescription>
            O nome aparece em listagens e seleções de colaboradores.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="unit-form"
            onSubmit={form.handleSubmit(onSubmit, onInvalidToast(undefined, () => form.getValues()))}
            className="space-y-4"
          >
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome *</FormLabel>
                <FormControl>
                  <Input autoFocus placeholder="Ex: Hugs" {...field} />
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
          <Button type="submit" form="unit-form" disabled={loading}>
            {loading ? 'Salvando…' : (isEdit ? 'Salvar' : 'Criar unidade')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
