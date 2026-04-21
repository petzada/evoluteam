'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Users, ClipboardList, MessageSquare, TrendingUp,
  Settings, Building2, Layers, Briefcase, Star, ScrollText,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '../SidebarContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
}

const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Colaboradores', href: '/colaboradores', icon: Users },
  { label: 'Avaliações', href: '/avaliacoes', icon: ClipboardList },
  { label: 'Feedbacks', href: '/feedbacks', icon: MessageSquare },
  { label: 'PDI', href: '/pdi', icon: TrendingUp },
];

const CONFIG_NAV: NavItem[] = [
  { label: 'Empresa', href: '/configuracoes/empresa', icon: Building2 },
  { label: 'Departamentos', href: '/configuracoes/departamentos', icon: Layers },
  { label: 'Cargos', href: '/configuracoes/cargos', icon: Briefcase },
  { label: 'Competências', href: '/configuracoes/competencias', icon: Star },
  { label: 'Auditoria', href: '/configuracoes/auditoria', icon: ScrollText },
];

interface SidebarProps {
  role: string;
  footer?: React.ReactNode;
}

export function Sidebar({ role, footer }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const isAdmin = role === 'admin_rh';

  const isInConfig = pathname.startsWith('/configuracoes');
  const [manualOpen, setManualOpen] = useState(false);
  const configOpen = isInConfig || manualOpen;

  const renderItem = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;

    const baseClasses = cn(
      'flex items-center rounded-md text-sm transition-colors',
      collapsed ? 'h-9 w-9 mx-auto justify-center' : 'gap-3 px-3 py-2',
    );

    if (item.disabled) {
      const disabled = (
        <span className={cn(baseClasses, 'text-sidebar-foreground/30 cursor-not-allowed select-none')}>
          <Icon className="h-4 w-4 shrink-0" />
          {!collapsed && item.label}
        </span>
      );
      return (
        <li key={item.href}>
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger render={disabled} />
              <TooltipContent side="right">{item.label} (em breve)</TooltipContent>
            </Tooltip>
          ) : disabled}
        </li>
      );
    }

    const link = (
      <Link
        href={item.href}
        className={cn(
          baseClasses,
          isActive
            ? 'bg-sidebar-accent text-sidebar-primary font-medium'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && item.label}
      </Link>
    );

    return (
      <li key={item.href}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger render={link} />
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ) : link}
      </li>
    );
  };

  const renderConfigSubItem = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-md py-1.5 pl-9 pr-3 text-sm transition-colors',
            isActive
              ? 'bg-sidebar-accent text-sidebar-foreground font-medium'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
          )}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          {item.label}
        </Link>
      </li>
    );
  };

  const renderConfigCollapsed = () => {
    const firstHref = CONFIG_NAV[0]?.href ?? '/configuracoes';
    const isActive = isInConfig;
    const link = (
      <Link
        href={firstHref}
        className={cn(
          'flex h-9 w-9 mx-auto items-center justify-center rounded-md transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-primary'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
        )}
      >
        <Settings className="h-4 w-4" />
      </Link>
    );
    return (
      <li>
        <Tooltip>
          <TooltipTrigger render={link} />
          <TooltipContent side="right">Configurações</TooltipContent>
        </Tooltip>
      </li>
    );
  };

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col bg-sidebar transition-[width] duration-200 ease-out',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      <div className="flex h-14 items-center justify-center px-4 border-b border-sidebar-border">
        {collapsed ? (
          <span className="text-lg font-bold text-sidebar-primary">E</span>
        ) : (
          <span className="text-lg font-bold text-sidebar-primary tracking-tight">Evoluteam</span>
        )}
      </div>

      <nav className={cn('flex-1 overflow-y-auto py-4 space-y-6', collapsed ? 'px-2' : 'px-3')}>
        <div>
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
              Principal
            </p>
          )}
          <ul className="space-y-0.5">{MAIN_NAV.map(renderItem)}</ul>
        </div>

        {isAdmin && (
          <div>
            {collapsed ? (
              <ul className="space-y-0.5">{renderConfigCollapsed()}</ul>
            ) : (
              <ul className="space-y-0.5">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      if (isInConfig) return;
                      setManualOpen((v) => !v);
                    }}
                    aria-expanded={configOpen}
                    aria-controls="config-submenu"
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                      isInConfig
                        ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    )}
                  >
                    <Settings className="h-4 w-4 shrink-0" />
                    <span className="flex-1 text-left">Configurações</span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 transition-transform',
                        configOpen ? '' : '-rotate-90',
                      )}
                    />
                  </button>
                </li>
                {configOpen && (
                  <ul id="config-submenu" className="space-y-0.5 mt-0.5">
                    {CONFIG_NAV.map(renderConfigSubItem)}
                  </ul>
                )}
              </ul>
            )}
          </div>
        )}
      </nav>
      {footer}
    </aside>
  );
}
