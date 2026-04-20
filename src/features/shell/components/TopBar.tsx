import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUnreadCount, listRecentNotifications } from '@/features/notifications/queries';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';

interface TopBarProps {
  title?: string;
}

export async function TopBar({ title }: TopBarProps) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [unread, notifications] = user
    ? await Promise.all([getUnreadCount(user.id), listRecentNotifications(user.id)])
    : [0, []];

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      {title ? <h1 className="text-base font-semibold text-foreground">{title}</h1> : <div />}
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
