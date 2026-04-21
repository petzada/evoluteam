'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Home, Users, ClipboardList, MessageSquare, TrendingUp,
  Building2, Layers, Briefcase, Star, ScrollText,
  UserPlus, KanbanSquare, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '../SidebarContext';
import { hasAdminPower } from '@/features/permissions/permissions';
import type { RhPermissions } from '@/features/permissions/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  adminOnly?: boolean;
  permission?: 'can_employees' | 'can_audit' | 'can_recruitment';
}

const MAIN_NAV: NavItem[] = [
  { label: 'Colaboradores', href: '/colaboradores', icon: Users },
  { label: 'Avaliações', href: '/avaliacoes', icon: ClipboardList },
  { label: 'Feedbacks', href: '/feedbacks', icon: MessageSquare },
  { label: 'PDI', href: '/pdi', icon: TrendingUp },
];

const RECRUITMENT_NAV: NavItem[] = [
  { label: 'Relatórios', href: '/recrutamento/relatorios', icon: BarChart3 },
  { label: 'Candidatos', href: '/recrutamento/candidatos', icon: UserPlus },
  { label: 'Vagas', href: '/recrutamento/vagas', icon: Briefcase },
  { label: 'Etapas', href: '/recrutamento/etapas', icon: KanbanSquare, permission: 'can_recruitment' },
];

const CONFIG_NAV: NavItem[] = [
  { label: 'Empresa', href: '/configuracoes/empresa', icon: Building2 },
  { label: 'Departamentos', href: '/configuracoes/departamentos', icon: Layers, permission: 'can_employees' },
  { label: 'Cargos', href: '/configuracoes/cargos', icon: Briefcase, permission: 'can_employees' },
  { label: 'Competências', href: '/configuracoes/competencias', icon: Star, permission: 'can_employees' },
  { label: 'Auditoria', href: '/configuracoes/auditoria', icon: ScrollText, permission: 'can_audit' },
];

interface SidebarProps {
  role: string;
  rhPermissions?: RhPermissions | null;
  isOperationalOnly: boolean;
  footer?: React.ReactNode;
}

export function Sidebar({ role, rhPermissions, isOperationalOnly, footer }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const isAdmin = role === 'admin_rh';
  const actorForGate = { role, rhPermissions: rhPermissions ?? null };

  // Filtra item por capacidade administrativa: admin_rh ve tudo;
  // adminOnly fica admin-only; permission usa o toggle correspondente.
  const isItemVisible = (item: NavItem): boolean => {
    if (item.adminOnly) return isAdmin;
    if (item.permission) return hasAdminPower(actorForGate, item.permission);
    return true;
  };
  // Configuracoes aparece pra admin OU pra rh com qualquer toggle
  // que destrave algum item dentro de Configuracoes (employees ou audit).
  const showConfigSection =
    isAdmin
    || hasAdminPower(actorForGate, 'can_employees')
    || hasAdminPower(actorForGate, 'can_audit');

  const homeItem: NavItem = isOperationalOnly
    ? { label: 'Início', href: '/dashboard', icon: Home }
    : { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard };

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
        <ul className="space-y-0.5">{renderItem(homeItem)}</ul>

        <div>
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
              Acompanhamento
            </p>
          )}
          <ul className="space-y-0.5">{MAIN_NAV.map(renderItem)}</ul>
        </div>

        {!isOperationalOnly && (
          <div>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                Recrutamento
              </p>
            )}
            <ul className="space-y-0.5">
              {RECRUITMENT_NAV.filter(isItemVisible).map(renderItem)}
            </ul>
          </div>
        )}

        {showConfigSection && (
          <div>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                Configurações
              </p>
            )}
            <ul className="space-y-0.5">{CONFIG_NAV.filter(isItemVisible).map(renderItem)}</ul>
          </div>
        )}
      </nav>
      {footer}
    </aside>
  );
}
