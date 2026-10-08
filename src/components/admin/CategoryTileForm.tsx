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

interface CategoryTileFormProps {
  initialData?: CategoryTile;
}

export default function CategoryTileForm({ initialData }: CategoryTileFormProps) {
  const t = useTranslations('categoryTiles');
  const tc = useTranslations('common');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<string | null>(initialData?.image_url || null);

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-3xl space-y-8">
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
            onChange={setImage}
            uploadPrefix="category-tiles/"
            aspectClassName="h-56"
          />
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
      </form>
    </Form>
  );
}
