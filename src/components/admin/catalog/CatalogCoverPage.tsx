import { Page, View, Text, Image } from '@react-pdf/renderer';
import { catalogStyles as styles } from './catalogStyles';
import { PDF_LOGO_SRC } from '@/lib/pdf-brand';
import { CatalogCoverConfig, CatalogWatermarkLine } from './types';
import type { CatalogLabels } from './catalogLabels';
import CatalogPageWatermark from './CatalogWatermark';

interface CatalogCoverPageProps {
  cover: CatalogCoverConfig;
  totalProductCount: number;
  groupCount: number;
  byBrand: boolean;
  labels: CatalogLabels;
  watermarkLines: CatalogWatermarkLine[];
}

/**
 * Ink cover in the site's look: gold hairline frame, the gold Cangday logo,
 * Fraunces title. With a cover photo, the photo fills the top and the copy
 * sits below it; without one, the copy is centred on the page.
 */
export default function CatalogCoverPage({
  cover,
  totalProductCount,
  groupCount,
  byBrand,
  labels,
  watermarkLines,
}: CatalogCoverPageProps) {
  const edition = new Date().toLocaleDateString(labels.dateLocale, { year: 'numeric', month: 'long' });
  const contactLine = [cover.website, cover.email, cover.phone].filter(Boolean).join('   ·   ');
  const hasPhoto = !!cover.coverImageUrl;

  return (
    <Page size="A4" style={styles.coverPage}>
      {hasPhoto ? (
        <>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML img, no alt prop exists */}
          <Image src={cover.coverImageUrl} style={styles.coverPhoto} />
          <View style={styles.coverPhotoShade} />
        </>
      ) : null}
      <CatalogPageWatermark lines={watermarkLines} defaultText={cover.companyName || 'CANGDAY'} light />
      <View style={styles.coverFrame} />

      <View style={[styles.coverInner, hasPhoto ? { top: 440, bottom: 120 } : { top: 0, bottom: 120 }]}>
        {cover.seasonName ? <Text style={styles.coverEyebrow}>{cover.seasonName}</Text> : null}
        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML img, no alt prop exists */}
        <Image src={cover.logoUrl || PDF_LOGO_SRC} style={hasPhoto ? [styles.coverLogo, { width: 220, height: 74 }] : styles.coverLogo} />
        <View style={styles.coverRule} />
        <Text style={styles.coverTitle}>{cover.title}</Text>
        {cover.subtitle ? <Text style={styles.coverSubtitle}>{cover.subtitle}</Text> : null}
        {cover.description && !hasPhoto ? <Text style={styles.coverDescription}>{cover.description}</Text> : null}
        <Text style={styles.coverStats}>
          {labels.groups(groupCount, byBrand)}   ·   {labels.products(totalProductCount)}
        </Text>
      </View>

      <View style={styles.coverBottom}>
        {contactLine ? <Text style={styles.coverMeta}>{contactLine}</Text> : null}
        {cover.social || cover.address ? (
          <Text style={styles.coverMeta}>{[cover.social, cover.address].filter(Boolean).join('   ·   ')}</Text>
        ) : null}
        <Text style={styles.coverEdition}>{labels.edition(edition)}</Text>
      </View>
    </Page>
  );
}
