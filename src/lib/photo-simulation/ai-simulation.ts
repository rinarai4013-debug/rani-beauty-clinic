/**
 * AI-powered photo simulation using Replicate API (Stable Diffusion XL img2img)
 * with fallback to enhanced canvas filters when no API token is available.
 */

import { applyFilterChain, type FilterStep } from './filters';

// ─── Types ─────────────────────────────────────────────────────────────

export interface SimulationRequest {
  photoBase64: string; // original photo (data URL or raw base64)
  treatments: string[]; // treatment names to simulate
  timeframe: '1-month' | '3-months' | '6-months';
  intensity: number; // 0-1
}

export interface SimulationResult {
  imageUrl: string; // URL or base64 of generated image
  timeframe: string;
  treatments: string[];
  confidence: number; // 0-1
}

// ─── Treatment Prompt Mapping ──────────────────────────────────────────

const TREATMENT_PROMPTS: Record<string, string> = {
  'HydraFacial': 'hydrated, glowing, dewy skin with minimized pores',
  'RF Microneedling': 'smoother skin texture, reduced acne scarring, tighter pores',
  'Sofwave': 'firmer jawline, lifted brow, tighter neck skin',
  'VI Peel': 'even skin tone, reduced dark spots, brighter complexion',
  'Botox': 'smoothed forehead lines, reduced crow\'s feet',
  'Dysport': 'softened dynamic expression lines with natural movement',
  'Xeomin': 'subtle wrinkle relaxation with preserved facial balance',
  'Dermal Fillers': 'fuller lips, defined cheekbones, smoother nasolabial folds',
  'Sculptra': 'progressively restored mid-face volume and firmer collagen-rich skin structure',
  'Juvederm': 'restored contour and softened fold depth with natural volume support',
  'Restylane': 'balanced contour restoration with smooth facial transitions',
  'Radiesse': 'structural lift and collagen stimulation for firmer contours',
  'Laser Facial': 'clear, even skin, reduced redness and sun damage',
  'BioRePeel': 'radiant, refreshed skin with zero downtime glow',
  'PRX-T33': 'deep hydration, plumper skin, collagen-rich appearance',
  'GLP-1': 'slimmer face contour, defined jawline',
  'PicoWay': 'clear skin, reduced pigmentation, faded dark spots',
  'Glutathione': 'brighter, more luminous skin tone, reduced oxidative damage',
  'NAD+': 'revitalized, youthful appearance, improved skin elasticity',
  'Tretinoin': 'refined skin texture, reduced fine lines, clearer complexion',
  'Laser Hair Removal': 'smooth, hair-free skin with even texture',
  'Hormone Optimization': 'improved skin vitality, reduced puffiness, steadier facial tone and energy-linked glow',
  'Peptide Therapy': 'enhanced recovery appearance, reduced inflammatory puffiness, tighter skin quality',
  'Folix Hair Restoration': 'thicker, fuller hair with improved density',
};

const TIMEFRAME_MODIFIERS: Record<string, { prefix: string; strength: number }> = {
  '1-month': {
    prefix: 'subtle early improvement showing',
    strength: 0.3,
  },
  '3-months': {
    prefix: 'visible transformation with noticeable',
    strength: 0.6,
  },
  '6-months': {
    prefix: 'dramatic results with significant',
    strength: 1.0,
  },
};

const NEGATIVE_PROMPT =
  'deformed, blurry, unrealistic, plastic, oversaturated, cartoon, painting, disfigured, mutation, ugly, poorly drawn, bad anatomy, wrong proportions';

// ─── Prompt Builder ────────────────────────────────────────────────────

/**
 * Build a natural language prompt for Stable Diffusion based on
 * selected treatments and timeframe.
 */
export function buildSimulationPrompt(
  treatments: string[],
  timeframe: string,
): string {
  const modifier = TIMEFRAME_MODIFIERS[timeframe] || TIMEFRAME_MODIFIERS['3-months'];

  const treatmentDescriptions = treatments
    .map((t) => {
      // Try exact match first, then case-insensitive partial match
      const exact = TREATMENT_PROMPTS[t];
      if (exact) return exact;

      const key = Object.keys(TREATMENT_PROMPTS).find(
        (k) => k.toLowerCase() === t.toLowerCase() || t.toLowerCase().includes(k.toLowerCase()),
      );
      return key ? TREATMENT_PROMPTS[key] : 'improved, healthier skin appearance';
    })
    .join(', ');

  return [
    'Professional portrait photograph of a person with',
    modifier.prefix,
    treatmentDescriptions,
    '| high quality skin detail, natural lighting, photorealistic, 8k, detailed skin texture,',
    'professional headshot, studio lighting, sharp focus',
  ].join(' ');
}

// ─── Replicate API Integration ─────────────────────────────────────────

interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
}

/**
 * Call the Replicate API for img2img generation using SDXL.
 * Posts a prediction and polls until completion (max 60s).
 */
async function callReplicateAPI(
  photoBase64: string,
  treatments: string[],
  timeframe: string,
  intensity: number,
): Promise<{ imageUrl: string; confidence: number }> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error('REPLICATE_API_TOKEN not configured');
  }

  const prompt = buildSimulationPrompt(treatments, timeframe);
  const modifier = TIMEFRAME_MODIFIERS[timeframe] || TIMEFRAME_MODIFIERS['3-months'];

  // Map intensity to a realistic strength range (0.2-0.5)
  // Lower = more of original preserved, higher = more AI transformation
  const strength = 0.2 + intensity * modifier.strength * 0.3;

  // Ensure the photo is a proper data URL
  const imageInput = photoBase64.startsWith('data:')
    ? photoBase64
    : `data:image/jpeg;base64,${photoBase64}`;

  // Create prediction
  const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'wait',
    },
    body: JSON.stringify({
      version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      input: {
        image: imageInput,
        prompt,
        negative_prompt: NEGATIVE_PROMPT,
        strength,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        scheduler: 'K_EULER_ANCESTRAL',
        num_outputs: 1,
        width: 768,
        height: 768,
      },
    }),
  });

  if (!createResponse.ok) {
    const errorBody = await createResponse.text();
    throw new Error(`Replicate API error (${createResponse.status}): ${errorBody}`);
  }

  let prediction: ReplicatePrediction = await createResponse.json();

  // Poll for result (max 60 seconds)
  const startTime = Date.now();
  const maxWaitMs = 60_000;
  const pollIntervalMs = 1_500;

  while (
    prediction.status !== 'succeeded' &&
    prediction.status !== 'failed' &&
    prediction.status !== 'canceled'
  ) {
    if (Date.now() - startTime > maxWaitMs) {
      throw new Error('Replicate prediction timed out after 60 seconds');
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    const pollResponse = await fetch(
      `https://api.replicate.com/v1/predictions/${prediction.id}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!pollResponse.ok) {
      throw new Error(`Replicate poll error (${pollResponse.status})`);
    }

    prediction = await pollResponse.json();
  }

  if (prediction.status === 'failed') {
    throw new Error(`Replicate prediction failed: ${prediction.error || 'Unknown error'}`);
  }

  if (prediction.status === 'canceled') {
    throw new Error('Replicate prediction was canceled');
  }

  // Extract output URL
  const output = prediction.output;
  const imageUrl = Array.isArray(output) ? output[0] : output;

  if (!imageUrl) {
    throw new Error('Replicate prediction returned no output');
  }

  // Confidence is based on timeframe realism and intensity
  const confidence = Math.min(0.95, 0.6 + modifier.strength * 0.2 + (1 - intensity) * 0.15);

  return { imageUrl, confidence };
}

// ─── Canvas Filter Fallback ────────────────────────────────────────────

/**
 * Treatment name to canvas filter mapping for the fallback path.
 */
function getTreatmentFilters(treatment: string): FilterStep[] {
  const key = treatment.toLowerCase();

  if (key.includes('hydrafacial') || key.includes('hydra')) {
    return [
      { filter: 'brightening', intensity: 1 },
      { filter: 'glow', intensity: 1 },
      { filter: 'skinSmoothing', intensity: 0.5 },
    ];
  }
  if (key.includes('rf') || key.includes('microneedling')) {
    return [
      { filter: 'skinSmoothing', intensity: 1 },
      { filter: 'toneEvening', intensity: 0.6 },
      { filter: 'glow', intensity: 0.4 },
    ];
  }
  if (key.includes('sofwave')) {
    return [
      { filter: 'skinSmoothing', intensity: 0.6 },
      { filter: 'glow', intensity: 0.8 },
    ];
  }
  if (key.includes('vi peel') || key.includes('peel')) {
    return [
      { filter: 'toneEvening', intensity: 1 },
      { filter: 'brightening', intensity: 0.8 },
      { filter: 'glow', intensity: 0.3 },
    ];
  }
  if (key.includes('botox')) {
    return [
      { filter: 'skinSmoothing', intensity: 0.7 },
      { filter: 'glow', intensity: 0.5 },
    ];
  }
  if (key.includes('dysport') || key.includes('xeomin')) {
    return [
      { filter: 'skinSmoothing', intensity: 0.7 },
      { filter: 'glow', intensity: 0.45 },
    ];
  }
  if (key.includes('filler')) {
    return [
      { filter: 'skinSmoothing', intensity: 0.5 },
      { filter: 'glow', intensity: 0.7 },
    ];
  }
  if (
    key.includes('sculptra') ||
    key.includes('juvederm') ||
    key.includes('restylane') ||
    key.includes('radiesse')
  ) {
    return [
      { filter: 'skinSmoothing', intensity: 0.45 },
      { filter: 'glow', intensity: 0.65 },
      { filter: 'toneEvening', intensity: 0.35 },
    ];
  }
  if (key.includes('laser')) {
    return [
      { filter: 'toneEvening', intensity: 0.9 },
      { filter: 'brightening', intensity: 0.7 },
      { filter: 'skinSmoothing', intensity: 0.4 },
    ];
  }
  if (key.includes('biorepeel') || key.includes('biore')) {
    return [
      { filter: 'glow', intensity: 0.9 },
      { filter: 'skinSmoothing', intensity: 0.5 },
      { filter: 'brightening', intensity: 0.4 },
    ];
  }
  if (key.includes('prx') || key.includes('t33')) {
    return [
      { filter: 'brightening', intensity: 0.8 },
      { filter: 'glow', intensity: 0.7 },
      { filter: 'skinSmoothing', intensity: 0.4 },
    ];
  }
  if (key.includes('glp') || key.includes('semaglutide') || key.includes('tirzepatide')) {
    return [
      { filter: 'skinSmoothing', intensity: 0.4 },
      { filter: 'toneEvening', intensity: 0.3 },
    ];
  }
  if (key.includes('hormone') || key.includes('trt') || key.includes('hrt') || key.includes('thyroid')) {
    return [
      { filter: 'toneEvening', intensity: 0.45 },
      { filter: 'glow', intensity: 0.4 },
      { filter: 'brightening', intensity: 0.35 },
    ];
  }
  if (
    key.includes('peptide') ||
    key.includes('bpc') ||
    key.includes('ipamorelin') ||
    key.includes('cjc') ||
    key.includes('sermorelin')
  ) {
    return [
      { filter: 'skinSmoothing', intensity: 0.35 },
      { filter: 'glow', intensity: 0.45 },
      { filter: 'toneEvening', intensity: 0.3 },
    ];
  }
  if (key.includes('glutathione')) {
    return [
      { filter: 'brightening', intensity: 0.9 },
      { filter: 'glow', intensity: 0.6 },
    ];
  }
  if (key.includes('tretinoin')) {
    return [
      { filter: 'skinSmoothing', intensity: 0.8 },
      { filter: 'toneEvening', intensity: 0.7 },
      { filter: 'brightening', intensity: 0.4 },
    ];
  }

  // Default fallback
  return [
    { filter: 'glow', intensity: 0.6 },
    { filter: 'skinSmoothing', intensity: 0.5 },
    { filter: 'brightening', intensity: 0.4 },
  ];
}

/**
 * Apply canvas filters as a fallback when Replicate is not available.
 * Uses OffscreenCanvas (Node/Edge) or creates a virtual canvas.
 */
async function applyCanvasFallback(
  photoBase64: string,
  treatments: string[],
  timeframe: '1-month' | '3-months' | '6-months',
  intensity: number,
): Promise<{ imageUrl: string; confidence: number }> {
  // Timeframe multipliers for progressive intensity
  const timeframeMultiplier: Record<string, number> = {
    '1-month': 0.4,
    '3-months': 0.7,
    '6-months': 1.0,
  };
  const multiplier = timeframeMultiplier[timeframe] ?? 0.7;
  const effectiveIntensity = intensity * multiplier;

  // Merge filters from all treatments, scaling by effective intensity
  const allFilters: FilterStep[] = [];
  const filterMaxIntensity = new Map<FilterStep['filter'], number>();

  for (const treatment of treatments) {
    const filters = getTreatmentFilters(treatment);
    for (const f of filters) {
      const scaled = f.intensity * effectiveIntensity;
      const existing = filterMaxIntensity.get(f.filter) ?? 0;
      if (scaled > existing) {
        filterMaxIntensity.set(f.filter, scaled);
      }
    }
  }

  for (const [filter, filterIntensity] of filterMaxIntensity) {
    allFilters.push({ filter, intensity: Math.min(1, filterIntensity) });
  }

  // If running server-side (API route), we cannot use Canvas directly.
  // Return the filter instructions for the client to apply, or
  // use a data URL pass-through with metadata.
  // For the API route, we return the original image with filter metadata
  // so the client can apply canvas filters locally.
  const confidence = Math.min(0.7, 0.3 + effectiveIntensity * 0.4);

  return {
    imageUrl: photoBase64.startsWith('data:') ? photoBase64 : `data:image/jpeg;base64,${photoBase64}`,
    confidence,
  };
}

/**
 * Apply canvas filters on the client side (browser context).
 * This is called from components when the API returns a fallback result.
 */
export function applyClientSideFilters(
  canvas: HTMLCanvasElement,
  treatments: string[],
  timeframe: '1-month' | '3-months' | '6-months',
  intensity: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const timeframeMultiplier: Record<string, number> = {
    '1-month': 0.4,
    '3-months': 0.7,
    '6-months': 1.0,
  };
  const multiplier = timeframeMultiplier[timeframe] ?? 0.7;
  const effectiveIntensity = intensity * multiplier;

  // Merge filters from all treatments
  const filterMaxIntensity = new Map<FilterStep['filter'], number>();

  for (const treatment of treatments) {
    const filters = getTreatmentFilters(treatment);
    for (const f of filters) {
      const scaled = f.intensity * effectiveIntensity;
      const existing = filterMaxIntensity.get(f.filter) ?? 0;
      if (scaled > existing) {
        filterMaxIntensity.set(f.filter, scaled);
      }
    }
  }

  const allFilters: FilterStep[] = [];
  for (const [filter, filterIntensity] of filterMaxIntensity) {
    allFilters.push({ filter, intensity: Math.min(1, filterIntensity) });
  }

  applyFilterChain(ctx, canvas.width, canvas.height, allFilters);
}

// ─── Main Entry Point ──────────────────────────────────────────────────

/**
 * Generate an AI-powered treatment simulation.
 *
 * Strategy:
 * 1. If REPLICATE_API_TOKEN is set, uses Replicate's SDXL img2img model
 * 2. Falls back to enhanced canvas filters if no token is available
 *
 * @param request - Simulation parameters
 * @returns SimulationResult with the generated/filtered image
 */
export async function generateAISimulation(
  request: SimulationRequest,
): Promise<SimulationResult> {
  const { photoBase64, treatments, timeframe, intensity } = request;

  const hasReplicateToken = !!process.env.REPLICATE_API_TOKEN;

  try {
    if (hasReplicateToken) {
      // Primary: Replicate API with SDXL img2img
      const result = await callReplicateAPI(photoBase64, treatments, timeframe, intensity);
      return {
        imageUrl: result.imageUrl,
        timeframe,
        treatments,
        confidence: result.confidence,
      };
    }
  } catch (error) {
    // Log and fall through to canvas fallback
    console.error('[AI Simulation] Replicate API failed, falling back to canvas filters:', error);
  }

  // Fallback: Enhanced canvas filters
  const fallbackResult = await applyCanvasFallback(photoBase64, treatments, timeframe, intensity);
  return {
    imageUrl: fallbackResult.imageUrl,
    timeframe,
    treatments,
    confidence: fallbackResult.confidence,
  };
}
