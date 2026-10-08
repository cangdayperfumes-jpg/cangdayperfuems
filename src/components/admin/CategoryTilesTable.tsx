'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GripVertical, Pencil } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DeleteButton from '@/components/admin/DeleteButton';
import { DragReorderList } from '@/components/shared/DragReorderList';
import { CategoryTile } from '@/types';
import { deleteCategoryTile, updateCategoryTilesOrder } from '@/app/admin/marketing/category-tiles/actions';

export default function CategoryTilesTable({ tiles }: { tiles: CategoryTile[] }) {
  const t = useTranslations('categoryTiles');
  const tc = useTranslations('common');
  const [items, setItems] = useState(tiles);

  async function handleReorder(next: CategoryTile[]) {
    setItems(next);
    await updateCategoryTilesOrder(next.map((t) => t.id));
  }

  if (items.length === 0) {
    return (
      <div className="border rounded-lg bg-white p-8 text-center text-muted-foreground">
        {t('noItemsYet')}
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <DragReorderList
        items={items}
        getKey={(t) => t.id}
        onReorder={handleReorder}
        className="divide-y"
        renderItem={(tile, _index, dragControls) => (
          <div className="flex items-center gap-3 p-4">
            <button
              type="button"
              onPointerDown={(e) => dragControls.start(e)}
              className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
              aria-label={t('dragToReorder')}
            >
              <GripVertical className="h-4 w-4" />
            </button>

            <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
              <Image src={tile.image_url} alt={tile.label} fill sizes="64px" className="object-cover" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{tile.label}</p>
              <p className="truncate text-xs text-muted-foreground">
                {t('spanSummary', { cols: tile.col_span, rows: tile.row_span })} · {tile.link_href}
              </p>
            </div>

            <Badge variant={tile.is_active ? 'default' : 'outline'}>
              {tile.is_active ? tc('active') : t('disabled')}
            </Badge>

            <div className="flex items-center gap-1">
              <Link href={`/admin/marketing/category-tiles/${tile.id}`}>
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">{tc('edit')}</span>
                </Button>
              </Link>
              <DeleteButton id={tile.id} onDelete={deleteCategoryTile} itemName={t('itemName')} />
            </div>
          </div>
        )}
      />
    </div>
  );
}
