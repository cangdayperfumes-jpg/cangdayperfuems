import { View, Text, Image } from '@react-pdf/renderer';
import { catalogStyles as styles } from './catalogStyles';
import { CatalogHeaderFooterConfig } from './types';

export function CatalogHeader({ headerFooter }: { headerFooter: CatalogHeaderFooterConfig }) {
  const contactLine = [headerFooter.website, headerFooter.phone, headerFooter.email].filter(Boolean).join('   •   ');
  if (!headerFooter.logoUrl && !contactLine) return null;

  return (
    <View style={styles.headerRow} fixed>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML img, no alt prop exists */}
      {headerFooter.logoUrl ? <Image src={headerFooter.logoUrl} style={styles.headerLogo} /> : <View />}
      {contactLine ? <Text style={styles.headerText}>{contactLine}</Text> : null}
    </View>
  );
}

export function CatalogFooter({ headerFooter }: { headerFooter: CatalogHeaderFooterConfig }) {
  const leftLine = [headerFooter.copyrightText, headerFooter.social].filter(Boolean).join('   •   ');

  return (
    <View style={styles.footerRow} fixed>
      <Text style={styles.footerText}>{leftLine}</Text>
      <Text
        style={styles.footerText}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
        fixed
      />
    </View>
  );
}
