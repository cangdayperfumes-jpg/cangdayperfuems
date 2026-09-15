import { Page, View, Text, Image } from '@react-pdf/renderer';
import { catalogStyles as styles } from './catalogStyles';
import { CatalogCoverConfig, CatalogWatermarkLine } from './types';
import CatalogPageWatermark from './CatalogWatermark';

interface CatalogCoverPageProps {
  cover: CatalogCoverConfig;
  totalProductCount: number;
  groupCount: number;
  watermarkLines: CatalogWatermarkLine[];
}

export default function CatalogCoverPage({ cover, totalProductCount, groupCount, watermarkLines }: CatalogCoverPageProps) {
  const generatedDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const contactLine = [cover.phone, cover.email, cover.website].filter(Boolean).join('   •   ');

  return (
    <Page size="A4" style={styles.coverPage}>
      <CatalogPageWatermark lines={watermarkLines} defaultText={cover.companyName || 'ROYAL PERFUMES'} />
      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML img, no alt prop exists */}
      {cover.coverImageUrl ? <Image src={cover.coverImageUrl} style={styles.coverImage} /> : null}

      <View style={styles.coverBody}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML img, no alt prop exists */}
        {cover.logoUrl ? <Image src={cover.logoUrl} style={styles.coverLogo} /> : null}

        <Text style={styles.coverTitle}>{cover.title || 'Product Catalog'}</Text>
        {cover.subtitle ? <Text style={styles.coverSubtitle}>{cover.subtitle}</Text> : null}
        {cover.seasonName ? <Text style={styles.coverSeason}>{cover.seasonName}</Text> : null}
        {cover.description ? <Text style={styles.coverDescription}>{cover.description}</Text> : null}

        <View style={styles.coverDivider} />

        <View style={styles.coverMetaBlock}>
          {cover.companyName ? <Text style={styles.coverMetaText}>{cover.companyName}</Text> : null}
          {cover.address ? <Text style={styles.coverMetaText}>{cover.address}</Text> : null}
          {contactLine ? <Text style={styles.coverMetaText}>{contactLine}</Text> : null}
          {cover.social ? <Text style={styles.coverMetaText}>{cover.social}</Text> : null}
        </View>

        <Text style={[styles.coverMetaText, { marginTop: 10 }]}>
          {groupCount} {groupCount === 1 ? 'Category' : 'Categories'} • {totalProductCount}{' '}
          {totalProductCount === 1 ? 'Product' : 'Products'}
        </Text>
        <Text style={styles.coverDate}>Generated {generatedDate}</Text>
      </View>
    </Page>
  );
}
