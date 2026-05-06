// Mapa de tags MDX → estilo do projeto. Allow-list explícita: tags HTML
// padrão usadas pelos tutoriais + componente <Callout> custom.
//
// Sem syntax highlighting — tutoriais de UI raramente têm bloco grande
// de código.

import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CalloutKind = 'info' | 'warning' | 'tip';

const CALLOUT_STYLES: Record<CalloutKind, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100',
  warning:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
  tip:
    'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100',
};

function Callout({
  kind = 'info',
  children,
}: {
  kind?: CalloutKind;
  children: ReactNode;
}) {
  return (
    <aside
      className={cn(
        'my-4 rounded-md border-l-4 px-4 py-3 text-sm',
        CALLOUT_STYLES[kind],
      )}
    >
      {children}
    </aside>
  );
}

function MdxLink({ href, children, ...rest }: ComponentProps<'a'>) {
  if (href && href.startsWith('/')) {
    return (
      <Link href={href} className="font-medium text-primary underline-offset-4 hover:underline">
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-primary underline-offset-4 hover:underline"
      {...rest}
    >
      {children}
    </a>
  );
}

export const helpMdxComponents = {
  h2: (props: ComponentProps<'h2'>) => (
    <h2 className="mt-6 text-lg font-semibold tracking-tight" {...props} />
  ),
  h3: (props: ComponentProps<'h3'>) => (
    <h3 className="mt-4 text-base font-semibold" {...props} />
  ),
  p: (props: ComponentProps<'p'>) => (
    <p className="my-2 text-sm leading-relaxed text-foreground" {...props} />
  ),
  ul: (props: ComponentProps<'ul'>) => (
    <ul className="my-2 ml-5 list-disc space-y-1 text-sm" {...props} />
  ),
  ol: (props: ComponentProps<'ol'>) => (
    <ol className="my-2 ml-5 list-decimal space-y-1 text-sm" {...props} />
  ),
  li: (props: ComponentProps<'li'>) => <li className="leading-relaxed" {...props} />,
  a: MdxLink,
  code: (props: ComponentProps<'code'>) => (
    <code
      className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
      {...props}
    />
  ),
  pre: (props: ComponentProps<'pre'>) => (
    <pre
      className="my-3 overflow-x-auto rounded-md border bg-muted p-3 text-xs"
      {...props}
    />
  ),
  Callout,
};
