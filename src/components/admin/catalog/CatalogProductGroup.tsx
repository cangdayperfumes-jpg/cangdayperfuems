import { View, Text } from '@react-pdf/renderer';
import { catalogStyles as styles } from './catalogStyles';
import {
  CatalogImageWatermarkConfig,
  CatalogLanguage,
  CatalogModelGroup,
  CatalogVisibleFields,
  CatalogGroupBy,
  CatalogProductsPerRow,
  groupAnchorId,
} from './types';
import type { CatalogLabels } from './catalogLabels';
import CatalogProductCard from './CatalogProductCard';
import type { Product } from '@/types';

interface CatalogProductGroupProps {
  group: CatalogModelGroup;
  index: number;
  groupBy: CatalogGroupBy;
  productsPerRow: CatalogProductsPerRow;
  visibleFields: CatalogVisibleFields;
  language: CatalogLanguage;
  labels: CatalogLabels;
  imagesByProductId: Map<string, string>;
  categoryNameById: Map<string, string>;
  brandNameById: Map<string, string>;
  imageWatermark: CatalogImageWatermarkConfig;
  imageWatermarkLogoSrc?: string;
  defaultWatermarkText: string;
}

function chunk<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

/**
 * A section of the catalog. Products are laid out as explicit rows, each
 * kept whole on one page (`wrap={false}`), instead of a single flex-wrap
 * grid — react-pdf can't split a wrapping grid across pages cleanly, which
 * is what produced overlapping / half-empty pages. The heading travels with
 * its first row so a title is never stranded at the bottom of a page.
 */
export default function CatalogProductGroup({
  group,
  index,
  groupBy,
  productsPerRow,
  visibleFields,
  language,
  labels,
  imagesByProductId,
  categoryNameById,
  brandNameById,
  imageWatermark,
  imageWatermarkLogoSrc,
  defaultWatermarkText,
}: CatalogProductGroupProps) {
  const rows = chunk(group.products, productsPerRow);

  const renderRow = (row: Product[]) => (
    <View style={styles.row}>
      {row.map((product, i) => {
        // Show the *other* dimension as a tag — brand when grouped by
        // category, category when grouped by brand.
        const label =
          groupBy === 'category'
            ? (product.brand_id && brandNameById.get(product.brand_id)) || undefined
            : (product.category_id && categoryNameById.get(product.category_id)) || undefined;
        return (
          <CatalogProductCard
            key={product.id}
            product={product}
            perRow={productsPerRow}
            isLast={i === productsPerRow - 1}
            imageSrc={imagesByProductId.get(product.id) || ''}
            groupLabel={label}
            visibleFields={visibleFields}
            language={language}
            labels={labels}
            imageWatermark={imageWatermark}
            imageWatermarkLogoSrc={imageWatermarkLogoSrc}
            defaultWatermarkText={defaultWatermarkText}
          />
        );
      })}
    </View>
  );

  return (
    <View>
      <View wrap={false}>
        <View style={styles.groupHead}>
          <Text style={styles.eyebrow}>{String(index + 1).padStart(2, '0')}</Text>
          <View style={styles.groupTitleRow}>
            <Text id={groupAnchorId(group.id)} style={styles.groupTitle}>
              {group.name}
            </Text>
            <Text style={styles.groupCount}>{labels.items(group.products.length)}</Text>
          </View>
          <View style={styles.groupRule}>
            <View style={styles.groupRuleGold} />
            <View style={styles.groupRuleLine} />
          </View>
        </View>
        {rows[0] ? renderRow(rows[0]) : null}
      </View>

      {rows.slice(1).map((row, i) => (
        <View key={i} wrap={false}>
          {renderRow(row)}
        </View>
      ))}
    </View>
  );
}
