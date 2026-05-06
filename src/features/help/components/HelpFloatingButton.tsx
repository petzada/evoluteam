'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export function HelpFloatingButton() {
  const pathname = usePathname();
  const active = pathname === '/ajuda' || pathname.startsWith('/ajuda/');

  const link = (
    <Link
      href="/ajuda"
      aria-label="Ajuda"
      className={cn(
        'fixed bottom-5 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full border text-lg font-semibold shadow-lg transition-all focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:bottom-6 sm:right-6',
        active
          ? 'border-primary bg-foreground text-background shadow-xl'
          : 'border-primary/20 bg-primary text-primary-foreground hover:-translate-y-0.5 hover:bg-primary/90',
      )}
    >
      ?
    </Link>
  );

  return (
    <Tooltip>
      <TooltipTrigger render={link} />
      <TooltipContent side="left">Ajuda</TooltipContent>
    </Tooltip>
  );
}
