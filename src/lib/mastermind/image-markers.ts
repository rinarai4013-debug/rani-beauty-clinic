/**
 * Markers used to indicate that a photo URL cannot be rendered.
 * Persistence layer replaces large base64 with `[base64_stripped]`;
 * device integration replaces missing files with `[photo_ref_unavailable]`.
 *
 * Centralized so scan, plan, simulate, and the dashboard renderer
 * all agree on what "unrenderable" means.
 */
export const NON_RENDERABLE_IMAGE_MARKERS = new Set([
  '[base64_stripped]',
  '[photo_ref_unavailable]',
  '[image_unavailable]',
]);

export function isUnrenderablePhoto(value: string | null | undefined): boolean {
  if (typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  return NON_RENDERABLE_IMAGE_MARKERS.has(trimmed.toLowerCase());
}

export function isRenderableImageValue(value: string | null | undefined): value is string {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (NON_RENDERABLE_IMAGE_MARKERS.has(trimmed.toLowerCase())) return false;
  return (
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('blob:')
  );
}
