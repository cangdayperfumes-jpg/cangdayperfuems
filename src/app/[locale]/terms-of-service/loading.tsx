import { Skeleton } from "@/components/ui/skeleton";

/** Long-form text page: title block then paragraphs. */
export default function Loading() {
  return (
    <div className="container py-12 md:py-20 max-w-3xl mx-auto space-y-8" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-10 w-4/5" />
        <Skeleton className="h-4 w-48" />
      </div>
      {[0, 1, 2, 3].map((p) => (
        <div key={p} className="space-y-2.5">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      ))}
    </div>
  );
}
