'use client';

import { PanelLeft } from 'lucide-react';
import { useSidebar } from '../SidebarContext';

export function SidebarToggleButton() {
  const { collapsed, toggle } = useSidebar();

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors outline-none"
      aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
    >
      <PanelLeft className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
