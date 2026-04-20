import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Sidebar } from '@/features/shell/components/Sidebar';
import { TopBar } from '@/features/shell/components/TopBar';
import { UserCard } from '@/features/shell/components/UserCard';
import { SidebarProvider } from '@/features/shell/SidebarContext';

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

  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get('sidebar-collapsed')?.value === '1';

  return (
    <SidebarProvider initialCollapsed={initialCollapsed}>
      <div className="flex h-full">
        <Sidebar
          role={profile.role}
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
    </SidebarProvider>
  );
}
