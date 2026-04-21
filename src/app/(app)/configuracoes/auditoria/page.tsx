import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { listActivityLogs, ACTIVITY_PAGE_SIZE } from '@/features/activity/queries';
import { ActivityLogList } from '@/features/activity/components/ActivityLogList';
import { PageHeader } from '@/components/PageHeader';
import { hasAdminPower } from '@/features/permissions/permissions';
import { loadActorRhPermissions } from '@/features/permissions/queries';

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.company_id) redirect('/dashboard');
  const actorRhPermissions = await loadActorRhPermissions(user.id, profile.role);
  if (!hasAdminPower({ role: profile.role, rhPermissions: actorRhPermissions }, 'can_audit')) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const pageNumber = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
  const { rows, total, pageSize, page } = await listActivityLogs(profile.company_id, {
    page: pageNumber - 1,
  });

  return (
    <div>
      <PageHeader title="Auditoria" description="Histórico de ações da equipe." />
      <ActivityLogList
        logs={rows}
        total={total}
        pageSize={pageSize}
        page={page + 1}
      />
    </div>
  );
}

export const dynamic = 'force-dynamic';
export { ACTIVITY_PAGE_SIZE };
