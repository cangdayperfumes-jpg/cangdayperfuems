
'use client';

import Link from 'next/link';
import { Home, Grid, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/hooks/use-cart';
import { useStore } from '@/hooks/use-store';
import CartSheet from '@/components/cart/cart-sheet';
import { useState } from 'react';

export default function BottomNav() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const itemCount = useStore(useCartStore, (state) => state.getItemCount());

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t h-16 flex items-center justify-around pb-safe">
        <Link href="/" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground">
          <Home className="h-5 w-5" />
          <span className="text-[10px] mt-1">Home</span>
        </Link>
        
        <Link href="/shop" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground">
          <Grid className="h-5 w-5" />
          <span className="text-[10px] mt-1">Shop</span>
        </Link>

        {/* Cart Button */}
        <button 
          onClick={() => setIsCartOpen(true)}
          className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground"
        >
          <div className="relative">
            <ShoppingBag className="h-5 w-5" />
            {itemCount !== undefined && itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1">Cart</span>
        </button>
      </div>

      {/* Cart Sheet */}
      <CartSheet open={isCartOpen} onOpenChange={setIsCartOpen} />
    </>
  );
}
