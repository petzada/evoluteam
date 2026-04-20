import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUnreadCount } from '@/features/notifications/queries';

interface TopBarProps {
  title?: string;
}

export async function TopBar({ title }: TopBarProps) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const unread = user ? await getUnreadCount(user.id) : 0;

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <h1 className="text-base font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </div>
    </header>
  );
}
