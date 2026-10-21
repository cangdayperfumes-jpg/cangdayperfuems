import { View, Text, Image } from '@react-pdf/renderer';
import { PDF_COLORS } from '@/lib/pdf-brand';
import { catalogStyles as styles } from './catalogStyles';
import { CatalogBanner } from './types';
import { isDarkColor } from './catalogLabels';

interface CatalogPromoBannerProps {
  banner: CatalogBanner;
  imageSrc?: string;
}

export default function CatalogPromoBanner({ banner, imageSrc }: CatalogPromoBannerProps) {
  const bg = banner.backgroundColor || PDF_COLORS.ink;
  const text = isDarkColor(bg) ? PDF_COLORS.ivory : PDF_COLORS.ink;

  return (
    <View style={[styles.banner, { backgroundColor: bg }]} wrap={false}>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML img, no alt prop exists */}
      {imageSrc ? <Image src={imageSrc} style={styles.bannerImage} /> : null}
      {banner.title ? <Text style={[styles.bannerTitle, { color: text }]}>{banner.title}</Text> : null}
      {banner.title && banner.subtitle ? <View style={styles.bannerRule} /> : null}
      {banner.subtitle ? <Text style={[styles.bannerSubtitle, { color: text, opacity: 0.8 }]}>{banner.subtitle}</Text> : null}
    </View>
  );
}
