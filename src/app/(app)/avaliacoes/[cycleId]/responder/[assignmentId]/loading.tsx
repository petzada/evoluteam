import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingAssignmentResponder() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-36" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-md border bg-card p-4">
            <div className="mb-3 flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>

          <div className="rounded-md border bg-card p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>

          <div className="rounded-md border bg-card p-4 space-y-2">
            <Skeleton className="h-3 w-28" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-md border p-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-3 w-full" />
              </div>
            ))}
          </div>

          <div className="rounded-md border border-amber-200 bg-card p-3">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        </aside>

        <main className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-80 max-w-full" />
              <Skeleton className="h-4 w-[34rem] max-w-full" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>

          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Skeleton className="h-4 w-6" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-5 w-11/12" />
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <Skeleton key={j} className="h-10 w-full" />
                  ))}
                </div>
                <Skeleton className="mt-3 h-3 w-full" />
              </div>
            ))}
          </div>

          <div className="sticky bottom-4 flex items-center justify-between gap-3 rounded-md border bg-background p-3 shadow-sm">
            <Skeleton className="h-4 w-56" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
