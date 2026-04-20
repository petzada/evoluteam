'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function signIn(email: string, password: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: 'E-mail ou senha inválidos.' };
  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function requestPasswordReset(email: string) {
  const supabase = await createServerSupabaseClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });
  // Resposta genérica — não enumeramos usuários
  return { ok: true };
}

export async function resetPassword(newPassword: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: 'Não foi possível redefinir a senha. Tente novamente.' };
  return { ok: true };
}
