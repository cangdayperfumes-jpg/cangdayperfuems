'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/utils/supabase/client';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { formatCurrency } from '@/lib/utils';
import { useSettings } from '@/components/providers/SettingsProvider';

interface Suggestion {
  id: string;
  name_en: string;
  slug: string | null;
  images: string[];
  price: number;
  discount: number;
}

// Two full rows of the desktop 4-column grid.
const MAX_RESULTS = 8;

/**
 * Live "type ahead" results under the navbar search box — top product
 * matches as the user types, each a direct link to that product, plus a
 * "see all results" row to the existing full /shop?q= search. Shared by
 * both the desktop inline panel and the mobile sheet's search field.
 */
export default function SearchSuggestions({
  query,
  onNavigate,
}: {
  query: string;
  onNavigate: () => void;
}) {
  const t = useTranslations('nav');
  const tProduct = useTranslations('product');
  const { hidePrices } = useSettings();
  const [debouncedQuery] = useDebounce(query.trim(), 250);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const supabase = createClient();
    supabase
      .from('products')
      .select('id,name_en,slug,images,price,discount')
      .eq('is_active', true)
      .ilike('name_en', `%${debouncedQuery}%`)
      .order('sales_count', { ascending: false })
      .limit(MAX_RESULTS)
      .then(({ data }) => {
        if (cancelled) return;
        setResults(data || []);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  if (debouncedQuery.length < 2) return null;

  return (
    <div className="border-t border-border bg-ivory">
      {isLoading ? (
        <div className="px-1 py-4 text-center text-xs text-ink/40">{t('searching')}</div>
      ) : results.length === 0 ? (
        <div className="px-1 py-4 text-center text-xs text-ink/40">{t('noSearchResults', { query: debouncedQuery })}</div>
      ) : (
        <>
          {/* Phones: compact list rows. Desktop: 4-across card grid that fits
              all results without any inner scrolling. */}
          <ul className="max-h-[60vh] overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:max-h-none md:overflow-visible md:grid md:grid-cols-4 md:gap-4 md:py-4">
            {results.map((product) => {
              const finalPrice = product.price - (product.discount || 0);
              return (
                <li key={product.id}>
                  <Link
                    href={`/shop/${product.slug || product.id}`}
                    onClick={onNavigate}
                    className="group flex items-center gap-3 px-1 py-2.5 hover:bg-ink/5 transition-colors md:flex-col md:items-stretch md:gap-2 md:p-0 md:hover:bg-transparent"
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-sm bg-white ring-1 ring-border md:h-auto md:w-full md:aspect-square group-hover:ring-gold/50 transition-colors">
                      <ImageWithFallback
                        src={product.images?.[0] || '/placeholder.svg'}
                        alt={product.name_en}
                        fill
                        sizes="(max-width: 768px) 48px, 200px"
                        className="object-contain md:p-2 md:transition-transform md:duration-500 md:group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0 flex-1 md:text-center">
                      <p className="truncate text-sm font-medium text-ink md:whitespace-normal md:line-clamp-2 md:text-xs md:leading-snug group-hover:text-gold-deep transition-colors">
                        {product.name_en}
                      </p>
                      {!hidePrices && (
                        <p className="text-xs text-ink/60 md:mt-1">{formatCurrency(finalPrice)}</p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href={`/shop?q=${encodeURIComponent(debouncedQuery)}`}
            onClick={onNavigate}
            className="flex items-center justify-center gap-2 border-t border-border py-3 text-xs font-semibold uppercase tracking-widest text-ink hover:text-gold-deep transition-colors"
          >
            {t('viewAllResults', { query: debouncedQuery })}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </>
      )}
    </div>
  );
}
