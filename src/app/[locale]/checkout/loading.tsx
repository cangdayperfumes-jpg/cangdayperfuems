import { Skeleton } from "@/components/ui/skeleton";

function FieldSkeleton({ wide = false }: { wide?: boolean }) {
  return (
    <div className={wide ? "space-y-2 sm:col-span-2" : "space-y-2"}>
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-11 w-full rounded-sm" />
    </div>
  );
}

/** Mirrors the checkout page: header + steps, numbered form sections, sticky summary. */
export default function Loading() {
  return (
    <div className="min-h-screen bg-background pb-16" aria-busy="true">
      <div className="mx-auto max-w-6xl px-4 pt-6 md:pt-10">
        <div className="mb-6 md:mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-9 w-44" />
          </div>
          <Skeleton className="h-5 w-72" />
        </div>

        <Skeleton className="lg:hidden mb-8 h-12 w-full rounded-sm" />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7 space-y-10">
            {[3, 5].map((fields, section) => (
              <div key={section}>
                <div className="flex items-center gap-3 mb-5">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: fields }).map((_, i) => (
                    <FieldSkeleton key={i} wide={i === 0} />
                  ))}
                </div>
              </div>
            ))}
            <Skeleton className="hidden lg:block h-14 w-full rounded-none" />
          </div>

          <div className="hidden lg:block lg:col-span-5">
            <div className="rounded-sm border border-border bg-secondary/40 p-6 space-y-5">
              <Skeleton className="h-6 w-40" />
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-20 w-16 rounded-sm shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
              <Skeleton className="h-12 w-full rounded-sm" />
              <div className="space-y-2.5 border-t border-border pt-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-7 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
