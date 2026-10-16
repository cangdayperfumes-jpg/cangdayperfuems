"use client";

import { useState } from 'react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import ResponsiveCroppedImage from '@/components/shared/ResponsiveCroppedImage';
import { cn } from '@/lib/utils';
import type { CropMeta } from '@/lib/image-crop';

interface ProductGalleryProps {
  images: string[];
  name: string;
  /** Mobile override + crop apply only to the cover (images[0]) — a crop set
   *  for the cover has no defined meaning for the other gallery photos. */
  mobileImageUrl?: string | null;
  cropDesktop?: CropMeta | null;
  cropMobile?: CropMeta | null;
}

export default function ProductGallery({ images, name, mobileImageUrl, cropDesktop, cropMobile }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0] || '/placeholder.svg');
  const isViewingCover = selectedImage === images[0];

  return (
    <div className="flex flex-col gap-2.5 md:gap-3">
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg">
        <ResponsiveCroppedImage
          src={selectedImage}
          mobileSrc={isViewingCover ? mobileImageUrl : undefined}
          cropDesktop={isViewingCover ? cropDesktop : undefined}
          cropMobile={isViewingCover ? cropMobile : undefined}
          alt={name}
          fill
          className="object-cover object-center"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2.5 md:gap-3">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(image)}
              className={cn(
                "relative aspect-[4/5] overflow-hidden rounded-md border-2 transition-all",
                selectedImage === image ? "border-black dark:border-white" : "border-transparent hover:border-gray-200"
              )}
            >
              <ImageWithFallback
                src={image}
                alt={`${name} thumbnail ${index + 1}`}
                fill
                className="object-cover object-center"
                sizes="100px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
