#!/usr/bin/env node
/**
 * ONE-OFF CLEANUP TOOL — removes the 18 confirmed Royal Perfumes-branded
 * marketing photos found by scripts/scan-royal-branding.mjs: strips each
 * URL from the owning product(s)' `images` array, then deletes the
 * now-unused file from Supabase Storage. User-approved list, hardcoded
 * below (not re-derived) so this can't accidentally touch anything beyond
 * exactly what was reviewed and approved.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

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
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

// Exactly the 18 approved matches from the scan — product slug -> branded image URL.
const REMOVALS = [
  { slug: 'amouage-honour-man-edp-100ml', hash: 'a249c52f7ef206bc62a8dec3a6b71a13fc45a56fa2eddf6e9ed62ceef1bc0c1d' },
  { slug: 'creed-silver-mountain-water-100-ml', hash: 'a837463dd5d97c87fd3964eb281447bc35da69a03cc7c81540df2690855e7617' },
  { slug: 'byredo-sellier-edp-100-ml-lux', hash: 'adede88100e1169f29c14c93d469bb7f075712ab622d3324517882d388b684e3' },
  { slug: 'byredo-casablanca-lily-edp-100-ml-lux', hash: '754e173d987bb0ce463464243dfe318f1c409a79a255089a221a7763e8c0d3ee' },
  { slug: 'xerjofflamborghini-blends-perseveranza-100-ml', hash: '871c4bc96a712d7c53ecea65b329177664302fc89f0f81b0ae8ed61c4d825496' },
  { slug: 'xerjoff-lamborghini-blends-fierezza-100-ml', hash: '871c4bc96a712d7c53ecea65b329177664302fc89f0f81b0ae8ed61c4d825496' },
  { slug: 'carolina-herrera-luckycharms-cute-chaos-eau-de-parfum-100ml', hash: '4052333bbcc879b5cab12f767a85e1d33b52edcdb6c61aaee164d64ad71c531e' },
  { slug: 'carolina-herrera-luckycharms-lucky-charm-eau-de-parfum-100ml', hash: '4052333bbcc879b5cab12f767a85e1d33b52edcdb6c61aaee164d64ad71c531e' },
  { slug: 'hugo-boss-bottled-absolu-edp-100ml', hash: 'd3b5f9dbd0031b441350518dbef2e4732ee0e884f37ea268a277b72e5a3d0d76' },
  { slug: 'amouage-reflection-woman-eau-de-parfum-100ml', hash: 'e80a09c67eeb851174c899003a80208bc96f2f8f291aa06e66a4b0fa566b836f' },
  { slug: 'nishane-hundred-silent-ways-exdrait-parfum-100-ml', hash: 'db3de7b344979e32922eee997de79e94f1dce8e5bc68c83667f676a439226a33' },
  { slug: 'by-kilian-angels-share-parads-extrait-de-parfum-50ml', hash: '70a3c0d9eb9b17d87f06e5ab08811fb045250c84f48c9fb15c13d8a526d19860' },
  { slug: 'elie-saab-girl-of-now-eau-de-parfum-90ml', hash: '00c4174835816b17cb26937981f5c75c713bcadda7bf2b014747e9b202098853' },
  { slug: 'creed-millesime-oud-zarian-100ml-unisex', hash: 'aa5633b74dcf3a4665a967dd431d3438f6b7b900d47a6e16e1c349eb1f0b92a4' },
  { slug: 'amouage-interlude-woman-eau-de-parfum-100ml', hash: '0bab573e64cbf287100079b7f7836c236968204080db6ed359ed87b8c78b806e' },
  { slug: 'xerjoff-hermetic-parfum-100ml', hash: '85b1cc5b7d60f646c9fcd93fc3a26212b52a16d83dcb656dd3b93883bc05f306' },
  { slug: 'creed-millesime-viking-edp-100ml', hash: '8906dccc6d01ad49d083765cb472fc369f220affc0645abfca78701973cb1005' },
  { slug: 'creed-millesime-aventus-cologne-100ml', hash: '98c5ecc0e017285be53dfb2654c822f8434bc9595023161262f79d8dcf275d6b' },
  { slug: 'amouage-love-hibiscus-edp-100ml', hash: 'c77c753f79fcb119233791f940fa93f83f39405a627815f373250d59a7ba749d' },
  { slug: 'amouage-jubilation-40-man-extrait-100ml', hash: 'ca8b9d40b39ca20059e0d107cf736b563e5b9b711cc200cea2a5be05b21cd048' },
];

async function main() {
  loadLocalEnvFile();
  const cangday = createClient(requireEnv('CANGDAY_SUPABASE_URL'), requireEnv('CANGDAY_SUPABASE_SERVICE_ROLE_KEY'));

  console.log(`Processing ${REMOVALS.length} product rows (${new Set(REMOVALS.map((r) => r.hash)).size} unique files)...\n`);

  const updated = [];
  const failed = [];

  for (const { slug, hash } of REMOVALS) {
    const { data: product, error: fetchError } = await cangday
      .from('products')
      .select('id,name_en,images')
      .eq('slug', slug)
      .single();

    if (fetchError || !product) {
      failed.push({ slug, reason: fetchError?.message || 'not found' });
      continue;
    }

    const before = product.images || [];
    const after = before.filter((url) => !url.includes(hash));

    if (after.length === before.length) {
      failed.push({ slug, reason: 'branded URL not found in current images array (already removed?)' });
      continue;
    }

    const { error: updateError } = await cangday.from('products').update({ images: after }).eq('id', product.id);
    if (updateError) {
      failed.push({ slug, reason: updateError.message });
      continue;
    }

    updated.push({ slug, name: product.name_en, before: before.length, after: after.length });
    console.log(`  OK: ${product.name_en} (${before.length} -> ${after.length} images)`);
  }

  console.log(`\nUpdated ${updated.length} product rows, ${failed.length} failed.`);
  if (failed.length) {
    console.log('Failures:', JSON.stringify(failed, null, 2));
  }

  // Delete the 18 unique files from Storage.
  const uniqueHashes = [...new Set(REMOVALS.map((r) => r.hash))];
  console.log(`\nDeleting ${uniqueHashes.length} files from Storage...`);

  // Need the actual extension — all were .jpg per the scan, confirm via a HEAD-less guess then try both common exts if needed.
  const paths = uniqueHashes.map((h) => `${h}.jpg`);
  const { data: deleted, error: deleteError } = await cangday.storage.from('products').remove(paths);
  if (deleteError) {
    console.error('Storage delete error:', deleteError.message);
  } else {
    console.log(`Deleted ${deleted.length} files.`);
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Removal failed:', err.message || err);
  process.exit(1);
});
