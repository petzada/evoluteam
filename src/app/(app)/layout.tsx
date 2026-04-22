import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Sidebar } from '@/features/shell/components/Sidebar';
import { TopBar } from '@/features/shell/components/TopBar';
import { UserCard } from '@/features/shell/components/UserCard';
import { SidebarProvider } from '@/features/shell/SidebarContext';
import { BreadcrumbProvider } from '@/features/shell/BreadcrumbContext';
import { canAccessDashboard } from '@/features/dashboard/permissions';
import { loadActorGate } from '@/features/permissions/queries';
import { hasOpenJobAsHiringManager } from '@/features/recruitment/queries/jobOpenings';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id, full_name, avatar_url, company:companies(name)')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');
  if (!profile.company_id) redirect('/onboarding/criar-empresa');

  const company = profile.company as { name: string } | null;

  const { data: actorEmployee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  let isManager = false;
  let isHiringManager = false;
  if (actorEmployee?.id) {
    const [{ count: directReports }, hasOpenJob] = await Promise.all([
      supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('manager_id', actorEmployee.id),
      hasOpenJobAsHiringManager(profile.company_id, actorEmployee.id),
    ]);
    isManager = (directReports ?? 0) > 0;
    isHiringManager = hasOpenJob;
  }

  const gate = await loadActorGate(user.id, profile.role);

  const isOperationalOnly = !canAccessDashboard({
    role: profile.role,
    employeeId: actorEmployee?.id ?? null,
    isManager,
    ...gate,
  });

  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get('sidebar-collapsed')?.value === '1';

  return (
    <SidebarProvider initialCollapsed={initialCollapsed}>
      <BreadcrumbProvider>
        <div className="flex h-full">
          <Sidebar
            role={profile.role}
            screenPermissions={gate.screenPermissions}
            isOperationalOnly={isOperationalOnly}
            isHiringManager={isHiringManager}
            footer={
              <UserCard
                fullName={profile.full_name}
                companyName={company?.name ?? ''}
                avatarUrl={profile.avatar_url}
              />
            }
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </BreadcrumbProvider>
    </SidebarProvider>
  );
}
