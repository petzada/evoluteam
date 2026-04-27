import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingAuditSettings() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="rounded-md border bg-card shadow-card">
        <div className="border-b px-4 py-3">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>

        <div className="space-y-2 px-4 py-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-3 items-center gap-3 py-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-52 max-w-full" />
                <Skeleton className="h-3 w-72 max-w-full" />
              </div>
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-40 justify-self-end" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
}
