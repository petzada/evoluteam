import { redirect } from 'next/navigation';
import { canDo } from '@/features/permissions/permissions';
import { listAllStages } from '@/features/recruitment/queries/stages';
import { canManageStages } from '@/features/recruitment/permissions';
import { RecruitmentStagesManager } from '@/features/recruitment/components/RecruitmentStagesManager';
import { getActorContext } from '@/features/auth/context';

export default async function EtapasPage() {
  const { profile, employee, gate } = await getActorContext();
  const actor = {
    role: profile.role,
    employeeId: employee?.id ?? null,
    ...gate,
  };
  const canEdit = canManageStages(actor);
  const canView = canDo(actor, 'recrutamento_etapas', 'view');
  if (!canView && !canEdit) redirect('/dashboard');

  const stages = await listAllStages(profile.company_id);

  return <RecruitmentStagesManager stages={stages} canEdit={canEdit} />;
}
