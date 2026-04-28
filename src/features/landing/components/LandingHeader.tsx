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
      <HoverCardTrigger className="inline-flex items-center gap-1 rounded text-sm font-medium text-slate-500 outline-none transition-colors hover:text-slate-950 focus-visible:text-slate-950">
        {label}
        <ChevronDown className="size-3.5" aria-hidden />
      </HoverCardTrigger>
      <HoverCardContent
        side="bottom"
        align="center"
        sideOffset={12}
        className="min-w-44 border border-outline-variant bg-white p-1.5 text-slate-950 ring-0 shadow-md"
      >
        <ul className="grid">
          {items.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="block rounded px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
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
    <header className="sticky top-0 z-40 border-b border-outline-variant bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 md:px-12">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-slate-950">Evolu</span>
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
            className="text-sm font-medium text-slate-500 transition hover:text-slate-950"
          >
            Entrar
          </Link>
          <a
            href="#demo"
            className="inline-flex h-10 items-center justify-center rounded bg-[#0a0a0a] px-4 text-sm font-medium text-white transition hover:bg-neutral-800 active:scale-[0.99]"
          >
            Agendar demo
          </a>
        </div>
        <MobileMenu />
      </div>
    </header>
  );
}
