import { redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import { canAccessRecruitmentModule } from '@/features/recruitment/permissions';

export default async function RecrutamentoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getActorContext();

  const actor = {
    role: ctx.profile.role,
    employeeId: ctx.employee?.id ?? null,
    isHiringManager: ctx.isHiringManager,
    ...ctx.gate,
  };

  if (!canAccessRecruitmentModule(actor)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
