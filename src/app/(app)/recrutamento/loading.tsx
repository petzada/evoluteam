import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingRecrutamentoFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-44" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-4 w-36" />
            <Skeleton className="mt-4 h-24 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
