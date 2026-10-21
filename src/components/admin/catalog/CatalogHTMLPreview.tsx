'use client';

import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { CatalogModel, CatalogBanner } from './types';
import { catalogDescription, catalogLabels, catalogPrice, clip, isDarkColor } from './catalogLabels';

interface CatalogHTMLPreviewProps {
  model: CatalogModel;
  categoryNameById: Map<string, string>;
  brandNameById: Map<string, string>;
}

function CatalogBannerBlock({ banner }: { banner: CatalogBanner }) {
  const bg = banner.backgroundColor || '#120D0A';
  const dark = isDarkColor(bg);
  return (
    <div
      className="my-8 flex flex-col items-center justify-center p-8 text-center break-inside-avoid"
      style={{ backgroundColor: bg, color: dark ? '#F5EFE6' : '#120D0A' }}
    >
      {banner.imageUrl && (
        <div className="relative mb-4 h-40 w-full overflow-hidden">
          <Image src={banner.imageUrl} alt="" fill className="object-cover" sizes="900px" />
        </div>
      )}
      {banner.title && <h3 className="font-heading text-xl uppercase tracking-[0.15em]">{banner.title}</h3>}
      {banner.title && banner.subtitle && <span className="my-3 block h-px w-9 bg-gold" />}
      {banner.subtitle && <p className="text-sm opacity-80">{banner.subtitle}</p>}
    </div>
  );
}

/** HTML/Tailwind rendering of the same CatalogModel the final react-pdf
 *  document consumes — content/grouping can never drift from the PDF, only
 *  the rendering technology differs (fast DOM preview vs. real PDF). */
export default function CatalogHTMLPreview({ model, categoryNameById, brandNameById }: CatalogHTMLPreviewProps) {
  const labels = catalogLabels(model.language);
  const gridColsClass =
    model.productsPerRow === 3
      ? 'grid grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-3 sm:gap-4'
      : 'grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-3 sm:gap-4';

  const edition = new Date().toLocaleDateString(labels.dateLocale, { year: 'numeric', month: 'long' });
  const contactLine = [model.cover.website, model.cover.email, model.cover.phone].filter(Boolean).join('  ·  ');
  const leadingBanners = model.bannersByGroupId.get(null) || [];
  const logo = model.cover.logoUrl || '/images/cangday-logo-pdf.png';

  return (
    <div id="printable-catalog" className="bg-[#FBF8F3] text-[#120D0A]">
      {/* Cover */}
      <div className="relative overflow-hidden bg-[#120D0A] text-[#F5EFE6] print:break-after-page">
        {model.cover.coverImageUrl && (
          <div className="relative h-56 sm:h-80">
            <Image src={model.cover.coverImageUrl} alt="" fill className="object-cover opacity-80" sizes="1000px" />
          </div>
        )}
        <div className="pointer-events-none absolute inset-3 border border-gold/50 sm:inset-5" />
        <div className="relative flex flex-col items-center px-6 py-14 text-center sm:py-20">
          {model.cover.seasonName && (
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">{model.cover.seasonName}</p>
          )}
          <div className="relative h-20 w-60 sm:h-24 sm:w-72">
            <Image src={logo} alt="Cangday" fill sizes="288px" className="object-contain" />
          </div>
          <span className="my-6 block h-px w-12 bg-gold" />
          <h1 className="font-heading text-3xl uppercase tracking-[0.12em] sm:text-4xl">{model.cover.title}</h1>
          {model.cover.subtitle && <p className="mt-2 text-sm opacity-70">{model.cover.subtitle}</p>}
          {model.cover.description && !model.cover.coverImageUrl && (
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed opacity-60">{model.cover.description}</p>
          )}
          <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">
            {labels.groups(model.groups.length, model.groupBy === 'brand')} · {labels.products(model.totalProductCount)}
          </p>
          {contactLine && <p className="mt-8 text-xs opacity-60">{contactLine}</p>}
          <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-gold/80">{labels.edition(edition)}</p>
        </div>
      </div>

      <div className="mx-auto max-w-5xl p-4 sm:p-8 print:p-0">
        {leadingBanners.map((banner) => (
          <CatalogBannerBlock key={banner.id} banner={banner} />
        ))}

        {/* Groups */}
        <div className="space-y-12">
          {model.groups.map((group, idx) => {
            const trailingBanners = model.bannersByGroupId.get(group.id) || [];
            return (
              <div key={group.id}>
                <div className="mb-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold-deep">{String(idx + 1).padStart(2, '0')}</p>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <h3 className="font-heading text-2xl">{group.name}</h3>
                    <span className="text-xs text-[#6E655C]">{labels.items(group.products.length)}</span>
                  </div>
                  <div className="mt-2 flex">
                    <span className="h-px w-10 bg-gold" />
                    <span className="h-px flex-1 bg-[#E4D9C6]" />
                  </div>
                </div>

                <div className={gridColsClass}>
                  {group.products.map((product) => {
                    const price = model.visibleFields.price ? catalogPrice(product, model.visibleFields.discount) : null;
                    const label =
                      model.groupBy === 'category'
                        ? product.brand_id && brandNameById.get(product.brand_id)
                        : product.category_id && categoryNameById.get(product.category_id);
                    const description = model.visibleFields.description ? catalogDescription(product, model.language) : '';

                    return (
                      <div key={product.id} className="flex flex-col border border-[#E4D9C6] bg-white break-inside-avoid">
                        <div className="relative aspect-[4/5] w-full bg-white">
                          <Image
                            src={product.images?.[0] || '/placeholder.svg'}
                            alt={product.name_en}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-contain p-3"
                          />
                          <div className="absolute inset-x-2 top-2 flex justify-between">
                            {model.visibleFields.popular && product.is_popular ? (
                              <span className="bg-gold px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#120D0A]">{labels.popular}</span>
                            ) : (
                              <span />
                            )}
                            {model.visibleFields.stock && !product.stock && (
                              <span className="bg-[#5E1F2A] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">{labels.outOfStock}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col border-t border-[#E4D9C6] p-3">
                          {model.visibleFields.category && label && (
                            <p className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-gold-deep">{label}</p>
                          )}
                          <h4 className="font-heading text-sm leading-snug">{product.name_en}</h4>
                          {description && (
                            <p className="mt-1.5 text-[11px] leading-relaxed text-[#6E655C]">
                              {clip(description, model.productsPerRow === 3 ? 140 : 78)}
                            </p>
                          )}
                          <div className="flex-1" />
                          {price && (
                            <div className="mt-2 flex items-baseline gap-2 text-sm font-bold">
                              {price.was && <span className="text-xs font-normal text-[#6E655C] line-through">{formatCurrency(price.was)}</span>}
                              <span>
                                {model.language === 'tr'
                                  ? `${formatCurrency(price.price)}${price.from ? `'den ${labels.from}` : ''}`
                                  : `${price.from ? `${labels.from} ` : ''}${formatCurrency(price.price)}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {trailingBanners.map((banner) => (
                  <CatalogBannerBlock key={banner.id} banner={banner} />
                ))}
              </div>
            );
          })}

          {model.groups.length === 0 && <div className="py-20 text-center text-gray-500">No products match these settings.</div>}
        </div>
      </div>
    </div>
  );
}
