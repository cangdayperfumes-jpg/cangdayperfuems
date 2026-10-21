import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@supabase/supabase-js';
import { Link } from '@/i18n/navigation';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ProductCard from '@/components/shared/ProductCard';
import { getPost, getPosts, headingId, tableOfContents, type BlogLocale } from '@/lib/blog';
import { localeAlternates, localeUrl, jsonLd, OG_LOCALE, SITE_NAME, SITE_URL } from '@/lib/seo';
import type { Product } from '@/types';

export const revalidate = 300;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(slug, locale as BlogLocale);
  if (!post) return { title: 'Not found', robots: { index: false } };

  const url = localeUrl(locale, `/blog/${slug}`);
  return {
    // The layout appends " | Cangday".
    title: post.seoTitle,
    description: post.excerpt,
    keywords: post.tags,
    authors: [{ name: post.author }],
    // hreflang lists only the languages this post is actually written in.
    alternates: localeAlternates(locale, `/blog/${slug}`, post.locales),
    openGraph: {
      type: 'article',
      url,
      title: post.seoTitle,
      description: post.excerpt,
      siteName: SITE_NAME,
      locale: OG_LOCALE[locale],
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author],
      tags: post.tags,
      ...(post.image ? { images: [{ url: post.image, alt: post.imageAlt }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle,
      description: post.excerpt,
      ...(post.image ? { images: [post.image] } : {}),
    },
  };
}

const textOf = (children: React.ReactNode): string =>
  typeof children === 'string'
    ? children
    : Array.isArray(children)
      ? children.map(textOf).join('')
      : children && typeof children === 'object' && 'props' in children
        ? textOf((children as { props: { children?: React.ReactNode } }).props.children)
        : '';

const mdComponents = {
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 id={headingId(textOf(children))} className="mt-12 mb-4 scroll-mt-28 font-heading text-2xl font-medium text-ink md:text-3xl">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 id={headingId(textOf(children))} className="mt-8 mb-3 scroll-mt-28 font-heading text-xl font-medium text-ink">
      {children}
    </h3>
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => <p className="mb-5 leading-relaxed text-ink/75" {...props} />,
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => <ul className="mb-5 list-disc space-y-2 pl-5 text-ink/75 marker:text-gold-deep" {...props} />,
  ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => <ol className="mb-5 list-decimal space-y-2 pl-5 text-ink/75 marker:text-gold-deep" {...props} />,
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote className="my-8 border-l-2 border-gold pl-5 font-heading text-xl italic text-ink/80" {...props} />
  ),
  a: ({ href = '', ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
    const external = /^https?:\/\//.test(href) && !href.startsWith(SITE_URL);
    return (
      <a
        href={href}
        className="text-ink underline decoration-gold underline-offset-4 hover:decoration-2"
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...props}
      />
    );
  },
  strong: (props: React.HTMLAttributes<HTMLElement>) => <strong className="font-semibold text-ink" {...props} />,
  hr: () => <hr className="my-12 border-border" />,
  img: ({ src = '', alt = '' }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element -- inline post images have unknown dimensions
    <img src={String(src)} alt={alt} loading="lazy" decoding="async" className="my-8 w-full rounded-sm ring-1 ring-border" />
  ),
  table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="mb-6 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className="border-b border-ink/20 py-2 pr-4 text-left font-semibold text-ink" {...props} />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className="border-b border-border py-2 pr-4 align-top text-ink/75" {...props} />
  ),
};

async function relatedProducts(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data } = await supabase.from('products').select('*, product_variants(*)').in('id', ids).eq('is_active', true);
  // Keep the order chosen in the editor.
  return ids.map((id) => (data ?? []).find((p) => p.id === id)).filter(Boolean) as Product[];
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const post = await getPost(slug, locale as BlogLocale);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: 'blog' });
  const [products, allPosts] = await Promise.all([relatedProducts(post.relatedProductIds), getPosts(locale as BlogLocale)]);
  const more = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const toc = tableOfContents(post.content);
  const url = localeUrl(locale, `/blog/${slug}`);
  const dateLocale = locale === 'tr' ? 'tr-TR' : 'en-GB';
  const fmt = (iso: string) => new Date(iso).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' });
  const updatedLater = new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() > 86_400_000;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    inLanguage: locale,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(post.image ? { image: [post.image] } : {}),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    wordCount: post.content.split(/\s+/).filter(Boolean).length,
    keywords: post.tags.join(', '),
    author:
      post.author && post.author !== SITE_NAME
        ? { '@type': 'Person', name: post.author, ...(post.authorBio ? { description: post.authorBio } : {}) }
        : { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/cangday-logo-pdf.png` },
    },
    ...(products.length
      ? { mentions: products.map((p) => ({ '@type': 'Product', name: p.name_en, url: localeUrl(locale, `/shop/${p.slug || p.id}`) })) }
      : {}),
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('breadcrumbHome'), item: localeUrl(locale) },
      { '@type': 'ListItem', position: 2, name: t('title'), item: localeUrl(locale, '/blog') },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };
  const faqLd = post.faq.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }
    : null;

  return (
    <div className="bg-ivory">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(articleLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbLd)} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqLd)} />}

      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-16">
        <nav aria-label="Breadcrumb" className="mb-8 text-xs text-ink/50">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-ink">{t('breadcrumbHome')}</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/blog" className="hover:text-ink">{t('title')}</Link></li>
            <li aria-hidden="true">/</li>
            <li className="line-clamp-1 text-ink/70" aria-current="page">{post.title}</li>
          </ol>
        </nav>

        <header className="mb-8 space-y-4">
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tg) => (
                <Link
                  key={tg}
                  href={{ pathname: '/blog', query: { tag: tg } }}
                  className="rounded-full bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold-deep hover:bg-gold/20"
                >
                  {tg}
                </Link>
              ))}
            </div>
          )}
          <h1 className="font-heading text-3xl font-medium leading-tight text-ink md:text-5xl">{post.title}</h1>
          {post.excerpt && <p className="text-lg leading-relaxed text-ink/60">{post.excerpt}</p>}
          <p className="text-xs text-ink/50">
            {t('by', { author: post.author })}
            <span aria-hidden="true"> · </span>
            <time dateTime={post.publishedAt}>{fmt(post.publishedAt)}</time>
            {updatedLater && (
              <>
                <span aria-hidden="true"> · </span>
                {t('updated')} <time dateTime={post.updatedAt}>{fmt(post.updatedAt)}</time>
              </>
            )}
            <span aria-hidden="true"> · </span>
            {t('readingTime', { minutes: post.readingMinutes })}
          </p>
        </header>

        {post.image && (
          <div className="relative mb-10 aspect-[16/9] overflow-hidden rounded-sm bg-secondary ring-1 ring-border">
            <ImageWithFallback src={post.image} alt={post.imageAlt} fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
          </div>
        )}

        {post.summary && (
          <aside className="mb-10 rounded-sm border-l-2 border-gold bg-white p-5 ring-1 ring-border md:p-6">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-deep">{t('inShort')}</p>
            <p className="leading-relaxed text-ink/80">{post.summary}</p>
          </aside>
        )}

        {toc.length >= 3 && (
          <nav aria-label={t('contents')} className="mb-10 rounded-sm bg-white/60 p-5 ring-1 ring-border">
            <p className="mb-3 text-sm font-semibold text-ink">{t('contents')}</p>
            <ol className="space-y-1.5 text-sm">
              {toc.map((h) => (
                <li key={h.id} className={h.level === 3 ? 'pl-4' : ''}>
                  <a href={`#${h.id}`} className="text-ink/65 hover:text-ink hover:underline">{h.text}</a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="text-[17px]">
          <MDXRemote
            source={post.content}
            components={mdComponents}
            options={{
              // Plain Markdown: no JSX or JS expressions, so post text can never run code.
              blockJS: true,
              blockDangerousJS: true,
              mdxOptions: { format: 'md', remarkPlugins: [remarkGfm] },
            }}
          />
        </div>

        {post.faq.length > 0 && (
          <section className="mt-14" aria-labelledby="faq">
            <h2 id="faq" className="mb-5 font-heading text-2xl font-medium text-ink md:text-3xl">{t('faqTitle')}</h2>
            <div className="divide-y divide-border rounded-sm bg-white ring-1 ring-border">
              {post.faq.map((f, i) => (
                <details key={i} className="group p-5" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-medium text-ink">
                    <h3 className="text-base">{f.q}</h3>
                    <span className="text-gold-deep transition group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-ink/70">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-14 flex gap-4 rounded-sm bg-white p-5 ring-1 ring-border">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink font-heading text-lg text-gold">
            {post.author.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-ink/50">{t('writtenBy')}</p>
            <p className="font-heading text-lg text-ink">{post.author}</p>
            {post.authorBio && <p className="mt-1 text-sm text-ink/65">{post.authorBio}</p>}
          </div>
        </footer>
      </article>

      {products.length > 0 && (
        <section className="mx-auto max-w-[1200px] px-4 pb-14 sm:px-6 lg:px-8" aria-labelledby="related-products">
          <h2 id="related-products" className="mb-6 text-center font-heading text-2xl font-medium text-ink md:text-3xl">{t('productsInPost')}</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-4 md:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {more.length > 0 && (
        <section className="border-t border-border bg-white/40" aria-labelledby="more-posts">
          <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 lg:px-8">
            <h2 id="more-posts" className="mb-8 font-heading text-2xl font-medium text-ink">{t('morePosts')}</h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {more.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="group block">
                  <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-sm bg-secondary ring-1 ring-border">
                    {p.image && (
                      <ImageWithFallback src={p.image} alt={p.imageAlt} fill loading="lazy" sizes="(max-width: 640px) 100vw, 380px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    )}
                  </div>
                  <h3 className="font-heading text-lg leading-snug text-ink group-hover:text-ink/70">{p.title}</h3>
                  <p className="mt-1 text-xs text-ink/50">{t('readingTime', { minutes: p.readingMinutes })}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
