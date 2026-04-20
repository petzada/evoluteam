'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function updateProfile(data: { fullName: string; phone?: string | null }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado.' };

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: data.fullName, phone: data.phone ?? null, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) return { error: 'Erro ao salvar.' };
  revalidatePath('/configuracoes/perfil');
  return { ok: true };
}

export async function changePassword(newPassword: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: 'Erro ao alterar senha.' };
  return { ok: true };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Não autenticado.' };

  const file = formData.get('avatar') as File;
  if (!file) return { error: 'Arquivo não encontrado.' };

  const ext = file.name.split('.').pop();
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true });

  if (uploadError) return { error: 'Erro no upload.' };

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);

  await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
  revalidatePath('/configuracoes/perfil');
  return { ok: true, url: publicUrl };
}
