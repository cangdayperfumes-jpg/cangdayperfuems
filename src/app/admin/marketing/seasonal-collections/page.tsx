import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import SeasonalCollectionsTable from '@/components/admin/SeasonalCollectionsTable';
import { getSeasonalCollections } from './actions';

export const revalidate = 0;

export default async function SeasonalCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || '';

  const { data: collections, totalCount } = await getSeasonalCollections({ query, limit: 100 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-heading font-bold">Seasonal Collections</h1>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {totalCount} total
          </span>
        </div>
        <Link href="/admin/marketing/seasonal-collections/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        </Link>
      </div>

      <div className="max-w-sm">
        <form className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input name="q" defaultValue={query} placeholder="Search collections..." className="pl-9" />
        </form>
      </div>

      <p className="text-xs text-muted-foreground">Drag rows to change homepage display order.</p>

      <SeasonalCollectionsTable collections={collections} />
    </div>
  );
}
