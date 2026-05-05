import { getUnreadCount, listRecentNotifications } from '@/features/notifications/queries';
import { TopBarChrome } from './TopBarChrome';

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
    <TopBarChrome
      userId={userId}
      initialUnread={unread}
      initialNotifications={notifications}
    />
  );
}
