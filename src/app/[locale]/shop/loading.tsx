import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors ShopClientWrapper: sidebar, title + intro, count/sort bar, product grid. */
export default function Loading() {
  return (
    <div className="container py-8 md:py-12" aria-busy="true">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0 space-y-8 pr-8 border-r border-border">
          <div className="space-y-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-9 w-full rounded-none" />
          </div>
          {[5, 3, 6].map((rows, section) => (
            <div key={section} className="space-y-2.5">
              <Skeleton className="h-5 w-28" />
              {Array.from({ length: rows }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full" />
              ))}
            </div>
          ))}
        </aside>

        <div className="flex-1">
          {/* Title, intro, count/sort bar */}
          <div className="mb-4 md:mb-6 space-y-2">
            <Skeleton className="h-7 md:h-9 w-56" />
            <Skeleton className="h-3.5 w-full max-w-md" />
            <div className="flex items-center justify-between border-y border-border py-2.5 mt-3">
              <Skeleton className="h-4 w-36" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-32 rounded-sm" />
                <Skeleton className="h-8 w-20 rounded-sm md:hidden" />
              </div>
            </div>
          </div>

          {/* Product grid — same columns/gaps/card shape as the real grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 md:gap-6 px-3 md:px-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[4/5] md:aspect-[3/4] w-full rounded-sm" />
                <Skeleton className="h-3.5 w-3/4 md:mx-auto" />
                <Skeleton className="h-3.5 w-1/3 md:mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
