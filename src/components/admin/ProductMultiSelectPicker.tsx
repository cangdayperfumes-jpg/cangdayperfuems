'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useDebounce } from 'use-debounce';
import { Check, GripVertical, Loader2, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { DragReorderList } from '@/components/shared/DragReorderList';

export interface SelectedProductRef {
  product_id: string;
  name_en: string;
  image?: string | null;
  display_order: number;
}

interface SearchResult {
  id: string;
  name_en: string;
  images: string[] | null;
}

interface ProductMultiSelectPickerProps {
  value: SelectedProductRef[];
  onChange: (next: SelectedProductRef[]) => void;
}

export default function ProductMultiSelectPicker({ value, onChange }: ProductMultiSelectPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);

    const supabase = createClient();
    const run = async () => {
      let queryBuilder = supabase
        .from('products')
        .select('id, name_en, images')
        .eq('is_active', true)
        .order('name_en', { ascending: true })
        .limit(20);

      if (debouncedQuery.trim()) {
        queryBuilder = queryBuilder.ilike('name_en', `%${debouncedQuery.trim()}%`);
      }

      const { data } = await queryBuilder;
      if (!cancelled) {
        setResults(data || []);
        setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, open]);

  const selectedIds = new Set(value.map((v) => v.product_id));

  function toggleProduct(product: SearchResult) {
    if (selectedIds.has(product.id)) {
      onChange(value.filter((v) => v.product_id !== product.id));
    } else {
      onChange([
        ...value,
        {
          product_id: product.id,
          name_en: product.name_en,
          image: product.images?.[0] || null,
          display_order: value.length,
        },
      ]);
    }
  }

  function removeProduct(productId: string) {
    onChange(value.filter((v) => v.product_id !== productId));
  }

  function handleReorder(next: SelectedProductRef[]) {
    onChange(next.map((item, index) => ({ ...item, display_order: index })));
  }

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-start">
            Search &amp; add products…
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search products by name..." value={query} onValueChange={setQuery} />
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading && <CommandEmpty>No products found.</CommandEmpty>}
              {!loading && (
                <CommandGroup>
                  {results.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.id}
                      onSelect={() => toggleProduct(product)}
                    >
                      <Check
                        className={selectedIds.has(product.id) ? 'opacity-100' : 'opacity-0'}
                      />
                      {product.images?.[0] && (
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded border">
                          <Image src={product.images[0]} alt="" fill className="object-cover" sizes="32px" />
                        </div>
                      )}
                      <span className="truncate">{product.name_en}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <DragReorderList
          items={value}
          getKey={(item) => item.product_id}
          onReorder={handleReorder}
          className="flex flex-col gap-2"
          renderItem={(item, _index, dragControls) => (
            <div className="flex items-center gap-2 rounded-md border bg-background p-2">
              <button
                type="button"
                onPointerDown={(e) => dragControls.start(e)}
                className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing"
                aria-label="Drag to reorder"
              >
                <GripVertical className="h-4 w-4" />
              </button>
              {item.image && (
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded border">
                  <Image src={item.image} alt="" fill className="object-cover" sizes="32px" />
                </div>
              )}
              <span className="flex-1 truncate text-sm">{item.name_en}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => removeProduct(item.product_id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        />
      )}
    </div>
  );
}
