'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';
import { Minus, Plus, ShoppingBag, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/hooks/use-cart';
import { useStickyBarStore } from '@/store/useStickyBarStore';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn, formatCurrency } from '@/lib/utils'; // Assumed utils
import { ProductVariant } from '@/types';
import { useSettings } from '@/components/providers/SettingsProvider';

interface ProductActionsProps {
  product: {
    id: string;
    name: string;
    price: number;
    discount?: number;
    images: string[];
    stock: boolean;
    has_variants?: boolean;
  };
  initialVariants?: ProductVariant[];
}

export default function ProductActions({ product, initialVariants = [] }: ProductActionsProps) {
  const t = useTranslations('product');
  const tCommon = useTranslations('common');
  const [quantity, setQuantity] = useState(1);
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [loadingVariants, setLoadingVariants] = useState(false);
  
  const addItem = useCartStore((state) => state.addItem);
  const supabase = createClient();
  const { hidePrices } = useSettings();

  // Drives the mobile sticky bar: shown only once the real Add to Cart
  // button (the one below, in-page) has been scrolled UP past the top of
  // the viewport — not merely "not intersecting", which would also be true
  // on initial load before the user ever scrolls (the button starts below
  // the fold), showing a redundant bar right above the real one.
  const addToCartButtonRef = useRef<HTMLDivElement>(null);
  const [isButtonOffscreen, setIsButtonOffscreen] = useState(false);
  // Once the shopper reaches "You may also like" (#related-products) and
  // below, the bar would only cover those cards — hide it there.
  const [pastDetails, setPastDetails] = useState(false);
  const setStickyBarVisible = useStickyBarStore((s) => s.setVisible);
  const showStickyBar = isButtonOffscreen && !pastDetails;

  useEffect(() => {
    const el = addToCartButtonRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsButtonOffscreen(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );
    observer.observe(el);

    const related = document.getElementById('related-products');
    const relatedObserver = related
      ? new IntersectionObserver(
          // Hidden while the section is on screen or already scrolled past (footer).
          ([entry]) => setPastDetails(entry.isIntersecting || entry.boundingClientRect.top < 0),
          // Trigger when the section's top enters the area above the bar + bottom nav.
          { rootMargin: '0px 0px -140px 0px', threshold: 0 }
        )
      : null;
    if (related) relatedObserver?.observe(related);

    return () => {
      observer.disconnect();
      relatedObserver?.disconnect();
    };
  }, []);

  useEffect(() => {
    setStickyBarVisible(showStickyBar);
  }, [showStickyBar, setStickyBarVisible]);

  // Reset on unmount (navigating away) so ScrollToTop doesn't stay
  // shifted up on pages that never show this bar.
  useEffect(() => () => setStickyBarVisible(false), [setStickyBarVisible]);

  useEffect(() => {
    async function fetchVariants() {
      // If we already have variants (from initial props), don't fetch
      if (!product.has_variants || variants.length > 0) return;
      
      setLoadingVariants(true);
      const { data } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id)
        .eq('is_active', true)
        .order('price', { ascending: true });
        
      if (data && data.length > 0) {
        setVariants(data);
        setSelectedVariantId(data[0].id);
      }
      setLoadingVariants(false);
    }
    
    fetchVariants();
  }, [product.id, product.has_variants, variants.length]);

  // Set initial selected variant if available and not set
  useEffect(() => {
      if (variants.length > 0 && !selectedVariantId) {
          setSelectedVariantId(variants[0].id);
      }
  }, [variants, selectedVariantId]);

  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  const baseDiscount = product.discount || 0;

  // The single source of truth for this page's price — reacts to variant
  // selection, which a server-rendered price above it never could.
  const displayPrice = selectedVariant
    ? (selectedVariant.price - (selectedVariant.discount || 0))
    : (product.price - baseDiscount);

  let priceNode: ReactNode;
  if (product.has_variants && variants.length === 0) {
    // Variants declared but not loaded yet (still fetching, or none active)
    priceNode = <span>{formatCurrency(product.price)}</span>;
  } else if (selectedVariant) {
    const variantDiscount = selectedVariant.discount || 0;
    priceNode = variantDiscount > 0 ? (
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground line-through text-lg">{formatCurrency(selectedVariant.price)}</span>
        <span>{formatCurrency(selectedVariant.price - variantDiscount)}</span>
      </div>
    ) : (
      <span>{formatCurrency(selectedVariant.price)}</span>
    );
  } else if (variants.length > 0) {
    // No variant picked yet — show the range across all sizes/options.
    const prices = variants.map((v) => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    priceNode = minPrice === maxPrice ? (
      <span>{formatCurrency(minPrice)}</span>
    ) : (
      <span>{formatCurrency(minPrice)} - {formatCurrency(maxPrice)}</span>
    );
  } else if (baseDiscount > 0) {
    priceNode = (
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground line-through text-lg">{formatCurrency(product.price)}</span>
        <span>{formatCurrency(product.price - baseDiscount)}</span>
      </div>
    );
  } else {
    priceNode = <span>{formatCurrency(product.price)}</span>;
  }

  const handleAddToCart = () => {
    if (product.has_variants && !selectedVariantId) {
        toast.error(t('pleaseSelectSize'));
        return;
    }

    // Add item with the cart store
    for (let i = 0; i < quantity; i++) {
        addItem({
            id: product.id,
            name: product.name,
            price: displayPrice,
            images: product.images,
            variantId: selectedVariantId || undefined,
            variantName: selectedVariant?.name || undefined
        }); 
    }
    
    const variantLabel = selectedVariant ? `(${selectedVariant.name})` : '';
    toast.success(t('addedToCartQty', { quantity, name: product.name, variant: variantLabel }));
    setQuantity(1);
  };

  const increment = () => setQuantity(q => q + 1);
  const decrement = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  // Determine stock
  const isOutOfStock = product.has_variants 
    ? (selectedVariant ? !selectedVariant.stock : false) 
    : !product.stock;

  if (loadingVariants) {
      return <div className="h-20 animate-pulse bg-gray-100 rounded-md"></div>;
  }

  return (
    <div className="space-y-4 md:space-y-5">

      {/* Price — the only price shown on the page; reacts to variant selection. */}
      <div className="text-xl md:text-2xl font-medium">
         {hidePrices ? (
           <span className="text-muted-foreground text-base md:text-lg italic">{tCommon('contactForPrice')}</span>
         ) : (
           priceNode
         )}
      </div>

      {/* Variant Selector - Classy Minimal */}
      {variants.length > 0 && (
          <div className="space-y-2 md:space-y-3">
              <Label className="text-sm uppercase tracking-wide text-muted-foreground">{t('size')}</Label>
              <div className="flex flex-wrap gap-2 md:gap-3">
                  {variants.map((v) => {
                      const isSelected = selectedVariantId === v.id;
                      return (
                        <button
                            key={v.id}
                            onClick={() => v.stock && setSelectedVariantId(v.id)}
                            disabled={!v.stock}
                            className={cn(
                                "min-w-[80px] px-4 py-2 text-sm border transition-all duration-200",
                                isSelected
                                    ? "border-black bg-black text-white"
                                    : "border-gray-200 text-gray-700 hover:border-black",
                                !v.stock && "opacity-50 cursor-not-allowed decoration-slice line-through"
                            )}
                        >
                            {v.name}
                        </button>
                      );
                  })}
              </div>
          </div>
      )}

      {/* Quantity & Add */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground mr-auto">{t('quantity')}</span>
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={decrement}
            disabled={quantity <= 1 || isOutOfStock}
            className="h-9 w-9 md:h-10 md:w-10 rounded-none"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={increment}
            disabled={isOutOfStock}
            className="h-9 w-9 md:h-10 md:w-10 rounded-none"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={addToCartButtonRef}>
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="w-full text-base md:text-lg py-4 md:py-5 transition-all"
          variant={isOutOfStock ? "secondary" : "default"}
        >
          {isOutOfStock ? t('outOfStock') : (
              <>
                  <ShoppingBag className="mr-2 h-5 w-5" /> {t('addToCart')}
              </>
          )}
        </Button>
      </div>

      {/* Shipping Link */}
      <Link href="/shipping" className="flex items-center justify-between w-full border-b border-gray-100 py-3 md:py-4 mt-1 md:mt-2 cursor-pointer group hover:bg-gray-50/50 transition-colors px-2">
         <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors">
            {t('shippingAndReturns')}
         </span>
         <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
      </Link>

      {/* Mobile sticky bar — appears once the in-page Add to Cart button
          above scrolls out of view, so the buy action is always reachable
          while reading the description or browsing related products. */}
      {showStickyBar && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 z-40 bg-background border-t shadow-[0_-2px_12px_rgba(0,0,0,0.08)] px-4 py-2.5 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground truncate">{product.name}</p>
            <p className="text-sm font-semibold">
              {hidePrices ? tCommon('contactForPrice') : formatCurrency(displayPrice)}
            </p>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            variant={isOutOfStock ? "secondary" : "default"}
            className="shrink-0 px-5"
          >
            {isOutOfStock ? t('outOfStock') : t('addToCart')}
          </Button>
        </div>
      )}
    </div>
  );
}
