import { Page, View, Text, Image } from '@react-pdf/renderer';
import { catalogStyles as styles } from './catalogStyles';
import { PDF_LOGO_SRC } from '@/lib/pdf-brand';
import { CatalogCoverConfig } from './types';
import type { CatalogLabels } from './catalogLabels';

/** Closing ink page: logo, slogan and where to order — mirrors the cover. */
export default function CatalogBackCover({
  cover,
  labels,
  showPricesNote,
}: {
  cover: CatalogCoverConfig;
  labels: CatalogLabels;
  showPricesNote: boolean;
}) {
  const contact = [cover.phone, cover.email].filter(Boolean).join('   ·   ');

  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverFrame} />
      <View style={styles.backInner}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML img, no alt prop exists */}
        <Image src={cover.logoUrl || PDF_LOGO_SRC} style={styles.backLogo} />
        <View style={styles.coverRule} />
        <Text style={styles.backSlogan}>{labels.slogan}</Text>
        {cover.website ? (
          <>
            <Text style={[styles.coverStats, { marginTop: 30 }]}>{labels.orderOnline}</Text>
            <Text style={[styles.backSlogan, { marginTop: 6, fontSize: 13 }]}>{cover.website}</Text>
          </>
        ) : null}
        {contact ? <Text style={[styles.coverMeta, { marginTop: 12 }]}>{contact}</Text> : null}
        {cover.social || cover.address ? (
          <Text style={styles.coverMeta}>{[cover.social, cover.address].filter(Boolean).join('   ·   ')}</Text>
        ) : null}
      </View>
      {showPricesNote ? <Text style={styles.backNote}>{labels.pricesNote}</Text> : null}
    </Page>
  );
}
