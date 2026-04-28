import Link from 'next/link';
import { navItems } from '../content';
import { MobileMenu } from './MobileMenu';

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-outline-variant bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 md:px-12">
        <Link href="/" className="font-serif-landing text-2xl font-bold tracking-tighter text-slate-950">
          evoluteam
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="text-sm font-medium text-slate-500 transition hover:text-slate-950">
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/login" className="text-sm font-medium text-slate-500 transition hover:text-slate-950">
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
