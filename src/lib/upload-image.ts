/**
 * Shared image upload pipeline for the admin dashboard — reused by product,
 * brand, category, and catalog-logo uploads instead of each keeping its own
 * copy. All uploads land in the single "products" storage bucket (existing
 * convention), differentiated only by key prefix.
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;
const ONE_YEAR_CACHE_CONTROL = '31536000';

export interface ValidateImageResult {
  valid: boolean;
  error?: string;
}

/** Fast, shared validation — checked before any resize/hash/network work. */
export function validateImageFile(file: File): ValidateImageResult {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Please select a JPEG, PNG, or WebP image.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 5MB limit.' };
  }
  return { valid: true };
}

function outputMimeType(sourceType: string): string {
  // Preserve PNG/WebP (both support transparency); everything else -> JPEG.
  return sourceType === 'image/png' || sourceType === 'image/webp' ? sourceType : 'image/jpeg';
}

function extFromMimeType(type: string): string {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

/** Downscale (if needed) and re-encode for consistent, reasonably-sized uploads. */
async function resizeAndEncode(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return blob;

  ctx.drawImage(bitmap, 0, 0, width, height);
  const mimeType = outputMimeType(blob.type);

  return new Promise((resolve) => {
    canvas.toBlob((result) => resolve(result || blob), mimeType, JPEG_QUALITY);
  });
}

async function hashBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Resizes/re-encodes `file`, hashes the result, and uploads it to the shared
 * "products" bucket under `prefix`. Re-uploading identical bytes resolves to
 * the same content-addressed path — no duplicate object, no wasted upload.
 */
export async function uploadToProductsBucket(
  supabase: any,
  file: Blob,
  prefix: string = ''
): Promise<string> {
  const optimized = await resizeAndEncode(file);
  const mimeType = outputMimeType(file.type);
  const hash = await hashBlob(optimized);
  const path = `${prefix}${hash}.${extFromMimeType(mimeType)}`;

  const { error } = await supabase.storage.from('products').upload(path, optimized, {
    cacheControl: ONE_YEAR_CACHE_CONTROL,
    contentType: mimeType,
    upsert: false,
  });

  // A conflict here just means this exact content is already stored — safe to reuse.
  if (error && !/already exists|duplicate/i.test(error.message || '')) {
    throw error;
  }

  const { data } = supabase.storage.from('products').getPublicUrl(path);
  return data.publicUrl;
}
