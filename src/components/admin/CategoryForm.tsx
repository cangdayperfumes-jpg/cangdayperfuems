'use client';

import { Category } from '@/types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCategory, updateCategory } from '@/app/admin/categories/actions'; // Adjust path
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import ImageUploadField from '@/components/admin/ImageUploadField';
import ImageCropEditorModal from '@/components/admin/ImageCropEditorModal';
import { IMAGE_SPECS } from '@/lib/image-specs';
import type { CropMeta } from '@/lib/image-crop';
import { Checkbox } from '@/components/ui/checkbox';

interface CategoryFormProps {
  category?: Category;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();
  const t = useTranslations('categories');
  const tc = useTranslations('common');

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isEditing ? tc('saving') : t('creating')}
        </>
      ) : (
        isEditing ? t('updateCategory') : t('createCategory')
      )}
    </Button>
  );
}

export default function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const t = useTranslations('categories');
  const tc = useTranslations('common');
  const [imageUrl, setImageUrl] = useState<string | null>(category?.image_url || null);
  const [cropDesktop, setCropDesktop] = useState<CropMeta | null>(category?.image_crop_desktop ?? null);
  const [cropMobile, setCropMobile] = useState<CropMeta | null>(category?.image_crop_mobile ?? null);
  const [cropOpen, setCropOpen] = useState(false);
  const [isFeatured, setIsFeatured] = useState(category?.is_featured || false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    // Append image URL if present
    if (imageUrl) {
        formData.set('image_url', imageUrl);
    }
    formData.set('image_crop_desktop', cropDesktop ? JSON.stringify(cropDesktop) : '');
    formData.set('image_crop_mobile', cropMobile ? JSON.stringify(cropMobile) : '');

    try {
        let result;
        if (category) {
             result = await updateCategory(category.id, formData);
        } else {
             result = await createCategory(formData);
        }

        if (result && !result.success) {
            toast.error(result.error || tc('failedToSave'));
        } else {
            toast.success(category ? t('categoryUpdated') : t('categoryCreated'));
            startTransition(() => {
              router.refresh();
              router.push('/admin/categories');
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
        <Label htmlFor="name">{tc('name')}</Label>
        <Input
          id="name"
          name="name"
          defaultValue={category?.name}
          placeholder={t('namePlaceholder')}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">{t('slug')}</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={category?.slug}
          placeholder={t('slugPlaceholder')}
          required
        />
        <p className="text-xs text-muted-foreground">{t('slugHint')}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('descriptionOptional')}</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={category?.description || ''}
          placeholder={t('descriptionPlaceholder')}
        />
      </div>

      <ImageUploadField
        label={t('categoryImage')}
        value={imageUrl}
        onChange={(url, reason) => {
          setImageUrl(url);
          if (reason !== 'adjust') {
            setCropDesktop(null);
            setCropMobile(null);
          }
        }}
        uploadPrefix="categories/"
        spec={IMAGE_SPECS.category}
        aspectClassName="h-56"
        onEditCrop={imageUrl ? () => setCropOpen(true) : undefined}
      />
      {imageUrl && (
        // Home carousel card is 4:7 on both breakpoints; the same focal point
        // also frames the square card on the Categories page.
        <ImageCropEditorModal
          open={cropOpen}
          onOpenChange={setCropOpen}
          imageUrl={imageUrl}
          title={t('categoryImage')}
          desktopAspect={4 / 7}
          mobileAspect={4 / 7}
          initialDesktopCrop={cropDesktop}
          initialMobileCrop={cropMobile}
          onSave={({ desktop, mobile }) => {
            setCropDesktop(desktop);
            setCropMobile(mobile);
          }}
        />
      )}

      <div className="flex items-center space-x-2">
          <Checkbox
            id="is_featured"
            checked={isFeatured}
            onCheckedChange={(checked) => setIsFeatured(checked === true)}
          />
          <input type="hidden" name="is_featured" value={isFeatured ? 'on' : 'off'} />
          <Label htmlFor="is_featured">{t('featuredInTicker')}</Label>
      </div>

      <SubmitButton isEditing={!!category} />
    </form>
  );
}
