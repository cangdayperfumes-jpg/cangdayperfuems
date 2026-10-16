'use client';

import { useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { useTranslations } from 'next-intl';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { CropMeta } from '@/lib/image-crop';

type Breakpoint = 'desktop' | 'mobile';

interface ImageCropEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  title: string;
  /** e.g. 3/4, 4/5 — locked per field, not admin-selectable (matches how each field actually renders). */
  desktopAspect: number;
  mobileAspect: number;
  initialDesktopCrop?: CropMeta | null;
  initialMobileCrop?: CropMeta | null;
  onSave: (result: { desktop: CropMeta | null; mobile: CropMeta | null }) => void;
}

function BreakpointEditor({
  imageUrl,
  aspect,
  initialCrop,
  zoom,
  onZoomChange,
  onResult,
}: {
  imageUrl: string;
  aspect: number;
  initialCrop: CropMeta | null;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onResult: (area: Area) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });

  return (
    <div className="relative h-[320px] w-full bg-black rounded-md overflow-hidden">
      <Cropper
        image={imageUrl}
        crop={crop}
        zoom={zoom}
        aspect={aspect}
        initialCroppedAreaPercentages={initialCrop ?? undefined}
        onCropChange={setCrop}
        onZoomChange={onZoomChange}
        onCropComplete={(area) => onResult(area)}
      />
    </div>
  );
}

/**
 * Shared Desktop/Mobile crop editor reused across every admin image field
 * that supports independent responsive composition. Non-destructive: emits
 * `{x,y,width,height,zoom}` metadata (see src/lib/image-crop.ts), never
 * bakes a new file — the original upload is untouched.
 */
export default function ImageCropEditorModal({
  open,
  onOpenChange,
  imageUrl,
  title,
  desktopAspect,
  mobileAspect,
  initialDesktopCrop,
  initialMobileCrop,
  onSave,
}: ImageCropEditorModalProps) {
  const t = useTranslations('imageCrop');
  const [tab, setTab] = useState<Breakpoint>('desktop');

  const [desktopZoom, setDesktopZoom] = useState(initialDesktopCrop?.zoom ?? 1);
  const [desktopResult, setDesktopResult] = useState<CropMeta | null>(initialDesktopCrop ?? null);
  const [mobileZoom, setMobileZoom] = useState(initialMobileCrop?.zoom ?? 1);
  const [mobileResult, setMobileResult] = useState<CropMeta | null>(initialMobileCrop ?? null);

  // Reset local editor state whenever the modal (re)opens, since it's kept
  // mounted across opens/closes in the parent form.
  useEffect(() => {
    if (!open) return;
    setTab('desktop');
    setDesktopZoom(initialDesktopCrop?.zoom ?? 1);
    setDesktopResult(initialDesktopCrop ?? null);
    setMobileZoom(initialMobileCrop?.zoom ?? 1);
    setMobileResult(initialMobileCrop ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, imageUrl]);

  const handleReset = (which: Breakpoint) => {
    if (which === 'desktop') {
      setDesktopZoom(1);
      setDesktopResult(null);
    } else {
      setMobileZoom(1);
      setMobileResult(null);
    }
  };

  const handleSave = () => {
    onSave({ desktop: desktopResult, mobile: mobileResult });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 border-b pb-3">
          <Button
            type="button"
            variant={tab === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('desktop')}
          >
            {t('desktop')}
          </Button>
          <Button
            type="button"
            variant={tab === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('mobile')}
          >
            {t('mobile')}
          </Button>
        </div>

        {tab === 'desktop' ? (
          <BreakpointEditor
            // Remount-on-reopen key, not a tab-switch key — switching tabs
            // must NOT reset in-progress edits made during this session.
            key="desktop"
            imageUrl={imageUrl}
            aspect={desktopAspect}
            initialCrop={desktopResult}
            zoom={desktopZoom}
            onZoomChange={setDesktopZoom}
            onResult={(area) => setDesktopResult({ ...area, zoom: desktopZoom })}
          />
        ) : (
          <BreakpointEditor
            key="mobile"
            imageUrl={imageUrl}
            aspect={mobileAspect}
            initialCrop={mobileResult}
            zoom={mobileZoom}
            onZoomChange={setMobileZoom}
            onResult={(area) => setMobileResult({ ...area, zoom: mobileZoom })}
          />
        )}

        <div className="flex items-center gap-4 py-2">
          <ZoomOut className="w-5 h-5 text-gray-500 shrink-0" />
          <input
            type="range"
            value={tab === 'desktop' ? desktopZoom : mobileZoom}
            min={1}
            max={3}
            step={0.1}
            aria-label={t('zoom')}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (tab === 'desktop') {
                setDesktopZoom(value);
                setDesktopResult((prev) => (prev ? { ...prev, zoom: value } : prev));
              } else {
                setMobileZoom(value);
                setMobileResult((prev) => (prev ? { ...prev, zoom: value } : prev));
              }
            }}
            className="w-full"
          />
          <ZoomIn className="w-5 h-5 text-gray-500 shrink-0" />
          <Button type="button" variant="ghost" size="icon" onClick={() => handleReset(tab)} title={t('reset')}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button type="button" onClick={handleSave}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
