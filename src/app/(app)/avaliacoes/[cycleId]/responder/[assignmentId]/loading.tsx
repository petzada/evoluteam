import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingAssignmentResponder() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="sticky top-0 z-10 flex flex-wrap gap-2 rounded-md border bg-card/95 p-3 backdrop-blur">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28" />
        ))}
      </div>

      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-lg border bg-card p-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {Array.from({ length: 4 }).map((__, j) => (
                <Skeleton key={j} className="h-10 w-full" />
              ))}
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
