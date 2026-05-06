'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LifeBuoy } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '@/features/shell/SidebarContext';
import { cn } from '@/lib/utils';

export function HelpBanner() {
  const { collapsed } = useSidebar();
  const pathname = usePathname();
  const active = pathname === '/ajuda' || pathname.startsWith('/ajuda/');

  if (collapsed) {
    const link = (
      <Link
        href="/ajuda"
        aria-label="Ajuda"
        className={cn(
          'flex h-9 w-9 mx-auto items-center justify-center rounded-md transition-colors',
          active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
        )}
      >
        <LifeBuoy className="h-4 w-4" />
      </Link>
    );

    return (
      <Tooltip>
        <TooltipTrigger render={link} />
        <TooltipContent side="right">Ajuda</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link
      href="/ajuda"
      className={cn(
        'flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors',
        active
          ? 'border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground'
          : 'border-sidebar-border/60 bg-sidebar-accent/40 text-sidebar-foreground hover:bg-sidebar-accent',
      )}
    >
      <LifeBuoy className="h-5 w-5 shrink-0" />
      <div className="min-w-0 flex flex-col">
        <span className="text-sm font-medium leading-tight truncate">
          Precisa de ajuda?
        </span>
        <span className="text-[11px] leading-tight text-sidebar-foreground/60 truncate">
          Tutoriais em vídeo
        </span>
      </div>
    </Link>
  );
}
