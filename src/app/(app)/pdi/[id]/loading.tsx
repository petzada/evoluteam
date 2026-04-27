import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingPdiDetail() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-9/12" />
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <Skeleton className="h-5 w-44" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 rounded-md border p-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5 rounded-sm" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
