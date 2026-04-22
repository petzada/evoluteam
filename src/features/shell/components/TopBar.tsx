import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUnreadCount, listRecentNotifications } from '@/features/notifications/queries';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { Breadcrumbs } from './Breadcrumbs';
import { SidebarToggleButton } from './SidebarToggleButton';

export async function TopBar() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [unread, notifications] = user
    ? await Promise.all([getUnreadCount(user.id), listRecentNotifications(user.id)])
    : [0, []];

  return (
    <header className="flex h-14 items-center border-b bg-background px-4 gap-3">
      <SidebarToggleButton />
      <div className="h-5 w-px bg-border" />
      <Breadcrumbs />
      <div className="ml-auto" />
      {user && (
        <NotificationBell
          userId={user.id}
          initialUnread={unread}
          initialNotifications={notifications}
        />
      )}
    </header>
  );
}
