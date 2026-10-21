'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import ImageUploadField from '@/components/admin/ImageUploadField';
import ImageCropEditorModal from '@/components/admin/ImageCropEditorModal';
import type { CropMeta } from '@/lib/image-crop';
import { categoryTileSpec } from '@/lib/image-specs';
import { CategoryTile } from '@/types';
import {
  createCategoryTile,
  updateCategoryTile,
  CategoryTileInput,
} from '@/app/admin/marketing/category-tiles/actions';

function buildTileSchema(t: (key: string) => string) {
  return z.object({
    label: z.string().min(1, t('validation.labelRequired')),
    link_href: z.string().min(1, t('validation.linkRequired')),
    col_span: z.coerce.number().min(1).max(4),
    row_span: z.coerce.number().min(1).max(2),
    display_order: z.coerce.number().default(0),
    is_active: z.boolean().default(true),
  });
}

type TileFormValues = z.infer<ReturnType<typeof buildTileSchema>>;

/**
 * Frame shape of a tile on the homepage, so the crop drawn here is what
 * visitors see. Mirrors discover-categories.tsx: on desktop a 4-column ×
 * 2-row grid, 600px tall inside the 1400px container (≈322px columns,
 * ≈292px rows, 16px gaps); on mobile, wide tiles (2+ columns) are a 2:1
 * banner and the rest are 3:4 portrait cards.
 */
const COL_W = 322;
const ROW_H = 292;
const GAP = 16;
function tileAspects(colSpan: number, rowSpan: number) {
  const w = colSpan * COL_W + (colSpan - 1) * GAP;
  const h = rowSpan * ROW_H + (rowSpan - 1) * GAP;
  return { desktop: w / h, mobile: colSpan >= 2 ? 2 : 3 / 4 };
}

interface CategoryTileFormProps {
  initialData?: CategoryTile;
}

export default function CategoryTileForm({ initialData }: CategoryTileFormProps) {
  const t = useTranslations('categoryTiles');
  const tc = useTranslations('common');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<string | null>(initialData?.image_url || null);
  const [cropDesktop, setCropDesktop] = useState<CropMeta | null>(initialData?.image_crop_desktop ?? null);
  const [cropMobile, setCropMobile] = useState<CropMeta | null>(initialData?.image_crop_mobile ?? null);
  const [isCropEditorOpen, setIsCropEditorOpen] = useState(false);

  const tileSchema = buildTileSchema(t);

  const form = useForm<TileFormValues>({
    resolver: zodResolver(tileSchema) as any,
    defaultValues: {
      label: initialData?.label || '',
      link_href: initialData?.link_href || '/shop',
      col_span: initialData?.col_span ?? 1,
      row_span: initialData?.row_span ?? 1,
      display_order: initialData?.display_order ?? 0,
      is_active: initialData?.is_active ?? true,
    },
  });

  const colSpan = Number(form.watch('col_span')) || 1;
  const rowSpan = Number(form.watch('row_span')) || 1;
  const aspects = tileAspects(colSpan, rowSpan);

  const onSubmit = async (values: TileFormValues) => {
    if (!image) {
      toast.error(t('imageRequired'));
      return;
    }

    setSaving(true);
    try {
      const payload: CategoryTileInput = {
        label: values.label,
        image_url: image,
        link_href: values.link_href,
        col_span: values.col_span as CategoryTile['col_span'],
        row_span: values.row_span as CategoryTile['row_span'],
        display_order: values.display_order,
        is_active: values.is_active,
        image_crop_desktop: cropDesktop,
        image_crop_mobile: cropMobile,
      };

      const result = initialData
        ? await updateCategoryTile(initialData.id, payload)
        : await createCategoryTile(payload);

      if (!result.success) {
        toast.error(result.error || t('failedToSave'));
        return;
      }

      toast.success(initialData ? t('updatedSuccess') : t('createdSuccess'));
      router.push('/admin/marketing/category-tiles');
      router.refresh();
    } catch (error) {
      console.error('Category tile submit error', error);
      toast.error(tc('somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="xl:columns-2 xl:gap-6 [&>*]:mb-6 [&>*]:break-inside-avoid">
        <section className="space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-heading text-lg">{t('sectionContent')}</h2>

          <FormField
            control={form.control}
            name="label"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('labelLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('labelPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="link_href"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('linkLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder="/shop?audience=Women" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        <section className="space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-heading text-lg">{t('sectionMedia')}</h2>
          <ImageUploadField
            label={t('tileImageLabel')}
            value={image}
            onChange={(url, reason) => {
              setImage(url);
              // A replaced image invalidates any crop computed for the old one;
              // an adjusted copy has the same framing, so its crop is kept.
              if (reason !== 'adjust') {
                setCropDesktop(null);
                setCropMobile(null);
              }
            }}
            spec={categoryTileSpec(aspects.desktop, aspects.mobile)}
            uploadPrefix="category-tiles/"
            aspectClassName="h-56"
            hint={t('tileCropHint')}
            onEditCrop={image ? () => setIsCropEditorOpen(true) : undefined}
          />
          {image && (cropDesktop || cropMobile) && (
            <p className="text-xs text-emerald-700">{t('tileCropSaved')}</p>
          )}
          {image && (
            <ImageCropEditorModal
              // Remount when the size changes so the frame shape updates.
              key={`${colSpan}x${rowSpan}`}
              open={isCropEditorOpen}
              onOpenChange={setIsCropEditorOpen}
              imageUrl={image}
              title={t('tileImageLabel')}
              desktopAspect={aspects.desktop}
              mobileAspect={aspects.mobile}
              initialDesktopCrop={cropDesktop}
              initialMobileCrop={cropMobile}
              onSave={({ desktop, mobile }) => {
                setCropDesktop(desktop);
                setCropMobile(mobile);
              }}
            />
          )}
        </section>

        <section className="space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-heading text-lg">{t('sectionBentoSizing')}</h2>
          <p className="text-xs text-muted-foreground">{t('bentoSizingHint')}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="col_span"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('columnSpanLabel')}</FormLabel>
                  <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4].map((v) => (
                        <SelectItem key={v} value={String(v)}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="row_span"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('rowSpanLabel')}</FormLabel>
                  <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2].map((v) => (
                        <SelectItem key={v} value={String(v)}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-heading text-lg">{t('sectionActivation')}</h2>
          <FormField
            control={form.control}
            name="display_order"
            render={({ field }) => (
              <FormItem className="max-w-[180px]">
                <FormLabel>{t('displayOrderLabel')}</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 space-y-0">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="!mt-0">{t('enabledLabel')}</FormLabel>
              </FormItem>
            )}
          />
        </section>

        {/* Spans both columns so Save always sits at the end. */}
        <div className="[column-span:all] pt-2">
          <Button type="submit" disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tc('saving')}
              </>
            ) : initialData ? (
              t('submitUpdate')
            ) : (
              t('submitCreate')
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
