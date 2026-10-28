/**
 * Recommended upload size for every admin image area, derived from the
 * frame each one is actually shown in on the storefront. Shown under the
 * upload field together with the uploaded file's real size, so an admin can
 * see before saving whether a photo is too small or the wrong shape.
 *
 * `maxDimension` is the longest side kept after upload (the pipeline in
 * upload-image.ts downscales anything larger). Full-width banners keep more
 * pixels so they stay sharp on large screens.
 */
export interface ImageSpec {
  /** Key into the admin `imageSpecs` messages for the "where it shows" note. */
  key: ImageSpecKey;
  width: number;
  height: number;
  maxDimension?: number;
  /** Logos/patterns: shape mismatch is fine, so don't warn about cropping. */
  anyShape?: boolean;
}

export type ImageSpecKey =
  | 'product'
  | 'productMobile'
  | 'hero'
  | 'categoryTile'
  | 'category'
  | 'brand'
  | 'seasonalDesktop'
  | 'seasonalMobile'
  | 'seasonalPattern'
  | 'seasonalDecorative'
  | 'blogCover'
  | 'offerCard'
  | 'catalog';

export const IMAGE_SPECS: Record<Exclude<ImageSpecKey, 'categoryTile'>, ImageSpec> = {
  // ProductCard/gallery: 3:4 on desktop, 4:5 on mobile.
  product: { key: 'product', width: 1200, height: 1600 },
  productMobile: { key: 'productMobile', width: 1200, height: 1500 },
  // One image serves the 2.6:1 desktop banner and the 1:1 mobile crop, so a
  // 2:1 source leaves room for both.
  hero: { key: 'hero', width: 2400, height: Math.round(2400 / 2), maxDimension: 2400 },
  // Home carousel card is 4:7 portrait; the Categories page shows it square.
  category: { key: 'category', width: 900, height: 1575 },
  // Small round logo in the brand strip.
  brand: { key: 'brand', width: 400, height: 400, anyShape: true },
  // Full-width banner, 380–640px tall on desktop.
  seasonalDesktop: { key: 'seasonalDesktop', width: 2400, height: 800, maxDimension: 2400 },
  seasonalMobile: { key: 'seasonalMobile', width: 1080, height: 1350 },
  seasonalPattern: { key: 'seasonalPattern', width: 1600, height: 1600, anyShape: true },
  seasonalDecorative: { key: 'seasonalDecorative', width: 600, height: 600, anyShape: true },
  blogCover: { key: 'blogCover', width: 1600, height: 900 },
  // Homepage offer card: 4:5 portrait from tablets up, a wide ~1.6:1 banner on phones.
  offerCard: { key: 'offerCard', width: 1280, height: 1600 },
  catalog: { key: 'catalog', width: 1600, height: 1600, anyShape: true },
};

/**
 * Category tiles change shape with their grid size, so their spec is
 * computed from the tile's desktop/mobile frame: the source must be at
 * least as "tall" as the narrower of the two so both crops have room.
 */
export function categoryTileSpec(desktopAspect: number, mobileAspect: number): ImageSpec {
  const aspect = Math.min(desktopAspect, mobileAspect);
  const long = 1600;
  const width = aspect >= 1 ? long : Math.round(long * aspect);
  const height = aspect >= 1 ? Math.round(long / aspect) : long;
  return { key: 'categoryTile', width, height };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** "16:9"-style label for a spec, rounded to a readable ratio. */
export function ratioLabel(width: number, height: number): string {
  const common: [number, number][] = [[1, 1], [4, 5], [3, 4], [2, 3], [4, 7], [9, 16], [16, 9], [3, 2], [2, 1], [3, 1], [5, 4], [4, 3]];
  const r = width / height;
  for (const [a, b] of common) if (Math.abs(r - a / b) / (a / b) < 0.03) return `${a}:${b}`;
  const g = gcd(width, height);
  const a = width / g;
  const b = height / g;
  return a <= 30 && b <= 30 ? `${a}:${b}` : `${r.toFixed(2)}:1`;
}
