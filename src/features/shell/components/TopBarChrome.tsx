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
      className="flex min-h-[4.75rem] shrink-0 flex-col justify-center gap-1.5 border-b border-border/60 bg-muted/40 px-4 py-2.5 backdrop-blur-sm dark:bg-card/90"
    >
      {hasCrumbs ? (
        <div className="flex min-h-[1.125rem] min-w-0 items-center">
          <Breadcrumbs variant="topBar" />
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="min-w-0 flex-1 text-xl font-semibold tracking-tight text-foreground">
          {resolvedTitle}
        </h1>
        <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
          {actions}
          <NotificationBell
            userId={userId}
            initialUnread={initialUnread}
            initialNotifications={initialNotifications}
          />
        </div>
      </div>
    </header>
  );
}
