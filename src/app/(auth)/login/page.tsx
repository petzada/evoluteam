'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import Link from 'next/link';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { onInvalidToast } from '@/lib/form';
import { LoginSchema, type LoginInput } from '@/features/auth/schema';
import { signIn } from '@/features/auth/actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  async function onSubmit(values: LoginInput) {
    setError(null);
    setLoading(true);
    const result = await signIn(values.email, values.password, values.rememberMe);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="mb-8 text-2xl font-semibold tracking-tight text-slate-950">Entrar</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalidToast(undefined, () => form.getValues()))} className="space-y-4">
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl><Input type="email" placeholder="voce@empresa.com" autoComplete="email" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Senha</FormLabel>
                <Link href="/forgot-password" className="text-xs text-muted-foreground transition hover:text-brand-ink">
                  Esqueci minha senha
                </Link>
              </div>
              <FormControl><Input type="password" autoComplete="current-password" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="rememberMe" render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={field.value ?? false}
                  onChange={field.onChange}
                  className="h-4 w-4 cursor-pointer accent-primary"
                />
              </FormControl>
              <label htmlFor="rememberMe" className="cursor-pointer select-none text-sm text-muted-foreground">
                Lembrar-me neste dispositivo
              </label>
            </FormItem>
          )} />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="h-10 w-full rounded-xl bg-brand-ink text-white hover:bg-slate-800" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Não tem acesso? Fale com seu RH.
      </p>
    </div>
  );
}
