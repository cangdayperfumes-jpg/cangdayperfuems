'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, RotateCcw, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { uploadToProductsBucket, MAX_DIMENSION } from '@/lib/upload-image';
import {
  AUTO_ENHANCE,
  DEFAULT_ADJUSTMENTS,
  exportAdjusted,
  isDefault,
  loadBitmap,
  renderAdjusted,
  type ImageAdjustments,
} from '@/lib/image-adjust';

interface ImageAdjustModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title: string;
  uploadPrefix: string;
  maxDimension?: number;
  /** Receives the URL of the new, adjusted copy. */
  onApply: (url: string) => void;
}

const PREVIEW_MAX = 560;

const SLIDERS: { key: keyof ImageAdjustments; min: number; max: number }[] = [
  { key: 'sharpen', min: 0, max: 100 },
  { key: 'brightness', min: 50, max: 150 },
  { key: 'contrast', min: 50, max: 150 },
  { key: 'saturation', min: 0, max: 200 },
];

/**
 * Sharpen / brightness / contrast / saturation editor with a live preview.
 * Applying saves a new copy through the normal upload pipeline; the
 * original file stays in storage untouched.
 */
export default function ImageAdjustModal({
  open,
  onOpenChange,
  imageUrl,
  title,
  uploadPrefix,
  maxDimension = MAX_DIMENSION,
  onApply,
}: ImageAdjustModalProps) {
  const t = useTranslations('imageAdjust');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [source, setSource] = useState<{ bitmap: ImageBitmap; type: string } | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [adj, setAdj] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [comparing, setComparing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load the image when the dialog opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setSource(null);
    setLoadError(false);
    setAdj(DEFAULT_ADJUSTMENTS);
    loadBitmap(imageUrl)
      .then((s) => !cancelled && setSource(s))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [open, imageUrl]);

  // Redraw the preview on every change (one frame at a time).
  useEffect(() => {
    if (!source || !canvasRef.current) return;
    const { bitmap } = source;
    const scale = Math.min(1, PREVIEW_MAX / Math.max(bitmap.width, bitmap.height));
    const frame = requestAnimationFrame(() => {
      if (!canvasRef.current) return;
      renderAdjusted(
        canvasRef.current,
        bitmap,
        Math.round(bitmap.width * scale),
        Math.round(bitmap.height * scale),
        comparing ? DEFAULT_ADJUSTMENTS : adj
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [source, adj, comparing]);

  const apply = async () => {
    if (!source) return;
    setSaving(true);
    try {
      const blob = await exportAdjusted(source.bitmap, adj, source.type, maxDimension);
      const url = await uploadToProductsBucket(createClient(), blob, uploadPrefix, maxDimension);
      onApply(url);
      toast.success(t('applied'));
      onOpenChange(false);
    } catch (e) {
      console.error('Image adjust failed', e);
      toast.error(t('failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !saving && onOpenChange(v)}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1.5rem)] max-w-[640px] sm:max-w-[640px] gap-4 [&>*]:min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:w-full sm:p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <DialogHeader className="min-w-0 pr-8 text-left">
          <DialogTitle className="truncate">{t('title', { name: title })}</DialogTitle>
        </DialogHeader>

        <div
          className="relative flex min-h-[200px] w-full min-w-0 touch-none items-center justify-center overflow-hidden rounded-md bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#fff_0%_50%)] bg-[length:16px_16px]"
          onPointerDown={() => setComparing(true)}
          onPointerUp={() => setComparing(false)}
          onPointerLeave={() => setComparing(false)}
        >
          {!source && !loadError && <Loader2 className="h-6 w-6 animate-spin text-slate-400" />}
          {loadError && <p className="px-6 text-center text-sm text-rose-600">{t('loadFailed')}</p>}
          <canvas ref={canvasRef} className={source ? 'block h-auto max-h-[45vh] w-auto max-w-full select-none sm:max-h-[400px]' : 'hidden'} />
          {source && (
            <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
              {comparing ? t('original') : t('holdToCompare')}
            </span>
          )}
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {SLIDERS.map(({ key, min, max }) => (
            <label key={key} className="min-w-0 space-y-1">
              <span className="flex items-center justify-between text-sm font-medium">
                {t(key)}
                <span className="tabular-nums text-xs text-muted-foreground">
                  {key === 'sharpen' ? adj[key] : `${adj[key] - 100 > 0 ? '+' : ''}${adj[key] - 100}`}
                </span>
              </span>
              <input
                type="range"
                min={min}
                max={max}
                value={adj[key]}
                disabled={!source}
                onChange={(e) => setAdj((a) => ({ ...a, [key]: Number(e.target.value) }))}
                className="w-full accent-[rgb(var(--brand-gold-deep))]"
              />
            </label>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">{t('note')}</p>

        <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" disabled={!source} onClick={() => setAdj(AUTO_ENHANCE)}>
              <Wand2 className="mr-1.5 h-4 w-4" /> {t('autoEnhance')}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={isDefault(adj)} onClick={() => setAdj(DEFAULT_ADJUSTMENTS)}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> {t('reset')}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="button" disabled={!source || isDefault(adj) || saving} onClick={apply}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? t('applying') : t('apply')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
