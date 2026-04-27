import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingEmployeeProfile() {
  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-1.5 w-1.5 rounded-full" />
        <Skeleton className="h-4 w-44" />
      </nav>

      <div className="flex items-start gap-4 border-b pb-6">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-7 w-64 max-w-full" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-md border">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-center">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
            ))}
          </div>

          <div className="rounded-md border p-4">
            <Skeleton className="h-3 w-56" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-11/12" />
            <Skeleton className="mt-2 h-4 w-8/12" />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-md border p-4 space-y-3">
            <Skeleton className="h-3 w-40" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-md border p-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
            ))}
          </div>

          <div className="rounded-md border p-4 space-y-3">
            <Skeleton className="h-3 w-28" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
