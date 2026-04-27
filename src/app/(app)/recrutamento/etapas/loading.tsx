import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingRecruitmentStages() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="rounded-md border bg-card px-4 py-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-10/12" />
      </div>

      <div className="rounded-md border bg-card">
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="ml-auto h-8 w-20" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <div className="rounded-md border bg-card p-3 space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md border p-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="ml-auto h-8 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
