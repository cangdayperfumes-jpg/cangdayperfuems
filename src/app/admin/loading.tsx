import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the dashboard: header, 8 stat cards, chart + recent orders, three bottom panels. */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm sm:p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-3 rounded-lg border bg-white p-4 shadow-sm lg:col-span-2">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-56 w-full sm:h-64" />
        </div>
        <div className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[5, 4, 6].map((rows, p) => (
          <div key={p} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
            <Skeleton className="h-4 w-36" />
            {Array.from({ length: rows }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
