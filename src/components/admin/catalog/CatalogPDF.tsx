import { Fragment } from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { catalogStyles as styles } from './catalogStyles';
import { registerPdfFonts } from '@/lib/pdf-brand';
import { CatalogModel } from './types';
import { catalogLabels, catalogPrice } from './catalogLabels';
import CatalogCoverPage from './CatalogCoverPage';
import CatalogTOC from './CatalogTOC';
import CatalogBackCover from './CatalogBackCover';
import { CatalogHeader, CatalogFooter } from './CatalogHeaderFooter';
import CatalogProductGroup from './CatalogProductGroup';
import CatalogPromoBanner from './CatalogPromoBanner';
import CatalogPageWatermark from './CatalogWatermark';

interface CatalogPDFProps {
  model: CatalogModel;
  imagesByProductId: Map<string, string>;
  bannerImagesById: Map<string, string>;
  categoryNameById: Map<string, string>;
  brandNameById: Map<string, string>;
}

/** Cover → contents → products (auto-paginated, fixed header/footer) → back cover. */
export default function CatalogPDF({
  model,
  imagesByProductId,
  bannerImagesById,
  categoryNameById,
  brandNameById,
}: CatalogPDFProps) {
  registerPdfFonts();
  const labels = catalogLabels(model.language);
  const leadingBanners = model.bannersByGroupId.get(null) || [];
  const defaultWatermarkText = model.cover.companyName || 'CANGDAY';
  const headerTitle = [model.cover.title, model.cover.seasonName].filter(Boolean).join('  ·  ');
  // Only mention prices when at least one product actually shows one.
  const showPricesNote =
    model.visibleFields.price && model.groups.some((g) => g.products.some((p) => catalogPrice(p, model.visibleFields.discount)));

  return (
    <Document title={headerTitle || 'Cangday'} author={model.cover.companyName || 'Cangday'} language={model.language}>
      <CatalogCoverPage
        cover={model.cover}
        totalProductCount={model.totalProductCount}
        groupCount={model.groups.length}
        byBrand={model.groupBy === 'brand'}
        labels={labels}
        watermarkLines={model.watermarkLines}
      />
      {model.groups.length > 1 ? (
        <CatalogTOC
          groups={model.groups}
          labels={labels}
          headerFooter={model.headerFooter}
          headerTitle={headerTitle}
          showPricesNote={showPricesNote}
          watermarkLines={model.watermarkLines}
          defaultWatermarkText={defaultWatermarkText}
        />
      ) : null}

      <Page size="A4" style={styles.page}>
        <CatalogPageWatermark lines={model.watermarkLines} defaultText={defaultWatermarkText} />
        <CatalogHeader headerFooter={model.headerFooter} title={headerTitle} />
        <CatalogFooter headerFooter={model.headerFooter} labels={labels} />

        {leadingBanners.map((banner) => (
          <CatalogPromoBanner key={banner.id} banner={banner} imageSrc={bannerImagesById.get(banner.id)} />
        ))}

        {model.groups.map((group, index) => {
          const trailingBanners = model.bannersByGroupId.get(group.id) || [];
          return (
            <Fragment key={group.id}>
              <CatalogProductGroup
                group={group}
                index={index}
                groupBy={model.groupBy}
                productsPerRow={model.productsPerRow}
                visibleFields={model.visibleFields}
                language={model.language}
                labels={labels}
                imagesByProductId={imagesByProductId}
                categoryNameById={categoryNameById}
                brandNameById={brandNameById}
              />
              {trailingBanners.map((banner) => (
                <CatalogPromoBanner key={banner.id} banner={banner} imageSrc={bannerImagesById.get(banner.id)} />
              ))}
            </Fragment>
          );
        })}
      </Page>

      <CatalogBackCover cover={model.cover} labels={labels} showPricesNote={showPricesNote} />
    </Document>
  );
}
