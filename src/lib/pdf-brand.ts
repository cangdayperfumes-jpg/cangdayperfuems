import { Font } from '@react-pdf/renderer';

/**
 * Shared look for every PDF (invoice, orders report, catalog): the site's
 * ink / ivory / gold palette, its fonts (Fraunces headings, Manrope text) and
 * the logo. Works in the browser (invoice, catalog are rendered client-side)
 * and on the server (orders report route).
 *
 * Fonts are the complete Google Fonts TTFs (from @expo-google-fonts/*) in
 * public/fonts/pdf — one file per weight covering ş/ğ/ı/İ and ₺. Split
 * Latin / Latin-Ext subsets with a fallback fontFamily array garbled
 * Turkish letters (ş → y, ğ → m), so don't go back to that.
 */

export const PDF_COLORS = {
  ink: '#120D0A',
  ivory: '#F5EFE6',
  paper: '#FBF8F3',
  gold: '#C9A24B',
  goldDeep: '#8A6A2F',
  line: '#E4D9C6',
  muted: '#6E655C',
  burgundy: '#5E1F2A',
  white: '#FFFFFF',
} as const;

const isServer = typeof window === 'undefined';

/** Absolute file path on the server, same-origin URL in the browser. */
function publicAsset(rel: string) {
  return isServer ? `${process.cwd()}/public/${rel}` : `/${rel}`;
}

export const PDF_LOGO_SRC = publicAsset('images/cangday-logo-pdf.png');
/** The logo file is 640×213. */
export const PDF_LOGO_RATIO = 640 / 213;

let registered = false;

export const PDF_FONT_HEADING = 'Fraunces';
export const PDF_FONT_BODY = 'Manrope';

export function registerPdfFonts() {
  if (registered) return;
  Font.register({
    family: PDF_FONT_HEADING,
    fonts: [
      { src: publicAsset('fonts/pdf/Fraunces_500Medium.ttf'), fontWeight: 500 },
      { src: publicAsset('fonts/pdf/Fraunces_600SemiBold.ttf'), fontWeight: 600 },
    ],
  });
  Font.register({
    family: PDF_FONT_BODY,
    fonts: [
      { src: publicAsset('fonts/pdf/Manrope_400Regular.ttf'), fontWeight: 400 },
      { src: publicAsset('fonts/pdf/Manrope_600SemiBold.ttf'), fontWeight: 600 },
      { src: publicAsset('fonts/pdf/Manrope_700Bold.ttf'), fontWeight: 700 },
    ],
  });
  // Don't hyphenate product names / addresses.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

/** "1.250,50 ₺" */
export function formatPdfMoney(amount: number) {
  return `${Number(amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
}
