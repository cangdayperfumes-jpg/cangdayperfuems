import { StyleSheet } from '@react-pdf/renderer';

// Sticks to react-pdf's standard built-in fonts (Helvetica family), same as
// InvoicePDF.tsx — a custom webfont would need Font.register() against an
// external URL, which would need a CSP connect-src change for no strong
// visual payoff. Deferred, not needed for a solid "premium" look.
export const catalogStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111111',
  },

  // Cover page
  coverPage: {
    padding: 0,
    fontFamily: 'Helvetica',
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
    width: 90,
    height: 89,
    marginBottom: 16,
    objectFit: 'contain',
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginTop: 8,
    textAlign: 'center',
  },
  coverSeason: {
    fontSize: 11,
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 14,
    textAlign: 'center',
  },
  coverDescription: {
    fontSize: 10,
    color: '#444444',
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 1.6,
    maxWidth: 380,
  },
  coverDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    width: 120,
    marginTop: 24,
    marginBottom: 24,
  },
  coverMetaBlock: {
    alignItems: 'center',
  },
  coverMetaText: {
    fontSize: 9,
    color: '#666666',
    marginBottom: 3,
    textAlign: 'center',
  },
  coverDate: {
    fontSize: 8,
    color: '#AAAAAA',
    marginTop: 24,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Table of contents
  tocTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 24,
  },
  tocRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingVertical: 10,
  },
  tocRowText: {
    fontSize: 12,
    color: '#111111',
  },
  tocRowCount: {
    fontSize: 9,
    color: '#999999',
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
    borderBottomColor: '#EEEEEE',
    paddingBottom: 8,
  },
  headerLogo: {
    width: 30,
    height: 30,
    objectFit: 'contain',
  },
  headerText: {
    fontSize: 8,
    color: '#888888',
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
    borderTopColor: '#EEEEEE',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#888888',
  },

  // Group heading
  groupHeading: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
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
    backgroundColor: '#F9F9F9',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  cardName: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  cardTag: {
    fontSize: 7,
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  cardDescription: {
    fontSize: 7.5,
    color: '#666666',
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
    color: '#B8860B',
    marginRight: 4,
  },
  cardBadgeOutOfStock: {
    fontSize: 7,
    color: '#C0392B',
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardPrice: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
  },
  cardPriceStrike: {
    fontSize: 8,
    color: '#999999',
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
    fontFamily: 'Helvetica-Bold',
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
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
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
    fontFamily: 'Helvetica-Bold',
    color: '#000000',
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
