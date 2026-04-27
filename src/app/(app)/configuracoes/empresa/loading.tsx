import { Skeleton } from '@/components/ui/skeleton';

export default function LoadingCompanySettings() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-5 max-w-lg">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  );
}
