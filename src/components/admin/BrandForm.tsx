'use client';

import { Brand } from '@/types';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createBrand, updateBrand } from '@/app/admin/brands/actions';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { validateImageFile, uploadToProductsBucket } from '@/lib/upload-image';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTransition } from 'react';

interface BrandFormProps {
  brand?: Brand;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isEditing ? 'Updating...' : 'Creating...'}
        </>
      ) : (
        isEditing ? 'Update Brand' : 'Create Brand'
      )}
    </Button>
  );
}

export default function BrandForm({ brand }: BrandFormProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(brand?.image_url || null);
  const [uploading, setUploading] = useState(false);
  const [isFeatured, setIsFeatured] = useState(brand?.is_featured || false);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();
  const router = useRouter();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    const file = e.target.files[0];

    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(true);

    try {
      const publicUrl = await uploadToProductsBucket(supabase, file, 'brands/');
      setImageUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading image', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

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
            toast.error(result.error || "Failed to save brand");
        } else {
            toast.success(brand ? "Brand updated successfully" : "Brand created successfully");
            startTransition(() => {
              router.refresh();
              router.push('/admin/brands');
            });
        }
    } catch (error) {
        console.error("Form submission error", error);
        toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <form action={handleSubmit} className="space-y-6 max-w-lg bg-white p-6 rounded-lg shadow-sm">
      <div className="space-y-2">
        <Label htmlFor="name">Brand Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={brand?.name}
          placeholder="e.g. Channel"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={brand?.slug}
          placeholder="e.g. channel"
          required
        />
      </div>

       <div className="space-y-2">
        <Label htmlFor="image">Brand Logo (Optional)</Label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
        />
        {uploading && <p className="text-sm text-yellow-600">Uploading...</p>}
        {imageUrl && (
            <div className="relative w-full h-20 mt-2 rounded overflow-hidden border bg-gray-50">
                <Image 
                    src={imageUrl} 
                    alt="Brand preview" 
                    fill 
                    sizes="(max-width: 768px) 100vw, 512px"
                    className="object-contain p-2"
                />
            </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
          <Checkbox 
                id="is_featured" 
                checked={isFeatured}
                onCheckedChange={(checked) => setIsFeatured(checked === true)}
          />
          <input type="hidden" name="is_featured" value={isFeatured ? 'on' : 'off'} />
          <Label htmlFor="is_featured">Featured in Ticker?</Label>
      </div>

      <SubmitButton isEditing={!!brand} />
    </form>
  );
}
