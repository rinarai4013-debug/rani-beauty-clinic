/**
 * Degradation filter primitives for aging simulation.
 *
 * These filters model natural skin aging: wrinkle deepening, texture loss,
 * tone decline, and elasticity reduction. Each follows the same function
 * signature as the improvement filters in filters.ts for unified chain support.
 */

/**
 * Simulate wrinkle deepening via localized contrast enhancement.
 * Darkens creases and furrows by amplifying existing shadow patterns.
 */
export function applyAgingProgression(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
): void {
  if (intensity <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const original = new Uint8ClampedArray(data);

  // Increase local contrast to exaggerate wrinkles
  // Dark areas get darker, simulating deeper creases
  const contrastBoost = 1.0 + intensity * 0.25;
  const midpoint = 128;

  for (let i = 0; i < data.length; i += 4) {
    const r = original[i];
    const g = original[i + 1];
    const b = original[i + 2];
    const lum = r * 0.299 + g * 0.587 + b * 0.114;

    // Only enhance shadows (wrinkle-like regions)
    if (lum < midpoint) {
      const shadowDepth = (midpoint - lum) / midpoint;
      const darken = shadowDepth * intensity * 20;

      data[i] = clamp(r - darken);
      data[i + 1] = clamp(g - darken);
      data[i + 2] = clamp(b - darken);
    } else {
      // Slight contrast push in midtones
      const factor = 1 + intensity * 0.05;
      data[i] = clamp((r - midpoint) * factor + midpoint);
      data[i + 1] = clamp((g - midpoint) * factor + midpoint);
      data[i + 2] = clamp((b - midpoint) * factor + midpoint);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Simulate texture degradation by adding subtle noise and reducing uniformity.
 * Models the loss of smooth skin texture over time.
 */
export function applyTextureDegradation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
): void {
  if (intensity <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Deterministic noise based on position (not random — repeatable)
  const noiseAmplitude = intensity * 12;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Only apply to skin-tone pixels
      if (isSkinTone(r, g, b)) {
        // Deterministic noise via hash
        const noise = ((pseudoHash(x, y) % 200) - 100) / 100 * noiseAmplitude;

        data[i] = clamp(r + noise);
        data[i + 1] = clamp(g + noise * 0.8);
        data[i + 2] = clamp(b + noise * 0.6);
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Simulate tone decline — skin becomes more sallow and uneven.
 * Shifts skin toward yellow/dull tones and reduces luminosity.
 */
export function applyToneDecline(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
): void {
  if (intensity <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Sallow shift: increase yellow, reduce blue, slight darken
  const yellowShift = intensity * 8;
  const blueLoss = intensity * 12;
  const brightnessLoss = 1.0 - intensity * 0.08;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (isSkinTone(r, g, b)) {
      // Yellow/sallow shift
      data[i] = clamp((r + yellowShift * 0.5) * brightnessLoss);
      data[i + 1] = clamp((g + yellowShift * 0.3) * brightnessLoss);
      data[i + 2] = clamp((b - blueLoss) * brightnessLoss);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Simulate elasticity loss — subtle downward shift and softening.
 * Models gravitational descent and loss of facial structure definition.
 */
export function applyElasticityLoss(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number,
): void {
  if (intensity <= 0) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const src = new Uint8ClampedArray(imageData.data);
  const dst = imageData.data;

  // Subtle downward pixel shift to simulate sagging
  // More pronounced in lower half of image
  const maxShift = Math.round(intensity * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dstIdx = (y * width + x) * 4;

      // Shift increases toward bottom of face
      const verticalProgress = y / height;
      const shift = Math.round(maxShift * verticalProgress * verticalProgress);

      // Sample from shifted source (upward — pulling down)
      const srcY = Math.max(0, y - shift);
      const srcIdx = (srcY * width + x) * 4;

      // Blend shifted with original for subtlety
      const blendFactor = 0.4 + intensity * 0.3;
      dst[dstIdx] = clamp(src[dstIdx] * (1 - blendFactor) + src[srcIdx] * blendFactor);
      dst[dstIdx + 1] = clamp(src[dstIdx + 1] * (1 - blendFactor) + src[srcIdx + 1] * blendFactor);
      dst[dstIdx + 2] = clamp(src[dstIdx + 2] * (1 - blendFactor) + src[srcIdx + 2] * blendFactor);
      dst[dstIdx + 3] = src[dstIdx + 3];
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// ── Utilities ──

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function isSkinTone(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max > 0 ? (max - min) / max : 0;
  return r > 60 && r > g && g > b && r - g < 80 && r - b > 10 && saturation < 0.65 && max > 80;
}

/** Deterministic hash for repeatable noise */
function pseudoHash(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  h = h ^ (h >> 16);
  return Math.abs(h);
}
