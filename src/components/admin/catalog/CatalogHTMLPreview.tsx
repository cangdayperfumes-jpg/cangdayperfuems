'use client';

import Image from 'next/image';
import { CatalogModel, CatalogBanner } from './types';

interface CatalogHTMLPreviewProps {
  model: CatalogModel;
  categoryNameById: Map<string, string>;
  brandNameById: Map<string, string>;
}

const formatPrice = (amount: number) => `$${amount.toFixed(2)}`;

function CatalogBannerBlock({ banner }: { banner: CatalogBanner }) {
  return (
    <div
      className="my-10 flex flex-col items-center justify-center rounded-sm p-8 text-center break-inside-avoid"
      style={{ backgroundColor: banner.backgroundColor || '#F5F5F5' }}
    >
      {banner.imageUrl && (
        <div className="relative mb-4 h-40 w-full max-w-2xl overflow-hidden">
          <Image src={banner.imageUrl} alt="" fill className="object-cover" sizes="700px" />
        </div>
      )}
      {banner.title && (
        <h3 className="text-xl font-playfair font-bold uppercase tracking-[0.15em]">{banner.title}</h3>
      )}
      {banner.subtitle && <p className="mt-2 text-sm text-gray-600">{banner.subtitle}</p>}
    </div>
  );
}

/** HTML/Tailwind rendering of the same CatalogModel the final react-pdf
 *  document consumes — content/grouping can never drift from the PDF, only
 *  the rendering technology differs (fast DOM preview vs. real PDF). */
export default function CatalogHTMLPreview({ model, categoryNameById, brandNameById }: CatalogHTMLPreviewProps) {
  const gridColsClass =
    model.productsPerRow === 3
      ? 'grid grid-cols-2 md:grid-cols-3 print:grid-cols-3 gap-x-4 gap-y-10 sm:gap-x-8 sm:gap-y-16'
      : 'grid grid-cols-2 md:grid-cols-4 print:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-8 sm:gap-y-16';

  const generatedDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const contactLine = [model.cover.phone, model.cover.email, model.cover.website].filter(Boolean).join('  •  ');
  const leadingBanners = model.bannersByGroupId.get(null) || [];

  return (
    <div id="printable-catalog" className="mx-auto max-w-5xl p-4 sm:p-8 print:m-0 print:p-0">
      {/* Cover */}
      <div className="mb-10 border-b-2 border-black pb-8 text-center sm:mb-16">
        {model.cover.coverImageUrl && (
          <div className="relative -mx-4 mb-8 h-48 sm:-mx-8 sm:h-64 print:mx-0">
            <Image src={model.cover.coverImageUrl} alt="" fill className="object-cover" sizes="1000px" />
          </div>
        )}
        {model.cover.logoUrl ? (
          <div className="relative mx-auto mb-6 h-20 w-40 sm:h-24 sm:w-48">
            <Image src={model.cover.logoUrl} alt="Logo" fill sizes="192px" className="object-contain" />
          </div>
        ) : (
          <h1 className="mb-4 font-playfair text-3xl font-bold sm:text-5xl">{model.cover.title || 'Product Catalog'}</h1>
        )}
        {model.cover.subtitle && <p className="text-lg text-gray-600">{model.cover.subtitle}</p>}
        {model.cover.seasonName && (
          <h2 className="mt-4 text-xl uppercase tracking-widest text-gray-500">{model.cover.seasonName}</h2>
        )}
        {model.cover.description && (
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-gray-600">{model.cover.description}</p>
        )}

        <div className="mx-auto mt-6 w-32 border-b border-gray-300" />

        <div className="mt-4 space-y-1 text-xs text-gray-500">
          {model.cover.companyName && <p>{model.cover.companyName}</p>}
          {model.cover.address && <p>{model.cover.address}</p>}
          {contactLine && <p>{contactLine}</p>}
          {model.cover.social && <p>{model.cover.social}</p>}
        </div>

        <p className="mt-4 text-xs text-gray-400">
          {model.groups.length} {model.groups.length === 1 ? 'Category' : 'Categories'} • {model.totalProductCount}{' '}
          {model.totalProductCount === 1 ? 'Product' : 'Products'}
        </p>
        <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-300">Generated {generatedDate}</p>
      </div>

      {leadingBanners.map((banner) => (
        <CatalogBannerBlock key={banner.id} banner={banner} />
      ))}

      {/* Groups */}
      <div className="space-y-16 sm:space-y-24">
        {model.groups.map((group, idx) => {
          const trailingBanners = model.bannersByGroupId.get(group.id) || [];
          return (
            <div key={group.id} className={idx > 0 ? 'print:break-before-page' : ''}>
              <div className="mb-10 text-center">
                <h3 className="inline-block border-b border-black px-4 pb-4 font-playfair text-2xl uppercase tracking-[0.1em] text-black sm:px-8 sm:text-3xl sm:tracking-[0.2em] md:text-4xl">
                  {group.name}
                </h3>
              </div>

              <div className={gridColsClass}>
                {group.products.map((product) => {
                  const hasDiscount = model.visibleFields.discount && product.discount > 0;
                  const finalPrice = hasDiscount ? product.price - product.discount : product.price;
                  const label =
                    model.groupBy === 'category'
                      ? product.brand_id && brandNameById.get(product.brand_id)
                      : product.category_id && categoryNameById.get(product.category_id);

                  return (
                    <div key={product.id} className="flex flex-col items-center break-inside-avoid text-center">
                      <div className="group relative mb-4 aspect-[4/5] w-full overflow-hidden bg-[#F9F9F9]">
                        <Image
                          src={product.images?.[0] || '/placeholder.svg'}
                          alt={product.name_en}
                          fill
                          sizes="(max-width: 768px) 50vw, 25vw"
                          className="object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="px-2">
                        <h3 className="line-clamp-2 font-heading text-sm font-bold uppercase leading-snug tracking-wide md:text-base">
                          {product.name_en}
                        </h3>

                        {model.visibleFields.category && label && (
                          <p className="mt-1 text-[9px] uppercase tracking-widest text-gray-400">{label}</p>
                        )}

                        {(model.visibleFields.popular && product.is_popular) ||
                        (model.visibleFields.stock && !product.stock) ? (
                          <div className="mt-2 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest">
                            {model.visibleFields.popular && product.is_popular && (
                              <span className="text-amber-600">★ Popular</span>
                            )}
                            {model.visibleFields.stock && !product.stock && (
                              <span className="text-red-600">Out of Stock</span>
                            )}
                          </div>
                        ) : null}

                        {model.visibleFields.description && product.description_en && (
                          <p className="mx-auto mt-3 line-clamp-3 max-w-[90%] text-[11px] leading-relaxed text-gray-500">
                            {product.description_en}
                          </p>
                        )}

                        {model.visibleFields.price && (
                          <div className="mt-3 flex items-center justify-center gap-2 text-sm font-medium text-black">
                            {hasDiscount && (
                              <span className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</span>
                            )}
                            <span>{formatPrice(finalPrice)}</span>
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

        {model.groups.length === 0 && (
          <div className="py-20 text-center text-gray-500">No products found matching the selected filters.</div>
        )}
      </div>
    </div>
  );
}
