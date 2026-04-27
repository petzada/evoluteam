import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingEmployees() {
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
        <Skeleton className="h-9 w-72 max-w-full" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="flex items-center justify-between rounded-md border bg-card px-4 py-3">
        <Skeleton className="h-4 w-80 max-w-[70%]" />
        <Skeleton className="h-4 w-28" />
      </div>

      <div className="rounded-md border bg-card shadow-card">
        <div className="border-b px-4 py-3">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>

        <div className="space-y-2 px-4 py-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-2 gap-3 py-2 md:grid-cols-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 justify-self-end rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
