import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors the journal list: centered title, then image + text rows. */
export default function Loading() {
  return (
    <div className="container py-12 md:py-20 max-w-4xl mx-auto" aria-busy="true">
      <div className="mb-12 flex flex-col items-center gap-3">
        <Skeleton className="h-11 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="space-y-10">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col sm:flex-row gap-6 border-b border-border pb-10 last:border-0">
            <Skeleton className="h-56 w-full sm:h-40 sm:w-56 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
