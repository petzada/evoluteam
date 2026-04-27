import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingCycles() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <section className="space-y-3">
        <Skeleton className="h-3 w-40" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-md border border-primary/25 bg-card p-4">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-2 h-5 w-48 max-w-full" />
              <Skeleton className="mt-2 h-3 w-40" />
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-9 w-44" />
      </div>

      <div className="flex items-center justify-between rounded-md border bg-card px-4 py-3">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-36" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-md border bg-card p-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-56 max-w-full" />
              <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <Skeleton className="h-8 w-24" />
            <div className="space-y-1 text-right">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
