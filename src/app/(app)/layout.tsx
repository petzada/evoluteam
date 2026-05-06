import { cookies } from 'next/headers';
import { Sidebar } from '@/features/shell/components/Sidebar';
import { TopBar } from '@/features/shell/components/TopBar';
import { UserCard } from '@/features/shell/components/UserCard';
import { HelpFloatingButton } from '@/features/help/components/HelpFloatingButton';
import { SidebarProvider } from '@/features/shell/SidebarContext';
import { BreadcrumbProvider } from '@/features/shell/BreadcrumbContext';
import { AppTopBarProvider } from '@/features/shell/AppTopBarContext';
import { canAccessDashboard } from '@/features/dashboard/permissions';
import { getActorContext } from '@/features/auth/context';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getActorContext();
  const { user, profile, employee, isManager, isHiringManager, gate } = ctx;

  const isOperationalOnly = !canAccessDashboard({
    role: profile.role,
    employeeId: employee?.id ?? null,
    isManager,
    ...gate,
  });

  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get('sidebar-collapsed')?.value === '1';

  return (
    <SidebarProvider initialCollapsed={initialCollapsed}>
      <BreadcrumbProvider>
        <AppTopBarProvider>
        <div className="flex h-full">
          <Sidebar
            role={profile.role}
            screenPermissions={gate.screenPermissions}
            isOperationalOnly={isOperationalOnly}
            isHiringManager={isHiringManager}
            footer={
              <UserCard
                fullName={profile.full_name}
                companyName={profile.company?.name ?? ''}
                avatarUrl={profile.avatar_url}
              />
            }
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <TopBar userId={user.id} />
            <main className="flex-1 overflow-y-auto px-6 py-4">
              {children}
            </main>
          </div>
          <HelpFloatingButton />
        </div>
        </AppTopBarProvider>
      </BreadcrumbProvider>
    </SidebarProvider>
  );
}
