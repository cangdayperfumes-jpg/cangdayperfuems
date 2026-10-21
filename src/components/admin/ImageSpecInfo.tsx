'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { ratioLabel, type ImageSpec } from '@/lib/image-specs';
import { cn } from '@/lib/utils';

/** Natural pixel size of an image URL (null until loaded). */
export function useImageSize(url: string | null | undefined) {
  const [size, setSize] = useState<{ url: string; w: number; h: number } | null>(null);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    const img = new window.Image();
    img.onload = () => alive && setSize({ url, w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;
    return () => {
      alive = false;
    };
  }, [url]);
  return size && size.url === url ? size : null;
}

/**
 * Recommended size for an image area plus, once a file is set, its real
 * size with a warning when it's noticeably smaller than recommended
 * (will look soft) or a different shape (parts will be cropped).
 */
export default function ImageSpecInfo({
  spec,
  url,
  canCrop = false,
  className,
}: {
  spec: ImageSpec;
  url?: string | null;
  canCrop?: boolean;
  className?: string;
}) {
  const t = useTranslations('imageSpecs');
  const size = useImageSize(url);

  const tooSmall = size && (size.w < spec.width * 0.75 || size.h < spec.height * 0.75);
  const specRatio = spec.width / spec.height;
  const shapeOff = size && !spec.anyShape && Math.abs(size.w / size.h - specRatio) / specRatio > 0.15;

  return (
    <div className={cn('space-y-1.5 rounded-md border border-dashed bg-slate-50/70 px-3 py-2 text-xs', className)}>
      <p className="flex items-start gap-1.5 text-slate-600">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span>
          <span className="font-semibold text-slate-800">
            {t('recommended', { w: spec.width, h: spec.height, ratio: ratioLabel(spec.width, spec.height) })}
          </span>
          {' · '}
          {t('formats')}
          <span className="block text-slate-500">{t(`where.${spec.key}`)}</span>
        </span>
      </p>
      {size && (
        <p
          className={cn(
            'flex items-start gap-1.5',
            tooSmall || shapeOff ? 'text-amber-700' : 'text-emerald-700'
          )}
        >
          {tooSmall || shapeOff ? (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span>
            {t('actual', { w: size.w, h: size.h, ratio: ratioLabel(size.w, size.h) })}
            {tooSmall && <> — {t('tooSmall')}</>}
            {shapeOff && <> — {canCrop ? t('shapeOffCrop') : t('shapeOff')}</>}
            {!tooSmall && !shapeOff && <> — {t('good')}</>}
          </span>
        </p>
      )}
    </div>
  );
}
