import { View, Text, Image } from '@react-pdf/renderer';
import { catalogStyles as styles } from './catalogStyles';
import { Product } from '@/types';
import { CatalogImageWatermarkConfig, CatalogVisibleFields } from './types';

interface CatalogProductCardProps {
  product: Product;
  imageSrc: string;
  groupLabel?: string;
  visibleFields: CatalogVisibleFields;
  imageWatermark: CatalogImageWatermarkConfig;
  imageWatermarkLogoSrc?: string;
  /** Used when imageWatermark.text is left blank. */
  defaultWatermarkText: string;
}

const formatPrice = (amount: number) => `$${amount.toFixed(2)}`;

// react-pdf's Text primitive has no native outline/stroke — `stroke` and
// `strokeWidth` styles only apply to SVG shapes, not text glyphs. Fake it by
// stacking the same string in the outline color at 4 diagonal offsets behind
// the real (fill-colored) text on top.
const STROKE_OFFSETS: [number, number][] = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

function ImageWatermarkText({ config, text }: { config: CatalogImageWatermarkConfig; text: string }) {
  const baseTextStyle = {
    fontSize: config.fontSize,
    fontFamily: 'Helvetica-Bold' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
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
              {
                color: config.strokeColor,
                opacity: config.opacity,
                top: dy * config.strokeWidth,
                left: dx * config.strokeWidth,
              },
            ]}
          >
            {text}
          </Text>
        ))}
      <Text style={[baseTextStyle, { color: '#000000', opacity: config.opacity }]}>{text}</Text>
    </View>
  );
}

export default function CatalogProductCard({
  product,
  imageSrc,
  groupLabel,
  visibleFields,
  imageWatermark,
  imageWatermarkLogoSrc,
  defaultWatermarkText,
}: CatalogProductCardProps) {
  // discount is stored as a flat amount, not a percentage — see ProductCard.tsx
  const hasDiscount = visibleFields.discount && product.discount > 0;
  const finalPrice = hasDiscount ? product.price - product.discount : product.price;
  const showOutOfStock = visibleFields.stock && !product.stock;
  const showPopular = visibleFields.popular && product.is_popular;

  return (
    <View style={styles.card} wrap={false}>
      <View style={styles.cardImageWrap}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML img, no alt prop exists */}
        <Image src={imageSrc} style={styles.cardImage} />
        {imageWatermark.mode === 'text' && (
          <View style={styles.imageWatermarkOverlay}>
            <ImageWatermarkText
              config={imageWatermark}
              text={(imageWatermark.text.trim() || defaultWatermarkText).toUpperCase()}
            />
          </View>
        )}
        {imageWatermark.mode === 'logo' && imageWatermarkLogoSrc && (
          <View style={styles.imageWatermarkOverlay}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image is not an HTML img, no alt prop exists */}
            <Image
              src={imageWatermarkLogoSrc}
              style={{ width: `${imageWatermark.logoSize}%`, opacity: imageWatermark.opacity }}
            />
          </View>
        )}
      </View>

      <Text style={styles.cardName}>{product.name_en}</Text>

      {visibleFields.category && groupLabel ? <Text style={styles.cardTag}>{groupLabel}</Text> : null}

      {showPopular || showOutOfStock ? (
        <View style={styles.cardBadgeRow}>
          {showPopular ? <Text style={styles.cardBadgePopular}>★ Popular</Text> : null}
          {showOutOfStock ? <Text style={styles.cardBadgeOutOfStock}>Out of Stock</Text> : null}
        </View>
      ) : null}

      {visibleFields.description && product.description_en ? (
        <Text style={styles.cardDescription}>
          {product.description_en.length > 140
            ? `${product.description_en.slice(0, 140)}…`
            : product.description_en}
        </Text>
      ) : null}

      {visibleFields.price ? (
        <View style={styles.cardPriceRow}>
          {hasDiscount ? <Text style={styles.cardPriceStrike}>{formatPrice(product.price)}</Text> : null}
          <Text style={styles.cardPrice}>{formatPrice(finalPrice)}</Text>
        </View>
      ) : null}
    </View>
  );
}
