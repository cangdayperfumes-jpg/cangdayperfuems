'use client';

import { Category } from '@/types';
import Link from 'next/link';
import ImageWithFallback from '@/components/shared/ImageWithFallback';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

interface CategoryCarouselProps {
  categories: Category[];
}

export default function CategoryCarousel({ categories }: CategoryCarouselProps) {
  return (
    <div className="relative">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        plugins={[
          Autoplay({
            delay: 3000,
            stopOnInteraction: true,
            stopOnMouseEnter: true,
          }),
        ]}
        className="w-full max-w-6xl mx-auto"
      >
        <CarouselContent>
          {categories.map((category) => (
            <CarouselItem key={category.id} className="basis-full md:basis-1/3">
              <Link 
                  href={`/shop?category=${category.slug}`}
                  className="group flex flex-col items-center gap-4 p-4"
              >
                  <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-transparent group-hover:border-black/10 transition-all shadow-sm group-hover:shadow-md">
                      {category.image_url ? (
                          <ImageWithFallback
                              src={category.image_url}
                              alt={category.name}
                              fill
                              sizes="(max-width: 768px) 128px, 160px"
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                      ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                              <span className="text-xs">No Image</span>
                          </div>
                      )}
                  </div>
                  <span className="text-sm md:text-base font-medium font-heading uppercase tracking-wider group-hover:text-amber-700 transition-colors text-center">
                      {category.name}
                  </span>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-2 md:-left-12 top-20 md:top-24 -translate-y-1/2 z-10" />
        <CarouselNext className="absolute right-2 md:-right-12 top-20 md:top-24 -translate-y-1/2 z-10" />
      </Carousel>
    </div>
  );
}
