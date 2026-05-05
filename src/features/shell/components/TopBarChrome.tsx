'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';
import { Breadcrumbs } from './Breadcrumbs';
import { useAppTopBar } from '../AppTopBarContext';
import { useBreadcrumbLabels } from '../BreadcrumbContext';
import { buildPathCrumbs, fallbackTitleFromPath } from '../breadcrumbSegments';

type Notification = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link_url: string | null;
  read_at: string | null;
  created_at: string;
};

export function TopBarChrome({
  userId,
  initialUnread,
  initialNotifications,
}: {
  userId: string;
  initialUnread: number;
  initialNotifications: Notification[];
}) {
  const pathname = usePathname();
  const { title, actions } = useAppTopBar();
  const dynamicLabels = useBreadcrumbLabels();
  const resolvedTitle = title ?? fallbackTitleFromPath(pathname, dynamicLabels) ?? '';
  const hasCrumbs = useMemo(
    () => buildPathCrumbs(pathname, dynamicLabels).length > 0,
    [pathname, dynamicLabels],
  );

  return (
    <header
      className="flex h-14 shrink-0 items-center gap-2 overflow-x-auto border-b border-border/60 bg-background/95 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-background/90 scrollbar-none"
    >
      <div className="flex min-w-0 flex-1 items-center gap-x-3">
        <h1 className="shrink-0 text-xl font-semibold tracking-tight text-foreground">
          {resolvedTitle}
        </h1>
        {hasCrumbs ? (
          <>
            <div className="hidden h-5 w-px shrink-0 bg-border/60 sm:block" aria-hidden />
            <Breadcrumbs variant="topBar" className="min-w-0" />
          </>
        ) : null}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {actions}
        <NotificationBell
          userId={userId}
          initialUnread={initialUnread}
          initialNotifications={initialNotifications}
        />
      </div>
    </header>
  );
}
