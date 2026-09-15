'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GripVertical, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DeleteButton from '@/components/admin/DeleteButton';
import { DragReorderList } from '@/components/shared/DragReorderList';
import { SeasonalCollection } from '@/types';
import { deleteSeasonalCollection, updateSeasonalCollectionsOrder } from '@/app/admin/marketing/seasonal-collections/actions';

function getStatus(collection: SeasonalCollection): { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' } {
  if (!collection.is_active) return { label: 'Disabled', variant: 'outline' };

  const now = Date.now();
  const start = collection.start_date ? new Date(collection.start_date).getTime() : null;
  const end = collection.end_date ? new Date(collection.end_date).getTime() : null;

  if (start && now < start) return { label: 'Scheduled', variant: 'secondary' };
  if (end && now > end) return { label: 'Expired', variant: 'destructive' };
  return { label: 'Active', variant: 'default' };
}

export default function SeasonalCollectionsTable({ collections }: { collections: SeasonalCollection[] }) {
  const [items, setItems] = useState(collections);

  async function handleReorder(next: SeasonalCollection[]) {
    setItems(next);
    await updateSeasonalCollectionsOrder(next.map((c) => c.id));
  }

  if (items.length === 0) {
    return (
      <div className="border rounded-lg bg-white p-8 text-center text-muted-foreground">
        No seasonal collections yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      <DragReorderList
        items={items}
        getKey={(c) => c.id}
        onReorder={handleReorder}
        className="divide-y"
        renderItem={(collection, _index, dragControls) => {
          const status = getStatus(collection);
          return (
            <div className="flex items-center gap-3 p-4">
              <button
                type="button"
                onPointerDown={(e) => dragControls.start(e)}
                className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
                aria-label="Drag to reorder"
              >
                <GripVertical className="h-4 w-4" />
              </button>

              <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded bg-gray-100">
                {collection.banner_image_desktop ? (
                  <Image
                    src={collection.banner_image_desktop}
                    alt={collection.title}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                    No Img
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{collection.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {collection.season_type} · /shop?season={collection.slug}
                </p>
              </div>

              <Badge variant={status.variant}>{status.label}</Badge>

              <div className="flex items-center gap-1">
                <Link href={`/admin/marketing/seasonal-collections/${collection.id}`}>
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                </Link>
                <DeleteButton id={collection.id} onDelete={deleteSeasonalCollection} itemName="seasonal collection" />
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
