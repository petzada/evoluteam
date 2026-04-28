'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { invalidate } from '@/lib/cache/memory';

export async function signIn(email: string, password: string, rememberMe?: boolean) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('[auth.signIn]', error.message);
    return { error: 'E-mail ou senha inválidos.' };
  }
  // Persistência da sessão é controlada pelo JWT expiry do dashboard Supabase (7 dias).
  // O flag rememberMe é capturado para uso futuro (ex: cookie max-age customizado).
  void rememberMe;
  redirect('/dashboard');
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  // Pega o userId ANTES do signOut para invalidar caches em memoria.
  // Se nao limpar, o proximo login pode ver dados de gate/hiringmgr stale por ate 60s.
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.auth.signOut();
  if (user) {
    invalidate(`gate:${user.id}`);
    invalidate(`hiringmgr:`);
  }
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
  if (error) {
    console.error('[auth.resetPassword]', error.message);
    return { error: 'Não foi possível redefinir a senha. Tente novamente.' };
  }
  return { ok: true };
}
