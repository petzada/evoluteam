'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, ClipboardList, MessageSquare, TrendingUp,
  Building2, Layers, Briefcase, Star, ScrollText, UserCircle, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  adminOnly?: boolean;
}

const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Colaboradores', href: '/colaboradores', icon: Users },
  { label: 'Avaliações', href: '/avaliacoes', icon: ClipboardList, disabled: true },
  { label: 'Feedbacks', href: '/feedbacks', icon: MessageSquare, disabled: true },
  { label: 'PDI', href: '/pdi', icon: TrendingUp, disabled: true },
];

const CONFIG_NAV: NavItem[] = [
  { label: 'Empresa', href: '/configuracoes/empresa', icon: Building2, adminOnly: true },
  { label: 'Departamentos', href: '/configuracoes/departamentos', icon: Layers, adminOnly: true },
  { label: 'Cargos', href: '/configuracoes/cargos', icon: Briefcase, adminOnly: true },
  { label: 'Competências', href: '/configuracoes/competencias', icon: Star, adminOnly: true },
  { label: 'Auditoria', href: '/configuracoes/auditoria', icon: ScrollText, adminOnly: true },
  { label: 'Perfil', href: '/configuracoes/perfil', icon: UserCircle },
];

interface SidebarProps {
  role: string;
  footer?: React.ReactNode;
}

export function Sidebar({ role, footer }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = role === 'admin_rh';

  const renderItem = (item: NavItem) => {
    if (item.adminOnly && !isAdmin) return null;

    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    const Icon = item.icon;

    if (item.disabled) {
      return (
        <li key={item.href}>
          <span className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/30 cursor-not-allowed select-none">
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </span>
        </li>
      );
    }

    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
            isActive
              ? 'bg-sidebar-accent text-sidebar-primary font-medium'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {item.label}
          {isActive && <ChevronRight className="ml-auto h-3 w-3 opacity-50" />}
        </Link>
      </li>
    );
  };

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
        <span className="text-lg font-bold text-sidebar-primary tracking-tight">Evoluteam</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Principal */}
        <div>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
            Principal
          </p>
          <ul className="space-y-0.5">{MAIN_NAV.map(renderItem)}</ul>
        </div>

        {/* Configurações */}
        <div>
          <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
            Configurações
          </p>
          <ul className="space-y-0.5">{CONFIG_NAV.map(renderItem)}</ul>
        </div>
      </nav>
      {footer}
    </aside>
  );
}
