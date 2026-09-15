import { View, Text } from '@react-pdf/renderer';
import { catalogStyles as styles } from './catalogStyles';
import {
  CatalogImageWatermarkConfig,
  CatalogModelGroup,
  CatalogVisibleFields,
  CatalogGroupBy,
  CatalogProductsPerRow,
  groupAnchorId,
} from './types';
import CatalogProductCard from './CatalogProductCard';

interface CatalogProductGroupProps {
  group: CatalogModelGroup;
  groupBy: CatalogGroupBy;
  productsPerRow: CatalogProductsPerRow;
  visibleFields: CatalogVisibleFields;
  imagesByProductId: Map<string, string>;
  categoryNameById: Map<string, string>;
  brandNameById: Map<string, string>;
  imageWatermark: CatalogImageWatermarkConfig;
  imageWatermarkLogoSrc?: string;
  defaultWatermarkText: string;
}

// Tallest a single product card row realistically gets (image + name + tag +
// badge + 2-line description + price, per catalogStyles' card metrics) — the
// heading's minPresenceAhead so react-pdf pushes a section title to the next
// page rather than stranding it alone at the bottom with no row under it.
const MIN_SPACE_FOR_HEADING_AND_ROW = 235;

export default function CatalogProductGroup({
  group,
  groupBy,
  productsPerRow,
  visibleFields,
  imagesByProductId,
  categoryNameById,
  brandNameById,
  imageWatermark,
  imageWatermarkLogoSrc,
  defaultWatermarkText,
}: CatalogProductGroupProps) {
  const slotStyle = productsPerRow === 3 ? styles.cardSlot3 : styles.cardSlot4;

  return (
    <View>
      <Text
        id={groupAnchorId(group.id)}
        style={styles.groupHeading}
        minPresenceAhead={MIN_SPACE_FOR_HEADING_AND_ROW}
      >
        {group.name}
      </Text>
      <View style={styles.grid}>
        {group.products.map((product) => {
          // Show the *other* dimension as a tag — brand when grouped by
          // category, category when grouped by brand — since the group's
          // own name is already the section heading.
          const label =
            groupBy === 'category'
              ? (product.brand_id && brandNameById.get(product.brand_id)) || undefined
              : (product.category_id && categoryNameById.get(product.category_id)) || undefined;

          return (
            <View key={product.id} style={slotStyle}>
              <CatalogProductCard
                product={product}
                imageSrc={imagesByProductId.get(product.id) || ''}
                groupLabel={label}
                visibleFields={visibleFields}
                imageWatermark={imageWatermark}
                imageWatermarkLogoSrc={imageWatermarkLogoSrc}
                defaultWatermarkText={defaultWatermarkText}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}
