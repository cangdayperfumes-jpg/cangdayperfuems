import { StyleSheet } from '@react-pdf/renderer';
import { PDF_COLORS as C, PDF_FONT_BODY, PDF_FONT_HEADING } from '@/lib/pdf-brand';

// Site look (see src/lib/pdf-brand.ts): Fraunces headings, Manrope text,
// ink / ivory / gold palette — shared with the invoice and orders report.

// A4 in pt. Content pages keep clear bands for the fixed header/footer so
// products never run underneath them (the old 40pt padding was smaller
// than the header, which is what overlapped/broke pages).
export const PAGE_W = 595.28;
export const PAD_X = 36;
export const PAD_TOP = 76;
export const PAD_BOTTOM = 58;
export const CONTENT_W = PAGE_W - PAD_X * 2;
export const CARD_GAP = 10;

export function cardWidth(perRow: number) {
  return (CONTENT_W - CARD_GAP * (perRow - 1)) / perRow;
}
export function cardImageHeight(perRow: number) {
  return perRow === 3 ? 218 : 98;
}

export const catalogStyles = StyleSheet.create({
  page: {
    paddingTop: PAD_TOP,
    paddingBottom: PAD_BOTTOM,
    paddingHorizontal: PAD_X,
    fontFamily: PDF_FONT_BODY,
    fontSize: 9,
    color: C.ink,
    backgroundColor: C.paper,
  },

  // ── Cover ──────────────────────────────────────────────────────────────
  coverPage: {
    padding: 0,
    backgroundColor: C.ink,
    fontFamily: PDF_FONT_BODY,
    color: C.ivory,
  },
  coverPhoto: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PAGE_W,
    height: 430,
    objectFit: 'cover',
  },
  coverPhotoShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PAGE_W,
    height: 430,
    backgroundColor: C.ink,
    opacity: 0.28,
  },
  coverFrame: {
    position: 'absolute',
    top: 22,
    left: 22,
    right: 22,
    bottom: 22,
    borderWidth: 0.6,
    borderColor: C.gold,
    opacity: 0.55,
  },
  coverInner: {
    position: 'absolute',
    left: 60,
    right: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEyebrow: {
    fontSize: 8.5,
    fontWeight: 600,
    color: C.gold,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 18,
    textAlign: 'center',
  },
  coverLogo: {
    width: 290,
    height: 97,
    objectFit: 'contain',
  },
  coverRule: {
    width: 46,
    borderBottomWidth: 1,
    borderBottomColor: C.gold,
    marginTop: 22,
    marginBottom: 22,
  },
  coverTitle: {
    fontSize: 30,
    fontFamily: PDF_FONT_HEADING,
    fontWeight: 500,
    color: C.ivory,
    textTransform: 'uppercase',
    letterSpacing: 3,
    textAlign: 'center',
  },
  coverSubtitle: {
    fontSize: 11,
    color: C.ivory,
    opacity: 0.7,
    marginTop: 8,
    letterSpacing: 1,
    textAlign: 'center',
  },
  coverDescription: {
    fontSize: 9.5,
    color: C.ivory,
    opacity: 0.62,
    marginTop: 18,
    lineHeight: 1.65,
    textAlign: 'center',
    maxWidth: 360,
  },
  coverStats: {
    marginTop: 22,
    fontSize: 8,
    fontWeight: 600,
    color: C.gold,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  coverBottom: {
    position: 'absolute',
    bottom: 46,
    left: 60,
    right: 60,
    alignItems: 'center',
  },
  coverMeta: {
    fontSize: 8,
    color: C.ivory,
    opacity: 0.62,
    marginTop: 3,
    textAlign: 'center',
  },
  coverEdition: {
    fontSize: 7,
    color: C.gold,
    opacity: 0.8,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },

  // ── Contents ───────────────────────────────────────────────────────────
  eyebrow: {
    fontSize: 7.5,
    fontWeight: 600,
    color: C.goldDeep,
    textTransform: 'uppercase',
    letterSpacing: 2.5,
  },
  tocTitle: {
    fontSize: 26,
    fontFamily: PDF_FONT_HEADING,
    fontWeight: 500,
    marginTop: 6,
  },
  rule: {
    width: 40,
    borderBottomWidth: 1,
    borderBottomColor: C.gold,
    marginTop: 12,
    marginBottom: 22,
  },
  tocRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: 9,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
    textDecoration: 'none',
    color: C.ink,
  },
  tocNumber: {
    width: 30,
    fontSize: 10,
    fontFamily: PDF_FONT_HEADING,
    fontWeight: 500,
    color: C.goldDeep,
  },
  tocName: {
    fontSize: 13,
    fontFamily: PDF_FONT_HEADING,
    fontWeight: 500,
  },
  tocLeader: {
    flexGrow: 1,
    marginHorizontal: 8,
    marginBottom: 3,
    borderBottomWidth: 0.6,
    borderBottomColor: C.line,
    borderBottomStyle: 'dotted',
  },
  tocCount: {
    fontSize: 8,
    color: C.muted,
  },
  tocNote: {
    marginTop: 20,
    fontSize: 7.5,
    color: C.muted,
  },

  // ── Fixed header / footer ──────────────────────────────────────────────
  headerRow: {
    position: 'absolute',
    top: 26,
    left: PAD_X,
    right: PAD_X,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.6,
    borderBottomColor: C.line,
    paddingBottom: 8,
  },
  headerLogo: {
    width: 66,
    height: 22,
    objectFit: 'contain',
  },
  headerText: {
    fontSize: 7,
    fontWeight: 600,
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
  },
  footerRow: {
    position: 'absolute',
    bottom: 24,
    left: PAD_X,
    right: PAD_X,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.6,
    borderTopColor: C.line,
    paddingTop: 7,
  },
  footerText: {
    fontSize: 7,
    color: C.muted,
  },
  footerPage: {
    fontSize: 7,
    fontWeight: 600,
    color: C.goldDeep,
    letterSpacing: 1,
  },

  // ── Group heading ──────────────────────────────────────────────────────
  groupHead: {
    marginTop: 4,
    marginBottom: 12,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  groupTitle: {
    fontSize: 20,
    fontFamily: PDF_FONT_HEADING,
    fontWeight: 500,
  },
  groupCount: {
    fontSize: 8,
    color: C.muted,
    marginBottom: 3,
  },
  groupRule: {
    flexDirection: 'row',
    marginTop: 8,
  },
  groupRuleGold: {
    width: 40,
    borderBottomWidth: 1.2,
    borderBottomColor: C.gold,
  },
  groupRuleLine: {
    flexGrow: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
  },

  // ── Product grid (explicit rows — never one big wrapping grid) ─────────
  row: {
    flexDirection: 'row',
    marginBottom: CARD_GAP,
  },
  card: {
    backgroundColor: C.white,
    borderWidth: 0.5,
    borderColor: C.line,
    flexDirection: 'column',
  },
  cardImageWrap: {
    width: '100%',
    padding: 7,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  badgeRow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgePopular: {
    fontSize: 5.8,
    fontWeight: 700,
    color: C.ink,
    backgroundColor: C.gold,
    paddingVertical: 2,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badgeStock: {
    fontSize: 5.8,
    fontWeight: 700,
    color: C.white,
    backgroundColor: C.burgundy,
    paddingVertical: 2,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  cardBody: {
    flexGrow: 1,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 7,
    borderTopWidth: 0.5,
    borderTopColor: C.line,
  },
  cardTag: {
    fontSize: 6,
    fontWeight: 600,
    color: C.goldDeep,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  cardName: {
    fontFamily: PDF_FONT_HEADING,
    fontWeight: 500,
    lineHeight: 1.25,
  },
  cardDescription: {
    fontSize: 6.6,
    color: C.muted,
    marginTop: 4,
    lineHeight: 1.45,
  },
  cardSpacer: {
    flexGrow: 1,
  },
  cardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
  },
  cardPrice: {
    fontSize: 8.6,
    fontWeight: 700,
    color: C.ink,
  },
  cardPriceStrike: {
    fontSize: 7,
    color: C.muted,
    marginRight: 5,
    textDecoration: 'line-through',
  },

  // ── Promo banner ───────────────────────────────────────────────────────
  banner: {
    width: '100%',
    marginTop: 6,
    marginBottom: 18,
    paddingVertical: 26,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImage: {
    width: '100%',
    height: 150,
    objectFit: 'cover',
    marginBottom: 14,
  },
  bannerTitle: {
    fontSize: 18,
    fontFamily: PDF_FONT_HEADING,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
  bannerRule: {
    width: 36,
    borderBottomWidth: 1,
    borderBottomColor: C.gold,
    marginTop: 10,
    marginBottom: 10,
  },
  bannerSubtitle: {
    fontSize: 9.5,
    textAlign: 'center',
    lineHeight: 1.5,
  },

  // ── Back cover ─────────────────────────────────────────────────────────
  backInner: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 60,
    right: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backLogo: {
    width: 220,
    height: 74,
    objectFit: 'contain',
  },
  backSlogan: {
    marginTop: 22,
    fontSize: 16,
    fontFamily: PDF_FONT_HEADING,
    fontWeight: 500,
    color: C.ivory,
    textAlign: 'center',
  },
  backNote: {
    position: 'absolute',
    bottom: 46,
    left: 60,
    right: 60,
    fontSize: 7,
    color: C.ivory,
    opacity: 0.5,
    textAlign: 'center',
  },

  // ── Watermarks ─────────────────────────────────────────────────────────
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
});
