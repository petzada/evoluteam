import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

function Wordmark({ tone }: { tone: 'light' | 'dark' }) {
  return (
    <span className="font-serif-landing text-2xl font-medium tracking-tight md:text-3xl">
      <span className={tone === 'light' ? 'text-white' : 'text-slate-950'}>evolu</span>
      <span className="text-[#F09469]">team</span>
    </span>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <aside className="relative hidden min-h-svh overflow-hidden md:flex md:flex-[3]">
        <Image
          src="/auth/login.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 75vw, 0px"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-slate-900/40 to-transparent" />
        <div className="absolute bottom-8 left-8">
          <Wordmark tone="light" />
        </div>
      </aside>

      <main className="flex min-h-svh flex-1 flex-col bg-background px-6 py-10 md:flex-[1] md:px-12">
        <header className="mb-12">
          <Wordmark tone="dark" />
        </header>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">{children}</div>

        <footer className="mt-auto flex flex-col gap-2 pt-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between md:flex-col md:items-start lg:flex-row lg:items-center">
          <span>© {year} Evoluteam</span>
          <Link href="/" className="transition hover:text-[#181d26]">
            Voltar ao site
          </Link>
        </footer>
      </main>
    </div>
  );
}
