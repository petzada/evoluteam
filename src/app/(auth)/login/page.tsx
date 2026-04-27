'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import Link from 'next/link';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoginSchema, type LoginInput } from '@/features/auth/schema';
import { signIn } from '@/features/auth/actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
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
    <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-card">
      <h2 className="mb-6 text-xl font-semibold">Entrar</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
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
                  className="h-4 w-4 accent-primary cursor-pointer"
                />
              </FormControl>
              <label htmlFor="rememberMe" className="text-sm text-muted-foreground cursor-pointer select-none">
                Lembrar-me neste dispositivo
              </label>
            </FormItem>
          )} />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </Form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Não tem acesso? Fale com o seu RH.
      </p>
    </div>
  );
}
