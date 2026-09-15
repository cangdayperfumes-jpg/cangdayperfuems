import { View, Text } from '@react-pdf/renderer';
import { catalogStyles as styles } from './catalogStyles';
import { CatalogWatermarkLine } from './types';

interface CatalogPageWatermarkProps {
  lines: CatalogWatermarkLine[];
  /** Used for any enabled line whose own text is left blank. */
  defaultText: string;
}

/**
 * Evenly spreads N lines from just below the header to just above the
 * footer. A single enabled line keeps the original centered (46%) position
 * so existing catalogs look unchanged.
 */
function computeTopOffsets(count: number): string[] {
  if (count <= 1) return ['46%'];
  const start = 12;
  const end = 90;
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, i) => `${Math.round(start + step * i)}%`);
}

/**
 * Faint diagonal brand mark(s). Rendered with `fixed` so react-pdf repeats
 * them on every physical page auto-generated from a single logical <Page> —
 * same mechanism CatalogHeader/CatalogFooter use.
 */
export default function CatalogPageWatermark({ lines, defaultText }: CatalogPageWatermarkProps) {
  const enabledLines = lines.filter((line) => line.enabled);
  if (enabledLines.length === 0) return null;

  const tops = computeTopOffsets(enabledLines.length);

  return (
    <>
      {enabledLines.map((line, index) => (
        <View key={line.id} style={[styles.pageWatermark, { top: tops[index] }]} fixed>
          <Text style={[styles.pageWatermarkText, { opacity: line.opacity }]}>
            {(line.text.trim() || defaultText).toUpperCase()}
          </Text>
        </View>
      ))}
    </>
  );
}
