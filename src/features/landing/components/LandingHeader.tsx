'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { navMenus } from '../content';
import { MobileMenu } from './MobileMenu';

function NavDropdown({
  label,
  items,
}: {
  label: string;
  items: { href: string; label: string }[];
}) {
  return (
    <HoverCard>
      <HoverCardTrigger className="inline-flex items-center gap-1 rounded text-sm font-medium text-white/70 outline-none transition-colors hover:text-white focus-visible:text-white">
        {label}
        <ChevronDown className="size-3.5" aria-hidden />
      </HoverCardTrigger>
      <HoverCardContent
        side="bottom"
        align="center"
        sideOffset={12}
        className="min-w-44 border border-white/10 bg-[#0a0a0a]/95 p-1.5 text-white/80 ring-1 ring-white/5 backdrop-blur-md"
      >
        <ul className="grid">
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="block rounded px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 md:px-12">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-white">Evolu</span>
          <span className="text-[#F09469]">team</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navMenus.map((menu) => (
            <NavDropdown key={menu.label} {...menu} />
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/login"
            className="text-sm font-medium text-white/70 transition hover:text-white"
          >
            Entrar
          </Link>
          <a
            href="#demo"
            className="inline-flex h-10 items-center justify-center rounded bg-white px-4 text-sm font-medium text-[#0a0a0a] transition hover:bg-neutral-200 active:scale-[0.99]"
          >
            Agendar demo
          </a>
        </div>
        <MobileMenu />
      </div>
    </header>
  );
}
