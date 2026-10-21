'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { CheckCircle2, Circle, ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import ImageUploadField from '@/components/admin/ImageUploadField';
import ProductMultiSelectPicker, { type SelectedProductRef } from '@/components/admin/ProductMultiSelectPicker';
import { saveBlogPost, type BlogPostInput } from '@/app/admin/blog/actions';
import { postLocales, slugify, type BlogFaq, type BlogPostRow } from '@/lib/blog';
import { cn } from '@/lib/utils';
import MarkdownEditor from './MarkdownEditor';
import { runSeoChecks } from './seo-checks';

type Lang = 'tr' | 'en';
const SITE = 'cangdayperfume.com';

function emptyInput(): BlogPostInput {
  return {
    slug: '',
    status: 'draft',
    published_at: null,
    featured: false,
    title_en: '', title_tr: '',
    excerpt_en: '', excerpt_tr: '',
    summary_en: '', summary_tr: '',
    content_en: '', content_tr: '',
    seo_title_en: '', seo_title_tr: '',
    cover_image_url: null,
    cover_alt_en: '', cover_alt_tr: '',
    tags: [],
    author_name: 'Cangday',
    author_bio_en: '', author_bio_tr: '',
    faq: [],
    related_product_ids: [],
  };
}

function fromRow(row: BlogPostRow): BlogPostInput {
  const base = emptyInput();
  // Copy only the editable fields (not id / timestamps).
  const picked = Object.fromEntries(Object.keys(base).map((k) => [k, row[k as keyof BlogPostRow] ?? base[k as keyof BlogPostInput]]));
  return { ...base, ...(picked as Partial<BlogPostInput>), faq: row.faq ?? [], tags: row.tags ?? [], related_product_ids: row.related_product_ids ?? [] };
}

/** ISO → value for <input type="datetime-local"> in the admin's timezone. */
function toLocalInput(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function Counter({ value, min, max }: { value: string; min: number; max: number }) {
  const n = value.trim().length;
  return (
    <span className={cn('text-[11px] tabular-nums', n === 0 ? 'text-slate-400' : n < min || n > max ? 'text-amber-600' : 'text-emerald-600')}>
      {n}/{max}
    </span>
  );
}

export default function BlogPostForm({ post, relatedProducts }: { post: BlogPostRow | null; relatedProducts: SelectedProductRef[] }) {
  const t = useTranslations('blog');
  const router = useRouter();
  const [id, setId] = useState(post?.id ?? null);
  const [v, setV] = useState<BlogPostInput>(post ? fromRow(post) : emptyInput());
  const [lang, setLang] = useState<Lang>('tr');
  const [slugTouched, setSlugTouched] = useState(!!post);
  const [products, setProducts] = useState<SelectedProductRef[]>(relatedProducts);
  const [tagText, setTagText] = useState((post?.tags ?? []).join(', '));
  const [saving, setSaving] = useState<'draft' | 'publish' | null>(null);

  const set = <K extends keyof BlogPostInput>(k: K, val: BlogPostInput[K]) => setV((prev) => ({ ...prev, [k]: val }));
  const field = (base: 'title' | 'excerpt' | 'summary' | 'content' | 'seo_title' | 'cover_alt' | 'author_bio') =>
    `${base}_${lang}` as keyof BlogPostInput;
  const get = (base: Parameters<typeof field>[0]) => (v[field(base)] as string) ?? '';
  const put = (base: Parameters<typeof field>[0], val: string) => set(field(base), val as never);

  const onTitle = (val: string) => {
    put('title', val);
    if (!slugTouched) set('slug', slugify(val));
  };

  const filled = postLocales({ title_en: v.title_en, title_tr: v.title_tr, content_en: v.content_en, content_tr: v.content_tr });

  const seo = useMemo(
    () =>
      runSeoChecks({
        title: get('title'),
        seoTitle: get('seo_title'),
        excerpt: get('excerpt'),
        summary: get('summary'),
        content: get('content'),
        coverImage: v.cover_image_url,
        coverAlt: get('cover_alt'),
        faqCount: v.faq.filter((f) => (lang === 'tr' ? f.q_tr && f.a_tr : f.q_en && f.a_en)).length,
        relatedProducts: products.length,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [v, lang, products.length]
  );

  const isLive = v.status === 'published' && (!v.published_at || new Date(v.published_at).getTime() <= Date.now());
  const isScheduled = v.status === 'published' && !!v.published_at && new Date(v.published_at).getTime() > Date.now();

  const save = async (publish: boolean) => {
    setSaving(publish ? 'publish' : 'draft');
    try {
      const input: BlogPostInput = {
        ...v,
        // "Save draft" on a live post takes it offline ("Unpublish").
        status: publish ? 'published' : 'draft',
        tags: tagText.split(',').map((s) => s.trim()).filter(Boolean),
        related_product_ids: products.map((p) => p.product_id),
      };
      const res = await saveBlogPost(id, input);
      if (!res.success) {
        const known = ['slug_required', 'needs_language', 'slug_taken'];
        toast.error(known.includes(res.error) ? t(`err_${res.error}` as never) : `${t('saveFailed')} (${res.error})`);
        return;
      }
      setV((prev) => ({ ...prev, status: input.status, slug: res.slug }));
      toast.success(publish ? t('published') : t('savedDraft'));
      if (!id) {
        setId(res.id);
        router.replace(`/admin/blog/${res.id}`);
      } else {
        router.refresh();
      }
    } catch (e) {
      console.error(e);
      toast.error(t('saveFailed'));
    } finally {
      setSaving(null);
    }
  };

  const faqSet = (i: number, key: keyof BlogFaq, val: string) =>
    set('faq', v.faq.map((f, j) => (j === i ? { ...f, [key]: val } : f)));

  const snippetTitle = (get('seo_title') || get('title') || t('snippetTitlePlaceholder')) + ' | Cangday';
  const snippetDesc = get('excerpt') || t('snippetDescPlaceholder');

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold font-heading">{post ? t('editPost') : t('newPost')}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {isLive ? t('status_live') : isScheduled ? t('status_scheduled') : t('status_draft')}
            {v.slug && <span className="font-mono"> · /{lang}/blog/{v.slug}</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isLive && id && filled.includes(lang) && (
            <a href={`/${lang}/blog/${v.slug}`} target="_blank" rel="noopener noreferrer">
              <Button type="button" variant="ghost">
                <ExternalLink className="mr-2 h-4 w-4" /> {t('viewLive')}
              </Button>
            </a>
          )}
          <Button type="button" variant="outline" onClick={() => save(false)} disabled={saving !== null}>
            {saving === 'draft' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {v.status === 'published' ? t('unpublish') : t('saveDraft')}
          </Button>
          <Button type="button" onClick={() => save(true)} disabled={saving !== null}>
            {saving === 'publish' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {v.status === 'published' ? t('update') : isScheduledInput(v) ? t('schedule') : t('publish')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Main column ── */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <div className="flex gap-1 rounded-lg border bg-white p-1">
            {(['tr', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={cn('flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition', lang === l ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50')}
              >
                {filled.includes(l) ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 opacity-40" />}
                {l === 'tr' ? 'Türkçe' : 'English'}
              </button>
            ))}
          </div>
          <p className="-mt-3 text-xs text-muted-foreground">{t('languageHint')}</p>

          <div className="space-y-5 rounded-lg border bg-white p-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{t('fieldTitle')}</Label>
                <Counter value={get('title')} min={30} max={70} />
              </div>
              <Input value={get('title')} onChange={(e) => onTitle(e.target.value)} placeholder={t('titlePlaceholder')} className="text-base" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>{t('fieldExcerpt')}</Label>
                <Counter value={get('excerpt')} min={110} max={160} />
              </div>
              <Textarea rows={2} value={get('excerpt')} onChange={(e) => put('excerpt', e.target.value)} placeholder={t('excerptPlaceholder')} />
              <p className="text-xs text-muted-foreground">{t('excerptHint')}</p>
            </div>

            <div className="space-y-1.5">
              <Label>{t('fieldSummary')}</Label>
              <Textarea rows={3} value={get('summary')} onChange={(e) => put('summary', e.target.value)} placeholder={t('summaryPlaceholder')} />
              <p className="text-xs text-muted-foreground">{t('summaryHint')}</p>
            </div>

            <div className="space-y-1.5">
              <Label>{t('fieldContent')}</Label>
              <MarkdownEditor value={get('content')} onChange={(val) => put('content', val)} placeholder={t('contentPlaceholder')} />
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-4 rounded-lg border bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">{t('faqTitle')}</h2>
                <p className="text-xs text-muted-foreground">{t('faqHint')}</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => set('faq', [...v.faq, { q_en: '', a_en: '', q_tr: '', a_tr: '' }])}>
                <Plus className="mr-1 h-4 w-4" /> {t('faqAdd')}
              </Button>
            </div>
            {v.faq.length === 0 && <p className="text-sm text-muted-foreground">{t('faqEmpty')}</p>}
            {v.faq.map((f, i) => (
              <div key={i} className="space-y-2 rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <Input
                    value={lang === 'tr' ? f.q_tr : f.q_en}
                    onChange={(e) => faqSet(i, lang === 'tr' ? 'q_tr' : 'q_en', e.target.value)}
                    placeholder={t('faqQuestion')}
                  />
                  <Button type="button" variant="ghost" size="icon" aria-label={t('remove')} onClick={() => set('faq', v.faq.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  value={lang === 'tr' ? f.a_tr : f.a_en}
                  onChange={(e) => faqSet(i, lang === 'tr' ? 'a_tr' : 'a_en', e.target.value)}
                  placeholder={t('faqAnswer')}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Side column ── */}
        <div className="min-w-0 space-y-6">
          {/* SEO */}
          <div className="space-y-4 rounded-lg border bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{t('seoTitle')}</h2>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums',
                  seo.score >= 80 ? 'bg-emerald-100 text-emerald-700' : seo.score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                )}
              >
                {seo.score}/100
              </span>
            </div>
            <div className="rounded-md border bg-slate-50 p-3">
              <p className="truncate text-xs text-slate-500">{SITE} › {lang} › blog › {v.slug || '…'}</p>
              <p className="mt-0.5 line-clamp-1 text-[15px] text-[#1a0dab]">{snippetTitle}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{snippetDesc}</p>
            </div>
            <ul className="space-y-1.5">
              {seo.checks.map((c) => (
                <li key={c.key} className="flex items-start gap-2 text-xs">
                  {c.ok ? <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-emerald-600" /> : <Circle className="mt-px h-3.5 w-3.5 shrink-0 text-amber-500" />}
                  <span className={c.ok ? 'text-slate-600' : 'text-slate-800'}>{t(`check_${c.key}` as never, (c.values ?? {}) as never)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-1.5 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t('fieldSeoTitle')}</Label>
                <Counter value={get('seo_title') || get('title')} min={30} max={60} />
              </div>
              <Input value={get('seo_title')} onChange={(e) => put('seo_title', e.target.value)} placeholder={get('title') || t('seoTitlePlaceholder')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('fieldSlug')}</Label>
              <Input
                value={v.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'));
                }}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">{t('slugHint')}</p>
            </div>
          </div>

          {/* Publishing */}
          <div className="space-y-4 rounded-lg border bg-white p-5">
            <h2 className="font-semibold">{t('publishing')}</h2>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('fieldPublishedAt')}</Label>
              <Input
                type="datetime-local"
                value={toLocalInput(v.published_at)}
                onChange={(e) => set('published_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
              />
              <p className="text-[11px] text-muted-foreground">{t('publishedAtHint')}</p>
            </div>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span>
                <span className="block font-medium">{t('featured')}</span>
                <span className="block text-xs text-muted-foreground">{t('featuredHint')}</span>
              </span>
              <Switch checked={v.featured} onCheckedChange={(c) => set('featured', c)} />
            </label>
          </div>

          {/* Cover */}
          <div className="space-y-4 rounded-lg border bg-white p-5">
            <ImageUploadField
              label={t('cover')}
              value={v.cover_image_url}
              onChange={(url) => set('cover_image_url', url)}
              uploadPrefix="blog/"
              hint={t('coverHint')}
              aspectClassName="aspect-[16/9] h-auto"
            />
            <div className="space-y-1.5">
              <Label className="text-xs">{t('fieldCoverAlt')} ({lang.toUpperCase()})</Label>
              <Input value={get('cover_alt')} onChange={(e) => put('cover_alt', e.target.value)} placeholder={t('coverAltPlaceholder')} />
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4 rounded-lg border bg-white p-5">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('fieldTags')}</Label>
              <Input value={tagText} onChange={(e) => setTagText(e.target.value)} placeholder={t('tagsPlaceholder')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('fieldAuthor')}</Label>
              <Input value={v.author_name} onChange={(e) => set('author_name', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('fieldAuthorBio')} ({lang.toUpperCase()})</Label>
              <Textarea rows={2} value={get('author_bio')} onChange={(e) => put('author_bio', e.target.value)} placeholder={t('authorBioPlaceholder')} />
            </div>
          </div>

          {/* Products */}
          <div className="space-y-3 rounded-lg border bg-white p-5">
            <div>
              <h2 className="font-semibold">{t('relatedProducts')}</h2>
              <p className="text-xs text-muted-foreground">{t('relatedProductsHint')}</p>
            </div>
            <ProductMultiSelectPicker value={products} onChange={setProducts} />
          </div>
        </div>
      </div>
    </div>
  );
}

function isScheduledInput(v: BlogPostInput) {
  return !!v.published_at && new Date(v.published_at).getTime() > Date.now();
}
