import Link from 'next/link';
import { ExternalLink, Pencil, Plus, Star } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { getAdminLocale, getAdminT } from '@/i18n/admin-locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { postLocales, type BlogPostRow } from '@/lib/blog';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteBlogPost } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const locale = await getAdminLocale();
  const t = await getAdminT(locale, 'blog');
  const supabase = await createClient();
  const { data } = await supabase
    .from('blog_posts')
    .select('id, slug, status, published_at, featured, title_en, title_tr, content_en, content_tr, updated_at, cover_image_url')
    .order('updated_at', { ascending: false });
  const posts = (data ?? []) as Pick<BlogPostRow, 'id' | 'slug' | 'status' | 'published_at' | 'featured' | 'title_en' | 'title_tr' | 'content_en' | 'content_tr' | 'updated_at' | 'cover_image_url'>[];
  const dateLocale = locale === 'tr' ? 'tr-TR' : 'en-GB';
  // Server component: "now" is the request time.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const statusOf = (p: (typeof posts)[number]) =>
    p.status === 'draft' ? 'draft' : p.published_at && new Date(p.published_at).getTime() > now ? 'scheduled' : 'live';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Link href="/admin/blog/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> {t('newPost')}
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('colTitle')}</TableHead>
              <TableHead>{t('colLanguages')}</TableHead>
              <TableHead>{t('colStatus')}</TableHead>
              <TableHead>{t('colUpdated')}</TableHead>
              <TableHead className="text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((p) => {
              const langs = postLocales(p);
              const status = statusOf(p);
              return (
                <TableRow key={p.id}>
                  <TableCell className="max-w-[360px]">
                    <Link href={`/admin/blog/${p.id}`} className="flex items-center gap-1.5 font-medium hover:underline">
                      {p.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />}
                      <span className="truncate">{p.title_tr || p.title_en || t('untitled')}</span>
                    </Link>
                    <span className="block truncate font-mono text-xs text-muted-foreground">/blog/{p.slug}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {(['tr', 'en'] as const).map((l) => (
                        <Badge key={l} variant="outline" className={langs.includes(l) ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'text-slate-400'}>
                          {l.toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        status === 'live'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : status === 'scheduled'
                            ? 'border-sky-200 bg-sky-50 text-sky-700'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                      }
                    >
                      {t(`status_${status}`)}
                    </Badge>
                    {status === 'scheduled' && p.published_at && (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {new Date(p.published_at).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Istanbul' })}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(p.updated_at).toLocaleDateString(dateLocale, { dateStyle: 'medium' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {status === 'live' && langs[0] && (
                        <a href={`/${langs[0]}/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon" aria-label={t('viewLive')}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                      <Link href={`/admin/blog/${p.id}`}>
                        <Button variant="ghost" size="icon" aria-label={t('edit')}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteButton id={p.id} onDelete={deleteBlogPost} itemName={p.title_tr || p.title_en || p.slug} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  {t('empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
