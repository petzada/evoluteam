import { redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import { listActivityLogs, ACTIVITY_PAGE_SIZE } from '@/features/activity/queries';
import { ActivityLogList } from '@/features/activity/components/ActivityLogList';
import { PageHeader } from '@/components/PageHeader';
import { canDo } from '@/features/permissions/permissions';

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const ctx = await getActorContext();
  if (!canDo({ role: ctx.profile.role, ...ctx.gate }, 'auditoria', 'view')) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  const pageNumber = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
  const { rows, total, pageSize, page } = await listActivityLogs(ctx.profile.company_id, {
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
