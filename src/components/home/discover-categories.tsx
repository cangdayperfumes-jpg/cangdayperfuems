import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import type { CategoryTile } from '@/types';

type Content = {
  title: string;
  cta: string;
  href?: string;
  image?: string;
  // Full literal Tailwind classes (not built from interpolated values —
  // Tailwind's JIT scanner needs the exact class string present in source
  // to generate it, same constraint as colSpanClass/rowSpanClass below).
  // Mobile cards crop to a short 2:1 "strap" banner — a much tighter
  // vertical slice than desktop's near-full-height 4:5 card — so a
  // portrait photo needs a different vertical anchor per breakpoint to
  // keep both the face and the bottle in frame on mobile without the
  // desktop crop pulling too tight on the face.
  positionClass?: string;
};

// Curated people-with-bottle photography for the two hero slots, used in
// place of whatever image_url the admin tile carries. The admin-managed
// photos currently seeded for these two (a folded-fabric bottle shot, a
// bare product shot) have no person in them; the brief for this section
// specifically asked for a woman/man actually holding the perfume. Swap
// these for admin-uploaded photos (via /admin/marketing/category-tiles)
// once the site has its own shoot — this is a placeholder, not a
// permanent bypass of that admin control.
const WOMEN_IMAGE = 'https://images.unsplash.com/photo-1784215118418-1c1ff08edac1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900';
const MEN_IMAGE = 'https://images.unsplash.com/photo-1770193349323-efd1c5492a83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900';

/**
 * Maps an admin-entered tile's link_href to translated title/CTA copy (and,
 * for the hero slots, a curated image) so the categories we know how to
 * localize — Women's, Men's, Gift Sets, Body Mists, and Popular (the only
 * taxonomy Cangday's catalog actually has: audience, product type, and the
 * is_popular flag) always render correctly, even though
 * `category_tiles.label` itself is a single untranslated column. The
 * `category=niche-perfumes` match below is a legacy admin-seeded href from
 * a "Designer/Niche" product concept that was removed from the schema (see
 * 20260730000000_replace_type_with_popular.sql) — it's remapped to Popular
 * Perfumes, a category the catalog actually has, both in copy and in the
 * link itself, rather than left pointing at a dead filter. Any other
 * admin-added tile (a genuinely new one) falls back to its own label,
 * image, and a generic CTA — same as the plain bento this section replaces.
 */
function resolveContent(tile: CategoryTile, t: Awaited<ReturnType<typeof getTranslations>>): Content {
  const href = tile.link_href;
  if (href.includes('audience=Women')) {
    // Face is in the top ~30%, bottle held roughly 30–60% down. Mobile's
    // short crop window needs to sit lower than desktop's to catch both.
    return {
      title: t('discoverWomenTitle'),
      cta: t('discoverWomenCta'),
      image: WOMEN_IMAGE,
      positionClass: 'object-[center_42%] md:object-[center_22%]',
    };
  }
  if (href.includes('audience=Men')) {
    return {
      title: t('discoverMenTitle'),
      cta: t('discoverMenCta'),
      image: MEN_IMAGE,
      positionClass: 'object-[center_35%]',
    };
  }
  if (href.includes('category=gift-sets')) return { title: t('discoverGiftTitle'), cta: t('discoverGiftCta') };
  if (href.includes('category=body-mists')) return { title: t('discoverMistsTitle'), cta: t('discoverMistsCta') };
  if (href.includes('category=niche-perfumes')) {
    return { title: t('discoverPopularTitle'), cta: t('discoverPopularCta'), href: '/shop?popular=true' };
  }
  return { title: tile.label, cta: t('discoverDefaultCta') };
}

export default async function DiscoverCategories({ tiles }: { tiles: CategoryTile[] }) {
  const t = await getTranslations('home');

  return (
    <section className="py-6 md:py-8 w-full bg-ivory">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-5 md:mb-6">
          <p className="text-xs uppercase tracking-[0.35em] text-gold-deep font-semibold mb-2">
            {t('shopByCategory')}
          </p>
          <h2 className="font-heading text-2xl md:text-3xl font-medium text-ink">
            {t('findYourCategory')}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-2 gap-3 md:gap-4 md:h-[600px]">
          {tiles.map((tile) => {
            const { title, cta, href, image, positionClass } = resolveContent(tile, t);
            // col_span >= 2 is this data model's existing signal for "this is
            // a primary/hero tile" (Women's and Men's both use col_span 2
            // today) — reused here to drive the mobile layout too, instead
            // of mobile being a uniform shrunk grid of every tile at the
            // same size: primary tiles go full-width, secondary tiles pair
            // up two-to-a-row.
            const isPrimary = tile.col_span >= 2;

            const colSpanClass = { 1: '', 2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4' }[tile.col_span];
            const rowSpanClass = { 1: 'md:row-span-1', 2: 'md:row-span-2' }[tile.row_span];

            return (
              <Link
                key={tile.id}
                href={href ?? tile.link_href}
                className={`group relative flex overflow-hidden bg-ink ${
                  // Primary tiles are a short, wide "strap" banner on mobile
                  // (full-width, landscape) rather than a tall portrait card
                  // — stacks as two quick horizontal bands instead of eating
                  // a full screen of scroll each.
                  isPrimary ? 'col-span-2 aspect-[2/1]' : 'col-span-1 aspect-[3/4]'
                } md:aspect-auto md:w-full md:h-full ${colSpanClass} ${rowSpanClass}`}
              >
                <ImageWithFallback
                  src={image ?? tile.image_url}
                  alt={title}
                  fill
                  loading="lazy"
                  sizes={isPrimary ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 768px) 50vw, 25vw'}
                  className={`object-cover transition-transform duration-700 group-hover:scale-105 [filter:grayscale(0.4)_sepia(0.15)_saturate(0.9)_brightness(0.78)] ${positionClass ?? ''}`}
                />

                {/* Bottom-anchored gradient — keeps the upper two-thirds of
                    the photo (faces, bottles) fully readable, only darkens
                    enough behind the text to guarantee contrast. */}
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />

                <div className={`relative mt-auto w-full ${isPrimary ? 'p-5 md:p-8' : 'p-4 md:p-5'}`}>
                  <h3
                    className={`font-heading font-medium text-ivory leading-[1.1] uppercase tracking-wide ${
                      isPrimary ? 'text-xl md:text-4xl' : 'text-base md:text-xl'
                    }`}
                  >
                    {title}
                  </h3>
                  <span className="mt-2 md:mt-3 inline-flex items-center gap-2 text-[11px] md:text-xs uppercase tracking-widest font-semibold text-gold group-hover:text-gold-soft transition-colors">
                    {cta}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
