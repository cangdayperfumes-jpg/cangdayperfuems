import { StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS as C, PDF_FONT_BODY, PDF_FONT_HEADING } from '@/lib/pdf-brand';

// Site look (see src/lib/pdf-brand.ts): Fraunces headings, Manrope text,
// ink / ivory / gold palette — shared with the invoice and orders report.
export const catalogStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: PDF_FONT_BODY,
    fontSize: 10,
    color: C.ink,
  },

  // Cover page
  coverPage: {
    padding: 0,
    backgroundColor: C.ivory,
    fontFamily: PDF_FONT_BODY,
  },
  coverImage: {
    width: '100%',
    height: 260,
    objectFit: 'cover',
  },
  coverBody: {
    padding: 40,
    alignItems: 'center',
  },
  coverLogo: {
    width: 220,
    height: 74,
    marginBottom: 16,
    objectFit: 'contain',
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: PDF_FONT_HEADING,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 13,
    color: C.muted,
    marginTop: 8,
    textAlign: 'center',
  },
  coverSeason: {
    fontSize: 11,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 14,
    textAlign: 'center',
  },
  coverDescription: {
    fontSize: 10,
    color: '#3B342E',
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 1.6,
    maxWidth: 380,
  },
  coverDivider: {
    borderBottomWidth: 1,
    borderBottomColor: C.gold,
    width: 120,
    marginTop: 24,
    marginBottom: 24,
  },
  coverMetaBlock: {
    alignItems: 'center',
  },
  coverMetaText: {
    fontSize: 9,
    color: C.muted,
    marginBottom: 3,
    textAlign: 'center',
  },
  coverDate: {
    fontSize: 8,
    color: C.muted,
    marginTop: 24,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Table of contents
  tocTitle: {
    fontSize: 22,
    fontFamily: PDF_FONT_HEADING,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 24,
  },
  tocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    paddingVertical: 10,
  },
  tocRowText: {
    fontSize: 12,
    color: C.ink,
  },
  tocRowCount: {
    fontSize: 9,
    color: C.muted,
  },

  // Fixed header / footer
  headerRow: {
    position: 'absolute',
    top: 16,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.line,
    paddingBottom: 8,
  },
  headerLogo: {
    width: 84,
    height: 28,
    objectFit: 'contain',
  },
  headerText: {
    fontSize: 8,
    color: C.muted,
  },
  footerRow: {
    position: 'absolute',
    bottom: 16,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: C.muted,
  },

  // Group heading
  groupHeading: {
    fontSize: 18,
    fontFamily: PDF_FONT_HEADING,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: C.gold,
    paddingBottom: 8,
  },

  // Product grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardSlot3: { width: '33.3333%' },
  cardSlot4: { width: '25%' },
  card: {
    padding: 6,
    alignItems: 'center',
  },
  cardImageWrap: {
    width: '100%',
    height: 115,
    marginBottom: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.paper,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  cardName: {
    fontSize: 8.5,
    fontFamily: PDF_FONT_BODY,
    fontWeight: 700,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  cardTag: {
    fontSize: 7,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  cardDescription: {
    fontSize: 7.5,
    color: C.muted,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 1.4,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 3,
  },
  cardBadgePopular: {
    fontSize: 7,
    color: C.goldDeep,
    marginRight: 4,
  },
  cardBadgeOutOfStock: {
    fontSize: 7,
    color: C.burgundy,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 9,
    fontFamily: PDF_FONT_BODY,
    fontWeight: 700,
  },
  cardPriceStrike: {
    fontSize: 8,
    color: C.muted,
    marginRight: 5,
    textDecoration: 'line-through',
  },

  // Promo banner
  banner: {
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImage: {
    width: '100%',
    height: 160,
    objectFit: 'cover',
    marginBottom: 12,
  },
  bannerTitle: {
    fontSize: 18,
    fontFamily: PDF_FONT_HEADING,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
  },

  // Watermark — page-wide diagonal brand mark (repeats on every
  // auto-paginated page via the `fixed` prop) plus a per-photo stamp.
  pageWatermark: {
    position: 'absolute',
    top: '46%',
    left: -100,
    right: -100,
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotate(-35deg)',
  },
  pageWatermarkText: {
    fontSize: 60,
    fontFamily: PDF_FONT_BODY,
    fontWeight: 700,
    color: C.ink,
    opacity: 0.05,
    textTransform: 'uppercase',
    letterSpacing: 6,
  },
  imageWatermarkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWatermarkText: {
    fontSize: 11,
    fontFamily: PDF_FONT_BODY,
    fontWeight: 700,
    color: C.ink,
    opacity: 0.14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    transform: 'rotate(-30deg)',
  },
  // Wraps the (possibly stroke-duplicated) watermark text so the outline
  // copies can be absolutely positioned relative to it instead of the
  // whole photo.
  imageWatermarkStack: {
    position: 'relative',
  },
  imageWatermarkStrokeText: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
