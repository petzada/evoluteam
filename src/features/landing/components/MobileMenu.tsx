'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navMenus } from '../content';

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Abrir menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="text-white hover:bg-white/10 hover:text-white"
      >
        <Menu className="size-5" />
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a]">
          <div className="mx-auto flex h-full max-w-xl flex-col px-6 py-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <Link
                href="/"
                className="text-xl font-bold tracking-tight"
                onClick={() => setOpen(false)}
              >
                <span className="text-white">Evolu</span>
                <span className="text-[#F09469]">team</span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" />
              </Button>
            </div>
            <nav className="grid gap-6 py-6">
              {navMenus.map((menu) => (
                <div key={menu.label}>
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
                    {menu.label}
                  </p>
                  <ul className="mt-2 grid gap-1">
                    {menu.items.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          className="block rounded px-2 py-2 text-base font-medium text-white/80 hover:bg-white/10 hover:text-white"
                          onClick={() => setOpen(false)}
                        >
                          {item.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
            <div className="mt-auto grid gap-3 border-t border-white/10 pt-5">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded border border-white/20 text-sm font-medium text-white"
                onClick={() => setOpen(false)}
              >
                Entrar
              </Link>
              <a
                href="#demo"
                className="inline-flex h-11 items-center justify-center rounded bg-white text-sm font-medium text-[#0a0a0a]"
                onClick={() => setOpen(false)}
              >
                Agendar demo
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
