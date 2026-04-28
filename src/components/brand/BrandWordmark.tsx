import { cn } from '@/lib/utils';

type BrandTone = 'light' | 'dark';
type BrandSize = 'sm' | 'md' | 'lg';

const wordmarkSizes: Record<BrandSize, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-2xl md:text-3xl',
};

const monogramSizes: Record<BrandSize, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
};

interface BrandWordmarkProps {
  tone?: BrandTone;
  size?: BrandSize;
  className?: string;
}

export function BrandWordmark({ tone = 'dark', size = 'md', className }: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        'font-serif-landing font-bold tracking-tighter',
        wordmarkSizes[size],
        className,
      )}
    >
      <span className={tone === 'light' ? 'text-white' : 'text-brand-ink'}>evolu</span>
      <span className="text-brand-coral">team</span>
    </span>
  );
}

export function BrandMonogram({ tone = 'dark', size = 'sm', className }: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        'font-serif-landing font-bold tracking-tighter',
        monogramSizes[size],
        className,
      )}
    >
      <span className={tone === 'light' ? 'text-white' : 'text-brand-ink'}>e</span>
      <span className="text-brand-coral">t</span>
    </span>
  );
}
