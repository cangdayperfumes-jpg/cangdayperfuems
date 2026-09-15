'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const settingsSchema = z.object({
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
}

export default function SettingsForm({ initialData }: { initialData: SettingsInitialData | null }) {
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
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* ── General Settings ─────────────────────────────── */}
        <div className="bg-white p-6 rounded-lg border shadow-sm max-w-2xl">
          <h2 className="text-lg font-semibold mb-4">General</h2>
          <FormField
            control={form.control}
            name="hidePrices"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base text-black">Hide Global Prices</FormLabel>
                  <FormDescription>
                    When enabled, product prices and checkout totals will be hidden across the entire store. Users will see a &quot;Contact for price&quot; message instead.
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
          <h2 className="text-lg font-semibold mb-4">Popup Banner</h2>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="popupEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-black">Enable Popup</FormLabel>
                    <FormDescription>
                      Show a promotional popup to visitors. It appears once per session.
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
                      <FormLabel>Show On</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select pages" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Pages</SelectItem>
                          <SelectItem value="shop">Shop Page Only</SelectItem>
                          <SelectItem value="home">Home Page Only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose which pages the popup appears on.
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="popupTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Welcome to Royal Perfumes!" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="popupMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="e.g. Explore our new arrivals and get free shipping on your first order."
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
                        <FormLabel>Button Text</FormLabel>
                        <FormControl>
                          <Input placeholder="Shop Now" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="popupButtonLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Button Link</FormLabel>
                        <FormControl>
                          <Input placeholder="/shop" {...field} />
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
                      <FormLabel>Image URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://... or /images/..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Add a banner image at the top of the popup. Leave empty for text-only.
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
          <h2 className="text-lg font-semibold mb-4">Seasonal Collections</h2>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="seasonalCollectionsMultiActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-black">Allow Multiple Active Collections</FormLabel>
                    <FormDescription>
                      When enabled, every currently-active seasonal collection shows on the homepage.
                      When disabled, only the highest-priority one (by Display Order) is shown.
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
                  <FormLabel>Homepage Section Position</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a position" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="after_hero">After Hero</SelectItem>
                      <SelectItem value="after_brand_ticker">After Brand Ticker</SelectItem>
                      <SelectItem value="after_gender_collection">After Gender Collection</SelectItem>
                      <SelectItem value="after_category_carousel">After Category Carousel</SelectItem>
                      <SelectItem value="after_best_sellers">After Best Sellers</SelectItem>
                      <SelectItem value="after_new_arrivals">After New Arrivals</SelectItem>
                      <SelectItem value="before_footer">Before Footer</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Where the Seasonal Collection section appears among the homepage's fixed sections.
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </form>
    </Form>
  );
}
