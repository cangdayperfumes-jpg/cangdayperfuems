import { Link } from '@/i18n/navigation';
import { Flame, Sparkles, Shirt, Flower2, Shuffle, Heart, LayoutGrid, ShoppingBag } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

// Every entry links to a filter the shop page actually supports (filter=best,
// filter=new, audience=, popular=true, /categories, /shop) — deliberately not
// a literal copy of the reference image's icon row, which included labels
// like "Gift Sets" and "Tester & Discovery" that have no backing data or
// route in this catalog. A quick-nav shortcut that leads nowhere real is
// worse than not having one.
const ITEMS = [
  { href: '/shop?filter=best', icon: Flame, key: 'bestSellers' },
  { href: '/shop?filter=new', icon: Sparkles, key: 'newArrivals' },
  { href: '/shop?audience=Men', icon: Shirt, key: 'men' },
  { href: '/shop?audience=Women', icon: Flower2, key: 'women' },
  { href: '/shop?audience=Unisex', icon: Shuffle, key: 'unisex' },
  { href: '/shop?popular=true', icon: Heart, key: 'popular' },
  { href: '/categories', icon: LayoutGrid, key: 'allCategories' },
  { href: '/shop', icon: ShoppingBag, key: 'shopAll' },
] as const;

export default async function QuickNav() {
  const t = await getTranslations('home.quickNav');
  return (
    <section className="w-full bg-ivory border-y border-border">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 md:gap-10 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-4 md:py-5 md:justify-center">
          {ITEMS.map(({ href, icon: Icon, key }) => (
            <Link
              key={key}
              href={href}
              className="group flex flex-col items-center gap-2 shrink-0 w-16 md:w-20"
            >
              <span className="flex items-center justify-center h-11 w-11 md:h-12 md:w-12 rounded-full border border-border bg-secondary/40 text-ink group-hover:border-gold group-hover:text-gold-deep transition-colors">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <span className="text-[10px] md:text-[11px] font-medium text-center uppercase tracking-wide text-ink/70 group-hover:text-ink transition-colors leading-tight">
                {t(key)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
