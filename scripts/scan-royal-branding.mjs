#!/usr/bin/env node
/**
 * ONE-OFF AUDIT TOOL — downloads every unique product image, tiles them into
 * labeled contact-sheet grids, so they can be visually scanned (by a human,
 * or by Claude's own vision) for leftover Royal Perfumes branding without
 * opening 1500+ images one at a time. READ-ONLY: never writes to the DB or
 * Storage, never deletes anything.
 *
 * Run: node scripts/scan-royal-branding.mjs <output-dir>
 * Writes:
 *   <output-dir>/sheets/sheet-XXXX.png   — labeled contact sheets
 *   <output-dir>/index.json              — cell index -> {url, products}
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
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

async function fetchAll(client, table, select) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];
  while (true) {
    const { data, error } = await client.from(table).select(select).range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function mapWithConcurrency(items, limit, fn) {
  let next = 0;
  const results = new Array(items.length);
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        results[i] = { error: String(err.message || err) };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const CELL = 160; // px per thumbnail cell (square)
const COLS = 10;
const ROWS = 8;
const PER_SHEET = COLS * ROWS;
const LABEL_H = 18;

function labelSvg(text) {
  return Buffer.from(
    `<svg width="${CELL}" height="${LABEL_H}">
      <rect width="100%" height="100%" fill="black" opacity="0.65"/>
      <text x="4" y="13" font-family="monospace" font-size="12" fill="white">${text}</text>
    </svg>`
  );
}

async function main() {
  loadLocalEnvFile();
  const outDir = process.argv[2];
  if (!outDir) throw new Error('Usage: node scripts/scan-royal-branding.mjs <output-dir>');
  const sheetsDir = join(outDir, 'sheets');
  const thumbsDir = join(outDir, 'thumbs');
  mkdirSync(sheetsDir, { recursive: true });
  mkdirSync(thumbsDir, { recursive: true });

  const cangday = createClient(requireEnv('CANGDAY_SUPABASE_URL'), requireEnv('CANGDAY_SUPABASE_SERVICE_ROLE_KEY'));

  console.log('Fetching products...');
  const products = await fetchAll(cangday, 'products', 'id,name_en,slug,images');

  const urlToProducts = new Map();
  for (const p of products) {
    for (const url of p.images || []) {
      if (!urlToProducts.has(url)) urlToProducts.set(url, []);
      urlToProducts.get(url).push({ id: p.id, name: p.name_en, slug: p.slug });
    }
  }
  const uniqueUrls = [...urlToProducts.keys()];
  console.log(`Products: ${products.length} | Unique images: ${uniqueUrls.length}`);

  console.log('Downloading + thumbnailing...');
  let done = 0;
  const thumbResults = await mapWithConcurrency(uniqueUrls, 12, async (url, i) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const thumb = await sharp(buf)
      .resize(CELL, CELL, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();
    done++;
    if (done % 100 === 0) console.log(`  ${done}/${uniqueUrls.length}`);
    return { index: i, url, thumb };
  });

  const failed = thumbResults.filter((r) => r.error);
  const ok = thumbResults.filter((r) => !r.error);
  console.log(`Downloaded: ${ok.length}, failed: ${failed.length}`);
  if (failed.length) {
    writeFileSync(join(outDir, 'download-failures.json'), JSON.stringify(failed, null, 2));
  }

  console.log('Building contact sheets...');
  const index = [];
  const sheetCount = Math.ceil(ok.length / PER_SHEET);
  for (let s = 0; s < sheetCount; s++) {
    const chunk = ok.slice(s * PER_SHEET, (s + 1) * PER_SHEET);
    const sheetW = COLS * CELL;
    const sheetH = ROWS * (CELL + LABEL_H);
    const composites = [];
    chunk.forEach((item, cellIdx) => {
      const col = cellIdx % COLS;
      const row = Math.floor(cellIdx / COLS);
      const x = col * CELL;
      const y = row * (CELL + LABEL_H);
      const globalIdx = s * PER_SHEET + cellIdx;
      composites.push({ input: item.thumb, left: x, top: y });
      composites.push({ input: labelSvg(`#${globalIdx}`), left: x, top: y + CELL });
      index.push({
        globalIndex: globalIdx,
        sheet: s,
        cell: cellIdx,
        url: item.url,
        products: urlToProducts.get(item.url).map((p) => ({ name: p.name, slug: p.slug })),
      });
    });

    await sharp({
      create: { width: sheetW, height: sheetH, channels: 3, background: '#222222' },
    })
      .composite(composites)
      .png()
      .toFile(join(sheetsDir, `sheet-${String(s).padStart(4, '0')}.png`));
    console.log(`  wrote sheet ${s + 1}/${sheetCount}`);
  }

  writeFileSync(join(outDir, 'index.json'), JSON.stringify(index, null, 2));
  console.log(`\nDone. ${sheetCount} sheets in ${sheetsDir}`);
  console.log(`Index: ${join(outDir, 'index.json')}`);
}

main().catch((err) => {
  console.error('Scan failed:', err.message || err);
  process.exit(1);
});
