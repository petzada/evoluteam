'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import Link from 'next/link';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@/features/auth/schema';
import { requestPasswordReset } from '@/features/auth/actions';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordSchema),
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
      <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm text-center">
        <h2 className="mb-3 text-xl font-semibold">Verifique seu e-mail</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Se o e-mail existir, enviamos um link de redefinição.
        </p>
        <Link href="/login" className="text-sm text-primary hover:underline">Voltar ao login</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
      <h2 className="mb-2 text-xl font-semibold">Recuperar senha</h2>
      <p className="mb-6 text-sm text-muted-foreground">Informe seu e-mail para receber o link.</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl><Input type="email" placeholder="voce@empresa.com" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar link'}
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-center">
        <Link href="/login" className="text-xs text-muted-foreground hover:text-primary">Voltar ao login</Link>
      </div>
    </div>
  );
}
