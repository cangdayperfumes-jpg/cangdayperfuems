import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CategoryTilesTable from '@/components/admin/CategoryTilesTable';
import { getCategoryTiles } from './actions';

export const revalidate = 0;

export default async function CategoryTilesPage() {
  const { data: tiles, totalCount } = await getCategoryTiles();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl font-heading font-bold">Category Tiles</h1>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {totalCount} total
          </span>
        </div>
        <Link href="/admin/marketing/category-tiles/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Tile
          </Button>
        </Link>
      </div>

      <p className="text-xs text-muted-foreground">
        These make up the &quot;Find Your Category&quot; grid on the homepage.
        Drag rows to change display order.
      </p>

      <CategoryTilesTable tiles={tiles} />
    </div>
  );
}
