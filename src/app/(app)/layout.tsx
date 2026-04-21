import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Sidebar } from '@/features/shell/components/Sidebar';
import { TopBar } from '@/features/shell/components/TopBar';
import { UserCard } from '@/features/shell/components/UserCard';
import { SidebarProvider } from '@/features/shell/SidebarContext';
import { BreadcrumbProvider } from '@/features/shell/BreadcrumbContext';
import { canAccessDashboard } from '@/features/dashboard/permissions';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url, company:companies(name)')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  const company = profile.company as { name: string } | null;

  const { data: actorEmployee } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  let isManager = false;
  if (actorEmployee?.id) {
    const { count } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('manager_id', actorEmployee.id);
    isManager = (count ?? 0) > 0;
  }

  const isOperationalOnly = !canAccessDashboard({
    role: profile.role,
    employeeId: actorEmployee?.id ?? null,
    isManager,
  });

  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get('sidebar-collapsed')?.value === '1';

  return (
    <SidebarProvider initialCollapsed={initialCollapsed}>
      <BreadcrumbProvider>
        <div className="flex h-full">
          <Sidebar
            role={profile.role}
            isOperationalOnly={isOperationalOnly}
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
