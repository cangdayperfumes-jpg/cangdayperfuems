'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { validateImageFile, uploadToProductsBucket } from '@/lib/upload-image';

interface ImageUploadFieldProps {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  uploadPrefix: string;
  hint?: string;
  aspectClassName?: string;
  /** Shows an "Edit crop" button next to the preview when provided. */
  onEditCrop?: () => void;
}

/**
 * Generalizes the inline image-upload block already duplicated across
 * CategoryForm/BrandForm/etc. into a single controlled field, reusing the
 * shared `uploadToProductsBucket` pipeline (resize/hash/upload) so every new
 * image field automatically gets the same optimization + dedupe behavior.
 */
export default function ImageUploadField({
  label,
  value,
  onChange,
  uploadPrefix,
  hint,
  aspectClassName = 'h-40',
  onEditCrop,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();
  const t = useTranslations('imageUpload');
  const tCrop = useTranslations('imageCrop');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(true);
    try {
      const publicUrl = await uploadToProductsBucket(supabase, file, uploadPrefix);
      onChange(publicUrl);
    } catch (error) {
      console.error('Error uploading image', error);
      alert(t('errorUploadingImage'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {uploading && <p className="text-sm text-yellow-600">{t('uploading')}</p>}
      {value && (
        <div className={`relative w-full ${aspectClassName} mt-2 rounded overflow-hidden border`}>
          <Image
            src={value}
            alt={`${label} preview`}
            fill
            sizes="(max-width: 768px) 100vw, 512px"
            className="object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-1.5">
            {onEditCrop && (
              <Button type="button" variant="secondary" size="sm" className="h-7" onClick={onEditCrop}>
                {tCrop('editCrop')}
              </Button>
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-7 w-7"
              onClick={() => onChange(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
