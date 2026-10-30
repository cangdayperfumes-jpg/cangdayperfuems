'use client';

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { toast } from 'sonner';
import { Loader2, Lock, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import SearchableSelect, { type SearchableOption } from '@/components/checkout/SearchableSelect';
import { useCartStore } from '@/hooks/use-cart';
import { useCheckout } from '@/contexts/checkout-context';
import { useSettings } from '@/components/providers/SettingsProvider';
import { TURKEY_PROVINCES } from '@/lib/turkey-provinces';
import { couponDiscount, couponProblemFromError } from '@/lib/coupons';
import { useBagOffers } from '@/hooks/use-bag-offers';
import { analytics } from '@/lib/analytics';
import {
  DOMESTIC_COUNTRY_CODE,
  countryDisplayName,
  flagUrl,
  getEnabledCountryZones,
  quoteShipping,
  shippingTotal,
  type ShippingZone,
} from '@/lib/shipping';

export const CHECKOUT_FORM_ID = 'checkout-form';

function SectionHeading({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-ivory text-xs font-semibold">
        {step}
      </span>
      <h2 className="font-heading text-xl md:text-2xl font-medium text-ink">{title}</h2>
    </div>
  );
}

export default function CheckoutForm() {
  const t = useTranslations('checkout');
  const locale = useLocale();
  const router = useRouter();
  const { setShipping, shipping, coupon, setCoupon, isSubmitting, setIsSubmitting } = useCheckout();
  const items = useCartStore((state) => state.items);
  const { lines: offerLines, discount: offerDiscount, afterOffers } = useBagOffers(items);
  const { hidePrices } = useSettings();

  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [zonesLoaded, setZonesLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data } = await supabase
        .from('shipping_zones')
        .select('id, country, country_code, city, price, continent, shipping_details, is_enabled')
        .eq('is_enabled', true);
      setZones((data ?? []) as ShippingZone[]);
      setZonesLoaded(true);
    })();
  }, []);

  // Turkey first, then every other enabled country by its localized name.
  const countries = useMemo(() => {
    const list = getEnabledCountryZones(zones).map((z) => ({
      code: z.country_code as string,
      englishName: z.country,
      label: countryDisplayName(z.country_code as string, locale, z.country),
    }));
    const domestic = list.find((c) => c.code === DOMESTIC_COUNTRY_CODE);
    const rest = list
      .filter((c) => c.code !== DOMESTIC_COUNTRY_CODE)
      .sort((a, b) => a.label.localeCompare(b.label, locale));
    return { domestic, rest };
  }, [zones, locale]);

  const formSchema = z
    .object({
      name: z.string().trim().min(2, t('nameMin')),
      email: z.string().trim().email(t('emailInvalid')),
      phone: z.string().min(10, t('phoneInvalid')),
      country_code: z.string().min(2, t('countryRequired')),
      province: z.string().optional(),
      district: z.string().optional(),
      city: z.string().optional(),
      address: z.string().trim().min(10, t('addressMin')),
      postal_code: z.string().trim().optional(),
    })
    .superRefine((v, ctx) => {
      if (v.country_code === DOMESTIC_COUNTRY_CODE) {
        if (!v.province) ctx.addIssue({ code: 'custom', path: ['province'], message: t('provinceRequired') });
      } else if (!v.city || v.city.trim().length < 2) {
        ctx.addIssue({ code: 'custom', path: ['city'], message: t('cityRequired') });
      }
    });
  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      country_code: '',
      province: '',
      district: '',
      city: '',
      address: '',
      postal_code: '',
    },
  });

  const countryCode = form.watch('country_code');
  const province = form.watch('province');
  const isDomestic = countryCode === DOMESTIC_COUNTRY_CODE;

  // Default the destination to Turkey once zones load (most orders are domestic).
  useEffect(() => {
    if (zonesLoaded && !form.getValues('country_code') && countries.domestic) {
      form.setValue('country_code', DOMESTIC_COUNTRY_CODE);
    }
  }, [zonesLoaded, countries.domestic, form]);

  useEffect(() => {
    setShipping(countryCode ? quoteShipping(zones, countryCode, isDomestic ? province : null) : null);
  }, [zones, countryCode, province, isDomestic, setShipping]);

  const onSubmit = async (values: FormValues) => {
    const quote = quoteShipping(zones, values.country_code, values.country_code === DOMESTIC_COUNTRY_CODE ? values.province : null);
    if (!quote.available) {
      toast.error(t('shippingNotAvailable'));
      return;
    }

    try {
      setIsSubmitting(true);
      // Cargo is charged per bottle.
      const bottles = items.reduce((n, i) => n + i.quantity, 0);
      const shippingCost = hidePrices ? 0 : shippingTotal(quote, bottles);
      // Offers come off first and are saved with the order (offer_discount /
      // offer_lines), so every later view shows these exact amounts. The
      // database re-validates the coupon against what's left and recomputes
      // its discount (and the total) when the order row is inserted.
      const activeCoupon = !hidePrices && coupon && afterOffers >= coupon.min_order ? coupon : null;
      const discount = couponDiscount(activeCoupon, afterOffers);
      const total = hidePrices ? 0 : afterOffers - discount + shippingCost;
      const countryZone = zones.find((z) => z.country_code === values.country_code && !z.city);
      const domestic = values.country_code === DOMESTIC_COUNTRY_CODE;

      const orderData = {
        customer_name: values.name.trim(),
        customer_email: values.email.trim(),
        customer_phone: values.phone,
        customer_address: {
          line1: values.address.trim(),
          // English country name, matching what admin/invoices already display.
          country: countryZone?.country ?? values.country_code,
          country_code: values.country_code,
          // For Turkey `city` holds the province (il), so existing order
          // views/invoices that read address.city keep working.
          city: domestic ? values.province : values.city?.trim(),
          district: domestic ? values.district?.trim() || null : null,
          postal_code: values.postal_code?.trim() || '',
          // Site language at checkout — order emails are sent in it.
          locale,
        },
        total_amount: total,
        shipping_cost: shippingCost,
        coupon_code: activeCoupon?.code ?? null,
        discount_amount: discount,
        offer_discount: hidePrices ? 0 : offerDiscount,
        offer_lines: !hidePrices && offerLines.length ? offerLines : null,
        status: 'pending',
      };

      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();

      // The id is made here so the order never has to be read back: the public
      // has no read access to orders (they hold customers' personal details).
      const orderId = crypto.randomUUID();
      const { error: orderError } = await supabase.from('orders').insert({ id: orderId, ...orderData });
      if (orderError) {
        console.error('Error saving order:', JSON.stringify(orderError, null, 2));
        const couponProblem = couponProblemFromError(orderError.message);
        if (couponProblem) {
          // e.g. this customer already used it, or the last use was just taken.
          setCoupon(null);
          toast.error(t(`coupon_${couponProblem}`) + ' ' + t('couponRemovedRetry'));
          return;
        }
        toast.error(orderError.message || t('orderFailed'));
        return;
      }

      const orderItems = items.map((item) => ({
        order_id: orderId,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        // The chosen size/option, so invoices and the dashboard can show it.
        variant_id: item.variantId ?? null,
        variant_name: item.variantName ?? null,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) {
        console.error('Error saving order items:', itemsError);
      } else {
        // Increment sales count for every item in one batched call instead of one RPC per item.
        const { error: salesCountError } = await supabase.rpc('increment_sales_counts', {
          items: items.map((item) => ({ id: item.id, qty: item.quantity })),
        });
        if (salesCountError) console.error('Error incrementing sales counts:', salesCountError);
      }

      // Telegram new-order alert for the shop owner(s). Fire-and-forget with
      // keepalive so it still goes out while we navigate to the success page.
      fetch('/api/telegram/new-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
        keepalive: true,
      }).catch((e) => console.error('Non-fatal: Telegram notification failed', e));

      try {
        await fetch('/api/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'confirmation', email: values.email, orderId, customerName: values.name, locale }),
        });
      } catch (emailError) {
        console.error('Non-fatal error: Failed to send confirmation email', emailError);
      }

      analytics.purchase({
        id: orderId,
        value: total,
        shipping: shippingCost,
        coupon: activeCoupon?.code,
        items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity, ...(i.variantName ? { item_variant: i.variantName } : {}) })),
      });

      toast.success(t('orderPlaced'));
      router.push(`/checkout/success?orderId=${orderId}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(t('orderFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toCountryOption = (c: { code: string; label: string }): SearchableOption => ({
    value: c.code,
    label: c.label,
    icon: <Image src={flagUrl(c.code)} width={20} height={15} alt="" className="rounded-[2px] shadow-sm" unoptimized />,
  });
  const provinceOptions: SearchableOption[] = TURKEY_PROVINCES.map((p) => ({ value: p, label: p }));

  const noDestinations = zonesLoaded && !countries.domestic && countries.rest.length === 0;
  const blocked = shipping !== null && !shipping.available;

  return (
    <Form {...form}>
      <form id={CHECKOUT_FORM_ID} onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        {/* ── 1. Contact ── */}
        <section>
          <SectionHeading step={1} title={t('contactSection')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t('fullName')}</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" className="h-11 bg-white" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('email')}</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" inputMode="email" className="h-11 bg-white" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('phoneNumber')}</FormLabel>
                  <FormControl>
                    <PhoneInput
                      country="tr"
                      preferredCountries={['tr']}
                      excludeCountries={['il']}
                      value={field.value}
                      onChange={(phone) => field.onChange(phone)}
                      inputClass="phone-input-field"
                      containerClass="phone-input-container"
                      buttonClass="phone-input-button"
                      enableSearch
                      searchPlaceholder={t('searchCountry')}
                      countryCodeEditable={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* ── 2. Delivery ── */}
        <section>
          <SectionHeading step={2} title={t('deliverySection')} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="country_code"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t('country')}</FormLabel>
                  <FormControl>
                    <SearchableSelect
                      value={field.value}
                      onChange={(v) => {
                        field.onChange(v);
                        form.setValue('province', '');
                        form.setValue('city', '');
                      }}
                      pinned={countries.domestic ? [toCountryOption(countries.domestic)] : []}
                      options={countries.rest.map(toCountryOption)}
                      restLabel={countries.domestic ? t('internationalDestinations') : undefined}
                      placeholder={zonesLoaded ? t('selectCountryPlaceholder') : t('loadingDestinations')}
                      searchPlaceholder={t('searchCountry')}
                      emptyText={t('noMatches')}
                      disabled={!zonesLoaded || noDestinations}
                      invalid={!!form.formState.errors.country_code}
                    />
                  </FormControl>
                  {noDestinations && <p className="text-xs text-destructive">{t('noDestinations')}</p>}
                  <FormMessage />
                </FormItem>
              )}
            />

            {isDomestic ? (
              <>
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('province')}</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          options={provinceOptions}
                          placeholder={t('selectProvince')}
                          searchPlaceholder={t('searchProvince')}
                          emptyText={t('noMatches')}
                          invalid={!!form.formState.errors.province}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="district"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('district')}</FormLabel>
                      <FormControl>
                        <Input autoComplete="address-level2" placeholder={t('districtPlaceholder')} className="h-11 bg-white" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('city')}</FormLabel>
                    <FormControl>
                      <Input autoComplete="address-level2" className="h-11 bg-white" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>{t('fullAddress')}</FormLabel>
                  <FormControl>
                    <Textarea
                      autoComplete="street-address"
                      placeholder={t('addressPlaceholder')}
                      className="min-h-[96px] bg-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <FormItem className={isDomestic ? 'sm:col-span-2' : ''}>
                  <FormLabel>
                    {t('postalCode')} <span className="text-muted-foreground font-normal">({t('optional')})</span>
                  </FormLabel>
                  <FormControl>
                    <Input autoComplete="postal-code" inputMode="numeric" className="h-11 bg-white sm:max-w-[200px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {shipping?.available && shipping.details && (
            <p className="mt-4 rounded-sm border border-border bg-secondary/40 px-3 py-2 text-xs text-ink/70">{shipping.details}</p>
          )}
          {blocked && (
            <p className="mt-4 rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              {t('shippingNotAvailable')}
            </p>
          )}
        </section>

        {/* ── 3. Payment ── */}
        <section>
          <SectionHeading step={3} title={t('paymentSection')} />
          <div className="flex items-start gap-3 rounded-sm border-2 border-ink bg-white p-4" role="radio" aria-checked="true">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-ink">
              <span className="h-2 w-2 rounded-full bg-ink" />
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Banknote className="h-4 w-4 text-gold-deep" /> {t('cashOnDelivery')}
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{t('cashOnDeliveryDesc')}</span>
            </span>
          </div>
        </section>

        {/* Desktop submit — mobile uses the sticky bar in the checkout page, which submits this form via form="checkout-form". */}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || blocked || noDestinations}
          className="hidden lg:flex w-full h-14 notch-corners rounded-none bg-ink text-ivory hover:bg-gold-deep uppercase tracking-widest text-sm font-semibold"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('placingOrder')}
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              {t('placeOrder')}
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
