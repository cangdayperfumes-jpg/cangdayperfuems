import { Skeleton } from "@/components/ui/skeleton";

/** Order confirmation: check mark, headline, order summary card, buttons. */
export default function Loading() {
  return (
    <div className="container max-w-xl mx-auto py-16 md:py-24 flex flex-col items-center gap-5" aria-busy="true">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-9 w-72 max-w-full" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="mt-4 w-full rounded-sm border border-border p-6 space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="flex w-full gap-3">
        <Skeleton className="h-12 flex-1" />
        <Skeleton className="h-12 flex-1" />
      </div>
    </div>
  );
}
