'use client';

import { Heart, ShoppingBag, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useStore } from '@/hooks/use-store';
import { useCartStore } from '@/hooks/use-cart';
import { useWishlistStore, type WishlistItem } from '@/store/useWishlistStore';
import { useSettings } from '@/components/providers/SettingsProvider';
import { formatCurrency } from '@/lib/utils';

/** Favourites drawer — same shell as the cart sheet, no separate page. */
export default function WishlistSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations('wishlist');
  const tCart = useTranslations('cart');
  const tCommon = useTranslations('common');
  const items = useStore(useWishlistStore, (s) => s.items);
  const remove = useWishlistStore((s) => s.remove);
  const addToCart = useCartStore((s) => s.addItem);
  const { hidePrices } = useSettings();

  const moveToBag = (item: WishlistItem) => {
    addToCart({ id: item.id, name: item.name, price: item.price - (item.discount || 0), images: [item.image] });
    remove(item.id);
    toast.success(tCart('addedToCart', { name: item.name }));
  };

  const href = (item: WishlistItem) => `/shop/${item.slug || item.id}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined} className="flex w-full flex-col gap-0 bg-ivory p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="flex items-baseline gap-2 font-heading text-xl font-medium">
            {t('title')}
            {!!items?.length && <span className="text-sm font-normal text-muted-foreground">({items.length})</span>}
          </SheetTitle>
        </SheetHeader>

        {!items ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">{tCommon('loading')}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/5">
              <Heart className="h-7 w-7 text-gold-deep" strokeWidth={1.5} />
            </span>
            <div>
              <h3 className="font-heading text-lg font-medium">{t('emptyTitle')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t('emptySubtitle')}</p>
            </div>
            <Button
              asChild
              onClick={() => onOpenChange(false)}
              className="mt-2 h-12 rounded-none bg-ink px-8 text-xs uppercase tracking-widest text-ivory hover:bg-gold-deep notch-corners"
            >
              <Link href="/shop">{tCart('browseCollection')}</Link>
            </Button>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
            {items.map((item) => {
              const finalPrice = item.price - (item.discount || 0);
              return (
                <li key={item.id} className="flex gap-4 py-5">
                  <Link
                    href={href(item)}
                    onClick={() => onOpenChange(false)}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-white ring-1 ring-border"
                  >
                    <ImageWithFallback src={item.image || '/placeholder.svg'} alt={item.name} fill sizes="80px" className="object-cover" />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={href(item)} onClick={() => onOpenChange(false)} className="min-w-0">
                        <h4 className="line-clamp-2 text-sm font-medium leading-snug text-ink hover:text-ink/70">{item.name}</h4>
                      </Link>
                      <button
                        type="button"
                        aria-label={t('removeLabel')}
                        onClick={() => remove(item.id)}
                        className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink/50 hover:bg-ink/5 hover:text-ink"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {!hidePrices && (
                      <p className="mt-1 text-sm tabular-nums">
                        {item.hasVariants ? (
                          <span className="text-muted-foreground">{t('fromPrice', { price: formatCurrency(item.price) })}</span>
                        ) : item.discount > 0 ? (
                          <>
                            <span className="mr-2 text-muted-foreground line-through">{formatCurrency(item.price)}</span>
                            <span className="font-medium text-gold-deep">{formatCurrency(finalPrice)}</span>
                          </>
                        ) : (
                          <span className="font-medium">{formatCurrency(item.price)}</span>
                        )}
                      </p>
                    )}

                    <div className="mt-auto pt-3">
                      {!item.inStock ? (
                        <span className="text-xs text-muted-foreground">{t('soldOut')}</span>
                      ) : item.hasVariants ? (
                        <Link
                          href={href(item)}
                          onClick={() => onOpenChange(false)}
                          className="inline-flex h-9 items-center rounded-full border border-ink/20 px-4 text-xs font-medium uppercase tracking-wider text-ink hover:border-ink"
                        >
                          {t('chooseSize')}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => moveToBag(item)}
                          className="inline-flex h-9 items-center gap-2 rounded-full bg-ink px-4 text-xs font-medium uppercase tracking-wider text-ivory hover:bg-gold-deep"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          {t('moveToBag')}
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}
