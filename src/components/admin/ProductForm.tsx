'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Upload, X, Check, ChevronsUpDown, Plus } from 'lucide-react';
import Image from 'next/image';
import { toast } from "sonner";
import { validateImageFile, uploadToProductsBucket } from '@/lib/upload-image';
import ImageUploadField from '@/components/admin/ImageUploadField';
import ImageCropEditorModal from '@/components/admin/ImageCropEditorModal';
import type { CropMeta } from '@/lib/image-crop';

// Matches ProductCard's responsive aspect classes (aspect-[4/5] mobile,
// aspect-[3/4] desktop) so the crop editor's frame matches what actually
// renders on the storefront grid.
const PRODUCT_DESKTOP_ASPECT = 3 / 4;
const PRODUCT_MOBILE_ASPECT = 4 / 5;

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { resolveUniqueProductSlug } from '@/lib/utils';
import { Product, Category, Brand } from '@/types';

// Zod Schema — built from a translate function so validation messages follow the
// active admin locale (see useMemo below where it's instantiated with `t`).
const buildProductSchema = (t: (key: string) => string) => z.object({
  name_en: z.string().min(2, t('validation.nameMinLength')),
  description_en: z.string().optional(),
  price: z.coerce.number().min(0, t('validation.pricePositive')),
  discount: z.coerce.number().min(0, t('validation.discountPositive')).default(0),
  category_id: z.string().min(1, t('validation.categoryRequired')),
  brand_id: z.string().min(1, t('validation.brandRequired')),
  target_audience: z.enum(['Men', 'Women', 'Unisex']),
  stock: z.boolean().default(true),
  is_active: z.boolean().default(true),
  has_variants: z.boolean().default(false),
  images: z.array(z.string()).optional(),
  is_popular: z.boolean().default(false),
  is_new: z.boolean().default(false),
  variants: z.array(z.object({
      id: z.string().optional(),
      name: z.string().min(1, t('validation.variantNameRequired')),
      price: z.coerce.number().min(0),
      discount: z.coerce.number().default(0),
      stock: z.boolean().default(true),
  })).optional(),
});

type ProductFormValues = z.infer<ReturnType<typeof buildProductSchema>>;

interface ProductFormProps {
  initialData?: Product;
  categories?: Category[];
  brands?: Brand[];
  onSuccess?: () => void;
}

export default function ProductForm({ initialData, categories: initialCategories = [], brands: initialBrands = [], onSuccess }: ProductFormProps) {
  const router = useRouter();
  const t = useTranslations('products');
  const tc = useTranslations('common');
  const productSchema = useMemo(() => buildProductSchema(t), [t]);
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  // Seeded from server-fetched props (cached, see src/lib/admin-data.ts) — local
  // state only so "create new category/brand inline" can append immediately.
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [uploading, setUploading] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [openBrand, setOpenBrand] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Optional mobile-only override for the cover image, with graceful
  // fallback to images[0] when not set — see src/lib/image-crop.ts for why
  // crop is stored as non-destructive metadata rather than a baked file.
  const [mobileImage, setMobileImage] = useState<string | null>(initialData?.mobile_image_url ?? null);
  const [cropDesktop, setCropDesktop] = useState<CropMeta | null>(initialData?.image_crop_desktop ?? null);
  const [cropMobile, setCropMobile] = useState<CropMeta | null>(initialData?.image_crop_mobile ?? null);
  const [isCropEditorOpen, setIsCropEditorOpen] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: initialData ? {
      name_en: initialData.name_en,
      description_en: initialData.description_en || '',
      price: initialData.price,
      discount: initialData.discount,
      category_id: initialData.category_id || '',
      brand_id: initialData.brand_id || '',
      target_audience: (initialData.target_audience as 'Men' | 'Women' | 'Unisex') || 'Unisex',
      stock: initialData.stock,
      is_active: initialData.is_active,
      has_variants: initialData.has_variants || false,
      images: initialData.images || [],
      is_popular: initialData.is_popular || false,
      is_new: initialData.is_new || false,
      variants: [], // Will be populated in useEffect
    } : {
      name_en: '',
      description_en: '',
      price: 0,
      discount: 0,
      category_id: '',
      brand_id: '',
      target_audience: 'Unisex',
      is_popular: false,
      is_new: false,
      stock: true,
      is_active: true,
      has_variants: false,
      images: [],
      variants: [],
    },
  });

  // Fetch variants only when editing a product that has them — categories/brands
  // now arrive as server-fetched (cached) props instead of a client fetch here.
  const fetchData = async () => {
    if (initialData?.id && initialData.has_variants) {
        const { data: variantsData } = await supabase
            .from('product_variants')
            .select('*')
            .eq('product_id', initialData.id)
            .order('price');
            
        if (variantsData) {
            form.setValue('variants', variantsData.map(v => ({
                id: v.id,
                name: v.name,
                price: v.price,
                discount: v.discount || 0,
                stock: v.stock
            })));
        }
    }
  };

  useEffect(() => {
    fetchData();
  }, [supabase, initialData]);

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setLoading(true);

      let productId = initialData?.id;

      // Calculate derived fields for variants
      let derivedPrice = data.price;
      let derivedStock = data.stock;
      
      if (data.has_variants && data.variants && data.variants.length > 0) {
          // Find minimum price among variants to show as "From $X"
          const minPrice = Math.min(...data.variants.map(v => v.price));
          derivedPrice = minPrice;
          
          // If any variant is in stock, the product is "in stock"
          const anyInStock = data.variants.some(v => v.stock);
          derivedStock = anyInStock;
      }

      const productData: Record<string, any> = {
          name_en: data.name_en,
          description_en: data.description_en,
          category_id: data.category_id,
          brand_id: data.brand_id,
          target_audience: data.target_audience,
          is_active: data.is_active,
          images: data.images,
          mobile_image_url: mobileImage || null,
          image_crop_desktop: cropDesktop,
          image_crop_mobile: cropMobile,
          has_variants: data.has_variants,
          price: derivedPrice,
          discount: data.has_variants ? 0 : data.discount,
          stock: derivedStock,
          is_popular: data.is_popular,
          is_new: data.is_new,
      };

      productData.slug = await resolveUniqueProductSlug(supabase, data.name_en, initialData?.id);

      if (initialData) {
        // Update Product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', initialData.id);
        
        if (error) throw error;
      } else {
        // Create Product
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
          
        if (error) throw error;
        productId = newProduct.id;
      }

      if (productId && data.has_variants && data.variants) {
          // Handle Variants
          // Strategy: Delete all existing and re-insert. 
          // This allows removing variants easily without tracking deleted IDs in UI.
          // Note: This changes variant IDs which breaks order history references IF order_items refers to variant_id directly.
          // WAIT: order_items DOES refer to variant_id. 
          // DELETING entries will break integrity or set valid FKs to null (on delete set null).
          // Better Strategy: Upsert based on ID.
          
          // 1. Get existing IDs to know what to delete
          const { data: existing } = await supabase.from('product_variants').select('id').eq('product_id', productId);
          const existingIds = existing?.map(v => v.id) || [];
          const formIds = data.variants.map(v => v.id).filter(Boolean);
          
          // 2. Delete removed variants
          const toDelete = existingIds.filter(id => !formIds.includes(id));
          if (toDelete.length > 0) {
              await supabase.from('product_variants').delete().in('id', toDelete);
          }

          // 3. Upsert
          const variantsToUpsert = data.variants.map(v => ({
              id: v.id, // If undefined, Supabase will ignore for insert? No, need to exclude it for new ones or use distinct arrays.
              product_id: productId,
              name: v.name,
              price: v.price,
              discount: v.discount,
              stock: v.stock,
              is_active: true
          }));

          // Seperate Insert and Update to be safe with auto-gen IDs
          const toInsert = variantsToUpsert.filter(v => !v.id).map(({ id, ...rest }) => rest);
          const toUpdate = variantsToUpsert.filter(v => v.id);

          if (toInsert.length > 0) {
              const { error: insError } = await supabase.from('product_variants').insert(toInsert as any); // Type cast for product_id?
              if (insError) throw insError;
          }
           if (toUpdate.length > 0) {
              const { error: upError } = await supabase.from('product_variants').upsert(toUpdate);
              if (upError) throw upError;
          }
      }

      toast.success(t('productSavedSuccessfully'));
      
      startTransition(() => {
        router.refresh();
        if (onSuccess) {
            onSuccess();
        } else {
            router.push('/admin/products');
        }
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(t('failedToSaveProduct'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
     try {
        const slug = searchValue.trim().toLowerCase().replace(/\s+/g, '-');
        const name = searchValue.trim();

        if (!name) return;

        // 1. Check if category already exists
        const { data: existingCategory } = await supabase
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

        if (existingCategory) {
            // Already exists, just select it
            if (!categories.find(c => c.id === existingCategory.id)) {
                setCategories(prev => [...prev, existingCategory]);
            }
            form.setValue('category_id', existingCategory.id);
            setOpenCategory(false);
            setSearchValue("");
            return;
        }

        // 2. Create new if checks passed
        const { data, error } = await supabase
            .from('categories')
            .insert([{ name, slug }])
            .select()
            .single();

        if (error) throw error;
        if (data) {
            setCategories((prev) => [...prev, data]);
            form.setValue('category_id', data.id);
            setOpenCategory(false);
            setSearchValue("");
        }
     } catch (error: any) {
        console.error('Error creating category:', error);
        if (error?.code === '42501' || error?.message?.includes('violates row-level security')) {
            alert(t('permissionDeniedCategory'));
        } else {
            alert(t('failedToCreateCategory'));
        }
     }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    e.target.value = ''; // reset input

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Stores the true original — no upload-time crop bake. Framing is set
    // afterward (and non-destructively) via "Edit crop" on the cover image.
    try {
      setUploading(true);
      const publicUrl = await uploadToProductsBucket(supabase, file);
      const currentImages = form.getValues('images') || [];
      form.setValue('images', [...currentImages, publicUrl]);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(t('errorUploadingImageBucket'));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (urlToRemove: string) => {
      // Only drops the reference from this product — the file may be shared
      // (uploads are content-addressed/deduped) so it's not deleted from storage.
      const currentImages = form.getValues('images') || [];
      const wasCover = currentImages[0] === urlToRemove;
      const nextImages = currentImages.filter(url => url !== urlToRemove);
      form.setValue('images', nextImages);
      // The cover image changed identity — a previously-saved crop box no
      // longer corresponds to the image it would now apply to.
      if (wasCover && nextImages[0] !== currentImages[0]) {
        setCropDesktop(null);
        setCropMobile(null);
      }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-6xl bg-white p-6 rounded-lg border shadow-sm">

        <div className="grid grid-cols-1 gap-6">
            <FormField
            control={form.control}
            name="name_en"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('productName')}</FormLabel>
                <FormControl>
                    <Input placeholder={t('productNamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />

            <FormField
            control={form.control}
            name="description_en"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('description')}</FormLabel>
                <FormControl>
                    <Textarea placeholder={t('descriptionPlaceholder')} className="min-h-[100px]" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
              control={form.control}
              name="has_variants"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('hasVariants')}</FormLabel>
                    <FormDescription>
                      {t('hasVariantsDescription')}
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

        {!form.watch('has_variants') ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('priceLabel')}</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="discount"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('discountAmount')}</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormDescription>{t('discountDescription')}</FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        ) : (
             <div className="space-y-4 rounded-lg border p-4 bg-gray-50">
                 <div className="flex items-center justify-between">
                     <FormLabel className="text-lg">{t('productVariants')}</FormLabel>
                     <Button type="button" size="sm" onClick={() => form.setValue('variants', [...(form.getValues('variants') || []), { name: '', price: 0, discount: 0, stock: true }])}>
                         <Plus className="mr-2 h-4 w-4" /> {t('addVariant')}
                     </Button>
                 </div>
                 
                 {form.watch('variants')?.map((_, index) => (
                     <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end border-b pb-4 last:border-0">
                         <FormField
                            control={form.control}
                            name={`variants.${index}.name`}
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                <FormLabel>{t('sizeName')}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('sizeNamePlaceholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.price`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('price')}</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                           <FormField
                            control={form.control}
                            name={`variants.${index}.discount`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>{t('discount')}</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <div className="flex items-center gap-2">
                                <FormField
                                    control={form.control}
                                    name={`variants.${index}.stock`}
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                            <FormLabel className="text-xs">{t('stock')}</FormLabel>
                                        </FormItem>
                                    )}
                                />
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-red-500 hover:text-red-700"
                                    onClick={() => {
                                        const current = form.getValues('variants');
                                        form.setValue('variants', current?.filter((__, i) => i !== index));
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                     </div>
                 ))}
                 {form.formState.errors.variants && (
                     <p className="text-sm font-medium text-destructive">{form.formState.errors.variants.message}</p>
                 )}
             </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <FormField
            control={form.control}
            name="brand_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('brand')}</FormLabel>
                <Popover open={openBrand} onOpenChange={setOpenBrand}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? brands.find(
                              (brand) => brand.id === field.value
                            )?.name
                          : t('selectBrand')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder={t('searchBrand')} />
                      <CommandList>
                        <CommandEmpty>{t('noBrandFound')}</CommandEmpty>
                        <CommandGroup>
                          {brands.map((brand) => (
                            <CommandItem
                              value={brand.name}
                              key={brand.id}
                              onSelect={() => {
                                form.setValue("brand_id", brand.id)
                                setOpenBrand(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  brand.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {brand.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>{t('category')}</FormLabel>
                <Popover open={openCategory} onOpenChange={setOpenCategory}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value
                          ? categories.find(
                              (category) => category.id === field.value
                            )?.name
                          : t('selectCategory')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder={t('searchCategory')} onValueChange={setSearchValue} />
                      <CommandList>
                        <CommandEmpty>
                            <div className="p-2">
                                <p className="text-sm text-muted-foreground mb-2">{t('noCategoryFound')}</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="w-full"
                                    onClick={handleCreateCategory}
                                    type="button"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    {t('createCategoryWithName', { name: searchValue })}
                                </Button>
                            </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {categories
                            .filter(c => c.name && c.name.trim() !== '')
                            .map((category) => (
                            <CommandItem
                              value={category.name}
                              key={category.id}
                              onSelect={() => {
                                form.setValue("category_id", category.id)
                                setOpenCategory(false)
                              }}
                              className="text-foreground"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  category.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {category.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="target_audience"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>{t('targetAudience')}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-row space-x-1"
                  >
                    {(['Men', 'Women', 'Unisex'] as const).map((option) => (
                        <FormItem key={option} className="flex-1">
                            <FormControl>
                                <RadioGroupItem value={option} className="sr-only" />
                            </FormControl>
                            <FormLabel className={cn(
                                "flex flex-1 items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all",
                                field.value === option && "border-black bg-black text-white hover:bg-black/90"
                            )}>
                                {option === 'Men' ? t('men') : option === 'Women' ? t('women') : t('unisex')}
                            </FormLabel>
                        </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_popular"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">{t('popularItem')}</FormLabel>
                  <FormDescription>
                    {t('popularItemDescription')}
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
            name="is_new"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">{t('newItem')}</FormLabel>
                  <FormDescription>
                    {t('newItemDescription')}
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

        <div className="space-y-4">
            <FormLabel>{t('images')}</FormLabel>
            <p className="text-xs text-muted-foreground">{t('coverImageHint')}</p>
            <div className="flex flex-wrap gap-4">
                {form.watch('images')?.map((url, index) => (
                    <div key={index} className="relative group">
                        <div className="relative w-24 h-32 rounded-md overflow-hidden border">
                          <Image src={url} alt="Product" fill sizes="96px" className="object-cover" />
                        </div>
                        {index === 0 && (
                            <button
                                type="button"
                                onClick={() => setIsCropEditorOpen(true)}
                                className="absolute bottom-1 left-1 right-1 bg-black/70 text-white text-[10px] leading-tight rounded py-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                {t('editCropAction')}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => removeImage(url)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
                {uploading && (
                    <div className="w-24 h-32 rounded-md overflow-hidden border">
                        <Skeleton className="w-full h-full" />
                    </div>
                )}
                <div className="w-24 h-32 border-2 border-dashed rounded-md flex items-center justify-center relative cursor-pointer hover:border-black hover:bg-gray-50 transition-all">
                    {uploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    ) : (
                        <Upload className="h-6 w-6 text-gray-400" />
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleImageUpload}
                        disabled={uploading}
                    />
                </div>
            </div>

            <ImageUploadField
              label={t('mobileImageLabel')}
              value={mobileImage}
              onChange={setMobileImage}
              uploadPrefix="products/mobile/"
              aspectClassName="h-40"
              hint={t('mobileImageHint')}
            />

            {form.watch('images')?.[0] && (
              <ImageCropEditorModal
                open={isCropEditorOpen}
                onOpenChange={setIsCropEditorOpen}
                imageUrl={form.watch('images')![0]}
                title={t('coverImageHint')}
                desktopAspect={PRODUCT_DESKTOP_ASPECT}
                mobileAspect={PRODUCT_MOBILE_ASPECT}
                initialDesktopCrop={cropDesktop}
                initialMobileCrop={cropMobile}
                onSave={({ desktop, mobile }) => {
                  setCropDesktop(desktop);
                  setCropMobile(mobile);
                }}
              />
            )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('inStock')}</FormLabel>
                    <FormDescription>
                      {t('inStockDescription')}
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
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{tc('active')}</FormLabel>
                    <FormDescription>
                      {t('activeDescription')}
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

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-4 z-50 md:relative md:bg-transparent md:border-0 md:p-0 md:pt-4 md:z-auto">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1 md:flex-none md:w-auto">
                {tc('cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 md:flex-none md:w-auto md:min-w-[150px]">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? t('updateProduct') : t('createProduct')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
