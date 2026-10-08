'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCartStore } from '@/hooks/use-cart';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useCheckout } from '@/contexts/checkout-context';
import { useSettings } from '@/components/providers/SettingsProvider';
import { useTranslations } from 'next-intl';

type FormValues = {
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  postal_code: string;
};

export default function CheckoutForm() {
  const t = useTranslations('checkout');
  const formSchema = z.object({
    name: z.string().min(2, t('nameMin')),
    email: z.string().email(t('emailInvalid')),
    phone: z.string().min(10, t('phoneInvalid')),
    country: z.string().min(2, t('countryRequired')),
    city: z.string().min(2, t('cityRequired')),
    address: z.string().min(10, t('addressMin')),
    postal_code: z.string().min(3, t('postalCodeRequired')),
  });
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingZones, setShippingZones] = useState<any[]>([]);
  const [shippingFee, setShippingFee] = useState(0);
  const { setShippingFee: setContextShippingFee } = useCheckout();
  const items = useCartStore((state) => state.items);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice());
  const clearCart = useCartStore((state) => state.clearCart);
  const { hidePrices } = useSettings();

  // Fetch shipping zones on mount
  useEffect(() => {
    const fetchShippingZones = async () => {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      const { data } = await supabase.from('shipping_zones').select('*').order('country');
      if (data) setShippingZones(data);
    };
    fetchShippingZones();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      country: '',
      city: '',
      address: '',
      postal_code: '',
    },
  });

  // Watch country changes to update shipping fee
  const selectedCountry = form.watch('country');

  useEffect(() => {
    if (selectedCountry && shippingZones.length > 0) {
      const zone = shippingZones.find(z => z.country === selectedCountry);
      const baseRate = zone?.price || 0;
      
      // Calculate Total Quantity
      const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
      
      // Wholesale Threshold Logic (500+ Items)
      if (totalQuantity >= 500) {
          setShippingFee(0); // Custom Quote for wholesale
          setContextShippingFee(0);
      } else {
          // Per-Item Calculation
          const calculatedFee = baseRate * totalQuantity;
          setShippingFee(calculatedFee);
          setContextShippingFee(calculatedFee);
      }
    }
  }, [selectedCountry, shippingZones, items, getTotalPrice, setContextShippingFee]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      const subtotal = getTotalPrice;
      const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
      const isWholesale = totalQuantity >= 500;
      
      // Final calculation check
      const finalShippingFee = isWholesale || hidePrices ? 0 : shippingFee;
      const total = hidePrices ? 0 : (subtotal + finalShippingFee);

      // Generate order number
      const orderNumber = `RP${Date.now()}`;

      // Prepare order data for database
      const orderData = {
        customer_name: values.name,
        customer_email: values.email,
        customer_phone: values.phone,
        customer_address: {
          line1: values.address,
          country: values.country,
          city: values.city,
          postal_code: values.postal_code,
        },
        total_amount: total,
        shipping_cost: finalShippingFee,
        status: 'pending',
      };

      // Save order to database
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Error saving order:', JSON.stringify(orderError, null, 2));
        toast.error(orderError.message || t('orderFailed'));
        return;
      }

      // Save order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error saving order items:', itemsError);
      } else {
        // Increment sales count for every item in one batched call instead of one RPC per item.
        const { error: salesCountError } = await supabase.rpc('increment_sales_counts', {
          items: items.map((item) => ({ id: item.id, qty: item.quantity })),
        });
        if (salesCountError) {
          console.error('Error incrementing sales counts:', salesCountError);
        }
      }

      // Send Order Confirmation Email Natively
      try {
        await fetch('/api/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'confirmation',
            email: values.email,
            orderId: order.id,
            customerName: values.name,
          }),
        });
      } catch (emailError) {
        console.error('Non-fatal error: Failed to send confirmation email', emailError);
      }

      toast.success(t('orderPlaced'));

      // Redirect to the success page to handle UI updates
      router.push(`/checkout/success?orderId=${order.id}`);

    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(t('orderFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border rounded-lg p-6">
      <h2 className="text-2xl font-heading font-medium mb-6">{t('deliveryInformation')}</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fullName')}</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('email')}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Phone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('phoneNumber')}</FormLabel>
                <FormControl>
                  <PhoneInput
                    country={'tr'}
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

          {/* Country */}
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('country')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('selectCountryPlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {shippingZones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.country}>
                        {zone.country} {zone.city ? `- ${zone.city}` : ''} {hidePrices ? '' : `(${zone.price.toFixed(2)} / item)`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City */}
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('city')}</FormLabel>
                <FormControl>
                  <Input placeholder="Istanbul" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Address */}
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('fullAddress')}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t('addressPlaceholder')}
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Postal Code */}
          <FormField
            control={form.control}
            name="postal_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('postalCode')}</FormLabel>
                <FormControl>
                  <Input placeholder="34000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('generatingInvoice')}
              </>
            ) : (
              t('placeOrder')
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
