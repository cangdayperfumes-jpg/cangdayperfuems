'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

const FALLBACK_SRC = '/placeholder.svg';

/**
 * Thin wrapper around `next/image` that swaps to a local placeholder when the
 * given `src` fails to load (deleted/renamed Storage file, bad admin-typed
 * URL, etc). Plain `<Image>` has no built-in recovery for a 404'd remote src.
 */
export default function ImageWithFallback({ src, alt, onError, ...props }: ImageProps) {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = !src || hasError ? FALLBACK_SRC : src;

  return (
    <Image
      {...props}
      src={resolvedSrc}
      alt={alt}
      onError={(e) => {
        setHasError(true);
        onError?.(e);
      }}
    />
  );
}
