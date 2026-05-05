'use client';

import { PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '../SidebarContext';

export function SidebarToggleButton({ className }: { className?: string }) {
  const { collapsed, toggle } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors outline-none',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        className,
      )}
      aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
    >
      <PanelLeft className="h-4 w-4 text-sidebar-foreground/80" />
    </button>
  );
}
