import { View, Text, Image } from '@react-pdf/renderer';
import { catalogStyles as styles } from './catalogStyles';
import { CatalogBanner } from './types';

interface CatalogPromoBannerProps {
  banner: CatalogBanner;
  imageSrc?: string;
}

export default function CatalogPromoBanner({ banner, imageSrc }: CatalogPromoBannerProps) {
  return (
    <View
      style={[styles.banner, { backgroundColor: banner.backgroundColor || '#F5F5F5' }]}
      wrap={false}
    >
      {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML img, no alt prop exists */}
      {imageSrc ? <Image src={imageSrc} style={styles.bannerImage} /> : null}
      {banner.title ? <Text style={styles.bannerTitle}>{banner.title}</Text> : null}
      {banner.subtitle ? <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text> : null}
    </View>
  );
}
