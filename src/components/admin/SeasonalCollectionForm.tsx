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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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

import ColorInput from '@/components/admin/ColorInput';
import ImageUploadField from '@/components/admin/ImageUploadField';
import ProductMultiSelectPicker, { SelectedProductRef } from '@/components/admin/ProductMultiSelectPicker';
import { SeasonalCollection, SeasonalCollectionProductLink } from '@/types';
import {
  createSeasonalCollection,
  updateSeasonalCollection,
  SeasonalCollectionInput,
} from '@/app/admin/marketing/seasonal-collections/actions';

const SEASON_TYPE_PRESETS = [
  'Summer Collection',
  'Winter Collection',
  'Spring Collection',
  'Autumn Collection',
  'Ramadan Collection',
  'Eid Collection',
  'Black Friday',
  'Christmas',
  'Valentine',
  'New Arrivals',
  'Limited Edition',
];

function buildSeasonalCollectionSchema(t: (key: string) => string) {
  return z.object({
    title: z.string().min(2, t('validation.titleMinLength')),
    subtitle: z.string().optional(),
    description: z.string().optional(),
    season_type: z.string().optional(),
    seo_title: z.string().optional(),
    seo_description: z.string().optional(),
    background_color: z.string().min(1),
    text_color: z.string().min(1),
    overlay_opacity: z.coerce.number().min(0).max(100),
    image_position: z.enum(['center', 'top', 'bottom', 'left', 'right']),
    section_height: z.enum(['sm', 'md', 'lg', 'full']),
    text_alignment: z.enum(['left', 'center', 'right']),
    animation_style: z.enum(['fade-up', 'fade-in', 'slide-left', 'slide-right', 'zoom-in', 'none']),
    button_text: z.string().min(1, t('validation.buttonTextRequired')),
    button_color: z.string().optional(),
    button_style: z.enum(['solid', 'outline', 'ghost']),
    display_order: z.coerce.number().default(0),
    is_active: z.boolean().default(false),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  });
}

type SeasonalCollectionFormValues = z.infer<ReturnType<typeof buildSeasonalCollectionSchema>>;

interface SeasonalCollectionFormProps {
  initialData?: SeasonalCollection;
  initialProducts?: SeasonalCollectionProductLink[];
}

function toDateInputValue(iso?: string | null): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export default function SeasonalCollectionForm({
  initialData,
  initialProducts = [],
}: SeasonalCollectionFormProps) {
  const t = useTranslations('seasonalCollections');
  const tc = useTranslations('common');
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [isCustomSeasonType, setIsCustomSeasonType] = useState(
    !!initialData?.season_type && !SEASON_TYPE_PRESETS.includes(initialData.season_type)
  );

  const [bannerDesktop, setBannerDesktop] = useState<string | null>(initialData?.banner_image_desktop || null);
  const [bannerMobile, setBannerMobile] = useState<string | null>(initialData?.banner_image_mobile || null);
  const [backgroundPattern, setBackgroundPattern] = useState<string | null>(initialData?.background_pattern_image || null);
  const [decorativeImage, setDecorativeImage] = useState<string | null>(initialData?.decorative_image || null);

  const [selectedProducts, setSelectedProducts] = useState<SelectedProductRef[]>(
    initialProducts.map((link) => ({
      product_id: link.product_id,
      name_en: link.product?.name_en || 'Product',
      image: link.product?.images?.[0] || null,
      display_order: link.display_order,
    }))
  );

  const seasonalCollectionSchema = buildSeasonalCollectionSchema(t);

  const form = useForm<SeasonalCollectionFormValues>({
    resolver: zodResolver(seasonalCollectionSchema) as any,
    defaultValues: {
      title: initialData?.title || '',
      subtitle: initialData?.subtitle || '',
      description: initialData?.description || '',
      season_type: initialData?.season_type || SEASON_TYPE_PRESETS[0],
      seo_title: initialData?.seo_title || '',
      seo_description: initialData?.seo_description || '',
      background_color: initialData?.background_color || '#000000',
      text_color: initialData?.text_color || '#FFFFFF',
      overlay_opacity: initialData?.overlay_opacity ?? 30,
      image_position: initialData?.image_position || 'center',
      section_height: initialData?.section_height || 'md',
      text_alignment: initialData?.text_alignment || 'center',
      animation_style: initialData?.animation_style || 'fade-up',
      button_text: initialData?.button_text || 'Shop Now',
      button_color: initialData?.button_color || '#FFFFFF',
      button_style: initialData?.button_style || 'solid',
      display_order: initialData?.display_order ?? 0,
      is_active: initialData?.is_active ?? false,
      start_date: toDateInputValue(initialData?.start_date),
      end_date: toDateInputValue(initialData?.end_date),
    },
  });

  const overlayOpacity = form.watch('overlay_opacity');

  const onSubmit = async (values: SeasonalCollectionFormValues) => {
    setSaving(true);
    try {
      const payload: SeasonalCollectionInput = {
        title: values.title,
        subtitle: values.subtitle || null,
        description: values.description || null,
        season_type: values.season_type || null,
        seo_title: values.seo_title || null,
        seo_description: values.seo_description || null,
        banner_image_desktop: bannerDesktop,
        banner_image_mobile: bannerMobile,
        background_pattern_image: backgroundPattern,
        decorative_image: decorativeImage,
        background_color: values.background_color,
        text_color: values.text_color,
        overlay_opacity: values.overlay_opacity,
        image_position: values.image_position,
        section_height: values.section_height,
        text_alignment: values.text_alignment,
        animation_style: values.animation_style,
        button_text: values.button_text,
        button_color: values.button_color || null,
        button_style: values.button_style,
        display_order: values.display_order,
        is_active: values.is_active,
        start_date: values.start_date ? new Date(values.start_date).toISOString() : null,
        end_date: values.end_date ? new Date(values.end_date).toISOString() : null,
        products: selectedProducts.map((p, index) => ({ product_id: p.product_id, display_order: index })),
      };

      const result = initialData
        ? await updateSeasonalCollection(initialData.id, payload)
        : await createSeasonalCollection(payload);

      if (!result.success) {
        toast.error(result.error || t('failedToSave'));
        return;
      }

      toast.success(initialData ? t('updatedSuccess') : t('createdSuccess'));
      router.push('/admin/marketing/seasonal-collections');
      router.refresh();
    } catch (error) {
      console.error('Seasonal collection submit error', error);
      toast.error(tc('somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-3xl space-y-8">
        {/* Basic Info */}
        <section className="space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-heading text-lg">{t('sectionBasicInfo')}</h2>

          <div className="space-y-2">
            <Label>{t('seasonTypeLabel')}</Label>
            <Select
              value={isCustomSeasonType ? '__custom__' : form.watch('season_type')}
              onValueChange={(val) => {
                if (val === '__custom__') {
                  setIsCustomSeasonType(true);
                  form.setValue('season_type', '');
                } else {
                  setIsCustomSeasonType(false);
                  form.setValue('season_type', val);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('seasonTypePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {SEASON_TYPE_PRESETS.map((preset) => (
                  <SelectItem key={preset} value={preset}>
                    {preset}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">{t('seasonTypeCustomOption')}</SelectItem>
              </SelectContent>
            </Select>
            {isCustomSeasonType && (
              <Input
                placeholder={t('seasonTypeCustomPlaceholder')}
                value={form.watch('season_type')}
                onChange={(e) => form.setValue('season_type', e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('titleLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('titlePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subtitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('subtitleLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('subtitlePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('descriptionLabel')}</FormLabel>
                <FormControl>
                  <Textarea placeholder={t('descriptionPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Media */}
        <section className="space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-heading text-lg">{t('sectionMedia')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageUploadField
              label={t('desktopBannerLabel')}
              value={bannerDesktop}
              onChange={setBannerDesktop}
              uploadPrefix="seasonal/banners/desktop/"
            />
            <ImageUploadField
              label={t('mobileBannerLabel')}
              value={bannerMobile}
              onChange={setBannerMobile}
              uploadPrefix="seasonal/banners/mobile/"
            />
            <ImageUploadField
              label={t('backgroundPatternLabel')}
              value={backgroundPattern}
              onChange={setBackgroundPattern}
              uploadPrefix="seasonal/patterns/"
            />
            <ImageUploadField
              label={t('decorativeImageLabel')}
              value={decorativeImage}
              onChange={setDecorativeImage}
              uploadPrefix="seasonal/decorative/"
            />
          </div>
        </section>

        {/* Appearance */}
        <section className="space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-heading text-lg">{t('sectionAppearance')}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="background_color"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ColorInput label={t('backgroundColorLabel')} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="text_color"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ColorInput label={t('textColorLabel')} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('overlayOpacityLabel', { value: overlayOpacity })}</Label>
            <Slider
              value={[overlayOpacity]}
              onValueChange={([v]) => form.setValue('overlay_opacity', v)}
              min={0}
              max={100}
              step={1}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="image_position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('imagePositionLabel')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['center', 'top', 'bottom', 'left', 'right'].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="text_alignment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('textAlignmentLabel')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['left', 'center', 'right'].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="section_height"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sectionHeightLabel')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['sm', 'md', 'lg', 'full'].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="animation_style"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('animationStyleLabel')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {['fade-up', 'fade-in', 'slide-left', 'slide-right', 'zoom-in', 'none'].map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </section>

        {/* Call to Action */}
        <section className="space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-heading text-lg">{t('sectionCta')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="button_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('buttonTextLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('buttonTextPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="button_style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('buttonStyleLabel')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['solid', 'outline', 'ghost'].map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="button_color"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <ColorInput label={t('buttonColorLabel')} value={field.value || '#FFFFFF'} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </section>

        {/* Products */}
        <section className="space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-heading text-lg">{t('sectionProducts')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('productsHintBefore')} <code>/shop?season=…</code> {t('productsHintAfter')}
          </p>
          <ProductMultiSelectPicker value={selectedProducts} onChange={setSelectedProducts} />
        </section>

        {/* Scheduling & Activation */}
        <section className="space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-heading text-lg">{t('sectionScheduling')}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('startDateLabel')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('endDateLabel')}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

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
          <p className="text-xs text-muted-foreground">{t('schedulingHint')}</p>
        </section>

        {/* SEO */}
        <section className="space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-heading text-lg">{t('sectionSeo')}</h2>
          <FormField
            control={form.control}
            name="seo_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('seoTitleLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('seoTitlePlaceholder')} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="seo_description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('seoDescriptionLabel')}</FormLabel>
                <FormControl>
                  <Textarea placeholder={t('seoDescriptionPlaceholder')} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <p className="text-xs text-muted-foreground">{t('seoHint')}</p>
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
