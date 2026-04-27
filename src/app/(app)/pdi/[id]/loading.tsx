import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingPdiDetail() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-28" />

      <div className="space-y-4 border-b pb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-64 max-w-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-[36rem] max-w-full" />
            <div className="flex flex-wrap gap-2 pt-1">
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="h-6 w-28 rounded-md" />
              <Skeleton className="h-6 w-36 rounded-md" />
            </div>
          </div>

          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section className="rounded-md border bg-card p-4">
            <Skeleton className="h-5 w-36" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-4 w-64 max-w-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                  <Skeleton className="mt-2 h-3 w-32" />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border bg-card p-4">
            <Skeleton className="h-5 w-32" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-md border p-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-10/12" />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-md border bg-card p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-3 w-12" />
            <Skeleton className="mt-2 h-2 w-full rounded-full" />
            <Skeleton className="mt-2 h-3 w-32" />
          </section>

          <section className="rounded-md border bg-card p-4 space-y-3">
            <Skeleton className="h-3 w-16" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}
