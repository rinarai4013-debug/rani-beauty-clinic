/**
 * Canvas filter functions for treatment visualization.
 * Real pixel manipulation for skin smoothing, tone evening, glow, and brightening effects.
 */

export interface FilterStep {
  filter: 'skinSmoothing' | 'toneEvening' | 'glow' | 'brightening';
  intensity: number; // 0-1
}

/** Degradation filter step for aging simulation */
export interface DegradationFilterStep {
  filter: 'agingProgression' | 'textureDegradation' | 'toneDecline' | 'elasticityLoss';
  intensity: number; // 0-1
}

/** Unified filter step — supports both improvement and degradation */
export type UnifiedFilterStep = FilterStep | DegradationFilterStep;

/**
 * Apply skin smoothing via iterative box blur.
 * Uses 3-pass box blur to approximate gaussian blur, then blends
 * with the original image to preserve edges.
 */
export function applySkinSmoothing(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
): void {
  if (intensity <= 0) return;

  const radius = Math.round(intensity * 3); // 0-3px blur radius
  if (radius === 0) return;

  // Save original for edge-preserving blend
  const original = ctx.getImageData(0, 0, width, height);
  const originalData = new Uint8ClampedArray(original.data);

  // Apply 3-pass box blur (approximates gaussian)
  for (let pass = 0; pass < 3; pass++) {
    boxBlurH(ctx, width, height, radius);
    boxBlurV(ctx, width, height, radius);
  }

  // Blend blurred result with original to preserve edges
  const blurred = ctx.getImageData(0, 0, width, height);
  const blendFactor = 0.6 + intensity * 0.3; // 0.6-0.9 blend toward blurred

  for (let i = 0; i < blurred.data.length; i += 4) {
    // Calculate edge strength from luminance difference
    const origLum =
      originalData[i] * 0.299 +
      originalData[i + 1] * 0.587 +
      originalData[i + 2] * 0.114;
    const blurLum =
      blurred.data[i] * 0.299 +
      blurred.data[i + 1] * 0.587 +
      blurred.data[i + 2] * 0.114;
    const edgeStrength = Math.min(Math.abs(origLum - blurLum) / 30, 1);

    // Reduce smoothing at edges
    const localBlend = blendFactor * (1 - edgeStrength * 0.8);

    blurred.data[i] = originalData[i] * (1 - localBlend) + blurred.data[i] * localBlend;
    blurred.data[i + 1] =
      originalData[i + 1] * (1 - localBlend) + blurred.data[i + 1] * localBlend;
    blurred.data[i + 2] =
      originalData[i + 2] * (1 - localBlend) + blurred.data[i + 2] * localBlend;
    // Alpha unchanged
  }

  ctx.putImageData(blurred, 0, 0);
}

/** Horizontal box blur pass */
function boxBlurH(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const src = new Uint8ClampedArray(imageData.data);
  const dst = imageData.data;
  const diameter = radius * 2 + 1;

  for (let y = 0; y < height; y++) {
    let ri = y * width * 4;
    let li = ri;
    let sumR = 0,
      sumG = 0,
      sumB = 0;

    // Initialize window with first pixel repeated for left edge
    const firstR = src[ri];
    const firstG = src[ri + 1];
    const firstB = src[ri + 2];
    const lastIdx = (y * width + width - 1) * 4;
    const lastR = src[lastIdx];
    const lastG = src[lastIdx + 1];
    const lastB = src[lastIdx + 2];

    for (let i = -radius; i <= radius; i++) {
      const idx = (y * width + Math.min(Math.max(i, 0), width - 1)) * 4;
      sumR += src[idx];
      sumG += src[idx + 1];
      sumB += src[idx + 2];
    }

    for (let x = 0; x < width; x++) {
      dst[ri] = sumR / diameter;
      dst[ri + 1] = sumG / diameter;
      dst[ri + 2] = sumB / diameter;
      dst[ri + 3] = src[ri + 3]; // preserve alpha

      // Slide window right
      const nextRight = Math.min(x + radius + 1, width - 1);
      const prevLeft = Math.max(x - radius, 0);
      const addIdx = (y * width + nextRight) * 4;
      const subIdx = (y * width + prevLeft) * 4;

      sumR += src[addIdx] - src[subIdx];
      sumG += src[addIdx + 1] - src[subIdx + 1];
      sumB += src[addIdx + 2] - src[subIdx + 2];

      ri += 4;
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/** Vertical box blur pass */
function boxBlurV(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radius: number,
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const src = new Uint8ClampedArray(imageData.data);
  const dst = imageData.data;
  const diameter = radius * 2 + 1;

  for (let x = 0; x < width; x++) {
    let sumR = 0,
      sumG = 0,
      sumB = 0;

    // Initialize window
    for (let i = -radius; i <= radius; i++) {
      const idx = (Math.min(Math.max(i, 0), height - 1) * width + x) * 4;
      sumR += src[idx];
      sumG += src[idx + 1];
      sumB += src[idx + 2];
    }

    for (let y = 0; y < height; y++) {
      const ri = (y * width + x) * 4;
      dst[ri] = sumR / diameter;
      dst[ri + 1] = sumG / diameter;
      dst[ri + 2] = sumB / diameter;
      dst[ri + 3] = src[ri + 3];

      const nextDown = Math.min(y + radius + 1, height - 1);
      const prevUp = Math.max(y - radius, 0);
      const addIdx = (nextDown * width + x) * 4;
      const subIdx = (prevUp * width + x) * 4;

      sumR += src[addIdx] - src[subIdx];
      sumG += src[addIdx + 1] - src[subIdx + 1];
      sumB += src[addIdx + 2] - src[subIdx + 2];
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Even out skin tone by reducing color variance.
 * Pushes skin tones toward a warm, even baseline and reduces redness/sallowness.
 */
export function applyToneEvening(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
): void {
  if (intensity <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const pixelCount = width * height;

  // Calculate average skin tone
  let avgR = 0,
    avgG = 0,
    avgB = 0;
  let skinPixelCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Simple skin tone detection (works for a range of skin tones)
    if (isSkinTone(r, g, b)) {
      avgR += r;
      avgG += g;
      avgB += b;
      skinPixelCount++;
    }
  }

  if (skinPixelCount === 0) {
    // If no skin detected, use overall average
    for (let i = 0; i < data.length; i += 4) {
      avgR += data[i];
      avgG += data[i + 1];
      avgB += data[i + 2];
    }
    skinPixelCount = pixelCount;
  }

  avgR /= skinPixelCount;
  avgG /= skinPixelCount;
  avgB /= skinPixelCount;

  // Warm baseline - shift average slightly toward warm tones
  const warmR = avgR * 1.02;
  const warmG = avgG * 1.0;
  const warmB = avgB * 0.97;

  const blendAmount = intensity * 0.35; // Subtle effect

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (isSkinTone(r, g, b)) {
      // Reduce redness: if red channel is significantly higher than average, pull it down
      const redness = Math.max(0, (r - g - 10) / 255);
      const rednessReduction = redness * intensity * 0.5;

      // Blend toward warm average to reduce variance
      data[i] = clamp(r + (warmR - r) * blendAmount - rednessReduction * 30);
      data[i + 1] = clamp(g + (warmG - g) * blendAmount);
      data[i + 2] = clamp(b + (warmB - b) * blendAmount);

      // Reduce sallowness (excess yellow = high R + high G, low B)
      const yellowness = Math.max(0, ((r + g) / 2 - b - 30) / 255);
      if (yellowness > 0.1) {
        data[i + 2] = clamp(data[i + 2] + yellowness * intensity * 15);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Add a healthy glow effect.
 * Increases brightness, adds warm gold tint overlay, and boosts contrast slightly.
 */
export function applyGlowEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
): void {
  if (intensity <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Brightness increase: 5-15% based on intensity
  const brightnessFactor = 1.0 + 0.05 + intensity * 0.1;

  // Gold tint overlay (subtle): RGB(201, 169, 110) = #C9A96E brand gold
  const goldR = 201;
  const goldG = 169;
  const goldB = 110;
  const tintStrength = intensity * 0.06; // Very subtle

  // Contrast boost
  const contrastFactor = 1.0 + intensity * 0.08;
  const contrastIntercept = 128 * (1 - contrastFactor);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply brightness
    r *= brightnessFactor;
    g *= brightnessFactor;
    b *= brightnessFactor;

    // Apply contrast
    r = r * contrastFactor + contrastIntercept;
    g = g * contrastFactor + contrastIntercept;
    b = b * contrastFactor + contrastIntercept;

    // Apply warm gold tint via screen blend
    r = r + (goldR - r) * tintStrength;
    g = g + (goldG - g) * tintStrength;
    b = b + (goldB - b) * tintStrength;

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Brightening effect targeting dark spots and shadow areas.
 * Selectively increases luminance in darker regions while preserving highlights.
 */
export function applyBrighteningEffect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
): void {
  if (intensity <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Calculate average luminance
  let totalLum = 0;
  const pixelCount = width * height;

  for (let i = 0; i < data.length; i += 4) {
    totalLum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }

  const avgLum = totalLum / pixelCount;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = r * 0.299 + g * 0.587 + b * 0.114;

    // Only brighten pixels darker than average (shadow areas / dark spots)
    if (lum < avgLum) {
      // How much darker than average - stronger lift for darker areas
      const darkness = (avgLum - lum) / avgLum;
      const lift = darkness * intensity * 0.4; // Max 40% lift

      // Lift shadows while maintaining color ratios
      const scale = 1 + lift;
      data[i] = clamp(r * scale);
      data[i + 1] = clamp(g * scale);
      data[i + 2] = clamp(b * scale);
    } else {
      // Slight lift for mid-tones, none for highlights
      const highlight = (lum - avgLum) / (255 - avgLum + 1);
      const lift = (1 - highlight) * intensity * 0.05;
      const scale = 1 + lift;
      data[i] = clamp(r * scale);
      data[i + 1] = clamp(g * scale);
      data[i + 2] = clamp(b * scale);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Apply multiple filters in sequence.
 */
export function applyFilterChain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filters: FilterStep[],
): void {
  const filterMap: Record<
    FilterStep['filter'],
    (ctx: CanvasRenderingContext2D, w: number, h: number, i: number) => void
  > = {
    skinSmoothing: applySkinSmoothing,
    toneEvening: applyToneEvening,
    glow: applyGlowEffect,
    brightening: applyBrighteningEffect,
  };

  for (const step of filters) {
    const fn = filterMap[step.filter];
    if (fn) {
      fn(ctx, width, height, step.intensity);
    }
  }
}

/**
 * Apply a unified filter chain supporting both improvement and degradation filters.
 * Lazily imports degradation filters to avoid bundling them when not needed.
 */
export async function applyUnifiedFilterChain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filters: UnifiedFilterStep[],
): Promise<void> {
  // Separate improvement from degradation steps
  const improvementSteps: FilterStep[] = [];
  const degradationSteps: DegradationFilterStep[] = [];

  for (const step of filters) {
    if (['skinSmoothing', 'toneEvening', 'glow', 'brightening'].includes(step.filter)) {
      improvementSteps.push(step as FilterStep);
    } else {
      degradationSteps.push(step as DegradationFilterStep);
    }
  }

  // Apply improvement filters first
  if (improvementSteps.length > 0) {
    applyFilterChain(ctx, width, height, improvementSteps);
  }

  // Apply degradation filters
  if (degradationSteps.length > 0) {
    const {
      applyAgingProgression,
      applyTextureDegradation,
      applyToneDecline,
      applyElasticityLoss,
    } = await import('./degradation-filters');

    const degradationMap: Record<
      DegradationFilterStep['filter'],
      (ctx: CanvasRenderingContext2D, w: number, h: number, i: number) => void
    > = {
      agingProgression: applyAgingProgression,
      textureDegradation: applyTextureDegradation,
      toneDecline: applyToneDecline,
      elasticityLoss: applyElasticityLoss,
    };

    for (const step of degradationSteps) {
      const fn = degradationMap[step.filter];
      if (fn) {
        fn(ctx, width, height, step.intensity);
      }
    }
  }
}

// --- Utility functions ---

/** Clamp a value to 0-255 range */
function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Simple skin tone detection using RGB rules.
 * Works across a range of skin tones from light to dark.
 */
function isSkinTone(r: number, g: number, b: number): boolean {
  // Rule 1: R > G > B for most skin tones
  // Rule 2: R > 60 (not too dark to detect)
  // Rule 3: Difference between R and G not too large (not pure red)
  // Rule 4: Not too saturated (not clothing/objects)
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max > 0 ? (max - min) / max : 0;

  return (
    r > 60 &&
    r > g &&
    g > b &&
    r - g < 80 &&
    r - b > 10 &&
    saturation < 0.65 &&
    max > 80
  );
}
