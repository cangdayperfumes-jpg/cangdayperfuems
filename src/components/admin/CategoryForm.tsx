'use client';

import { Category } from '@/types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCategory, updateCategory } from '@/app/admin/categories/actions'; // Adjust path
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { validateImageFile, uploadToProductsBucket } from '@/lib/upload-image';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';

interface CategoryFormProps {
  category?: Category;
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
        isEditing ? 'Update Category' : 'Create Category'
      )}
    </Button>
  );
}

export default function CategoryForm({ category }: CategoryFormProps) {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(category?.image_url || null);
  const [uploading, setUploading] = useState(false);
  const [isFeatured, setIsFeatured] = useState(category?.is_featured || false);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

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
      const publicUrl = await uploadToProductsBucket(supabase, file, 'categories/');
      setImageUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading image', error);
      alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    // Append image URL if present
    if (imageUrl) {
        formData.set('image_url', imageUrl);
    }
    
    try {
        let result;
        if (category) {
             result = await updateCategory(category.id, formData);
        } else {
             result = await createCategory(formData);
        }

        if (result && !result.success) {
            toast.error(result.error || "Failed to save category");
        } else {
            toast.success(category ? "Category updated successfully" : "Category created successfully");
            startTransition(() => {
              router.refresh();
              router.push('/admin/categories');
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
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={category?.name}
          placeholder="e.g. Body Lotions"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          defaultValue={category?.slug}
          placeholder="e.g. body-lotions"
          required
        />
        <p className="text-xs text-muted-foreground">Used in the URL: /shop?category=slug</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={category?.description || ''}
          placeholder="A brief description of this category..."
        />
      </div>

       <div className="space-y-2">
        <Label htmlFor="image">Category Image</Label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
        />
        {uploading && <p className="text-sm text-yellow-600">Uploading...</p>}
        {imageUrl && (
            <div className="relative w-full h-40 mt-2 rounded overflow-hidden border">
                <Image 
                    src={imageUrl} 
                    alt="Category preview" 
                    fill 
                    sizes="(max-width: 768px) 100vw, 512px"
                    className="object-cover"
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

      <SubmitButton isEditing={!!category} />
    </form>
  );
}
