import { View, Text, Image } from '@react-pdf/renderer';
import { PDF_FONT_BODY } from '@/lib/pdf-brand';
import { formatCurrency } from '@/lib/utils';
import { CARD_GAP, cardImageHeight, cardWidth, catalogStyles as styles } from './catalogStyles';
import { Product } from '@/types';
import { CatalogImageWatermarkConfig, CatalogLanguage, CatalogVisibleFields } from './types';
import { catalogDescription, catalogPrice, clip, type CatalogLabels } from './catalogLabels';

interface CatalogProductCardProps {
  product: Product;
  perRow: number;
  isLast: boolean;
  imageSrc: string;
  groupLabel?: string;
  visibleFields: CatalogVisibleFields;
  language: CatalogLanguage;
  labels: CatalogLabels;
  imageWatermark: CatalogImageWatermarkConfig;
  imageWatermarkLogoSrc?: string;
  /** Used when imageWatermark.text is left blank. */
  defaultWatermarkText: string;
}

// react-pdf's Text primitive has no native outline/stroke — fake it by
// stacking the same string in the outline color at 4 diagonal offsets
// behind the real (fill-colored) text on top.
const STROKE_OFFSETS: [number, number][] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

function ImageWatermarkText({ config, text }: { config: CatalogImageWatermarkConfig; text: string }) {
  const baseTextStyle = {
    fontSize: config.fontSize,
    fontFamily: PDF_FONT_BODY,
    fontWeight: 700 as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
    transform: 'rotate(-30deg)',
  };

  return (
    <View style={styles.imageWatermarkStack}>
      {config.strokeWidth > 0 &&
        STROKE_OFFSETS.map(([dx, dy]) => (
          <Text
            key={`${dx}-${dy}`}
            style={[
              styles.imageWatermarkStrokeText,
              baseTextStyle,
              { color: config.strokeColor, opacity: config.opacity, top: dy * config.strokeWidth, left: dx * config.strokeWidth },
            ]}
          >
            {text}
          </Text>
        ))}
      <Text style={[baseTextStyle, { color: '#120D0A', opacity: config.opacity }]}>{text}</Text>
    </View>
  );
}

export default function CatalogProductCard({
  product,
  perRow,
  isLast,
  imageSrc,
  groupLabel,
  visibleFields,
  language,
  labels,
  imageWatermark,
  imageWatermarkLogoSrc,
  defaultWatermarkText,
}: CatalogProductCardProps) {
  // discount is a flat amount, not a percentage — see ProductCard.tsx
  const price = visibleFields.price ? catalogPrice(product, visibleFields.discount) : null;
  const showOutOfStock = visibleFields.stock && !product.stock;
  const showPopular = visibleFields.popular && product.is_popular;
  const roomy = perRow === 3;
  const description = visibleFields.description ? catalogDescription(product, language) : '';

  return (
    <View style={[styles.card, { width: cardWidth(perRow), marginRight: isLast ? 0 : CARD_GAP }]}>
      <View style={[styles.cardImageWrap, { height: cardImageHeight(perRow) }]}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML img, no alt prop exists */}
        <Image src={imageSrc} style={styles.cardImage} />
        {imageWatermark.mode === 'text' && (
          <View style={styles.imageWatermarkOverlay}>
            <ImageWatermarkText config={imageWatermark} text={(imageWatermark.text.trim() || defaultWatermarkText).toUpperCase()} />
          </View>
        )}
        {imageWatermark.mode === 'logo' && imageWatermarkLogoSrc && (
          <View style={styles.imageWatermarkOverlay}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML img, no alt prop exists */}
            <Image src={imageWatermarkLogoSrc} style={{ width: `${imageWatermark.logoSize}%`, opacity: imageWatermark.opacity }} />
          </View>
        )}
        {showPopular || showOutOfStock ? (
          <View style={styles.badgeRow}>
            {showPopular ? <Text style={styles.badgePopular}>{labels.popular}</Text> : <View />}
            {showOutOfStock ? <Text style={styles.badgeStock}>{labels.outOfStock}</Text> : null}
          </View>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        {visibleFields.category && groupLabel ? <Text style={styles.cardTag}>{clip(groupLabel, 34)}</Text> : null}
        <Text style={[styles.cardName, { fontSize: roomy ? 10 : 8.6 }]}>{clip(product.name_en, roomy ? 90 : 66)}</Text>
        {description ? <Text style={styles.cardDescription}>{clip(description, roomy ? 140 : 78)}</Text> : null}
        <View style={styles.cardSpacer} />
        {price ? (
          <View style={styles.cardPriceRow}>
            {price.was ? <Text style={styles.cardPriceStrike}>{formatCurrency(price.was)}</Text> : null}
            <Text style={styles.cardPrice}>
              {language === 'tr'
                ? `${formatCurrency(price.price)}${price.from ? `'den ${labels.from}` : ''}`
                : `${price.from ? `${labels.from} ` : ''}${formatCurrency(price.price)}`}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}
