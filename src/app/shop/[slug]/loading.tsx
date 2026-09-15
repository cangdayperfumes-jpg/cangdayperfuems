import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container py-12 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        
        {/* Left Column: Image Skeleton */}
        <div className="relative aspect-[3/4] md:aspect-square w-full rounded-sm overflow-hidden bg-gray-50 border">
             <Skeleton className="h-full w-full" />
        </div>

        {/* Right Column: Details */}
        <div className="flex flex-col space-y-8">
            <div className="space-y-4">
                {/* Brand */}
                <Skeleton className="h-4 w-20" />
                
                {/* Title */}
                <Skeleton className="h-10 w-3/4 md:w-2/3" />
                
                {/* Price */}
                <Skeleton className="h-8 w-24" />
            </div>

            <div className="h-px w-full bg-gray-100" />

            {/* Description */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
            </div>

            <div className="h-px w-full bg-gray-100" />

            {/* Add to Cart Button */}
            <div className="pt-4">
                <Skeleton className="h-12 w-full rounded-full" />
            </div>
            
            {/* Additional Info (Accordion style) */}
            <div className="space-y-4 pt-8">
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-10 w-full" />
            </div>
        </div>
      </div>
    </div>
  );
}
