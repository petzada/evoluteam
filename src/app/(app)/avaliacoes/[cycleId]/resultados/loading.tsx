import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingCycleResults() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40" />

      <div className="space-y-2 border-b pb-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-96 max-w-full" />
      </div>

      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="rounded-md border bg-card">
        <div className="border-b px-4 py-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>

        <div className="space-y-2 px-4 py-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="grid grid-cols-2 items-center gap-3 py-2 md:grid-cols-6">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-14 rounded-md" />
              <Skeleton className="h-6 w-20" />
              <div className="justify-self-end">
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
