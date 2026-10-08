import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full">
      {/* Hero */}
      <div className="w-full h-[70vh] max-h-[700px] bg-gray-100 flex items-center justify-center">
        <Skeleton className="h-16 w-2/3 max-w-xl" />
      </div>

      {/* Best Sellers grid */}
      <div className="container py-16 space-y-8">
        <Skeleton className="h-8 w-48 mx-auto" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-6 md:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/5] w-full rounded-sm" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
