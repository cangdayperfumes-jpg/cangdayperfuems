'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ColorInput from '@/components/admin/ColorInput';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const settingsSchema = z.object({
  themeGold: z.string().default('#C9A24B'),
  themeGoldDeep: z.string().default('#8A6A2F'),
  themeInk: z.string().default('#120D0A'),
  themeIvory: z.string().default('#F5EFE6'),
  hidePrices: z.boolean().default(false),
  popupEnabled: z.boolean().default(false),
  popupTitle: z.string().default(''),
  popupMessage: z.string().default(''),
  popupButtonText: z.string().default('Shop Now'),
  popupButtonLink: z.string().default('/shop'),
  popupImageUrl: z.string().default(''),
  popupShowOn: z.string().default('all'),
  seasonalCollectionsMultiActive: z.boolean().default(false),
  seasonalSectionPosition: z.string().default('after_gender_collection'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export interface SettingsInitialData {
  hide_prices: boolean;
  popup_enabled: boolean | null;
  popup_title: string | null;
  popup_message: string | null;
  popup_button_text: string | null;
  popup_button_link: string | null;
  popup_image_url: string | null;
  popup_show_on: string | null;
  seasonal_collections_multi_active: boolean | null;
  seasonal_section_position: string | null;
  theme_gold: string | null;
  theme_gold_deep: string | null;
  theme_ink: string | null;
  theme_ivory: string | null;
}

export default function SettingsForm({ initialData }: { initialData: SettingsInitialData | null }) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      themeGold: initialData?.theme_gold ?? '#C9A24B',
      themeGoldDeep: initialData?.theme_gold_deep ?? '#8A6A2F',
      themeInk: initialData?.theme_ink ?? '#120D0A',
      themeIvory: initialData?.theme_ivory ?? '#F5EFE6',
      hidePrices: initialData?.hide_prices ?? false,
      popupEnabled: initialData?.popup_enabled ?? false,
      popupTitle: initialData?.popup_title ?? '',
      popupMessage: initialData?.popup_message ?? '',
      popupButtonText: initialData?.popup_button_text ?? 'Shop Now',
      popupButtonLink: initialData?.popup_button_link ?? '/shop',
      popupImageUrl: initialData?.popup_image_url ?? '',
      popupShowOn: initialData?.popup_show_on ?? 'all',
      seasonalCollectionsMultiActive: initialData?.seasonal_collections_multi_active ?? false,
      seasonalSectionPosition: initialData?.seasonal_section_position ?? 'after_gender_collection',
    },
  });

  const popupEnabled = form.watch('popupEnabled');

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('system_settings')
        .update({
          theme_gold: data.themeGold,
          theme_gold_deep: data.themeGoldDeep,
          theme_ink: data.themeInk,
          theme_ivory: data.themeIvory,
          hide_prices: data.hidePrices,
          popup_enabled: data.popupEnabled,
          popup_title: data.popupTitle,
          popup_message: data.popupMessage,
          popup_button_text: data.popupButtonText,
          popup_button_link: data.popupButtonLink,
          popup_image_url: data.popupImageUrl,
          popup_show_on: data.popupShowOn,
          seasonal_collections_multi_active: data.seasonalCollectionsMultiActive,
          seasonal_section_position: data.seasonalSectionPosition,
        })
        .eq('id', 'global');

      if (error) throw error;
      toast.success(tCommon('savedSuccessfully'));
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error(tCommon('failedToSave'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* ── Theme ─────────────────────────────────────────── */}
        <div className="bg-white p-6 rounded-lg border shadow-sm max-w-2xl">
          <h2 className="text-lg font-semibold mb-1">{t('themeTitle')}</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {t('themeDescription')}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="themeGold"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ColorInput label={t('accentGold')} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormDescription>{t('accentGoldDesc')}</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="themeGoldDeep"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ColorInput label={t('accentDeep')} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormDescription>{t('accentDeepDesc')}</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="themeInk"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ColorInput label={t('darkSurface')} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormDescription>{t('darkSurfaceDesc')}</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="themeIvory"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ColorInput label={t('lightSurface')} value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormDescription>{t('lightSurfaceDesc')}</FormDescription>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ── General Settings ─────────────────────────────── */}
        <div className="bg-white p-6 rounded-lg border shadow-sm max-w-2xl">
          <h2 className="text-lg font-semibold mb-4">{t('generalTitle')}</h2>
          <FormField
            control={form.control}
            name="hidePrices"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base text-black">{t('hidePricesLabel')}</FormLabel>
                  <FormDescription>
                    {t('hidePricesDesc')}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* ── Popup Settings ───────────────────────────────── */}
        <div className="bg-white p-6 rounded-lg border shadow-sm max-w-2xl">
          <h2 className="text-lg font-semibold mb-4">{t('popupBannerTitle')}</h2>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="popupEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-black">{t('enablePopup')}</FormLabel>
                    <FormDescription>
                      {t('enablePopupDesc')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {popupEnabled && (
              <div className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="popupShowOn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('showOn')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('selectPages')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">{t('allPages')}</SelectItem>
                          <SelectItem value="shop">{t('shopPageOnly')}</SelectItem>
                          <SelectItem value="home">{t('homePageOnly')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {t('showOnDesc')}
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="popupTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('popupTitleLabel')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('popupTitlePlaceholder')} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="popupMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('popupMessageLabel')}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t('popupMessagePlaceholder')}
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="popupButtonText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('buttonText')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('buttonTextPlaceholder')} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="popupButtonLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('buttonLink')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('buttonLinkPlaceholder')} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="popupImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('imageUrl')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('imageUrlPlaceholder')} {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('imageUrlDesc')}
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Seasonal Collections ──────────────────────────── */}
        <div className="bg-white p-6 rounded-lg border shadow-sm max-w-2xl">
          <h2 className="text-lg font-semibold mb-4">{t('seasonalTitle')}</h2>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="seasonalCollectionsMultiActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-black">{t('allowMultiple')}</FormLabel>
                    <FormDescription>
                      {t('allowMultipleDesc')}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seasonalSectionPosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('sectionPosition')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectPosition')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="after_hero">{t('posAfterHero')}</SelectItem>
                      <SelectItem value="after_brand_ticker">{t('posAfterBrandTicker')}</SelectItem>
                      <SelectItem value="after_gender_collection">{t('posAfterGenderCollection')}</SelectItem>
                      <SelectItem value="after_category_carousel">{t('posAfterCategoryCarousel')}</SelectItem>
                      <SelectItem value="after_best_sellers">{t('posAfterBestSellers')}</SelectItem>
                      <SelectItem value="after_new_arrivals">{t('posAfterNewArrivals')}</SelectItem>
                      <SelectItem value="before_footer">{t('posBeforeFooter')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {t('sectionPositionDesc')}
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('saveSettings')}
        </Button>
      </form>
    </Form>
  );
}
