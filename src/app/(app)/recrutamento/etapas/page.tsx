import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/PageHeader';

export default async function EtapasRecrutamentoPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();
  if (!profile?.company_id) redirect('/onboarding/criar-empresa');
  if (profile.role !== 'admin_rh') redirect('/dashboard');

  return (
    <div>
      <PageHeader
        title="Etapas de recrutamento"
        description="Personalize as etapas do funil usado em todas as vagas."
      />
      <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
        Em breve — Onda 1 do FT-7.
      </div>
    </div>
  );
}
