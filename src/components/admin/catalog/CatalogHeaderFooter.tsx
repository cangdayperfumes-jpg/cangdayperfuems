import { View, Text, Image } from '@react-pdf/renderer';
import { catalogStyles as styles } from './catalogStyles';
import { PDF_LOGO_SRC } from '@/lib/pdf-brand';
import { CatalogHeaderFooterConfig } from './types';
import type { CatalogLabels } from './catalogLabels';

/** Running header: logo left, catalog title / season right. Sits inside the page's top padding band. */
export function CatalogHeader({ headerFooter, title }: { headerFooter: CatalogHeaderFooterConfig; title: string }) {
  return (
    <View style={styles.headerRow} fixed>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML img, no alt prop exists */}
      <Image src={headerFooter.logoUrl || PDF_LOGO_SRC} style={styles.headerLogo} />
      {title ? <Text style={styles.headerText}>{title}</Text> : null}
    </View>
  );
}

/** Running footer: copyright · website · phone left, page number right. */
export function CatalogFooter({ headerFooter, labels }: { headerFooter: CatalogHeaderFooterConfig; labels: CatalogLabels }) {
  const leftLine = [headerFooter.copyrightText, headerFooter.website, headerFooter.phone, headerFooter.social]
    .filter(Boolean)
    .join('   ·   ');

  return (
    <View style={styles.footerRow} fixed>
      <Text style={styles.footerText}>{leftLine}</Text>
      <Text style={styles.footerPage} render={({ pageNumber, totalPages }) => labels.page(pageNumber, totalPages)} fixed />
    </View>
  );
}
