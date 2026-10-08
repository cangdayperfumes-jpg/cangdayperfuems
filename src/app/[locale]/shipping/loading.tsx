import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-24 space-y-16">

        {/* Hero */}
        <div className="text-center space-y-6">
          <Skeleton className="h-10 md:h-12 w-72 mx-auto" />
          <Skeleton className="h-4 w-full max-w-2xl mx-auto" />
          <Skeleton className="h-4 w-2/3 max-w-lg mx-auto" />
        </div>

        <Skeleton className="h-px w-full" />

        {/* Shipping Policy list */}
        <div className="space-y-6">
          <Skeleton className="h-7 w-48" />
          <div className="border-t border-gray-100 divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-5 py-6">
                <Skeleton className="flex-shrink-0 w-10 h-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-full max-w-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Map */}
        <Skeleton className="w-full aspect-[2/1] max-w-4xl mx-auto rounded-lg" />

        {/* Regional rates */}
        <div className="space-y-6">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-9 w-full max-w-sm" />
          <Skeleton className="h-40 w-full rounded-sm" />
        </div>

        {/* Get a Shipping Quote */}
        <Skeleton className="h-32 w-full rounded-sm" />

      </div>
    </div>
  );
}
