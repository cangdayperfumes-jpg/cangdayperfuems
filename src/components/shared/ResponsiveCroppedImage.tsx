'use client';

import { useId } from 'react';
import type { ImageProps } from 'next/image';
import ImageWithFallback from './ImageWithFallback';
import { cropToObjectPosition, cropToZoom, type CropMeta } from '@/lib/image-crop';
import { cn } from '@/lib/utils';

interface ResponsiveCroppedImageProps extends Omit<ImageProps, 'style'> {
  /** Optional separate mobile image (product mobile override). Falls back to `src`. */
  mobileSrc?: string | null;
  cropDesktop?: CropMeta | null;
  cropMobile?: CropMeta | null;
}

/**
 * Only sets `transform`/`transform-origin` when zoom actually departs from 1.
 * Several existing render spots (e.g. ProductCard) use a CSS hover class like
 * `group-hover:scale-105` on the image itself — an inline `transform` style
 * (even `scale(1)`) has higher specificity than any class, hover-state
 * included, and would silently kill that effect. Leaving the property out
 * entirely when there's nothing to zoom keeps those untouched.
 */
function buildCropStyle(position: string, zoom: number): React.CSSProperties {
  if (zoom === 1) return { objectPosition: position };
  return { objectPosition: position, transformOrigin: position, transform: `scale(${zoom})` };
}

/**
 * Drop-in replacement for `ImageWithFallback` that additionally applies
 * independent desktop/mobile focal-point + zoom crop metadata, and/or an
 * entirely separate mobile source image. Records with no crop metadata and
 * no mobile override render byte-identical to plain `ImageWithFallback` —
 * this only changes behavior once an admin explicitly sets a crop.
 */
export default function ResponsiveCroppedImage({
  src,
  mobileSrc,
  cropDesktop,
  cropMobile,
  className,
  ...props
}: ResponsiveCroppedImageProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const effectiveMobileSrc = mobileSrc || src;
  const hasDistinctMobileImage = effectiveMobileSrc !== src;
  const hasAnyCrop = Boolean(cropDesktop || cropMobile);

  // Common case: no crop metadata, no mobile override — unchanged behavior.
  if (!hasDistinctMobileImage && !hasAnyCrop) {
    return <ImageWithFallback src={src} className={className} {...props} />;
  }

  const desktopPos = cropToObjectPosition(cropDesktop);
  const mobilePos = cropToObjectPosition(cropMobile);
  const desktopZoom = cropToZoom(cropDesktop);
  const mobileZoom = cropToZoom(cropMobile);

  if (hasDistinctMobileImage) {
    // Genuinely different files per breakpoint — two DOM nodes gated by
    // visibility, same technique already used by
    // seasonal-collection-section.tsx for its two banner images.
    return (
      <>
        <ImageWithFallback
          src={src}
          className={cn(className, 'hidden md:block')}
          style={buildCropStyle(desktopPos, desktopZoom)}
          {...props}
        />
        <ImageWithFallback
          src={effectiveMobileSrc}
          className={cn(className, 'md:hidden')}
          style={buildCropStyle(mobilePos, mobileZoom)}
          {...props}
        />
      </>
    );
  }

  // Same source for both breakpoints — a single DOM node/request. The `md:`
  // override can't be expressed via the `style` attribute (no media queries
  // there), so it's scoped in a tiny `<style>` tag keyed to a unique class;
  // `!important` is required to win over the inline mobile-default style,
  // which is otherwise more specific than a class selector.
  const scopeClass = `crop-${uid}`;
  const desktopRuleLines = [`object-position: ${desktopPos} !important;`];
  if (desktopZoom !== 1) {
    desktopRuleLines.push(`transform-origin: ${desktopPos} !important;`, `transform: scale(${desktopZoom}) !important;`);
  }

  return (
    <>
      <ImageWithFallback
        src={src}
        className={cn(className, scopeClass)}
        style={buildCropStyle(mobilePos, mobileZoom)}
        {...props}
      />
      <style>{`
        @media (min-width: 768px) {
          .${scopeClass} {
            ${desktopRuleLines.join('\n            ')}
          }
        }
      `}</style>
    </>
  );
}
