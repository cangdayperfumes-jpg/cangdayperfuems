'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useDebounce } from 'use-debounce';
import { Check, Loader2, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

interface SearchResult {
  id: string;
  name_en: string;
  images: string[] | null;
}

interface CatalogProductPickerProps {
  label: string;
  placeholder: string;
  value: string[];
  onChange: (ids: string[]) => void;
  /** Product ids to hide from search results — e.g. the other list's picks, so a product can't end up force-included and force-excluded at once. */
  excludeFromSearch?: string[];
}

/** Same Popover+cmdk search pattern as ProductMultiSelectPicker.tsx, but
 *  generalized: works off a bare id list (no display_order/reorder — pick
 *  order doesn't matter for an include/exclude set) and supports hiding a
 *  given set of ids from search (so include/exclude lists can't collide). */
export default function CatalogProductPicker({
  label,
  placeholder,
  value,
  onChange,
  excludeFromSearch = [],
}: CatalogProductPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState<Record<string, SearchResult>>({});

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

  // Fetch display details for any selected id we haven't seen yet (e.g. on
  // initial load from a saved config) so the chip list can show names/images.
  useEffect(() => {
    const missing = value.filter((id) => !selectedDetails[id]);
    if (missing.length === 0) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from('products')
      .select('id, name_en, images')
      .in('id', missing)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setSelectedDetails((prev) => {
          const next = { ...prev };
          data.forEach((p) => {
            next[p.id] = p;
          });
          return next;
        });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const selectedIds = new Set(value);
  const excludeSet = new Set(excludeFromSearch);
  const visibleResults = results.filter((r) => !excludeSet.has(r.id));

  function toggleProduct(product: SearchResult) {
    if (selectedIds.has(product.id)) {
      onChange(value.filter((id) => id !== product.id));
    } else {
      setSelectedDetails((prev) => ({ ...prev, [product.id]: product }));
      onChange([...value, product.id]);
    }
  }

  function removeProduct(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-start">
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder={placeholder} value={query} onValueChange={setQuery} />
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading && <CommandEmpty>No products found.</CommandEmpty>}
              {!loading && (
                <CommandGroup>
                  {visibleResults.map((product) => (
                    <CommandItem key={product.id} value={product.id} onSelect={() => toggleProduct(product)}>
                      <Check className={selectedIds.has(product.id) ? 'opacity-100' : 'opacity-0'} />
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
        <div className="flex flex-col gap-2">
          {value.map((id) => {
            const detail = selectedDetails[id];
            return (
              <div key={id} className="flex items-center gap-2 rounded-md border bg-background p-2">
                {detail?.images?.[0] && (
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded border">
                    <Image src={detail.images[0]} alt="" fill className="object-cover" sizes="32px" />
                  </div>
                )}
                <span className="flex-1 truncate text-sm">{detail?.name_en || id}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => removeProduct(id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
