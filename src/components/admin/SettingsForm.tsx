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
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { refreshStorefrontSettings } from '@/app/admin/settings/actions';

const settingsSchema = z.object({
  hidePrices: z.boolean().default(false),
  popupEnabled: z.boolean().default(false),
  popupTitle: z.string().default(''),
  popupMessage: z.string().default(''),
  popupButtonText: z.string().default('Shop Now'),
  popupButtonLink: z.string().default('/shop'),
  popupImageUrl: z.string().default(''),
  popupShowOn: z.string().default('all'),
  popupEndsAt: z.string().default(''),
  popupShowBar: z.boolean().default(true),
  popupTitleTr: z.string().default(''),
  popupMessageTr: z.string().default(''),
  popupButtonTextTr: z.string().default(''),
  newBadgeDays: z.coerce.number().int().min(0).max(365).default(30),
  nicheMinPrice: z.coerce.number().min(0).default(3000),
  shippingBannerEnabled: z.boolean().default(true),
  giftEnabled: z.boolean().default(true),
  giftThreshold: z.coerce.number().positive().default(750),
  gaMeasurementId: z.string().trim().toUpperCase().regex(/^(G-[A-Z0-9]{4,16})?$/, 'G-XXXXXXXXXX').default(''),
  gscVerification: z.string().trim().regex(/^[A-Za-z0-9_-]{0,100}$/).default(''),
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
  popup_ends_at?: string | null;
  popup_show_bar?: boolean | null;
  popup_title_tr?: string | null;
  popup_message_tr?: string | null;
  popup_button_text_tr?: string | null;
  new_badge_days?: number | null;
  niche_min_price?: number | null;
  shipping_banner_enabled?: boolean | null;
  gift_enabled?: boolean | null;
  gift_threshold?: number | null;
  ga_measurement_id?: string | null;
  gsc_verification?: string | null;
  seasonal_collections_multi_active: boolean | null;
  seasonal_section_position: string | null;
  theme_gold?: string | null;
  theme_gold_deep?: string | null;
  theme_ink?: string | null;
  theme_ivory?: string | null;
}

/** timestamptz (ISO) → value for <input type="datetime-local"> in the admin's own timezone. */
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export default function SettingsForm({ initialData }: { initialData: SettingsInitialData | null }) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const supabase = createClient();
  const [saving, setSaving] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues: {
      hidePrices: initialData?.hide_prices ?? false,
      popupEnabled: initialData?.popup_enabled ?? false,
      popupTitle: initialData?.popup_title ?? '',
      popupMessage: initialData?.popup_message ?? '',
      popupButtonText: initialData?.popup_button_text ?? 'Shop Now',
      popupButtonLink: initialData?.popup_button_link ?? '/shop',
      popupImageUrl: initialData?.popup_image_url ?? '',
      popupShowOn: initialData?.popup_show_on ?? 'all',
      popupEndsAt: toLocalInput(initialData?.popup_ends_at),
      popupShowBar: initialData?.popup_show_bar ?? true,
      popupTitleTr: initialData?.popup_title_tr ?? '',
      popupMessageTr: initialData?.popup_message_tr ?? '',
      popupButtonTextTr: initialData?.popup_button_text_tr ?? '',
      newBadgeDays: initialData?.new_badge_days ?? 30,
      nicheMinPrice: Number(initialData?.niche_min_price ?? 3000),
      shippingBannerEnabled: initialData?.shipping_banner_enabled ?? true,
      giftEnabled: initialData?.gift_enabled ?? true,
      giftThreshold: Number(initialData?.gift_threshold ?? 750),
      gaMeasurementId: initialData?.ga_measurement_id ?? '',
      gscVerification: initialData?.gsc_verification ?? '',
      seasonalCollectionsMultiActive: initialData?.seasonal_collections_multi_active ?? false,
      seasonalSectionPosition: initialData?.seasonal_section_position ?? 'after_gender_collection',
    },
  });

  const popupEnabled = form.watch('popupEnabled');
  const popupEndsAt = form.watch('popupEndsAt');
  const giftEnabled = form.watch('giftEnabled');
  const offerExpired = !!popupEndsAt && new Date(popupEndsAt).getTime() <= Date.now();

  const onSubmit = async (data: SettingsFormValues) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('system_settings')
        .update({
          hide_prices: data.hidePrices,
          popup_enabled: data.popupEnabled,
          popup_title: data.popupTitle,
          popup_message: data.popupMessage,
          popup_button_text: data.popupButtonText,
          popup_button_link: data.popupButtonLink,
          popup_image_url: data.popupImageUrl,
          popup_show_on: data.popupShowOn,
          // datetime-local is the admin's local time; store it as an absolute instant.
          popup_ends_at: data.popupEndsAt ? new Date(data.popupEndsAt).toISOString() : null,
          popup_show_bar: data.popupShowBar,
          popup_title_tr: data.popupTitleTr,
          popup_message_tr: data.popupMessageTr,
          popup_button_text_tr: data.popupButtonTextTr,
          new_badge_days: data.newBadgeDays,
          niche_min_price: data.nicheMinPrice,
          shipping_banner_enabled: data.shippingBannerEnabled,
          gift_enabled: data.giftEnabled,
          gift_threshold: data.giftThreshold,
          ga_measurement_id: data.gaMeasurementId,
          gsc_verification: data.gscVerification,
          seasonal_collections_multi_active: data.seasonalCollectionsMultiActive,
          seasonal_section_position: data.seasonalSectionPosition,
        })
        .eq('id', 'global');

      if (error) throw error;
      // Show the change on the storefront now instead of after its cache expires.
      await refreshStorefrontSettings().catch((e) => console.error('Storefront refresh failed:', e));
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
      {/* `contents` lets each card join the page's two-column flow. */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="contents">

        {/* ── General Settings ─────────────────────────────── */}
        <div className="mb-6 break-inside-avoid bg-white p-6 rounded-lg border shadow-sm">
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
          <FormField
            control={form.control}
            name="newBadgeDays"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>{t('newBadgeDaysLabel')}</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={365} className="max-w-[140px]" {...field} />
                </FormControl>
                <FormDescription>{t('newBadgeDaysDesc')}</FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shippingBannerEnabled"
            render={({ field }) => (
              <FormItem className="mt-4 flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base text-black">{t('shippingBannerLabel')}</FormLabel>
                  <FormDescription>{t('shippingBannerDesc')}</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nicheMinPrice"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>{t('nicheMinPriceLabel')}</FormLabel>
                <FormControl>
                  <div className="relative max-w-[180px]">
                    <Input type="number" min={0} step="50" className="pr-8" {...field} />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₺</span>
                  </div>
                </FormControl>
                <FormDescription>{t('nicheMinPriceDesc')}</FormDescription>
              </FormItem>
            )}
          />
        </div>

        {/* ── Analytics & Search Console ─────────────────────── */}
        <div className="mb-6 break-inside-avoid bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold">{t('analyticsTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('analyticsDesc')}</p>
          </div>
          <FormField
            control={form.control}
            name="gaMeasurementId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('gaIdLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder="G-XXXXXXXXXX" className="max-w-[240px] font-mono uppercase" {...field} />
                </FormControl>
                <FormDescription>{t('gaIdDesc')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="gscVerification"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('gscLabel')}</FormLabel>
                <FormControl>
                  <Input placeholder="abc123…" className="font-mono" {...field} />
                </FormControl>
                <FormDescription>{t('gscDesc')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ── Free mini gift ───────────────────────────────── */}
        <div className="mb-6 break-inside-avoid bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-semibold mb-4">{t('giftTitle')}</h2>
          <FormField
            control={form.control}
            name="giftEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between gap-4 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base text-black">{t('giftEnabledLabel')}</FormLabel>
                  <FormDescription>{t('giftEnabledDesc')}</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          {giftEnabled && (
            <FormField
              control={form.control}
              name="giftThreshold"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>{t('giftThresholdLabel')}</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} step="1" className="max-w-[180px]" {...field} />
                  </FormControl>
                  <FormDescription>{t('giftThresholdDesc')}</FormDescription>
                </FormItem>
              )}
            />
          )}
        </div>

        {/* ── Popup Settings ───────────────────────────────── */}
        <div className="mb-6 break-inside-avoid bg-white p-6 rounded-lg border shadow-sm">
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

                {/* ── Countdown offer ── */}
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-4">
                  <div>
                    <h3 className="font-medium">{t('countdownTitle')}</h3>
                    <p className="text-sm text-muted-foreground">{t('countdownDesc')}</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="popupEndsAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('offerEndsAt')}</FormLabel>
                        <div className="flex flex-wrap items-center gap-2">
                          <FormControl>
                            <Input type="datetime-local" className="max-w-[260px] bg-white" {...field} />
                          </FormControl>
                          {field.value && (
                            <Button type="button" variant="outline" size="sm" onClick={() => field.onChange('')}>
                              {t('removeCountdown')}
                            </Button>
                          )}
                        </div>
                        <FormDescription>
                          {offerExpired ? <span className="text-destructive">{t('offerExpiredNote')}</span> : t('offerEndsAtDesc')}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="popupShowBar"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-white p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm text-black">{t('showOfferBar')}</FormLabel>
                          <FormDescription>{t('showOfferBarDesc')}</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* ── Turkish copy ── */}
                <div className="rounded-lg border p-4 space-y-4">
                  <div>
                    <h3 className="font-medium">{t('popupTurkishTitle')}</h3>
                    <p className="text-sm text-muted-foreground">{t('popupTurkishDesc')}</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="popupTitleTr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('popupTitleLabel')} (TR)</FormLabel>
                        <FormControl>
                          <Input placeholder={form.watch('popupTitle')} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="popupMessageTr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('popupMessageLabel')} (TR)</FormLabel>
                        <FormControl>
                          <Textarea rows={3} placeholder={form.watch('popupMessage')} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="popupButtonTextTr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('buttonText')} (TR)</FormLabel>
                        <FormControl>
                          <Input placeholder={form.watch('popupButtonText')} {...field} />
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
        <div className="mb-6 break-inside-avoid bg-white p-6 rounded-lg border shadow-sm">
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

        <div className="[column-span:all]">
          <Button type="submit" disabled={saving} size="lg">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('saveSettings')}
          </Button>
        </div>
      </form>
    </Form>
  );
}
