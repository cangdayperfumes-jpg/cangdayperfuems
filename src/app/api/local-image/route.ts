import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { access } from 'fs/promises';
import sharp from 'sharp';

// Resizes local /public images on demand. Exists because next.config.ts sets
// a custom `images.loader`, which makes Next.js skip registering its own
// built-in /_next/image route entirely — so local static images had no
// resizing path at all (same file served at every requested width). This
// keeps the existing custom-loader setup for Supabase images untouched and
// only adds a resize path for local assets.
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const MAX_WIDTH = 3840;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const requestedPath = searchParams.get('path');
  const widthParam = searchParams.get('w');
  const qualityParam = searchParams.get('q');

  if (!requestedPath || !requestedPath.startsWith('/') || requestedPath.startsWith('//')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const width = Math.min(MAX_WIDTH, Math.max(1, Math.round(Number(widthParam) || 0)));
  const quality = Math.min(100, Math.max(20, Math.round(Number(qualityParam) || 75)));
  if (!width) {
    return NextResponse.json({ error: 'Invalid width' }, { status: 400 });
  }

  // Resolve within PUBLIC_DIR and reject any traversal outside of it.
  const resolvedPath = path.resolve(PUBLIC_DIR, `.${requestedPath}`);
  if (!resolvedPath.startsWith(PUBLIC_DIR + path.sep)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    await access(resolvedPath);
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const resized = await sharp(resolvedPath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    return new NextResponse(resized, {
      status: 200,
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=2592000, immutable',
      },
    });
  } catch (err) {
    console.error('local-image resize failed:', err);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
