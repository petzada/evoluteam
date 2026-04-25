'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navItems } from '../content';

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
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <Link
                href="/"
                className="font-[Georgia,serif] text-2xl font-semibold tracking-tight text-slate-950"
                onClick={() => setOpen(false)}
              >
                evoluteam
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
            <nav className="grid gap-1 py-6">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded px-2 py-3 text-lg font-medium text-slate-800 hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-auto grid gap-3 border-t border-slate-200 pt-5">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded border border-slate-300 text-sm font-medium text-slate-900"
                onClick={() => setOpen(false)}
              >
                Entrar
              </Link>
              <a
                href="#demo"
                className="inline-flex h-11 items-center justify-center rounded bg-slate-950 text-sm font-medium text-white"
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
