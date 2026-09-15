import { Fragment } from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { catalogStyles as styles } from './catalogStyles';
import { CatalogModel } from './types';
import CatalogCoverPage from './CatalogCoverPage';
import CatalogTOC from './CatalogTOC';
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
  imageWatermarkLogoSrc?: string;
}

export default function CatalogPDF({
  model,
  imagesByProductId,
  bannerImagesById,
  categoryNameById,
  brandNameById,
  imageWatermarkLogoSrc,
}: CatalogPDFProps) {
  const leadingBanners = model.bannersByGroupId.get(null) || [];
  const defaultWatermarkText = model.cover.companyName || 'ROYAL PERFUMES';

  return (
    <Document>
      <CatalogCoverPage
        cover={model.cover}
        totalProductCount={model.totalProductCount}
        groupCount={model.groups.length}
        watermarkLines={model.watermarkLines}
      />
      <CatalogTOC groups={model.groups} watermarkLines={model.watermarkLines} defaultWatermarkText={defaultWatermarkText} />

      <Page size="A4" style={styles.page}>
        <CatalogPageWatermark lines={model.watermarkLines} defaultText={defaultWatermarkText} />
        <CatalogHeader headerFooter={model.headerFooter} />
        <CatalogFooter headerFooter={model.headerFooter} />

        {leadingBanners.map((banner) => (
          <CatalogPromoBanner key={banner.id} banner={banner} imageSrc={bannerImagesById.get(banner.id)} />
        ))}

        {model.groups.map((group) => {
          const trailingBanners = model.bannersByGroupId.get(group.id) || [];
          return (
            <Fragment key={group.id}>
              <CatalogProductGroup
                group={group}
                groupBy={model.groupBy}
                productsPerRow={model.productsPerRow}
                visibleFields={model.visibleFields}
                imagesByProductId={imagesByProductId}
                categoryNameById={categoryNameById}
                brandNameById={brandNameById}
                imageWatermark={model.imageWatermark}
                imageWatermarkLogoSrc={imageWatermarkLogoSrc}
                defaultWatermarkText={defaultWatermarkText}
              />
              {trailingBanners.map((banner) => (
                <CatalogPromoBanner key={banner.id} banner={banner} imageSrc={bannerImagesById.get(banner.id)} />
              ))}
            </Fragment>
          );
        })}
      </Page>
    </Document>
  );
}
