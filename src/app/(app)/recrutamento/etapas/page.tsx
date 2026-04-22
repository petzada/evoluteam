import { redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import { canDo } from '@/features/permissions/permissions';
import { listAllStages } from '@/features/recruitment/queries/stages';
import { canManageStages } from '@/features/recruitment/permissions';
import { RecruitmentStagesManager } from '@/features/recruitment/components/RecruitmentStagesManager';

export default async function EtapasPage() {
  const ctx = await getActorContext();
  const actor = {
    role: ctx.profile.role,
    employeeId: ctx.employee?.id ?? null,
    ...ctx.gate,
  };
  const canEdit = canManageStages(actor);
  const canView = canDo(actor, 'recrutamento_etapas', 'view');
  if (!canView && !canEdit) redirect('/dashboard');

  const stages = await listAllStages(ctx.profile.company_id);

  return <RecruitmentStagesManager stages={stages} canEdit={canEdit} />;
}
