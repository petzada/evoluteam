'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { acceptInvite } from '../actions';
import { signIn } from '@/features/auth/actions';

const Schema = z.object({
  fullName: z.string().min(2, 'Nome obrigatório'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

type FormInput = z.infer<typeof Schema>;

interface Props {
  token: string;
  companyName: string;
  prefillName: string;
  prefillEmail: string;
}

export function AcceptInviteForm({ token, companyName, prefillName, prefillEmail }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormInput>({
    resolver: zodResolver(Schema),
    defaultValues: { fullName: prefillName, password: '', confirmPassword: '' },
  });

  async function onSubmit(values: FormInput) {
    setLoading(true);
    const result = await acceptInvite(token, { fullName: values.fullName, password: values.password });
    if ('error' in result) {
      if (result.error === 'already_used') {
        toast.info('Este convite já foi usado. Entre com seu e-mail e senha.');
      } else if (result.error === 'expired') {
        toast.error('Este convite expirou. Peça ao administrador para reenviar.');
      } else {
        toast.error('Convite inválido. Peça um novo ao seu RH.');
      }
      setLoading(false);
      return;
    }
    // Auto sign-in (redirect happens inside signIn)
    await signIn(result.email, result.password);
  }

  return (
    <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
      <div className="mb-6 space-y-1">
        <h2 className="text-xl font-semibold">Aceitar convite</h2>
        <p className="text-sm text-muted-foreground">
          Você foi convidado para <span className="font-medium text-foreground">{companyName}</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="fullName" render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div>
            <p className="text-sm text-muted-foreground mb-1">E-mail: {prefillEmail}</p>
          </div>

          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="confirmPassword" render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar senha</FormLabel>
              <FormControl><Input type="password" autoComplete="new-password" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando…' : 'Criar conta e entrar'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
