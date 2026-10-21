import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { getPosts, type BlogLocale, type BlogPost } from '@/lib/blog';
import { localeAlternates, localeUrl, jsonLd, OG_LOCALE, SITE_NAME } from '@/lib/seo';
import { cn } from '@/lib/utils';

export const revalidate = 300;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tag?: string }>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale } = await params;
  const { tag } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'blog' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      ...localeAlternates(locale, '/blog'),
      types: { 'application/rss+xml': localeUrl(locale, '/blog/rss.xml') },
    },
    // Tag views are filtered copies of /blog — follow, don't index.
    ...(tag ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: `${t('metaTitle')} | ${SITE_NAME}`,
      description: t('metaDescription'),
      url: localeUrl(locale, '/blog'),
      type: 'website',
      locale: OG_LOCALE[locale],
    },
  };
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
}

function PostMeta({ post, locale, t }: { post: BlogPost; locale: string; t: (k: string, v?: Record<string, number>) => string }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">
      <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
      <span aria-hidden="true"> · </span>
      {t('readingTime', { minutes: post.readingMinutes })}
    </p>
  );
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { tag } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'blog' });
  const all = await getPosts(locale as BlogLocale);
  const tags = [...new Set(all.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, locale));
  const posts = tag ? all.filter((p) => p.tags.includes(tag)) : all;
  // The featured post (or the newest) leads the unfiltered list.
  const lead = tag ? undefined : posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p !== lead);

  const listLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} — ${t('title')}`,
    url: localeUrl(locale, '/blog'),
    inLanguage: locale,
    blogPost: all.slice(0, 20).map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: localeUrl(locale, `/blog/${p.slug}`),
      datePublished: p.publishedAt,
      dateModified: p.updatedAt,
      ...(p.image ? { image: p.image } : {}),
    })),
  };

  return (
    <div className="bg-ivory">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(listLd)} />
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 md:py-20 lg:px-8">
        <header className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold-deep">{t('eyebrow')}</p>
          <h1 className="font-heading text-4xl font-medium text-ink md:text-6xl">{t('title')}</h1>
          <p className="mt-4 text-ink/60">{t('intro')}</p>
        </header>

        {tags.length > 0 && (
          <nav aria-label={t('tagsLabel')} className="mb-10 flex flex-wrap justify-center gap-2">
            <Link
              href="/blog"
              className={cn('rounded-full border px-4 py-1.5 text-xs font-medium transition', !tag ? 'border-ink bg-ink text-ivory' : 'border-ink/15 text-ink/70 hover:border-ink/40')}
            >
              {t('allPosts')}
            </Link>
            {tags.map((tg) => (
              <Link
                key={tg}
                href={{ pathname: '/blog', query: { tag: tg } }}
                className={cn('rounded-full border px-4 py-1.5 text-xs font-medium transition', tag === tg ? 'border-ink bg-ink text-ivory' : 'border-ink/15 text-ink/70 hover:border-ink/40')}
              >
                {tg}
              </Link>
            ))}
          </nav>
        )}

        {posts.length === 0 ? (
          <p className="py-20 text-center text-ink/50">{t('empty')}</p>
        ) : (
          <>
            {lead && (
              <Link href={`/blog/${lead.slug}`} className="group mb-14 grid overflow-hidden rounded-sm bg-white ring-1 ring-border md:grid-cols-2">
                <div className="relative aspect-[16/10] bg-secondary md:aspect-auto md:min-h-[360px]">
                  {lead.image && (
                    <ImageWithFallback
                      src={lead.image}
                      alt={lead.imageAlt}
                      fill
                      priority
                      sizes="(max-width: 768px) 100vw, 600px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
                  <PostMeta post={lead} locale={locale} t={t} />
                  <h2 className="font-heading text-2xl font-medium leading-tight text-ink md:text-4xl">{lead.title}</h2>
                  <p className="text-ink/60">{lead.excerpt}</p>
                  <span className="text-xs font-semibold uppercase tracking-widest text-gold-deep">{t('readMore')} →</span>
                </div>
              </Link>
            )}

            <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <article key={post.id} className="group">
                  <Link href={`/blog/${post.slug}`} className="block">
                    <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-sm bg-secondary ring-1 ring-border">
                      {post.image && (
                        <ImageWithFallback
                          src={post.image}
                          alt={post.imageAlt}
                          fill
                          loading="lazy"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <PostMeta post={post} locale={locale} t={t} />
                    <h2 className="mt-2 font-heading text-xl font-medium leading-snug text-ink group-hover:text-ink/70">{post.title}</h2>
                    <p className="mt-2 line-clamp-3 text-sm text-ink/60">{post.excerpt}</p>
                  </Link>
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
