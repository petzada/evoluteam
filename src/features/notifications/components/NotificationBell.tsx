'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { markAllRead, markRead } from '../actions';
import { formatRelative } from '@/lib/date';

interface Notification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link_url: string | null;
  read_at: string | null;
  created_at: string;
}

interface Props {
  userId: string;
  initialUnread: number;
  initialNotifications: Notification[];
}

const POLL_INTERVAL_MS = 30_000;

export function NotificationBell({ userId, initialUnread, initialNotifications }: Props) {
  const [unread, setUnread] = useState(initialUnread);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const fetchState = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const [{ count }, { data }] = await Promise.all([
      supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('read_at', null),
      supabase
        .from('notifications')
        .select('id, type, title, body, link_url, read_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    setUnread(count ?? 0);
    setNotifications(data ?? []);
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(fetchState, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchState]);

  async function handleMarkAllRead() {
    await markAllRead();
    await fetchState();
  }

  async function handleClickNotification(id: number) {
    await markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
    );
    setUnread((u) => Math.max(0, u - 1));
  }

  return (
    <Popover>
      <PopoverTrigger
        className="relative inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors outline-none"
        aria-label="Notificações"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Notificações</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs text-primary hover:underline"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </p>
          ) : (
            <ul>
              {notifications.map((n) => {
                const inner = (
                  <>
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{formatRelative(n.created_at)}</p>
                  </>
                );
                const cls = `block w-full text-left border-b px-3 py-2.5 last:border-0 hover:bg-muted transition-colors ${!n.read_at ? 'bg-primary/5' : ''}`;
                return (
                  <li key={n.id}>
                    {n.link_url ? (
                      <Link href={n.link_url} onClick={() => handleClickNotification(n.id)} className={cls}>
                        {inner}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => handleClickNotification(n.id)} className={cls}>
                        {inner}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
