import { redirect } from 'next/navigation';
import { getActorContext } from '@/features/auth/context';
import { canAccessRecruitmentModule } from '@/features/recruitment/permissions';

export default async function RecrutamentoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, employee, isHiringManager, gate } = await getActorContext();

  const actor = {
    role: profile.role,
    employeeId: employee?.id ?? null,
    isHiringManager,
    ...gate,
  };

  if (!canAccessRecruitmentModule(actor)) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
