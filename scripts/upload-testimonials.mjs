#!/usr/bin/env node
/**
 * ONE-OFF TOOL — uploads customer feedback screenshots from a local folder
 * into Supabase Storage (same "products" bucket/content-addressed scheme as
 * src/lib/upload-image.ts) and inserts a `testimonials` row per unique image.
 *
 * Not part of the production app. Run manually:
 *   node scripts/upload-testimonials.mjs <source-dir>
 *
 * Reuses the env vars already set up for the migration tool
 * (scripts/.env.migration.local): CANGDAY_SUPABASE_URL,
 * CANGDAY_SUPABASE_SERVICE_ROLE_KEY.
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadLocalEnvFile() {
  const path = join(__dirname, '.env.migration.local');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 90; // screenshots of text — keep crisper than product photos

function extFromMime(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

async function processLocalImage(filePath) {
  const sourceBuffer = readFileSync(filePath);
  const meta = await sharp(sourceBuffer).metadata();
  const sourceMime = meta.format === 'png' ? 'image/png' : meta.format === 'webp' ? 'image/webp' : 'image/jpeg';
  const outputMime = sourceMime === 'image/png' || sourceMime === 'image/webp' ? sourceMime : 'image/jpeg';

  let pipeline = sharp(sourceBuffer).resize({
    width: MAX_DIMENSION,
    height: MAX_DIMENSION,
    fit: 'inside',
    withoutEnlargement: true,
  });
  if (outputMime === 'image/png') pipeline = pipeline.png();
  else if (outputMime === 'image/webp') pipeline = pipeline.webp({ quality: JPEG_QUALITY });
  else pipeline = pipeline.jpeg({ quality: JPEG_QUALITY });

  const outputBuffer = await pipeline.toBuffer();
  const hash = createHash('sha256').update(outputBuffer).digest('hex');
  const path = `testimonials/${hash}.${extFromMime(outputMime)}`;
  return { path, bytes: outputBuffer, contentType: outputMime };
}

async function main() {
  loadLocalEnvFile();
  const sourceDir = process.argv[2];
  if (!sourceDir || !existsSync(sourceDir)) {
    throw new Error(`Usage: node scripts/upload-testimonials.mjs <source-dir> — got: ${sourceDir}`);
  }

  const cangday = createClient(requireEnv('CANGDAY_SUPABASE_URL'), requireEnv('CANGDAY_SUPABASE_SERVICE_ROLE_KEY'));

  const files = readdirSync(sourceDir)
    .filter((f) => ['.jpg', '.jpeg', '.png', '.webp'].includes(extname(f).toLowerCase()))
    .sort(); // stable, deterministic display_order

  console.log(`Found ${files.length} image files in ${sourceDir}`);

  const seenHashPaths = new Set();
  let uploaded = 0;
  let deduped = 0;
  let order = 0;
  const inserted = [];

  for (const file of files) {
    const fullPath = join(sourceDir, file);
    const { path, bytes, contentType } = await processLocalImage(fullPath);

    if (seenHashPaths.has(path)) {
      deduped++;
      console.log(`  SKIP (duplicate content): ${file} -> ${path}`);
      continue;
    }
    seenHashPaths.add(path);

    const { error: uploadError } = await cangday.storage.from('products').upload(path, bytes, {
      cacheControl: '31536000',
      contentType,
      upsert: false,
    });
    if (uploadError && !/already exists|duplicate/i.test(uploadError.message || '')) {
      console.error(`  FAILED upload: ${file}: ${uploadError.message}`);
      continue;
    }

    const { data } = cangday.storage.from('products').getPublicUrl(path);

    const { error: insertError } = await cangday.from('testimonials').insert({
      image_url: data.publicUrl,
      display_order: order,
      is_active: true,
    });
    if (insertError) {
      console.error(`  FAILED db insert: ${file}: ${insertError.message}`);
      continue;
    }

    console.log(`  OK: ${file} -> ${path}`);
    inserted.push({ file, path, publicUrl: data.publicUrl });
    uploaded++;
    order++;
  }

  console.log(`\nDone. Uploaded+inserted: ${uploaded}, skipped as duplicate content: ${deduped}, total source files: ${files.length}`);
}

main().catch((err) => {
  console.error('\nUpload failed:', err.message || err);
  process.exit(1);
});
