'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Eye, EyeOff, ImagePlus, Loader2, MessageSquareQuote, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { uploadToProductsBucket, validateImageFile } from '@/lib/upload-image';
import type { Testimonial } from '@/lib/testimonials-data';
import { addTestimonials, deleteTestimonials, reorderTestimonials, setTestimonialActive } from './actions';

/**
 * Admin → Reviews: the customer message screenshots in the homepage
 * "What our customers say" strip. Upload several at once, reorder with the
 * arrows, hide or delete. Each change is saved immediately.
 */
export default function TestimonialsManager({ testimonials }: { testimonials: Testimonial[] }) {
  const t = useTranslations('testimonials');
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(testimonials);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [pending, startTransition] = useTransition();

  const shown = items.filter((i) => i.is_active).length;

  const run = (action: () => Promise<{ success: boolean; error?: string }>, ok?: string) =>
    startTransition(async () => {
      const res = await action();
      if (!res.success) {
        toast.error(t('failed'));
        setItems(testimonials);
        return;
      }
      if (ok) toast.success(ok);
      router.refresh();
    });

  const onFiles = async (files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    const valid = list.filter((f) => {
      const check = validateImageFile(f);
      if (!check.valid) toast.error(`${f.name}: ${check.error}`);
      return check.valid;
    });
    if (!valid.length) return;

    const supabase = createClient();
    const urls: string[] = [];
    setUploading({ done: 0, total: valid.length });
    try {
      for (const file of valid) {
        urls.push(await uploadToProductsBucket(supabase, file, 'testimonials/'));
        setUploading({ done: urls.length, total: valid.length });
      }
      const res = await addTestimonials(urls);
      if (!res.success) throw new Error(res.error);
      toast.success(t('added', { count: urls.length }));
      router.refresh();
    } catch (e) {
      console.error('Review upload failed:', e);
      toast.error(t('uploadFailed'));
    } finally {
      setUploading(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    run(() => reorderTestimonials(next.map((i) => i.id)));
  };

  const toggle = (item: Testimonial) => {
    setItems((list) => list.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i)));
    run(() => setTestimonialActive(item.id, !item.is_active));
  };

  const remove = (item: Testimonial) => {
    if (!confirm(t('confirmDelete'))) return;
    setItems((list) => list.filter((i) => i.id !== item.id));
    run(() => deleteTestimonials([item.id]), t('deleted'));
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-playfair font-bold">{t('title')}</h1>
          <p className="mt-2 max-w-2xl text-gray-500">{t('description')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('count', { shown, total: items.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <Button onClick={() => fileInput.current?.click()} disabled={!!uploading}>
            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
            {uploading ? t('uploading', { done: uploading.done, total: uploading.total }) : t('add')}
          </Button>
        </div>
      </div>

      <p className="mb-5 rounded-md border bg-white px-4 py-3 text-xs text-muted-foreground">{t('tip')}</p>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-white py-16 text-center text-muted-foreground hover:border-gold/60"
        >
          <MessageSquareQuote className="h-8 w-8" />
          <span className="font-medium text-ink">{t('emptyTitle')}</span>
          <span className="text-sm">{t('emptyBody')}</span>
        </button>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {items.map((item, index) => (
            <li key={item.id} className={cn('overflow-hidden rounded-lg border bg-white shadow-sm', !item.is_active && 'opacity-60')}>
              <div className="relative aspect-[3/4] bg-secondary/40">
                <Image src={item.image_url} alt="" fill sizes="(max-width: 640px) 50vw, 220px" className="object-cover" />
                <span className="absolute left-2 top-2 rounded bg-ink/80 px-1.5 py-0.5 text-[11px] font-semibold text-ivory">{index + 1}</span>
                {!item.is_active && (
                  <span className="absolute right-2 top-2 rounded bg-white/90 px-1.5 py-0.5 text-[11px] font-medium text-ink">{t('hidden')}</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5">
                <div className="flex">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(index, -1)} disabled={index === 0} aria-label={t('moveLeft')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => move(index, 1)} disabled={index === items.length - 1} aria-label={t('moveRight')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggle(item)} aria-label={item.is_active ? t('hide') : t('show')} title={item.is_active ? t('hide') : t('show')}>
                    {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => remove(item)} aria-label={t('delete')}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
