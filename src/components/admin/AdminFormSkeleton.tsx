import { Skeleton } from '@/components/ui/skeleton';

/** Loading state for admin create/edit pages — title, a card of labelled fields, and the save button. */
export default function AdminFormSkeleton({ fields = 6, withImages = false }: { fields?: number; withImages?: boolean }) {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-8 w-56" />
      <div className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className={i === 0 ? 'space-y-2 sm:col-span-2' : 'space-y-2'}>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
        {withImages && (
          <div className="flex gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-32 w-24" />
            ))}
          </div>
        )}
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
}
