import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="bg-ivory">

      {/* Hero (ink) */}
      <div className="bg-ink pt-20 pb-16 md:pt-32 md:pb-24 flex flex-col items-center px-4 space-y-6">
        <Skeleton className="h-3 w-32 bg-ivory/10" />
        <Skeleton className="h-16 md:h-20 w-64 md:w-96 bg-ivory/10" />
        <Skeleton className="h-4 w-full max-w-xl bg-ivory/10" />
      </div>

      {/* Values row */}
      <div className="border-b border-ink/10 py-8 md:py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-7 w-20 bg-ink/10" />
              <Skeleton className="h-2.5 w-24 bg-ink/10" />
            </div>
          ))}
        </div>
      </div>

      {/* Our story */}
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24 flex flex-col items-center space-y-4">
        <Skeleton className="h-3 w-24 bg-ink/10" />
        <Skeleton className="h-7 w-full max-w-lg bg-ink/10" />
        <Skeleton className="h-4 w-full max-w-xl bg-ink/10" />
        <Skeleton className="h-4 w-full max-w-xl bg-ink/10" />
        <Skeleton className="h-4 w-2/3 max-w-md bg-ink/10" />
      </div>

      {/* Commitment (ink) */}
      <div className="w-full bg-ink py-14">
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-2/3 bg-ivory/10" />
          ))}
        </div>
      </div>

      {/* What you get */}
      <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
        <div className="mb-10 flex flex-col items-center gap-3">
          <Skeleton className="h-3 w-28 bg-ink/10" />
          <Skeleton className="h-8 w-48 bg-ink/10" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-4 w-full bg-ink/10" />
          ))}
        </div>
      </div>

    </div>
  );
}
