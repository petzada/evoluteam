'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HelpTopic } from '../types';

interface HelpTopicListProps {
  topics: HelpTopic[];
}

function formatDuration(seconds: number | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getActiveSlug(pathname: string | null): string | null {
  if (!pathname || !pathname.startsWith('/ajuda/')) return null;
  const rest = pathname.slice('/ajuda/'.length);
  const slash = rest.indexOf('/');
  return slash === -1 ? rest : rest.slice(0, slash);
}

export function HelpTopicList({ topics }: HelpTopicListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const activeSlug = getActiveSlug(pathname);

  if (topics.length === 0) {
    return (
      <nav aria-label="Tópicos de ajuda" className="rounded-md border bg-card">
        <div className="px-3 py-4 text-sm text-muted-foreground">
          Nenhum tutorial disponível.
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* md+ : lista vertical */}
      <nav
        aria-label="Tópicos de ajuda"
        className="hidden rounded-md border bg-card md:block"
      >
        <ul className="divide-y">
          {topics.map((topic) => {
            const active = topic.slug === activeSlug;
            const dur = formatDuration(topic.duration);
            return (
              <li key={topic.slug}>
                <Link
                  href={`/ajuda/${topic.slug}`}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-start gap-2 px-3 py-2.5 text-sm transition-colors',
                    active ? 'bg-accent' : 'hover:bg-accent/60',
                  )}
                >
                  <PlayCircle
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      active ? 'text-primary' : 'text-muted-foreground',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block truncate',
                        active ? 'font-semibold text-foreground' : 'font-medium',
                      )}
                    >
                      {topic.title}
                    </span>
                    <span className="block text-xs text-muted-foreground line-clamp-2">
                      {topic.description}
                    </span>
                    {dur && (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground/70">
                        {dur}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* < md : <select> */}
      <div className="md:hidden">
        <label htmlFor="help-topic-select" className="sr-only">
          Selecionar tutorial
        </label>
        <select
          id="help-topic-select"
          value={activeSlug ?? ''}
          onChange={(e) => router.push(`/ajuda/${e.target.value}`)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          {!activeSlug && <option value="">Selecione um tópico…</option>}
          {topics.map((topic) => (
            <option key={topic.slug} value={topic.slug}>
              {topic.title}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
