import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container py-8 md:py-12">
      {/* Mobile Header Skeleton */}
      <div className="md:hidden mb-6 flex justify-between items-center">
         <Skeleton className="h-8 w-40" />
         <Skeleton className="h-9 w-24" />
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Desktop Sidebar Skeleton */}
        <aside className="hidden md:block w-64 flex-shrink-0 space-y-8">
           {/* Search */}
           <Skeleton className="h-10 w-full" />
           
           {/* Accordions */}
           <div className="space-y-4">
              <div className="space-y-2">
                 <Skeleton className="h-6 w-24" />
                 <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                 <Skeleton className="h-6 w-24" />
                 <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                    ))}
                 </div>
              </div>
           </div>
        </aside>

        {/* Main Content Skeleton */}
        <div className="flex-1">
            {/* Desktop Header */}
            <div className="hidden md:block mb-8 space-y-2">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-4 w-32" />
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-6 md:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="space-y-3">
                        {/* Image */}
                        <Skeleton className="aspect-[4/5] w-full rounded-sm" />
                        {/* Text */}
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
