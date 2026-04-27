import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingCandidates() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-48" />
      </div>

      <div className="rounded-md border bg-card shadow-card">
        <div className="border-b px-4 py-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>

        <div className="space-y-2 px-4 py-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="grid grid-cols-2 items-center gap-3 py-2 md:grid-cols-5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-16 justify-self-end" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
