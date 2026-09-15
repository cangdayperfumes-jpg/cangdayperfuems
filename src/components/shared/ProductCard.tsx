'use client';

import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/hooks/use-cart';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSettings } from '@/components/providers/SettingsProvider';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const { hidePrices } = useSettings();
  const mainImage = product.images?.[0] || '/placeholder.svg'; // Fallback image
  const variants = (product as any).product_variants || [];

  // Logic: Discount in DB is AMOUNT.
  const discountPercentage = product.discount > 0 
    ? Math.round((product.discount / product.price) * 100)
    : 0;

  const handleQuickAdd = () => {
    if (product.has_variants) {
        // Direct to page if clicking the main button/image logic falls through
        router.push(`/shop/${product.slug || product.id}`);
        toast.info("Select a size");
        return;
    }

    if (!product.stock) {
        toast.error("Out of Stock");
        return;
    }

    addItem({
        id: product.id,
        name: product.name_en,
        price: product.price - (product.discount || 0),
        images: [mainImage],
    });
    toast.success(`Added ${product.name_en} to cart`);
  };

  const handleVariantAdd = (variant: any) => {
      if (!variant.stock) return;

      const variantPrice = variant.price - (variant.discount || 0);

      addItem({
        id: product.id,
        name: product.name_en,
        price: variantPrice,
        images: [mainImage],
        variantId: variant.id,
        variantName: variant.name
      });
      toast.success(`Added ${product.name_en} - ${variant.name}`);
  };

  return (
    <div className="group block h-full relative">
      {/* Image Container */}
      <div className="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800 mb-3 rounded-sm">
        
        <Link href={`/shop/${product.slug || product.id}`} className="block relative w-full h-full">
            {/* Discount Badge */}
            {product.discount > 0 && (
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                <Badge className="bg-red-600 text-white rounded-sm px-2 py-1 text-[10px] md:text-xs uppercase font-bold tracking-wider">
                    -{discountPercentage}% OFF
                </Badge>
            </div>
            )}

            {/* Popular Badge */}
            {product.is_popular && (
            <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
                <div className="flex items-center gap-1 bg-black/80 backdrop-blur-sm rounded-sm px-1.5 py-1">
                    <img src="/fire.svg" alt="" className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    <span className="text-white text-[10px] md:text-xs uppercase font-bold tracking-wider">Popular</span>
                </div>
            </div>
            )}

            <ImageWithFallback
            src={mainImage}
            alt={product.name_en}
            fill
            priority={priority}
            className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            
        </Link>
        {/* --- Action Buttons / Sold Out Badge --- */}
        {(() => {
            const isOutOfStock = product.has_variants 
                ? variants.length === 0 || variants.every((v: any) => !v.stock)
                : !product.stock;

            if (isOutOfStock) {
                return (
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center z-20 pointer-events-none">
                        <span className="bg-gray-100/90 backdrop-blur-sm text-gray-500 px-3 py-1 text-[10px] md:text-xs font-medium uppercase tracking-wider rounded-sm shadow-sm border border-gray-200">
                            Sold Out
                        </span>
                    </div>
                );
            }

            return (
                <>
                {/* --- Variant Overlay (Outside Link, Positioned Absolute) --- */}
                {product.has_variants && variants.length > 0 ? (
                <div className="absolute bottom-2 left-1 right-1 flex flex-wrap justify-center gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 z-20">
                    {variants.slice(0, 3).map((v: any) => (
                        <button
                            key={v.id}
                            onClick={() => handleVariantAdd(v)}
                            disabled={!v.stock}
                            className={`
                                min-w-[32px] px-2 py-1 text-[9px] md:text-[10px] font-bold uppercase tracking-wider 
                                bg-white/95 backdrop-blur-md text-black border border-transparent shadow-sm hover:bg-black hover:text-white
                                transition-all duration-200 transform active:scale-95 md:hover:scale-105 rounded-sm
                                ${!v.stock ? 'opacity-50 cursor-not-allowed line-through bg-gray-100' : ''}
                            `}
                        >
                            {v.name}
                        </button>
                    ))}
                    {/* Show more indicator if needed */}
                    {variants.length > 3 && (
                        <Link
                            href={`/shop/${product.slug || product.id}`}
                            className="flex items-center justify-center min-w-[24px] px-1.5 py-1 text-[9px] font-bold bg-white/90 text-black rounded-sm hover:bg-black hover:text-white transition-colors"
                        >
                            +
                        </Link>
                    )}
                </div>
                ) : (
                    /* Quick Add Button or Quantity Selector (No Variants) */
                    <div className="absolute bottom-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-20">
                        {(() => {
                            const cartItem = useCartStore((state) => state.items.find(i => i.id === product.id && !i.variantId));
                            const updateQuantity = useCartStore((state) => state.updateQuantity);
                            const removeItem = useCartStore((state) => state.removeItem);

                            if (cartItem) {
                                return (
                                    <div className="flex items-center gap-2 bg-white text-black shadow-lg rounded-full px-2 py-1 h-8 md:h-9">
                                        <button 
                                            onClick={(e) => { e.preventDefault(); cartItem.quantity > 1 ? updateQuantity(cartItem.id, cartItem.variantId, cartItem.quantity - 1) : removeItem(cartItem.id, cartItem.variantId); }}
                                            className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full font-medium"
                                        >-</button>
                                        <span className="text-xs font-semibold w-4 text-center">{cartItem.quantity}</span>
                                        <button 
                                            onClick={(e) => { e.preventDefault(); updateQuantity(cartItem.id, cartItem.variantId, cartItem.quantity + 1); }}
                                            className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 rounded-full font-medium"
                                        >+</button>
                                    </div>
                                );
                            }

                            return (
                                <Button 
                                    size="icon" 
                                    className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-white text-black hover:bg-black hover:text-white shadow-lg transition-colors border-0"
                                    onClick={(e) => { e.preventDefault(); handleQuickAdd(); }}
                                    aria-label="Add to cart"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            );
                        })()}
                    </div>
                )}
                </>
            );
        })()}
      </div>
      
      {/* Content */}
      <div className="space-y-2">
        <Link href={`/shop/${product.slug || product.id}`} className="block">
             <h3 className="font-heading text-xs md:text-sm font-semibold leading-tight truncate md:text-center hover:text-gray-600 transition-colors">{product.name_en}</h3>
        </Link>
        
        <div className="flex items-center justify-start md:justify-center gap-2 text-xs md:text-sm">
          {hidePrices ? (
             <span className="font-medium text-muted-foreground">Contact for price</span>
          ) : product.has_variants ? (
             <span className="font-medium text-muted-foreground">
                From <span className="text-foreground">{formatCurrency(product.price)}</span>
             </span>
          ) : product.discount > 0 ? (
            <>
              <span className="text-muted-foreground line-through decoration-gray-400">
                {formatCurrency(product.price)}
              </span>
              <span className="font-medium text-red-600 text-sm">
                {formatCurrency(product.price - product.discount)}
              </span>
            </>
          ) : (
            <span className="font-medium">{formatCurrency(product.price)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
