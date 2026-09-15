
import { permanentRedirect } from 'next/navigation';

export default async function CategorySlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Permanent (301) so Google consolidates indexing signals onto the real
  // category listing at /shop?category=<slug>, instead of leaving this URL
  // stuck as a dead-end redirect target ("Page with redirect" in GSC).
  permanentRedirect(`/shop?category=${slug}`);
}
