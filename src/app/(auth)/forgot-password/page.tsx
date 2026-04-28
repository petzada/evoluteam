'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import Link from 'next/link';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { onInvalidToast } from '@/lib/form';
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@/features/auth/schema';
import { requestPasswordReset } from '@/features/auth/actions';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setLoading(true);
    await requestPasswordReset(values.email);
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <h2 className="mb-3 text-2xl font-semibold tracking-tight text-slate-950">Verifique seu e-mail</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Se o e-mail existir, enviamos um link de redefinição.
        </p>
        <Link href="/login" className="text-sm font-medium text-brand-ink transition hover:text-slate-800 hover:underline">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="mb-2 text-2xl font-semibold tracking-tight text-slate-950">Recuperar senha</h2>
      <p className="mb-8 text-sm text-muted-foreground">Informe seu e-mail para receber o link.</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalidToast(undefined, () => form.getValues()))} className="space-y-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl><Input type="email" placeholder="voce@empresa.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="h-10 w-full rounded-xl bg-brand-ink text-white hover:bg-slate-800" disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar link'}
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-center">
        <Link href="/login" className="text-xs text-muted-foreground transition hover:text-brand-ink">
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
