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
import { Textarea } from '@/components/ui/textarea';
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
import { IMAGE_SPECS } from '@/lib/image-specs';
import { HeroSlide } from '@/types';
import type { CropMeta } from '@/lib/image-crop';
import {
  createHeroSlide,
  updateHeroSlide,
  HeroSlideInput,
} from '@/app/admin/marketing/hero-slides/actions';
// Shared with the storefront <Hero> so the crop drawn here is the exact frame shown live.
import { HERO_DESKTOP_ASPECT, HERO_MOBILE_ASPECT } from '@/lib/hero-aspect';


function buildHeroSlideSchema(t: (key: string) => string) {
  return z.object({
    eyebrow: z.string().min(1, t('validation.eyebrowRequired')),
    headline: z.string().min(1, t('validation.headlineRequired')),
    headline_accent: z.string().optional(),
    subheading: z.string().optional(),
    image_position: z.enum(['center', 'top', 'bottom', 'left', 'right']),
    button_text: z.string().min(1, t('validation.buttonTextRequired')),
    button_link: z.string().min(1, t('validation.buttonLinkRequired')),
    secondary_button_text: z.string().optional(),
    secondary_button_link: z.string().optional(),
    // Turkish copy — all optional; blank falls back to the English field.
    eyebrow_tr: z.string().optional(),
    headline_tr: z.string().optional(),
    headline_accent_tr: z.string().optional(),
    subheading_tr: z.string().optional(),
    button_text_tr: z.string().optional(),
    secondary_button_text_tr: z.string().optional(),
    display_order: z.coerce.number().default(0),
    is_active: z.boolean().default(true),
  });
}

type HeroSlideFormValues = z.infer<ReturnType<typeof buildHeroSlideSchema>>;

interface HeroSlideFormProps {
  initialData?: HeroSlide;
}

export default function HeroSlideForm({ initialData }: HeroSlideFormProps) {
  const t = useTranslations('heroSlides');
  const tc = useTranslations('common');
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<string | null>(initialData?.image_url || null);
  const [cropDesktop, setCropDesktop] = useState<CropMeta | null>(initialData?.image_crop_desktop ?? null);
  const [cropMobile, setCropMobile] = useState<CropMeta | null>(initialData?.image_crop_mobile ?? null);
  const [isCropEditorOpen, setIsCropEditorOpen] = useState(false);

  const heroSlideSchema = buildHeroSlideSchema(t);

  const form = useForm<HeroSlideFormValues>({
    resolver: zodResolver(heroSlideSchema) as any,
    defaultValues: {
      eyebrow: initialData?.eyebrow || 'Modern Perfumery',
      headline: initialData?.headline || '',
      headline_accent: initialData?.headline_accent || '',
      subheading: initialData?.subheading || '',
      image_position: initialData?.image_position || 'center',
      button_text: initialData?.button_text || 'Shop the Collection',
      button_link: initialData?.button_link || '/shop',
      secondary_button_text: initialData?.secondary_button_text || '',
      secondary_button_link: initialData?.secondary_button_link || '',
      eyebrow_tr: initialData?.eyebrow_tr || '',
      headline_tr: initialData?.headline_tr || '',
      headline_accent_tr: initialData?.headline_accent_tr || '',
      subheading_tr: initialData?.subheading_tr || '',
      button_text_tr: initialData?.button_text_tr || '',
      secondary_button_text_tr: initialData?.secondary_button_text_tr || '',
      display_order: initialData?.display_order ?? 0,
      is_active: initialData?.is_active ?? true,
    },
  });

  const onSubmit = async (values: HeroSlideFormValues) => {
    if (!image) {
      toast.error(t('imageRequired'));
      return;
    }

    setSaving(true);
    try {
      const payload: HeroSlideInput = {
        eyebrow: values.eyebrow,
        headline: values.headline,
        headline_accent: values.headline_accent || null,
        subheading: values.subheading || null,
        image_url: image,
        image_position: values.image_position,
        image_crop_desktop: cropDesktop,
        image_crop_mobile: cropMobile,
        button_text: values.button_text,
        button_link: values.button_link,
        secondary_button_text: values.secondary_button_text || null,
        secondary_button_link: values.secondary_button_link || null,
        eyebrow_tr: values.eyebrow_tr?.trim() || null,
        headline_tr: values.headline_tr?.trim() || null,
        headline_accent_tr: values.headline_accent_tr?.trim() || null,
        subheading_tr: values.subheading_tr?.trim() || null,
        button_text_tr: values.button_text_tr?.trim() || null,
        secondary_button_text_tr: values.secondary_button_text_tr?.trim() || null,
        display_order: values.display_order,
        is_active: values.is_active,
      };

      const result = initialData
        ? await updateHeroSlide(initialData.id, payload)
        : await createHeroSlide(payload);

      if (!result.success) {
        toast.error(result.error || t('failedToSave'));
        return;
      }

      toast.success(initialData ? t('updatedSuccess') : t('createdSuccess'));
      router.push('/admin/marketing/hero-slides');
      router.refresh();
    } catch (error) {
      console.error('Hero slide submit error', error);
      toast.error(tc('somethingWentWrong'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="xl:columns-2 xl:gap-6 [&>*]:mb-6 [&>*]:break-inside-avoid">
        {/* Content */}
        <section className="space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-heading text-lg">{t('sectionContent')}</h2>

          <FormField
            control={form.control}
            name="eyebrow"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('eyebrowLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('eyebrowPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="headline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('headlineLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('headlinePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="headline_accent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('headlineAccentLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('headlineAccentPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="subheading"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('subheadingLabel')}</FormLabel>
                <FormControl>
                  <Textarea placeholder={t('subheadingPlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Media */}
        <section className="space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-heading text-lg">{t('sectionMedia')}</h2>
          <ImageUploadField
            label={t('slideImageLabel')}
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
            spec={IMAGE_SPECS.hero}
            uploadPrefix="hero-slides/"
            aspectClassName="h-56"
            hint={t('slideImageHint')}
            onEditCrop={image ? () => setIsCropEditorOpen(true) : undefined}
          />
          {image && (
            <ImageCropEditorModal
              open={isCropEditorOpen}
              onOpenChange={setIsCropEditorOpen}
              imageUrl={image}
              title={t('slideImageLabel')}
              desktopAspect={HERO_DESKTOP_ASPECT}
              mobileAspect={HERO_MOBILE_ASPECT}
              initialDesktopCrop={cropDesktop}
              initialMobileCrop={cropMobile}
              onSave={({ desktop, mobile }) => {
                setCropDesktop(desktop);
                setCropMobile(mobile);
              }}
            />
          )}
          <FormField
            control={form.control}
            name="image_position"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>{t('imageFocalPointLabel')}</FormLabel>
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
                  <FormLabel>{t('primaryButtonTextLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('primaryButtonTextPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="button_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('primaryButtonLinkLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder="/shop" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="secondary_button_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('secondaryButtonTextLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('secondaryButtonTextPlaceholder')} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secondary_button_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('secondaryButtonLinkLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder="/about" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* Turkish content — shown on the /tr storefront. Placeholders mirror
            the English values above, which is exactly what renders for any
            field left blank. */}
        <section className="space-y-4 rounded-lg border bg-white p-6">
          <div>
            <h2 className="font-heading text-lg">{t('sectionTurkish')}</h2>
            <p className="text-xs text-muted-foreground mt-1">{t('turkishHint')}</p>
          </div>

          {(
            [
              { name: 'eyebrow_tr', label: t('eyebrowLabel'), en: 'eyebrow' },
              { name: 'headline_tr', label: t('headlineLabel'), en: 'headline' },
              { name: 'headline_accent_tr', label: t('headlineAccentLabel'), en: 'headline_accent' },
              { name: 'subheading_tr', label: t('subheadingLabel'), en: 'subheading', multiline: true },
              { name: 'button_text_tr', label: t('primaryButtonTextLabel'), en: 'button_text' },
              { name: 'secondary_button_text_tr', label: t('secondaryButtonTextLabel'), en: 'secondary_button_text' },
            ] as const
          ).map((f) => (
            <FormField
              key={f.name}
              control={form.control}
              name={f.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {f.label} <span className="text-xs font-normal text-muted-foreground">(TR)</span>
                  </FormLabel>
                  <FormControl>
                    {'multiline' in f ? (
                      <Textarea placeholder={form.watch(f.en) || ''} {...field} />
                    ) : (
                      <Input placeholder={form.watch(f.en) || ''} {...field} />
                    )}
                  </FormControl>
                </FormItem>
              )}
            />
          ))}
        </section>

        {/* Activation */}
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
          <p className="text-xs text-muted-foreground">{t('activationHint')}</p>
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
