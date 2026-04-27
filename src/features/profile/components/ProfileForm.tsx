'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateProfile } from '../actions';
import { ChangePasswordDialog } from './ChangePasswordDialog';

const Schema = z.object({
  fullName: z.string().min(2, 'Nome obrigatório'),
  phone: z.string().optional(),
});

type FormInput = z.infer<typeof Schema>;

interface EmployeeData {
  position: { name: string } | null;
  department: { name: string } | null;
  hire_date: string;
  email: string;
}

interface Props {
  defaultValues: FormInput;
  employeeData?: EmployeeData | null;
}

export function ProfileForm({ defaultValues, employeeData }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormInput>({
    resolver: zodResolver(Schema),
    defaultValues,
  });

  async function onSubmit(values: FormInput) {
    setLoading(true);
    const result = await updateProfile({ fullName: values.fullName, phone: values.phone || null });
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success('Perfil atualizado!');
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="fullName" render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem>
              <FormLabel>Telefone</FormLabel>
              <FormControl><Input placeholder="(11) 99999-9999" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <Button type="submit" disabled={loading}>
            {loading ? 'Salvando…' : 'Salvar'}
          </Button>
        </form>
      </Form>

      {/* Read-only HR data */}
      {employeeData && (
        <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Dados de RH</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">E-mail</p>
              <p>{employeeData.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cargo</p>
              <p>{employeeData.position?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Departamento</p>
              <p>{employeeData.department?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Admissão</p>
              <p>{new Date(employeeData.hire_date).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2 border-t">
        <ChangePasswordDialog />
      </div>
    </div>
  );
}
