/**
 * Client-side photo adjustments for the admin Adjust editor: brightness,
 * contrast and saturation via the canvas filter, then an unsharp-style
 * sharpen pass. The original file is never modified — applying produces a
 * new image that goes through the normal upload pipeline.
 */

export interface ImageAdjustments {
  /** 0–100 */
  sharpen: number;
  /** 50–150, 100 = unchanged */
  brightness: number;
  contrast: number;
  saturation: number;
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = { sharpen: 0, brightness: 100, contrast: 100, saturation: 100 };

/** Gentle one-click enhance tuned for product photography. */
export const AUTO_ENHANCE: ImageAdjustments = { sharpen: 35, brightness: 102, contrast: 108, saturation: 106 };

export function isDefault(a: ImageAdjustments) {
  return a.sharpen === 0 && a.brightness === 100 && a.contrast === 100 && a.saturation === 100;
}

/** Loads a remote image as a bitmap (storage/Unsplash URLs allow CORS). */
export async function loadBitmap(url: string): Promise<{ bitmap: ImageBitmap; type: string }> {
  const res = await fetch(url, { mode: 'cors', cache: 'force-cache' });
  if (!res.ok) throw new Error(`Image fetch failed (${res.status})`);
  const blob = await res.blob();
  return { bitmap: await createImageBitmap(blob), type: blob.type };
}

/**
 * 3×3 sharpen kernel (centre 1+4a, edges −a), applied to RGB only so
 * transparent PNG edges stay clean. `amount` 0–100 maps to a ≈ 0–0.8.
 */
function sharpen(img: ImageData, amount: number) {
  if (amount <= 0) return;
  const a = (amount / 100) * 0.8;
  const { width: w, height: h, data } = img;
  const src = new Uint8ClampedArray(data);
  const row = w * 4;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * row + x * 4;
      for (let c = 0; c < 3; c++) {
        const v =
          src[i + c] * (1 + 4 * a) -
          a * (src[i + c - 4] + src[i + c + 4] + src[i + c - row] + src[i + c + row]);
        data[i + c] = v;
      }
    }
  }
}

/** Draws `bitmap` into `canvas` at the given size with all adjustments applied. */
export function renderAdjusted(
  canvas: HTMLCanvasElement,
  bitmap: ImageBitmap,
  width: number,
  height: number,
  adj: ImageAdjustments
) {
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: adj.sharpen > 0 });
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  ctx.filter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`;
  ctx.drawImage(bitmap, 0, 0, width, height);
  ctx.filter = 'none';
  if (adj.sharpen > 0) {
    const img = ctx.getImageData(0, 0, width, height);
    sharpen(img, adj.sharpen);
    ctx.putImageData(img, 0, 0);
  }
}

/** Full-resolution adjusted copy as a Blob, keeping PNG/WebP (transparency) when the source had it. */
export async function exportAdjusted(
  bitmap: ImageBitmap,
  adj: ImageAdjustments,
  sourceType: string,
  maxDimension: number
): Promise<Blob> {
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  renderAdjusted(canvas, bitmap, width, height, adj);
  const type = sourceType === 'image/png' || sourceType === 'image/webp' ? sourceType : 'image/jpeg';
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Export failed'))), type, 0.9)
  );
}
