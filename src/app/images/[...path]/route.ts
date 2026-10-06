import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Replaces a next.config.ts rewrite -> Supabase Storage. Fetches the object
// server-side and re-serves it with an explicit, long-lived Cache-Control —
// uploaded product images are either SHA-256 content-hashed or
// unique-per-upload (upload always uses upsert: false), so a given path's
// bytes never change after creation.
//
// With ?w= (sent by supabase-image-loader.ts whenever Supabase's paid
// transform API is off — see isSupabaseTransformsEnabled() in
// src/lib/images.ts), also resizes with sharp before responding. This never
// touches Next's built-in /_next/image route (disabled entirely by
// next.config.ts's custom `loader`) and never calls Supabase's own
// render/transform endpoint — everything happens in this one proxy request.
const MAX_WIDTH = 2500; // matches clampTransformParams() in src/lib/images.ts

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  let host: string;
  try {
    host = new URL(supabaseUrl).host;
  } catch {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  const { path } = await params;
  const upstreamUrl = `https://${host}/storage/v1/object/public/${path.map(encodeURIComponent).join('/')}`;

  // Absent, non-numeric, zero, or negative -> treated as "no resize
  // requested", same as if ?w= were never sent — preserves the original
  // passthrough behavior exactly for any caller that doesn't ask for a size.
  const widthParam = req.nextUrl.searchParams.get('w');
  const parsedWidth = Math.round(Number(widthParam));
  const width = widthParam && Number.isFinite(parsedWidth) && parsedWidth > 0
    ? Math.min(MAX_WIDTH, parsedWidth)
    : null;

  const qualityParam = req.nextUrl.searchParams.get('q');
  const parsedQuality = Math.round(Number(qualityParam));
  const quality = Number.isFinite(parsedQuality) ? Math.min(100, Math.max(20, parsedQuality)) : 75;

  let upstream: Response;
  try {
    // Cache the upstream fetch itself in Next's server-side Data Cache — the
    // object's bytes never change (see comment above), so without this every
    // visitor's first load of a given image re-fetches it from Supabase from
    // scratch. (Next's Data Cache can't store entries over 2MB, so this
    // specifically still misses for the largest originals — the resized
    // *response* below is cached separately, at the edge, regardless.)
    upstream = await fetch(upstreamUrl, { next: { revalidate: 2592000 } });
  } catch (error) {
    console.error('Error fetching Supabase object:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ error: 'Not found' }, { status: upstream.status });
  }

  const buffer = await upstream.arrayBuffer();

  if (width !== null) {
    try {
      const resized = await sharp(Buffer.from(buffer))
        .resize({ width, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();

      return new NextResponse(resized, {
        status: 200,
        headers: {
          'Content-Type': 'image/webp',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (error) {
      console.error('Supabase image resize failed, falling back to original:', error);
      // Fall through to the unresized response below rather than erroring
      // out a real page — a full-size image beats a broken one.
    }
  }

  const contentType = upstream.headers.get('content-type') || 'application/octet-stream';

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
