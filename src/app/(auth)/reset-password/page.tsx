'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ResetPasswordSchema, type ResetPasswordInput } from '@/features/auth/schema';
import { resetPassword } from '@/features/auth/actions';

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setLoading(true);
    const result = await resetPassword(values.password);
    if (result?.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }
    toast.success('Senha redefinida com sucesso!');
    router.push('/login');
  }

  return (
    <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold">Nova senha</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
              <FormLabel>Nova senha</FormLabel>
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
            {loading ? 'Salvando…' : 'Redefinir senha'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
