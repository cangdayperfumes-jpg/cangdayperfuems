import { Page, Text, Link, View } from '@react-pdf/renderer';
import { catalogStyles as styles } from './catalogStyles';
import { CatalogHeaderFooterConfig, CatalogModelGroup, CatalogWatermarkLine, groupAnchorId } from './types';
import type { CatalogLabels } from './catalogLabels';
import CatalogPageWatermark from './CatalogWatermark';
import { CatalogFooter, CatalogHeader } from './CatalogHeaderFooter';

interface CatalogTOCProps {
  groups: CatalogModelGroup[];
  labels: CatalogLabels;
  headerFooter: CatalogHeaderFooterConfig;
  headerTitle: string;
  showPricesNote: boolean;
  watermarkLines: CatalogWatermarkLine[];
  defaultWatermarkText: string;
}

// Real internal PDF links to each group's heading — not page-numbered,
// since react-pdf has no first-class way to know a link target's future
// physical page number during a single-pass render.
export default function CatalogTOC({
  groups,
  labels,
  headerFooter,
  headerTitle,
  showPricesNote,
  watermarkLines,
  defaultWatermarkText,
}: CatalogTOCProps) {
  return (
    <Page size="A4" style={styles.page}>
      <CatalogPageWatermark lines={watermarkLines} defaultText={defaultWatermarkText} />
      <CatalogHeader headerFooter={headerFooter} title={headerTitle} />
      <CatalogFooter headerFooter={headerFooter} labels={labels} />

      <Text style={styles.eyebrow}>{labels.contentsEyebrow}</Text>
      <Text style={styles.tocTitle}>{labels.contents}</Text>
      <View style={styles.rule} />

      {groups.map((group, i) => (
        <Link key={group.id} src={`#${groupAnchorId(group.id)}`} style={styles.tocRow} wrap={false}>
          <Text style={styles.tocNumber}>{String(i + 1).padStart(2, '0')}</Text>
          <Text style={styles.tocName}>{group.name}</Text>
          <View style={styles.tocLeader} />
          <Text style={styles.tocCount}>{labels.items(group.products.length)}</Text>
        </Link>
      ))}

      {showPricesNote ? <Text style={styles.tocNote}>{labels.pricesNote}</Text> : null}
    </Page>
  );
}
