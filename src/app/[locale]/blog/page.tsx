import type { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import { getAllPosts } from '@/lib/blog';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('blog');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: '/blog' },
  };
}

export default async function BlogIndexPage() {
  const t = await getTranslations('blog');
  const locale = await getLocale();
  const posts = getAllPosts();

  return (
    <div className="container py-12 md:py-20 max-w-4xl mx-auto">
      <div className="text-center mb-12 space-y-3">
        <h1 className="text-4xl md:text-5xl font-heading font-medium text-gray-900">{t('title')}</h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          {t('intro')}
        </p>
      </div>

      <div className="space-y-10">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col sm:flex-row gap-6 border-b border-gray-100 pb-10 last:border-0"
          >
            <div className="relative w-full sm:w-56 h-56 sm:h-40 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
              <Image
                src={post.image}
                alt={post.imageAlt}
                fill
                sizes="(max-width: 640px) 100vw, 224px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs uppercase tracking-widest text-gray-400">
                {new Date(post.date).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                {' · '}
                {post.readingTime}
              </p>
              <h2 className="text-xl md:text-2xl font-heading font-medium text-gray-900 group-hover:text-gray-600 transition-colors">
                {post.title}
              </h2>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed">{post.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
