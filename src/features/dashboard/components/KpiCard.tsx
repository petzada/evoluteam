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

const TONE_CLASS: Record<Tone, string> = {
  default: 'text-foreground',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  danger: 'text-red-600 dark:text-red-400',
};

export function KpiCard({ label, icon: Icon, value, hint, href, tone = 'default' }: KpiCardProps) {
  const content = (
    <Card className={cn('transition-colors', href && 'hover:border-primary/60 cursor-pointer')}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className={cn('text-2xl font-bold', TONE_CLASS[tone])}>{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
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
