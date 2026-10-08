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
import { HeroSlide } from '@/types';
import { deleteHeroSlide, updateHeroSlidesOrder } from '@/app/admin/marketing/hero-slides/actions';

export default function HeroSlidesTable({ slides }: { slides: HeroSlide[] }) {
  const t = useTranslations('heroSlides');
  const tc = useTranslations('common');
  const [items, setItems] = useState(slides);

  async function handleReorder(next: HeroSlide[]) {
    setItems(next);
    await updateHeroSlidesOrder(next.map((s) => s.id));
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
        getKey={(s) => s.id}
        onReorder={handleReorder}
        className="divide-y"
        renderItem={(slide, _index, dragControls) => (
          <div className="flex items-center gap-3 p-4">
            <button
              type="button"
              onPointerDown={(e) => dragControls.start(e)}
              className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
              aria-label={t('dragToReorder')}
            >
              <GripVertical className="h-4 w-4" />
            </button>

            <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded bg-gray-100">
              <Image
                src={slide.image_url}
                alt={slide.headline}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {slide.headline} {slide.headline_accent}
              </p>
              <p className="truncate text-xs text-muted-foreground">{slide.eyebrow}</p>
            </div>

            <Badge variant={slide.is_active ? 'default' : 'outline'}>
              {slide.is_active ? tc('active') : t('disabled')}
            </Badge>

            <div className="flex items-center gap-1">
              <Link href={`/admin/marketing/hero-slides/${slide.id}`}>
                <Button variant="ghost" size="icon">
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">{tc('edit')}</span>
                </Button>
              </Link>
              <DeleteButton id={slide.id} onDelete={deleteHeroSlide} itemName={t('itemName')} />
            </div>
          </div>
        )}
      />
    </div>
  );
}
