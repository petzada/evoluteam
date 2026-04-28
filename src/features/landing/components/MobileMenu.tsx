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
      >
        <Menu className="size-5" />
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="mx-auto flex h-full max-w-xl flex-col px-6 py-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-4">
              <Link
                href="/"
                className="text-xl font-bold tracking-tight"
                onClick={() => setOpen(false)}
              >
                <span className="text-slate-950">Evolu</span>
                <span className="text-[#F09469]">team</span>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </Button>
            </div>
            <nav className="grid gap-6 py-6">
              {navMenus.map((menu) => (
                <div key={menu.label}>
                  <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {menu.label}
                  </p>
                  <ul className="mt-2 grid gap-1">
                    {menu.items.map((item) => (
                      <li key={item.href}>
                        <a
                          href={item.href}
                          className="block rounded px-2 py-2 text-base font-medium text-slate-800 hover:bg-slate-100"
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
            <div className="mt-auto grid gap-3 border-t border-outline-variant pt-5">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded border border-outline-variant text-sm font-medium text-slate-900"
                onClick={() => setOpen(false)}
              >
                Entrar
              </Link>
              <a
                href="#demo"
                className="inline-flex h-11 items-center justify-center rounded bg-[#0a0a0a] text-sm font-medium text-white"
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
