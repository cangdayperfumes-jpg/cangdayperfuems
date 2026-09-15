"use client";

import { useState } from 'react';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0] || '/placeholder.svg');

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-lg">
        <ImageWithFallback
          src={selectedImage}
          alt={name}
          fill
          className="object-cover object-center"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(image)}
              className={cn(
                "relative aspect-[3/4] overflow-hidden rounded-md border-2 transition-all",
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
