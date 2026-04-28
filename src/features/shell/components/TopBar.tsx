import { getUnreadCount, listRecentNotifications } from '@/features/notifications/queries';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { Breadcrumbs } from './Breadcrumbs';
import { SidebarToggleButton } from './SidebarToggleButton';

interface TopBarProps {
  userId: string;
}

// userId vem por prop do (app)/layout — evita um auth.getUser() duplicado
// por request (o layout ja resolveu via getActorContext).
export async function TopBar({ userId }: TopBarProps) {
  const [unread, notifications] = await Promise.all([
    getUnreadCount(userId),
    listRecentNotifications(userId),
  ]);

  return (
    <header className="flex h-14 items-center border-b bg-background px-4 gap-3">
      <SidebarToggleButton />
      <div className="h-5 w-px bg-border" />
      <Breadcrumbs />
      <div className="ml-auto" />
      <NotificationBell
        userId={userId}
        initialUnread={unread}
        initialNotifications={notifications}
      />
    </header>
  );
}
