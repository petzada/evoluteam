'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useBreadcrumbLabels } from '../BreadcrumbContext';
import { buildPathCrumbs } from '../breadcrumbSegments';
import { cn } from '@/lib/utils';

type BreadcrumbsProps = {
  className?: string;
  /** Alinhado à TopBar: trilha mais discreta que o título. */
  variant?: 'default' | 'mutedTrail' | 'topBar';
};

export function Breadcrumbs({ className, variant = 'default' }: BreadcrumbsProps) {
  const pathname = usePathname();
  const labels = useBreadcrumbLabels();
  const crumbs = buildPathCrumbs(pathname, labels);

  if (crumbs.length === 0) return null;

  const isTopBar = variant === 'topBar';
  const isMutedTrail = variant === 'mutedTrail';

  const lastClass = isTopBar
    ? 'font-normal text-muted-foreground/80 truncate'
    : isMutedTrail
      ? 'font-medium text-muted-foreground truncate'
      : 'font-medium text-foreground truncate';
  const linkClass = isTopBar
    ? 'text-muted-foreground/60 hover:text-muted-foreground transition-colors truncate'
    : isMutedTrail
      ? 'text-muted-foreground/80 hover:text-foreground transition-colors truncate'
      : 'text-muted-foreground hover:text-foreground transition-colors truncate';

  const chevronClass = isTopBar
    ? 'h-3 w-3 text-muted-foreground/35 shrink-0'
    : 'h-3.5 w-3.5 text-muted-foreground/40 shrink-0';

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex items-center gap-1.5 min-w-0',
        isTopBar || isMutedTrail ? 'text-xs' : 'text-sm',
        className,
      )}
    >
      {crumbs.map((crumb, idx) => (
        <div key={crumb.href} className="flex items-center gap-1.5 min-w-0">
          {idx > 0 && (
            <ChevronRight className={chevronClass} aria-hidden />
          )}
          {crumb.isLast ? (
            <span className={lastClass}>{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className={linkClass}>
              {crumb.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
