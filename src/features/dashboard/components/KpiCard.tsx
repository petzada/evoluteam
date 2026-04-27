import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'success' | 'warning' | 'danger';

interface KpiCardProps {
  label: string;
  icon: LucideIcon;
  value: string | number;
  hint?: string;
  href?: string;
  tone?: Tone;
}

const TONE_CLASS: Record<Tone, { icon: string; value: string }> = {
  default: { icon: 'text-muted-foreground bg-muted', value: 'text-foreground' },
  success: { icon: 'text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/50', value: 'text-foreground' },
  warning: { icon: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/50', value: 'text-foreground' },
  danger: { icon: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950/50', value: 'text-foreground' },
};

export function KpiCard({ label, icon: Icon, value, hint, href, tone = 'default' }: KpiCardProps) {
  const content = (
    <Card className={cn('transition-colors', href && 'hover:border-primary/60 cursor-pointer')}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className={cn('inline-flex h-8 w-8 items-center justify-center rounded-lg', TONE_CLASS[tone].icon)}>
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className={cn('text-2xl font-bold', TONE_CLASS[tone].value)}>{value}</p>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : (
          <p aria-hidden className="mt-1 text-xs select-none">&nbsp;</p>
        )}
      </CardContent>
    </Card>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
      {content}
    </Link>
  );
}
