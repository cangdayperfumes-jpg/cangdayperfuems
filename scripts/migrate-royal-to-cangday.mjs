#!/usr/bin/env node
/**
 * ONE-OFF MIGRATION TOOL — Royal Perfumes → Cangday (Supabase → Supabase)
 *
 * NOT part of the production app. Not imported by anything under src/.
 * Run manually with `node scripts/migrate-royal-to-cangday.mjs [flags]`.
 *
 * Mirrors the existing upload pipeline (src/lib/upload-image.ts) and slug
 * logic (src/lib/utils.ts resolveUniqueProductSlug) so migrated data is
 * indistinguishable from data created through the normal admin UI.
 *
 * SAFETY
 * ------
 * Default mode is DRY RUN. Nothing is written to either project unless both
 * of the following are true:
 *   1. `--execute` is passed on the command line, AND
 *   2. env var MIGRATION_CONFIRM=I_UNDERSTAND is set
 * Dry run never calls INSERT/UPDATE/DELETE/upload — it only reads from both
 * projects (via REST) and downloads image bytes from Royal's PUBLIC bucket
 * to compute what the migrated content-addressed path/hash would be.
 *
 * CREDENTIALS
 * -----------
 * Read from environment variables only — never hardcoded, never printed.
 * Required:
 *   ROYAL_SUPABASE_URL
 *   ROYAL_SUPABASE_SERVICE_ROLE_KEY
 *   CANGDAY_SUPABASE_URL
 *   CANGDAY_SUPABASE_SERVICE_ROLE_KEY
 * Optionally pre-loaded from a local, gitignored `.env.migration.local` file
 * (same directory as this script) using the tiny parser below — no new npm
 * dependency added for this one-off tool.
 *
 * CLI flags:
 *   --execute        Enable the write path (still requires MIGRATION_CONFIRM)
 *   --limit=N        Only process the first N Royal products (for review runs)
 *   --report=path    Write the full JSON report to this path (default:
 *                     scripts/migration-report.json)
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// 0. Env + CLI
// ---------------------------------------------------------------------------

function loadLocalEnvFile() {
  const path = join(__dirname, '.env.migration.local');
  if (!existsSync(path)) return;
  const lines = readFileSync(path, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!(key in process.env)) process.env[key] = value;
  }
}

function parseArgs(argv) {
  const flags = { execute: false, limit: null, report: join(__dirname, 'migration-report.json') };
  for (const arg of argv) {
    if (arg === '--execute') flags.execute = true;
    else if (arg.startsWith('--limit=')) flags.limit = Number(arg.slice('--limit='.length));
    else if (arg.startsWith('--report=')) flags.report = arg.slice('--report='.length);
  }
  return flags;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// ---------------------------------------------------------------------------
// 1. Supabase clients (service role — bypasses RLS for full read + write)
// ---------------------------------------------------------------------------

function makeClients() {
  const royalUrl = requireEnv('ROYAL_SUPABASE_URL');
  const royalKey = requireEnv('ROYAL_SUPABASE_SERVICE_ROLE_KEY');
  const cangdayUrl = requireEnv('CANGDAY_SUPABASE_URL');
  const cangdayKey = requireEnv('CANGDAY_SUPABASE_SERVICE_ROLE_KEY');

  const royal = createClient(royalUrl, royalKey, { auth: { persistSession: false } });
  const cangday = createClient(cangdayUrl, cangdayKey, { auth: { persistSession: false } });
  return { royal, cangday };
}

async function fetchAll(client, table, select) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];
  while (true) {
    const { data, error } = await client
      .from(table)
      .select(select)
      .range(from, from + pageSize - 1);
    if (error) throw new Error(`fetchAll(${table}) failed: ${error.message}`);
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

// ---------------------------------------------------------------------------
// 2. Slug / name helpers (mirrors src/lib/utils.ts generateSlug)
// ---------------------------------------------------------------------------

function generateSlug(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizedName(name) {
  return (name || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Pure, read-only version of resolveUniqueProductSlug — computes against an
 *  already-fetched slug set instead of querying the DB again. */
function resolveUniqueSlugOffline(baseSlugInput, existingSlugs, fallbackPrefix) {
  let baseSlug = generateSlug(baseSlugInput);
  if (!baseSlug) baseSlug = `${fallbackPrefix}-${Date.now()}`;
  if (!existingSlugs.has(baseSlug)) return baseSlug;
  let counter = 2;
  while (existingSlugs.has(`${baseSlug}-${counter}`)) counter++;
  return `${baseSlug}-${counter}`;
}

// ---------------------------------------------------------------------------
// 3. Category / brand reconciliation
// ---------------------------------------------------------------------------

function reconcileLookupTable(royalRows, cangdayRows) {
  const cangdayBySlug = new Map(cangdayRows.map((r) => [r.slug, r]));
  const cangdayByName = new Map(cangdayRows.map((r) => [normalizedName(r.name), r]));

  const mappings = [];
  for (const royalRow of royalRows) {
    const bySlug = cangdayBySlug.get(royalRow.slug);
    const byName = cangdayByName.get(normalizedName(royalRow.name));
    const match = bySlug || byName;

    mappings.push({
      royal_id: royalRow.id,
      royal_slug: royalRow.slug,
      royal_name: royalRow.name,
      action: match ? 'map-existing' : 'create-new',
      matched_by: match ? (bySlug ? 'slug' : 'name') : null,
      cangday_id: match ? match.id : null,
      cangday_slug: match ? match.slug : null,
      cangday_name: match ? match.name : null,
    });
  }
  return mappings;
}

// ---------------------------------------------------------------------------
// 4. Image pipeline — mirrors src/lib/upload-image.ts exactly, server-side
// ---------------------------------------------------------------------------

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 85; // sharp uses 0-100, upload-image.ts uses 0-1 (0.85)

function extFromMime(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

/** Downloads, resizes/re-encodes, and hashes exactly like uploadToProductsBucket,
 *  but never uploads — returns the bytes + computed destination path so the
 *  caller decides (dry run: just report; execute: actually upload). */
async function processRoyalImage(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const sourceBuffer = Buffer.from(await res.arrayBuffer());
  const sourceMime = res.headers.get('content-type')?.split(';')[0] || 'image/jpeg';

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
  const ext = extFromMime(outputMime);
  const path = `${hash}.${ext}`; // product images use no prefix, matching ProductForm.tsx

  return { path, bytes: outputBuffer, contentType: outputMime, sourceBytes: sourceBuffer.length };
}

async function cangdayPublicUrlExists(cangday, path) {
  const { data } = cangday.storage.from('products').getPublicUrl(path);
  const res = await fetch(data.publicUrl, { method: 'HEAD' });
  return { exists: res.ok, publicUrl: data.publicUrl };
}

/** Simple concurrency limiter so we don't fire hundreds of simultaneous fetches. */
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ---------------------------------------------------------------------------
// 5. Main
// ---------------------------------------------------------------------------

async function main() {
  loadLocalEnvFile();
  const flags = parseArgs(process.argv.slice(2));
  const executeRequested = flags.execute;
  const confirmed = process.env.MIGRATION_CONFIRM === 'I_UNDERSTAND';
  const willExecute = executeRequested && confirmed;

  if (executeRequested && !confirmed) {
    console.error(
      '\n--execute was passed but MIGRATION_CONFIRM=I_UNDERSTAND is not set. Refusing to write anything. Continuing in DRY RUN.\n'
    );
  }

  const { royal, cangday } = makeClients();

  console.log(`Mode: ${willExecute ? 'EXECUTE (writes enabled)' : 'DRY RUN (read-only)'}`);

  // --- Step 1: categories & brands ---
  const royalCategories = await fetchAll(royal, 'categories', '*');
  const royalBrands = await fetchAll(royal, 'brands', '*');
  const cangdayCategories = await fetchAll(cangday, 'categories', '*');
  const cangdayBrands = await fetchAll(cangday, 'brands', '*');

  // --- Step 2 & 3: reconcile + build Royal -> Cangday id maps ---
  const categoryMappings = reconcileLookupTable(royalCategories, cangdayCategories);
  const brandMappings = reconcileLookupTable(royalBrands, cangdayBrands);
  const categoryIdMap = new Map(categoryMappings.map((m) => [m.royal_id, m]));
  const brandIdMap = new Map(brandMappings.map((m) => [m.royal_id, m]));

  // --- Step 4: products & variants ---
  let royalProducts = await fetchAll(
    royal,
    'products',
    'id,name_en,description_en,price,discount,category_id,brand_id,stock,images,is_active,target_audience,has_variants,is_popular,slug,created_at'
  );
  if (flags.limit) royalProducts = royalProducts.slice(0, flags.limit);
  const royalVariants = await fetchAll(royal, 'product_variants', '*');
  const variantsByProduct = new Map();
  for (const v of royalVariants) {
    if (!variantsByProduct.has(v.product_id)) variantsByProduct.set(v.product_id, []);
    variantsByProduct.get(v.product_id).push(v);
  }

  // --- Step 5: existing Cangday products index (duplicate detection) ---
  const cangdayProducts = await fetchAll(cangday, 'products', 'id,name_en,slug');
  const cangdayBySlug = new Map(cangdayProducts.map((p) => [p.slug, p]));
  const cangdayByName = new Map(cangdayProducts.map((p) => [normalizedName(p.name_en), p]));
  const cangdaySlugSet = new Set(cangdayProducts.map((p) => p.slug));

  // --- Execute-only: create categories/brands, but ONLY the ones actually
  // referenced by the (possibly --limit'd) product batch being migrated —
  // never the full Royal catalog's lookup tables, even though the dry-run
  // report above reconciles all of them for visibility. ---
  const createdCategories = [];
  const createdBrands = [];
  const createdProducts = [];
  const createdVariants = [];

  if (willExecute) {
    const referencedCategoryIds = new Set(royalProducts.map((p) => p.category_id).filter(Boolean));
    const referencedBrandIds = new Set(royalProducts.map((p) => p.brand_id).filter(Boolean));

    for (const mapping of categoryMappings) {
      if (mapping.action !== 'create-new' || !referencedCategoryIds.has(mapping.royal_id)) continue;
      const royalRow = royalCategories.find((c) => c.id === mapping.royal_id);
      const { data, error } = await cangday
        .from('categories')
        .insert({ name: royalRow.name, slug: royalRow.slug, description: royalRow.description ?? null })
        .select('id')
        .single();
      if (error) throw new Error(`Failed to create category "${royalRow.name}": ${error.message}`);
      mapping.cangday_id = data.id;
      mapping.action = 'created';
      createdCategories.push({ royal_id: royalRow.id, cangday_id: data.id, name: royalRow.name, slug: royalRow.slug });
    }

    for (const mapping of brandMappings) {
      if (mapping.action !== 'create-new' || !referencedBrandIds.has(mapping.royal_id)) continue;
      const royalRow = royalBrands.find((b) => b.id === mapping.royal_id);
      const { data, error } = await cangday
        .from('brands')
        .insert({ name: royalRow.name, slug: royalRow.slug, is_featured: royalRow.is_featured ?? false })
        .select('id')
        .single();
      if (error) throw new Error(`Failed to create brand "${royalRow.name}": ${error.message}`);
      mapping.cangday_id = data.id;
      mapping.action = 'created';
      createdBrands.push({ royal_id: royalRow.id, cangday_id: data.id, name: royalRow.name, slug: royalRow.slug });
    }
  }

  // --- Steps 6-9: image planning ---
  const allImageUrls = [];
  for (const p of royalProducts) {
    for (const url of p.images || []) allImageUrls.push({ productId: p.id, url });
  }

  const imagePlan = []; // one entry per unique URL processed
  const missingImages = [];
  const imageUrlToNewUrl = new Map();
  const uniqueUrls = [...new Set(allImageUrls.map((x) => x.url))];

  await mapWithConcurrency(uniqueUrls, 5, async (url) => {
    try {
      const { path, bytes, contentType, sourceBytes } = await processRoyalImage(url);
      const { exists, publicUrl } = await cangdayPublicUrlExists(cangday, path);
      imagePlan.push({
        royal_url: url,
        cangday_path: path,
        cangday_public_url: publicUrl,
        content_type: contentType,
        source_bytes: sourceBytes,
        optimized_bytes: bytes.length,
        status: exists ? 'already-present-in-cangday' : 'needs-upload',
      });
      imageUrlToNewUrl.set(url, publicUrl);

      if (willExecute && !exists) {
        const { error } = await cangday.storage.from('products').upload(path, bytes, {
          cacheControl: '31536000',
          contentType,
          upsert: false,
        });
        if (error && !/already exists|duplicate/i.test(error.message || '')) {
          throw error;
        }
      }
    } catch (err) {
      missingImages.push({ royal_url: url, error: String(err.message || err) });
    }
  });

  // --- Steps 5/10-12: per-product classification + record prep ---
  const readyToMigrate = [];
  const needsReview = [];
  const duplicates = [];
  const slugConflicts = [];
  const potentialErrors = [];

  for (const p of royalProducts) {
    const slugMatch = p.slug ? cangdayBySlug.get(p.slug) : null;
    const nameMatch = cangdayByName.get(normalizedName(p.name_en));

    const categoryMapping = p.category_id ? categoryIdMap.get(p.category_id) : null;
    const brandMapping = p.brand_id ? brandIdMap.get(p.brand_id) : null;

    const newImages = (p.images || []).map((url) => imageUrlToNewUrl.get(url)).filter(Boolean);
    const unresolvedImageCount = (p.images || []).length - newImages.length;

    const variants = variantsByProduct.get(p.id) || [];

    const record = {
      royal_id: p.id,
      name_en: p.name_en,
      royal_slug: p.slug,
      category: categoryMapping
        ? { royal_id: p.category_id, action: categoryMapping.action, cangday_id: categoryMapping.cangday_id }
        : p.category_id
          ? { error: 'category_id set on product but not found in Royal categories fetch' }
          : null,
      brand: brandMapping
        ? { royal_id: p.brand_id, action: brandMapping.action, cangday_id: brandMapping.cangday_id }
        : p.brand_id
          ? { error: 'brand_id set on product but not found in Royal brands fetch' }
          : null,
      variant_count: variants.length,
      image_count: (p.images || []).length,
      images_resolved: newImages.length,
      images_unresolved: unresolvedImageCount,
      planned_images: newImages,
    };

    if (p.category_id && !categoryMapping) {
      potentialErrors.push({ product: p.name_en, reason: 'category_id does not resolve to any Royal category row (orphaned FK)' });
    }
    if (p.brand_id && !brandMapping) {
      potentialErrors.push({ product: p.name_en, reason: 'brand_id does not resolve to any Royal brand row (orphaned FK)' });
    }
    if (unresolvedImageCount > 0) {
      needsReview.push({ ...record, reason: `${unresolvedImageCount} image(s) failed to download/process — see missingImages` });
      continue;
    }

    if (slugMatch || nameMatch) {
      duplicates.push({
        ...record,
        matched_by: slugMatch ? 'slug' : 'name_en',
        cangday_existing_id: (slugMatch || nameMatch).id,
        cangday_existing_slug: (slugMatch || nameMatch).slug,
      });
      continue;
    }

    // Slug conflict check: Royal's slug happens to already be taken in Cangday
    // by something that ISN'T actually this product (handled above as a
    // duplicate already if it matched by slug — this branch is for the rare
    // case the slug collides but name differs, i.e. NOT treated as same product).
    if (p.slug && cangdaySlugSet.has(p.slug)) {
      const resolved = resolveUniqueSlugOffline(p.name_en, cangdaySlugSet, 'product');
      slugConflicts.push({
        ...record,
        conflicting_slug: p.slug,
        proposed_slug: resolved,
      });
      cangdaySlugSet.add(resolved); // reserve for subsequent collision checks this run
      record.final_slug = resolved;
    } else {
      const finalSlug = p.slug && generateSlug(p.name_en) ? p.slug : resolveUniqueSlugOffline(p.name_en, cangdaySlugSet, 'product');
      cangdaySlugSet.add(finalSlug);
      record.final_slug = finalSlug;
    }

    readyToMigrate.push(record);

    // --- Execute-only: actually insert the product + its variants ---
    if (willExecute) {
      const { data: insertedProduct, error: insertError } = await cangday
        .from('products')
        .insert({
          name_en: p.name_en,
          description_en: p.description_en,
          price: p.price,
          discount: p.discount,
          category_id: categoryMapping ? categoryMapping.cangday_id : null,
          brand_id: brandMapping ? brandMapping.cangday_id : null,
          stock: p.stock,
          images: newImages,
          is_active: p.is_active,
          target_audience: p.target_audience,
          has_variants: p.has_variants,
          is_popular: p.is_popular,
          slug: record.final_slug,
        })
        .select('id')
        .single();

      if (insertError) {
        potentialErrors.push({ product: p.name_en, reason: `Product insert failed: ${insertError.message}` });
      } else {
        record.cangday_id = insertedProduct.id;
        createdProducts.push({ royal_id: p.id, cangday_id: insertedProduct.id, name_en: p.name_en, slug: record.final_slug });

        for (const v of variants) {
          const { data: insertedVariant, error: variantError } = await cangday
            .from('product_variants')
            .insert({
              product_id: insertedProduct.id,
              name: v.name,
              price: v.price,
              discount: v.discount,
              stock: v.stock,
              is_active: v.is_active,
            })
            .select('id')
            .single();

          if (variantError) {
            potentialErrors.push({ product: p.name_en, reason: `Variant "${v.name}" insert failed: ${variantError.message}` });
          } else {
            createdVariants.push({
              royal_id: v.id,
              cangday_id: insertedVariant.id,
              product_cangday_id: insertedProduct.id,
              name: v.name,
            });
          }
        }
      }
    }
  }

  // --- Step 13: report ---
  const report = {
    mode: willExecute ? 'execute' : 'dry-run',
    generated_at: new Date().toISOString(),
    counts: {
      products_found: royalProducts.length,
      categories_found: royalCategories.length,
      brands_found: royalBrands.length,
      variants_found: royalVariants.length,
      images_found: allImageUrls.length,
      unique_image_urls: uniqueUrls.length,
    },
    products_ready_to_migrate: { count: readyToMigrate.length, sample: readyToMigrate.slice(0, 5) },
    products_requiring_manual_review: { count: needsReview.length, sample: needsReview.slice(0, 5) },
    duplicate_products: { count: duplicates.length, sample: duplicates.slice(0, 5) },
    category_mappings: { count: categoryMappings.length, sample: categoryMappings.slice(0, 5) },
    brand_mappings: { count: brandMappings.length, sample: brandMappings.slice(0, 5) },
    image_files_to_migrate: {
      count: imagePlan.filter((i) => i.status === 'needs-upload').length,
      already_present: imagePlan.filter((i) => i.status === 'already-present-in-cangday').length,
      sample: imagePlan.slice(0, 5),
    },
    missing_images: { count: missingImages.length, sample: missingImages.slice(0, 5) },
    slug_conflicts: { count: slugConflicts.length, sample: slugConflicts.slice(0, 5) },
    potential_errors: { count: potentialErrors.length, sample: potentialErrors.slice(0, 5) },
  };

  if (willExecute) {
    report.execution_result = {
      created_categories: createdCategories,
      created_brands: createdBrands,
      created_products: createdProducts,
      created_variants: createdVariants,
      images_uploaded: imagePlan
        .filter((i) => i.status === 'needs-upload')
        .map((i) => ({ cangday_path: i.cangday_path, cangday_public_url: i.cangday_public_url })),
    };
  }

  writeFileSync(flags.report, JSON.stringify(report, null, 2));

  // --- Console summary ---
  console.log('\n=== MIGRATION REPORT SUMMARY ===\n');
  console.log(`Products found:    ${report.counts.products_found}`);
  console.log(`Categories found:  ${report.counts.categories_found}`);
  console.log(`Brands found:      ${report.counts.brands_found}`);
  console.log(`Variants found:    ${report.counts.variants_found}`);
  console.log(`Images found:      ${report.counts.images_found} (${report.counts.unique_image_urls} unique)\n`);

  console.log(`Products ready to migrate:        ${report.products_ready_to_migrate.count}`);
  console.log(`Products requiring manual review: ${report.products_requiring_manual_review.count}`);
  console.log(`Duplicate products:                ${report.duplicate_products.count}`);
  console.log(`Category mappings:                 ${report.category_mappings.count}`);
  console.log(`Brand mappings:                     ${report.brand_mappings.count}`);
  console.log(`Image files to migrate:             ${report.image_files_to_migrate.count} (already present: ${report.image_files_to_migrate.already_present})`);
  console.log(`Missing images:                     ${report.missing_images.count}`);
  console.log(`Slug conflicts:                      ${report.slug_conflicts.count}`);
  console.log(`Potential errors:                    ${report.potential_errors.count}\n`);

  if (willExecute) {
    console.log(`Categories created: ${createdCategories.length}`);
    console.log(`Brands created:     ${createdBrands.length}`);
    console.log(`Products created:   ${createdProducts.length}`);
    console.log(`Variants created:   ${createdVariants.length}`);
    console.log(`Images uploaded:    ${report.execution_result.images_uploaded.length}\n`);
  }

  console.log(`Full report written to: ${flags.report}`);
  if (!willExecute) {
    console.log('\nDRY RUN — no data was written to Cangday and nothing was modified on Royal.');
  }
}

main().catch((err) => {
  console.error('\nMigration script failed:', err.message || err);
  process.exit(1);
});
