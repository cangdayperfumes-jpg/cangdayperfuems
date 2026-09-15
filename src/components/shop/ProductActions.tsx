'use client';

import { useState, useEffect } from 'react';
import { Minus, Plus, ShoppingBag, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/hooks/use-cart';
import { toast } from 'sonner';
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
    images: string[];
    stock: boolean;
    has_variants?: boolean;
  };
  initialVariants?: ProductVariant[];
}

export default function ProductActions({ product, initialVariants = [] }: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [loadingVariants, setLoadingVariants] = useState(false);
  
  const addItem = useCartStore((state) => state.addItem);
  const supabase = createClient();
  const { hidePrices } = useSettings();

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
  
  // Calculate display price
  const displayPrice = selectedVariant 
    ? (selectedVariant.price - (selectedVariant.discount || 0))
    : product.price;

  const handleAddToCart = () => {
    if (product.has_variants && !selectedVariantId) {
        toast.error("Please select a size");
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
    toast.success(`Added ${quantity} ${product.name} ${variantLabel} to cart`);
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
    <div className="space-y-6">
      
      {/* Price Display (dynamic) */}
      <div className="text-2xl font-medium">
         {hidePrices ? (
           <span className="text-muted-foreground text-lg">Contact for price</span>
         ) : (
           formatCurrency(displayPrice)
         )}
      </div>

      {/* Variant Selector - Classy Minimal */}
      {variants.length > 0 && (
          <div className="space-y-3">
              <Label className="text-sm uppercase tracking-wide text-muted-foreground">Size</Label>
              <div className="flex flex-wrap gap-3">
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
        <span className="text-sm font-medium text-muted-foreground mr-auto">Quantity</span>
        <div className="flex items-center border rounded-md">
          <Button
            variant="ghost"
            size="icon"
            onClick={decrement}
            disabled={quantity <= 1 || isOutOfStock}
            className="h-10 w-10 rounded-none"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={increment}
            disabled={isOutOfStock}
            className="h-10 w-10 rounded-none"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Button 
        onClick={handleAddToCart} 
        disabled={isOutOfStock}
        className="w-full text-lg py-6 transition-all"
        variant={isOutOfStock ? "secondary" : "default"}
      >
        {isOutOfStock ? "Out of Stock" : (
            <>
                <ShoppingBag className="mr-2 h-5 w-5" /> Add to Cart
            </>
        )}
      </Button>

      {/* Shipping Link */}
      <Link href="/shipping" className="flex items-center justify-between w-full border-b border-gray-100 py-4 mt-2 cursor-pointer group hover:bg-gray-50/50 transition-colors px-2">
         <span className="text-sm font-medium text-gray-700 group-hover:text-black transition-colors">
            Shipping & Returns
         </span>
         <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-black transition-colors" />
      </Link>
    </div>
  );
}
