import { Skeleton } from "@/components/ui/skeleton";
import { HERO_DESKTOP_ASPECT, HERO_MOBILE_ASPECT, HERO_MAX_WIDTH_PX } from "@/lib/hero-aspect";

function ProductCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="aspect-[4/5] md:aspect-[3/4] w-full rounded-sm" />
      <Skeleton className="h-3.5 w-3/4 md:mx-auto" />
      <Skeleton className="h-3.5 w-1/3 md:mx-auto" />
    </div>
  );
}

function SectionHeadingSkeleton() {
  return (
    <div className="space-y-2 mb-4">
      <Skeleton className="h-2.5 w-24" />
      <Skeleton className="h-6 w-44" />
    </div>
  );
}

/**
 * Mirrors the real homepage layout section by section (same frame shapes,
 * same max-width column and gutters) so content swaps in without the page
 * jumping around.
 */
export default function Loading() {
  return (
    <div className="w-full bg-ivory" aria-busy="true">
      {/* Hero — exact same aspect frame as <Hero> */}
      <div className="w-full">
        <div
          className="relative mx-auto w-full overflow-hidden [aspect-ratio:var(--hero-mobile-aspect)] md:[aspect-ratio:var(--hero-desktop-aspect)] bg-ink/[0.04]"
          style={{
            "--hero-mobile-aspect": HERO_MOBILE_ASPECT,
            "--hero-desktop-aspect": HERO_DESKTOP_ASPECT,
            maxWidth: HERO_MAX_WIDTH_PX,
          } as React.CSSProperties}
        >
          <div className="absolute inset-0 flex flex-col justify-center max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-9 md:h-12 w-3/4 max-w-md" />
            <Skeleton className="h-9 md:h-12 w-1/2 max-w-xs" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-11 w-40 rounded-none" />
              <Skeleton className="hidden sm:block h-11 w-32 rounded-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="max-w-[1400px] mx-auto md:px-6 lg:px-8 border-b border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-ivory flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 px-3 py-4 md:py-6">
              <Skeleton className="h-10 w-10 md:h-11 md:w-11 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Brand strip */}
      <div className="border-b border-border bg-secondary/60 py-3 md:py-4 overflow-hidden">
        <div className="flex gap-10 px-4">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex shrink-0 items-center gap-2.5">
              <Skeleton className="h-7 w-7 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Find your category — same bento as DiscoverCategories */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <SectionHeadingSkeleton />
        <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-3 md:gap-4 md:h-[600px]">
          <Skeleton className="col-span-2 aspect-[2/1] md:aspect-auto md:row-span-2 rounded-none" />
          <Skeleton className="col-span-2 aspect-[2/1] md:aspect-auto rounded-none" />
          <Skeleton className="aspect-[3/4] md:aspect-auto rounded-none" />
          <Skeleton className="aspect-[3/4] md:aspect-auto rounded-none" />
        </div>
      </div>

      {/* Product rail (Best Sellers) */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
        <SectionHeadingSkeleton />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={i > 1 ? "hidden md:block" : undefined}>
              <ProductCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
