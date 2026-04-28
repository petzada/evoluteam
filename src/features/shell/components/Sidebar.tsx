'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Home, Users, ClipboardList, MessageSquare, TrendingUp,
  Building2, Layers, Briefcase, Star, ScrollText,
  UserPlus, KanbanSquare, BarChart3,
} from 'lucide-react';
import { BrandMonogram, BrandWordmark } from '@/components/brand/BrandWordmark';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useSidebar } from '../SidebarContext';
import { canDo } from '@/features/permissions/permissions';
import type { ScreenKey, ScreenPermissions } from '@/features/permissions/types';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  disabled?: boolean;
  adminOnly?: boolean;
  // FT-9: cada item da sidebar mapeia para uma tela. Se omitido, visivel
  // por baseline (dashboard + MAIN_NAV sao vistos por todos autenticados).
  screen?: ScreenKey;
}

const MAIN_NAV: NavItem[] = [
  { label: 'Colaboradores', href: '/colaboradores', icon: Users },
  { label: 'Avaliações', href: '/avaliacoes', icon: ClipboardList },
  { label: 'Feedbacks', href: '/feedbacks', icon: MessageSquare },
  { label: 'PDI', href: '/pdi', icon: TrendingUp },
];

const RECRUITMENT_NAV: NavItem[] = [
  { label: 'Relatórios', href: '/recrutamento/relatorios', icon: BarChart3, screen: 'recrutamento_relatorios' },
  { label: 'Candidatos', href: '/recrutamento/candidatos', icon: UserPlus, screen: 'recrutamento_candidatos' },
  { label: 'Vagas', href: '/recrutamento/vagas', icon: Briefcase, screen: 'recrutamento_vagas' },
  { label: 'Etapas', href: '/recrutamento/etapas', icon: KanbanSquare, screen: 'recrutamento_etapas' },
];

const CONFIG_NAV: NavItem[] = [
  { label: 'Empresa',       href: '/configuracoes/empresa',       icon: Building2,  screen: 'empresa' },
  { label: 'Departamentos', href: '/configuracoes/departamentos', icon: Layers,     screen: 'departamentos' },
  { label: 'Cargos',        href: '/configuracoes/cargos',        icon: Briefcase,  screen: 'cargos' },
  { label: 'Competências',  href: '/configuracoes/competencias',  icon: Star,       screen: 'competencias' },
  { label: 'Auditoria',     href: '/configuracoes/auditoria',     icon: ScrollText, screen: 'auditoria' },
];

interface SidebarProps {
  role: string;
  screenPermissions?: ScreenPermissions | null;
  isOperationalOnly: boolean;
  isHiringManager?: boolean;
  footer?: React.ReactNode;
}

export function Sidebar({
  role, screenPermissions, isOperationalOnly, isHiringManager = false, footer,
}: SidebarProps) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const isAdmin = role === 'admin_rh';
  const actorForGate = {
    role,
    screenPermissions: screenPermissions ?? null,
  };

  // FT-9: item da sidebar aparece se canDo(tela, 'view') OR e baseline.
  // Baseline (sem screen definido): MAIN_NAV (colaboradores, avaliacoes, feedbacks,
  // pdi) sempre aparece — conteudo baseline/proprio e visivel.
  // Recrutamento (exceto Etapas): libera quando o user e hiring_manager de
  // alguma vaga aberta, alem do caminho normal por toggle.
  const isItemVisible = (item: NavItem): boolean => {
    if (item.adminOnly) return isAdmin;
    if (item.screen === 'recrutamento_etapas') {
      return canDo(actorForGate, item.screen, 'view');
    }
    if (item.screen && item.screen.startsWith('recrutamento_')) {
      return canDo(actorForGate, item.screen, 'view') || isHiringManager;
    }
    if (item.screen) return canDo(actorForGate, item.screen, 'view');
    return true; // baseline
  };

  const visibleRecruitmentItems = RECRUITMENT_NAV.filter(isItemVisible);
  const visibleConfigItems = CONFIG_NAV.filter(isItemVisible);
  const showRecruitmentSection = visibleRecruitmentItems.length > 0;
  const showConfigSection = visibleConfigItems.length > 0;

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
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
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
          <BrandMonogram tone="light" size="sm" />
        ) : (
          <BrandWordmark tone="light" size="sm" />
        )}
      </div>

      <nav className={cn('flex-1 overflow-y-auto scrollbar-none py-4 space-y-6', collapsed ? 'px-2' : 'px-3')}>
        <ul className="space-y-0.5">{renderItem(homeItem)}</ul>

        <div>
          {!collapsed && (
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
              Acompanhamento
            </p>
          )}
          <ul className="space-y-0.5">{MAIN_NAV.map(renderItem)}</ul>
        </div>

        {showRecruitmentSection && (
          <div>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                Recrutamento
              </p>
            )}
            <ul className="space-y-0.5">{visibleRecruitmentItems.map(renderItem)}</ul>
          </div>
        )}

        {showConfigSection && (
          <div>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                Configurações
              </p>
            )}
            <ul className="space-y-0.5">{visibleConfigItems.map(renderItem)}</ul>
          </div>
        )}
      </nav>
      {footer}
    </aside>
  );
}
