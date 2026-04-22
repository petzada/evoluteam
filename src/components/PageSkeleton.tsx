export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-7 w-56 rounded-md bg-muted" />
        <div className="mt-2 h-4 w-80 rounded-md bg-muted/70" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-12 w-full rounded-md bg-muted/60" />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div>
        <div className="h-7 w-40 rounded-md bg-muted" />
        <div className="mt-2 h-4 w-72 rounded-md bg-muted/70" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg border bg-muted/40" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-72 rounded-lg border bg-muted/40" />
        <div className="h-72 rounded-lg border bg-muted/40" />
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-muted" />
        <div className="space-y-2">
          <div className="h-6 w-48 rounded-md bg-muted" />
          <div className="h-4 w-64 rounded-md bg-muted/70" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="h-24 rounded-lg border bg-muted/40" />
        <div className="h-24 rounded-lg border bg-muted/40" />
        <div className="h-24 rounded-lg border bg-muted/40" />
      </div>
      <div className="h-64 rounded-lg border bg-muted/30" />
    </div>
  );
}
