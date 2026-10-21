'use client';

import { Link } from '@/i18n/navigation';
import { Home, Grid, ShoppingBag, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCartStore } from '@/hooks/use-cart';
import { useStore } from '@/hooks/use-store';
import { useWishlistStore } from '@/store/useWishlistStore';
import CartSheet from '@/components/cart/cart-sheet';
import CartCountBadge from '@/components/shared/CartCountBadge';
import WishlistSheet from '@/components/cart/WishlistSheet';
import { useState } from 'react';

export default function BottomNav() {
  const t = useTranslations('nav');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const itemCount = useStore(useCartStore, (state) => state.getItemCount());
  const wishlistCount = useStore(useWishlistStore, (state) => state.items.length);

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t h-16 flex items-center justify-around pb-safe">
        <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground">
          <Home className="h-5 w-5" />
          <span className="text-[10px] mt-1">{t('home')}</span>
        </Link>

        <Link href="/shop" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground">
          <Grid className="h-5 w-5" />
          <span className="text-[10px] mt-1">{t('shop')}</span>
        </Link>

        {/* Favourites — opens a drawer like the cart, no separate page */}
        <button
          onClick={() => setIsWishlistOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground"
        >
          <div className="relative">
            <Heart className="h-5 w-5" />
            {wishlistCount !== undefined && wishlistCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-burgundy text-[10px] font-bold text-ivory">
                {wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">{t('favorites')}</span>
        </button>

        {/* Cart Button */}
        <button
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground"
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            <CartCountBadge
              count={itemCount}
              className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white"
            />
          </div>
          <span className="text-[10px] mt-1">{t('cart')}</span>
        </button>
      </div>

      <WishlistSheet open={isWishlistOpen} onOpenChange={setIsWishlistOpen} />
      <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}
