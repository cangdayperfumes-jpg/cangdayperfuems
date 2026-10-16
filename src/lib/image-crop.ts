/**
 * Non-destructive per-breakpoint crop metadata. Mirrors react-easy-crop's own
 * `Area` percentage shape (`x`/`y`/`width`/`height`, top-left origin, 0-100)
 * so a saved value can be passed straight back into `initialCroppedAreaPercentages`
 * when the editor reopens — plus `zoom`, captured directly from the editor's
 * own zoom state rather than re-derived from the box size.
 *
 * Applied at render time as CSS only (`object-position` + `transform: scale`)
 * — the original upload is never touched.
 */
export interface CropMeta {
  x: number;
  y: number;
  width: number;
  height: number;
  zoom: number;
}

export function cropToObjectPosition(crop: CropMeta | null | undefined): string {
  if (!crop) return '50% 50%';
  const cx = crop.x + crop.width / 2;
  const cy = crop.y + crop.height / 2;
  return `${cx}% ${cy}%`;
}

export function cropToZoom(crop: CropMeta | null | undefined): number {
  return crop?.zoom ?? 1;
}
