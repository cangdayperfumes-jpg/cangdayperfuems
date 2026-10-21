'use client';

import { Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useStore } from '@/hooks/use-store';
import { useWishlistStore, type WishlistItem } from '@/store/useWishlistStore';
import { cn } from '@/lib/utils';
import { analytics } from '@/lib/analytics';

/**
 * Heart toggle for saving a product to favourites. `variant="overlay"` is the
 * small round button on product photos; `variant="inline"` is the bordered
 * button beside the product title.
 */
export default function FavoriteButton({
  item,
  variant = 'overlay',
  className,
}: {
  item: WishlistItem;
  variant?: 'overlay' | 'inline';
  className?: string;
}) {
  const t = useTranslations('wishlist');
  // undefined until the persisted list is read, so SSR and first paint agree.
  const saved = useStore(useWishlistStore, (s) => s.items.some((i) => i.id === item.id));
  const toggle = useWishlistStore((s) => s.toggle);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nowSaved = toggle(item);
    if (nowSaved) analytics.addToWishlist({ item_id: item.id, item_name: item.name, price: item.price - (item.discount || 0) });
    toast.success(nowSaved ? t('added', { name: item.name }) : t('removed', { name: item.name }));
  };

  const label = saved ? t('removeLabel') : t('addLabel');

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={!!saved}
      title={label}
      className={cn(
        'flex items-center justify-center transition-colors',
        variant === 'overlay'
          ? 'h-8 w-8 rounded-full bg-ivory/90 backdrop-blur-sm shadow-sm hover:bg-ivory'
          : 'h-11 w-11 shrink-0 rounded-full border border-ink/15 hover:border-ink/40',
        className
      )}
    >
      <Heart
        className={cn('h-4 w-4 transition-transform', saved ? 'scale-110 fill-burgundy text-burgundy' : 'text-ink/70')}
        strokeWidth={1.75}
      />
    </button>
  );
}
