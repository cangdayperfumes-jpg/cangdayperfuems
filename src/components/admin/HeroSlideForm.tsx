'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
import { HeroSlide } from '@/types';
import {
  createHeroSlide,
  updateHeroSlide,
  HeroSlideInput,
} from '@/app/admin/marketing/hero-slides/actions';

const heroSlideSchema = z.object({
  eyebrow: z.string().min(1, 'Eyebrow text is required'),
  headline: z.string().min(1, 'Headline is required'),
  headline_accent: z.string().optional(),
  subheading: z.string().optional(),
  image_position: z.enum(['center', 'top', 'bottom', 'left', 'right']),
  button_text: z.string().min(1, 'Button text is required'),
  button_link: z.string().min(1, 'Button link is required'),
  secondary_button_text: z.string().optional(),
  secondary_button_link: z.string().optional(),
  display_order: z.coerce.number().default(0),
  is_active: z.boolean().default(true),
});

type HeroSlideFormValues = z.infer<typeof heroSlideSchema>;

interface HeroSlideFormProps {
  initialData?: HeroSlide;
}

export default function HeroSlideForm({ initialData }: HeroSlideFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<string | null>(initialData?.image_url || null);

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
      display_order: initialData?.display_order ?? 0,
      is_active: initialData?.is_active ?? true,
    },
  });

  const onSubmit = async (values: HeroSlideFormValues) => {
    if (!image) {
      toast.error('Please upload a slide image');
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
        button_text: values.button_text,
        button_link: values.button_link,
        secondary_button_text: values.secondary_button_text || null,
        secondary_button_link: values.secondary_button_link || null,
        display_order: values.display_order,
        is_active: values.is_active,
      };

      const result = initialData
        ? await updateHeroSlide(initialData.id, payload)
        : await createHeroSlide(payload);

      if (!result.success) {
        toast.error(result.error || 'Failed to save hero slide');
        return;
      }

      toast.success(initialData ? 'Slide updated successfully' : 'Slide created successfully');
      router.push('/admin/marketing/hero-slides');
      router.refresh();
    } catch (error) {
      console.error('Hero slide submit error', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-3xl space-y-8">
        {/* Content */}
        <section className="space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-heading text-lg">Content</h2>

          <FormField
            control={form.control}
            name="eyebrow"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Eyebrow Label</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Modern Perfumery" {...field} />
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
                  <FormLabel>Headline</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Wear what" {...field} />
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
                  <FormLabel>Headline Accent (Optional, italic)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. lingers." {...field} />
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
                <FormLabel>Subheading</FormLabel>
                <FormControl>
                  <Textarea placeholder="A short line supporting the headline..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </section>

        {/* Media */}
        <section className="space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-heading text-lg">Media</h2>
          <ImageUploadField
            label="Slide Image"
            value={image}
            onChange={setImage}
            uploadPrefix="hero-slides/"
            aspectClassName="h-56"
          />
          <FormField
            control={form.control}
            name="image_position"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel>Image Focal Point</FormLabel>
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
          <h2 className="font-heading text-lg">Call to Action</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="button_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Button Text</FormLabel>
                  <FormControl>
                    <Input placeholder="Shop the Collection" {...field} />
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
                  <FormLabel>Primary Button Link</FormLabel>
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
                  <FormLabel>Secondary Button Text (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Our Story" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="secondary_button_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Secondary Button Link (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="/about" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* Activation */}
        <section className="space-y-4 rounded-lg border bg-white p-6">
          <h2 className="font-heading text-lg">Activation</h2>

          <FormField
            control={form.control}
            name="display_order"
            render={({ field }) => (
              <FormItem className="max-w-[180px]">
                <FormLabel>Display Order</FormLabel>
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
                <FormLabel className="!mt-0">Enabled</FormLabel>
              </FormItem>
            )}
          />
          <p className="text-xs text-muted-foreground">
            Only enabled slides appear in the homepage carousel, in Display Order.
          </p>
        </section>

        <Button type="submit" disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : initialData ? (
            'Update Slide'
          ) : (
            'Create Slide'
          )}
        </Button>
      </form>
    </Form>
  );
}
