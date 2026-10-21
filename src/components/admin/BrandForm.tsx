'use client';

import { Brand } from '@/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBrand, updateBrand } from '@/app/admin/brands/actions';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { IMAGE_SPECS } from '@/lib/image-specs';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';

interface BrandFormProps {
  brand?: Brand;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  const t = useTranslations('brands');
  const tc = useTranslations('common');

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isEditing ? tc('saving') : t('creating')}
        </>
      ) : (
        isEditing ? t('updateBrand') : t('createBrand')
      )}
    </Button>
  );
}

export default function BrandForm({ brand }: BrandFormProps) {
  const t = useTranslations('brands');
  const tc = useTranslations('common');
  const [imageUrl, setImageUrl] = useState<string | null>(brand?.image_url || null);
  const [isFeatured, setIsFeatured] = useState(brand?.is_featured || false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    if (imageUrl) {
        formData.set('image_url', imageUrl);
    }

    try {
        let result;
        if (brand) {
             result = await updateBrand(brand.id, formData);
        } else {
             result = await createBrand(formData);
        }

        if (result && !result.success) {
            toast.error(result.error || tc('failedToSave'));
        } else {
            toast.success(brand ? t('brandUpdated') : t('brandCreated'));
            startTransition(() => {
              router.refresh();
              router.push('/admin/brands');
            });
        }
    } catch (error) {
        console.error("Form submission error", error);
        toast.error(tc('somethingWentWrong'));
    }
  };

  return (
    <form action={handleSubmit} className="space-y-6 max-w-3xl bg-white p-6 rounded-lg border shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="name">{t('brandName')}</Label>
        <Input
          id="name"
          name="name"
          defaultValue={brand?.name}
          placeholder={t('namePlaceholder')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">{t('slug')}</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={brand?.slug}
          placeholder={t('slugPlaceholder')}
          required
        />
      </div>

      <ImageUploadField
        label={t('brandLogoOptional')}
        value={imageUrl}
        onChange={(url) => setImageUrl(url)}
        uploadPrefix="brands/"
        spec={IMAGE_SPECS.brand}
        aspectClassName="h-32"
      />

      <div className="flex items-center space-x-2">
          <Checkbox
                id="is_featured"
                checked={isFeatured}
                onCheckedChange={(checked) => setIsFeatured(checked === true)}
          />
          <input type="hidden" name="is_featured" value={isFeatured ? 'on' : 'off'} />
          <Label htmlFor="is_featured">{t('featuredInTicker')}</Label>
      </div>

      <SubmitButton isEditing={!!brand} />
    </form>
  );
}
