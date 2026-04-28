'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { onInvalidToast } from '@/lib/form';
import { CompanySchema, type CompanyInput, SEGMENTS, TEAM_SIZES } from '../schema';
import { updateCompany } from '../actions';

interface Props {
  defaultValues: CompanyInput;
  readOnly?: boolean;
}

export function CompanyEditForm({ defaultValues, readOnly = false }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm<CompanyInput>({
    resolver: zodResolver(CompanySchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues,
  });

  async function onSubmit(values: CompanyInput) {
    if (readOnly) return;

    setLoading(true);
    const result = await updateCompany({
      name: values.name,
      cnpj: values.cnpj,
      segment: values.segment,
      teamSize: values.teamSize,
    });

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Empresa atualizada!');
    }

    setLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalidToast(undefined, () => form.getValues()))} className="space-y-4 max-w-lg">
        {readOnly && (
          <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            Voce tem acesso de auditoria nesta tela. Edicao de empresa e exclusiva de Administrador.
          </p>
        )}

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Nome da empresa *</FormLabel>
            <FormControl><Input {...field} disabled={readOnly} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="cnpj" render={({ field }) => (
          <FormItem>
            <FormLabel>CNPJ</FormLabel>
            <FormControl><Input placeholder="00.000.000/0001-00" {...field} disabled={readOnly} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="segment" render={({ field }) => (
          <FormItem>
            <FormLabel>Segmento *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={readOnly}>
              <FormControl>
                <SelectTrigger><SelectValue /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {SEGMENTS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="teamSize" render={({ field }) => (
          <FormItem>
            <FormLabel>Tamanho do time *</FormLabel>
            <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={readOnly}>
              <FormControl>
                <SelectTrigger><SelectValue /></SelectTrigger>
              </FormControl>
              <SelectContent>
                {TEAM_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>{s} pessoas</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        {!readOnly && (
          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </Button>
        )}
      </form>
    </Form>
  );
}
