import { NextRequest, NextResponse } from 'next/server';

// Replaces a next.config.ts rewrite -> Supabase render/transform endpoint.
// Only reached when Supabase image transforms are enabled (Pro plan) — see
// isSupabaseTransformsEnabled() in src/lib/images.ts. Same reasoning as the
// sibling object route: fetch server-side and re-serve with an explicit,
// long-lived Cache-Control instead of relying on a rewrite passthrough.
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
  const upstreamUrl = `https://${host}/storage/v1/render/image/public/${path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;

  let upstream: Response;
  try {
    // Cache each transformed variant (specific width/quality/resize combo)
    // in Next's server-side Data Cache. Without this, every distinct gallery
    // thumbnail size triggers a fresh on-demand transform request to
    // Supabase's render pipeline on every single page view, for every
    // visitor — that cold round-trip per photo is what makes multi-photo
    // pages feel slow to load.
    upstream = await fetch(upstreamUrl, { next: { revalidate: 2592000 } });
  } catch (error) {
    console.error('Error fetching Supabase rendered image:', error);
    return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json({ error: 'Not found' }, { status: upstream.status });
  }

  const buffer = await upstream.arrayBuffer();
  const contentType = upstream.headers.get('content-type') || 'application/octet-stream';

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
