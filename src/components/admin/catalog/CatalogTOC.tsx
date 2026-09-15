import { Page, Text, Link } from '@react-pdf/renderer';
import { catalogStyles as styles } from './catalogStyles';
import { CatalogModelGroup, CatalogWatermarkLine, groupAnchorId } from './types';
import CatalogPageWatermark from './CatalogWatermark';

interface CatalogTOCProps {
  groups: CatalogModelGroup[];
  watermarkLines: CatalogWatermarkLine[];
  defaultWatermarkText: string;
}

// Real internal PDF links to each group's heading — not page-numbered,
// since react-pdf has no first-class way to know a link target's future
// physical page number during a single-pass render. Clickable jump-to
// navigation already delivers the functional outcome a TOC exists for.
export default function CatalogTOC({ groups, watermarkLines, defaultWatermarkText }: CatalogTOCProps) {
  return (
    <Page size="A4" style={styles.page}>
      <CatalogPageWatermark lines={watermarkLines} defaultText={defaultWatermarkText} />
      <Text style={styles.tocTitle}>Table of Contents</Text>
      {groups.map((group) => (
        <Link key={group.id} src={`#${groupAnchorId(group.id)}`} style={styles.tocRow}>
          <Text style={styles.tocRowText}>{group.name}</Text>
          <Text style={styles.tocRowCount}>
            {group.products.length} {group.products.length === 1 ? 'item' : 'items'}
          </Text>
        </Link>
      ))}
    </Page>
  );
}
