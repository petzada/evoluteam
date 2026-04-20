import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listActivityLogs } from '@/features/activity/queries';
import { ActivityLogList } from '@/features/activity/components/ActivityLogList';

export default async function AuditoriaPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id || profile.role !== 'admin_rh') redirect('/dashboard');

  const logs = await listActivityLogs(profile.company_id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Auditoria</h1>
        <p className="text-sm text-muted-foreground">Histórico de ações da equipe.</p>
      </div>
      <ActivityLogList logs={logs} />
    </div>
  );
}
