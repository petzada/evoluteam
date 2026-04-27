import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingConfiguracoesFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-44" />
      <div className="space-y-3 rounded-lg border bg-card p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
