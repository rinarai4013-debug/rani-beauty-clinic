import Anthropic from '@anthropic-ai/sdk';
import { UNIFIED_CATALOG, getServicesByConcern, type UnifiedService } from '@/data/services/unified-catalog';
import { getPresetsForService } from './filter-presets';

// ─── Types ──────────────────────────────────────────────────────────

export interface SkinAnalysisResult {
  overallScore: number; // 0-100 skin health score
  projectedScore: number; // projected score after treatment
  concerns: DetectedConcern[];
  recommendations: ServiceRecommendation[];
  summary: string; // AI-generated summary in Rani voice
  skinType: string; // detected skin type
  ageRange: string; // estimated age range
}

export interface DetectedConcern {
  id: string; // matches skin-concerns.ts slugs
  label: string;
  severity: 'mild' | 'moderate' | 'significant';
  score: number; // 0-100 severity score
  description: string; // AI description of what it sees
  areas: string[]; // face zones affected
}

export interface ServiceRecommendation {
  service: UnifiedService;
  reason: string; // why this service addresses the detected concern
  priority: 'primary' | 'complementary' | 'maintenance';
  matchedConcerns: string[]; // which detected concerns this addresses
  presets: string[]; // photo simulation presets for this service
  estimatedImprovement: number; // projected improvement percentage
}

// ─── Concern ID → Catalog Slug Mapping ──────────────────────────────
// Maps the AI's detected concern IDs to the slugs used in unified-catalog concerns[]

const CONCERN_TO_CATALOG_SLUGS: Record<string, string[]> = {
  'acne': ['acne'],
  'hyperpigmentation': ['hyperpigmentation'],
  'fine-lines': ['aging-skin'],
  'wrinkles': ['aging-skin'],
  'texture': ['dull-skin', 'large-pores'],
  'large-pores': ['large-pores'],
  'skin-laxity': ['skin-laxity'],
  'dullness': ['dull-skin'],
  'sun-damage': ['sun-damage'],
  'redness': ['acne'],
  'dehydration': ['dull-skin'],
  'uneven-tone': ['hyperpigmentation', 'dull-skin'],
  'dark-circles': ['aging-skin'],
  'scarring': ['acne'],
};

// ─── Improvement Estimates by Concern ───────────────────────────────
// Average improvement % per concern when treated with recommended services

const IMPROVEMENT_ESTIMATES: Record<string, Record<string, number>> = {
  'acne': { primary: 35, complementary: 15, maintenance: 10 },
  'hyperpigmentation': { primary: 30, complementary: 12, maintenance: 8 },
  'fine-lines': { primary: 25, complementary: 10, maintenance: 8 },
  'wrinkles': { primary: 20, complementary: 10, maintenance: 5 },
  'texture': { primary: 30, complementary: 15, maintenance: 10 },
  'large-pores': { primary: 25, complementary: 12, maintenance: 8 },
  'skin-laxity': { primary: 20, complementary: 8, maintenance: 5 },
  'dullness': { primary: 35, complementary: 15, maintenance: 12 },
  'sun-damage': { primary: 25, complementary: 10, maintenance: 8 },
  'redness': { primary: 30, complementary: 12, maintenance: 8 },
  'dehydration': { primary: 35, complementary: 15, maintenance: 12 },
  'uneven-tone': { primary: 28, complementary: 12, maintenance: 8 },
  'dark-circles': { primary: 15, complementary: 8, maintenance: 5 },
  'scarring': { primary: 25, complementary: 10, maintenance: 5 },
};

// ─── System Prompt ──────────────────────────────────────────────────

const SKIN_ANALYSIS_SYSTEM_PROMPT = `You are a clinical skin assessment AI for Rani Beauty Clinic, a luxury physician-supervised medspa in Renton, WA. You are analyzing a client's face photo to detect skin concerns and provide a professional assessment.

IMPORTANT GUIDELINES:
- You are warm, professional, and clinically precise
- Brand voice: luxury, confident, clinically-assured, educational, aspirational
- NEVER use the words: "anti-aging", "problem areas", "fix", "flaws", "imperfections", "defects"
- Instead use: "skin renewal", "areas of opportunity", "enhance", "refine", "elevate", "transform"
- The summary should feel like a caring, expert consultation - not a clinical report
- Be honest but positive - frame everything as an opportunity for enhancement
- NEVER diagnose medical conditions - only observe visible skin characteristics

DETECTABLE CONCERNS (use these exact IDs):
- "acne" - Active breakouts, congestion, comedones
- "hyperpigmentation" - Dark spots, melasma, post-inflammatory marks, uneven tone
- "fine-lines" - Early fine lines, expression lines
- "wrinkles" - Deeper wrinkles, creases
- "texture" - Rough texture, uneven skin surface
- "large-pores" - Visibly enlarged pores
- "skin-laxity" - Loss of firmness, sagging
- "dullness" - Lack of radiance, tired-looking skin
- "sun-damage" - UV damage signs, sun spots, freckling from UV exposure
- "redness" - Rosacea-like appearance, general redness, irritation
- "dehydration" - Dry, flaky, or dehydrated skin
- "uneven-tone" - Overall tone inconsistency
- "dark-circles" - Under-eye discoloration or hollowing
- "scarring" - Acne scars, textural scarring

FACE ZONES (use these for the "areas" field):
- "forehead", "between-brows", "temples"
- "cheeks", "nose", "nasolabial-folds"
- "chin", "jawline", "under-eyes"
- "upper-lip", "neck", "overall"

Respond ONLY with valid JSON in this exact structure (no markdown, no code blocks, no extra text):
{
  "overallScore": 72,
  "skinType": "combination",
  "ageRange": "28-35",
  "concerns": [
    {
      "id": "hyperpigmentation",
      "label": "Dark Spots & Uneven Tone",
      "severity": "moderate",
      "score": 65,
      "description": "Visible post-inflammatory hyperpigmentation on cheeks and forehead with some areas of uneven melanin distribution.",
      "areas": ["cheeks", "forehead"]
    }
  ],
  "summary": "Your skin has beautiful natural radiance with some areas where we can make a real difference. I can see your skin is telling a story of sun exposure and some past breakout activity, but the great news is that these are exactly the kinds of concerns our advanced treatments address beautifully. With the right combination of targeted therapies, we can help your skin reach its full potential."
}

SCORING GUIDE:
- overallScore: 0-100 where 100 is perfect skin health. Consider all visible concerns weighted by severity.
  - 85-100: Excellent - minimal concerns, healthy skin
  - 70-84: Good - a few areas of opportunity
  - 55-69: Fair - multiple visible concerns that would benefit from treatment
  - 40-54: Below average - significant concerns present
  - Below 40: Needs attention - multiple significant concerns
- concern score: 0-100 where 100 is the most severe. A "mild" concern should be 20-40, "moderate" 41-65, "significant" 66-90.
- skinType: one of "normal", "dry", "oily", "combination", "sensitive"
- Only include concerns you can actually observe in the photo. Do not fabricate concerns.
- List concerns in order of severity (most significant first).
- The summary should be 2-4 sentences, warm and encouraging, mentioning 1-2 key observations.`;

// ─── Fallback Response ──────────────────────────────────────────────

function createFallbackResult(): SkinAnalysisResult {
  return {
    overallScore: 75,
    projectedScore: 85,
    skinType: 'combination',
    ageRange: '25-40',
    concerns: [
      {
        id: 'dullness',
        label: 'Skin Radiance',
        severity: 'mild',
        score: 30,
        description: 'Your skin could benefit from a boost in radiance and hydration for that lit-from-within glow.',
        areas: ['overall'],
      },
      {
        id: 'texture',
        label: 'Skin Texture',
        severity: 'mild',
        score: 25,
        description: 'Some areas show opportunity for smoother, more refined texture.',
        areas: ['cheeks', 'forehead'],
      },
    ],
    recommendations: [],
    summary: 'Your skin has a wonderful foundation to work with. For a personalized analysis with specific treatment recommendations, please visit us for a complimentary consultation where our provider can assess your unique skin in person.',
  };
}

// ─── Claude Vision API Response Type ────────────────────────────────

interface ClaudeAnalysisResponse {
  overallScore: number;
  skinType: string;
  ageRange: string;
  concerns: {
    id: string;
    label: string;
    severity: 'mild' | 'moderate' | 'significant';
    score: number;
    description: string;
    areas: string[];
  }[];
  summary: string;
}

// ─── Service Matching ───────────────────────────────────────────────

function buildRecommendations(concerns: DetectedConcern[]): ServiceRecommendation[] {
  const recommendations: ServiceRecommendation[] = [];
  const seenServiceIds = new Set<string>();

  // Sort concerns by severity score (highest first)
  const sortedConcerns = [...concerns].sort((a, b) => b.score - a.score);

  for (const concern of sortedConcerns) {
    const catalogSlugs = CONCERN_TO_CATALOG_SLUGS[concern.id] || [];

    // Collect matching services from all relevant catalog slugs
    const matchingServices: UnifiedService[] = [];
    for (const slug of catalogSlugs) {
      matchingServices.push(...getServicesByConcern(slug));
    }

    // Filter to face-relevant services only and deduplicate
    const faceServices = matchingServices.filter(
      (s) => s.bodyAreas.includes('face') && !seenServiceIds.has(s.id)
    );

    // Assign priorities based on position
    for (let i = 0; i < faceServices.length && i < 3; i++) {
      const service = faceServices[i];
      seenServiceIds.add(service.id);

      let priority: 'primary' | 'complementary' | 'maintenance';
      if (recommendations.length === 0 && i === 0) {
        priority = 'primary';
      } else if (recommendations.length < 3) {
        priority = 'complementary';
      } else {
        priority = 'maintenance';
      }

      const improvementEstimates = IMPROVEMENT_ESTIMATES[concern.id] || {
        primary: 20,
        complementary: 10,
        maintenance: 5,
      };

      const presets = getPresetsForService(service.id, service.category);

      recommendations.push({
        service,
        reason: buildRecommendationReason(concern, service),
        priority,
        matchedConcerns: [concern.id],
        presets,
        estimatedImprovement: improvementEstimates[priority],
      });
    }
  }

  // Merge matchedConcerns for services that address multiple concerns
  const merged = new Map<string, ServiceRecommendation>();
  for (const rec of recommendations) {
    const existing = merged.get(rec.service.id);
    if (existing) {
      existing.matchedConcerns = [
        ...new Set([...existing.matchedConcerns, ...rec.matchedConcerns]),
      ];
      // Keep the higher priority
      if (priorityRank(rec.priority) < priorityRank(existing.priority)) {
        existing.priority = rec.priority;
      }
    } else {
      merged.set(rec.service.id, { ...rec });
    }
  }

  // Return top recommendations sorted by priority, capped at 8
  return Array.from(merged.values())
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
    .slice(0, 8);
}

function priorityRank(p: 'primary' | 'complementary' | 'maintenance'): number {
  return p === 'primary' ? 0 : p === 'complementary' ? 1 : 2;
}

function buildRecommendationReason(concern: DetectedConcern, service: UnifiedService): string {
  const concernReasons: Record<string, string> = {
    'acne': `Targets active breakouts and congestion in the ${concern.areas.join(' and ')} area to help clear and refine your skin.`,
    'hyperpigmentation': `Addresses the uneven tone and dark spots visible in the ${concern.areas.join(' and ')} area for a more luminous, even complexion.`,
    'fine-lines': `Helps smooth early lines in the ${concern.areas.join(' and ')} area, restoring a refreshed and youthful appearance.`,
    'wrinkles': `Works to soften deeper lines in the ${concern.areas.join(' and ')} area through collagen stimulation and skin renewal.`,
    'texture': `Refines skin texture in the ${concern.areas.join(' and ')} area for a smoother, more polished complexion.`,
    'large-pores': `Minimizes the appearance of enlarged pores in the ${concern.areas.join(' and ')} area for a refined, smooth finish.`,
    'skin-laxity': `Firms and lifts the ${concern.areas.join(' and ')} area to restore youthful contours and definition.`,
    'dullness': `Restores radiance and that lit-from-within glow to the ${concern.areas.join(' and ')} area.`,
    'sun-damage': `Addresses visible signs of UV exposure in the ${concern.areas.join(' and ')} area, helping to even out tone and texture.`,
    'redness': `Calms redness and reduces visible irritation in the ${concern.areas.join(' and ')} area for a more even, comfortable complexion.`,
    'dehydration': `Delivers deep hydration to the ${concern.areas.join(' and ')} area, restoring plumpness and a dewy glow.`,
    'uneven-tone': `Evens out skin tone across the ${concern.areas.join(' and ')} area for a more harmonious, radiant complexion.`,
    'dark-circles': `Helps brighten and refresh the under-eye area for a more rested, vibrant appearance.`,
    'scarring': `Resurfaces and smooths textural scarring in the ${concern.areas.join(' and ')} area through collagen remodeling.`,
  };

  return concernReasons[concern.id] || `Addresses ${concern.label.toLowerCase()} to help your skin reach its full potential.`;
}

// ─── Projected Score Calculation ────────────────────────────────────

function calculateProjectedScore(
  overallScore: number,
  recommendations: ServiceRecommendation[]
): number {
  // Calculate weighted improvement from all recommendations
  let totalImprovement = 0;
  const weightByPriority = { primary: 1.0, complementary: 0.6, maintenance: 0.3 };

  for (const rec of recommendations) {
    const weight = weightByPriority[rec.priority];
    totalImprovement += rec.estimatedImprovement * weight;
  }

  // Apply diminishing returns - can't exceed 95
  const maxPossibleGain = 100 - overallScore;
  const actualGain = Math.min(totalImprovement * 0.5, maxPossibleGain * 0.7);

  return Math.min(95, Math.round(overallScore + actualGain));
}

// ─── Main Analysis Function ─────────────────────────────────────────

export async function analyzeSkinFromPhoto(photoBase64: string): Promise<SkinAnalysisResult> {
  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('[SkinAnalysis] ANTHROPIC_API_KEY not set - returning fallback analysis');
    const fallback = createFallbackResult();
    fallback.recommendations = buildRecommendations(fallback.concerns);
    return fallback;
  }

  const client = new Anthropic({ apiKey });

  // Strip data URL prefix if present
  let imageData = photoBase64;
  let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg';

  if (photoBase64.startsWith('data:')) {
    const match = photoBase64.match(/^data:(image\/(?:jpeg|png|gif|webp));base64,(.+)$/);
    if (match) {
      mediaType = match[1] as typeof mediaType;
      imageData = match[2];
    } else {
      throw new Error('Invalid image format. Please upload a JPEG, PNG, GIF, or WebP image.');
    }
  }

  // Validate base64 data is not empty
  if (!imageData || imageData.length < 100) {
    throw new Error('Image data is too small or empty. Please upload a clear face photo.');
  }

  try {
    const response = await client.messages.create(
      {
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: SKIN_ANALYSIS_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: imageData,
                },
              },
              {
                type: 'text',
                text: 'Analyze this face photo for skin concerns. Provide your clinical skin assessment as JSON.',
              },
            ],
          },
        ],
      },
      {
        timeout: 30_000, // 30 second timeout
      }
    );

    // Extract text content from response
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response received from analysis');
    }

    // Parse JSON response - handle potential markdown wrapping
    let jsonText = textBlock.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let parsed: ClaudeAnalysisResponse;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      console.error('[SkinAnalysis] Failed to parse Claude response:', jsonText.substring(0, 200));
      throw new Error('Could not parse skin analysis response. Please try again.');
    }

    // Validate required fields
    if (
      typeof parsed.overallScore !== 'number' ||
      !parsed.skinType ||
      !parsed.ageRange ||
      !Array.isArray(parsed.concerns) ||
      !parsed.summary
    ) {
      throw new Error('Incomplete analysis response. Please try again.');
    }

    // Build detected concerns with validated data
    const concerns: DetectedConcern[] = parsed.concerns.map((c) => ({
      id: c.id,
      label: c.label,
      severity: (['mild', 'moderate', 'significant'].includes(c.severity)
        ? c.severity
        : 'mild') as DetectedConcern['severity'],
      score: Math.max(0, Math.min(100, Math.round(c.score))),
      description: c.description,
      areas: Array.isArray(c.areas) ? c.areas : ['overall'],
    }));

    // Build service recommendations from detected concerns
    const recommendations = buildRecommendations(concerns);

    // Calculate projected score
    const projectedScore = calculateProjectedScore(parsed.overallScore, recommendations);

    return {
      overallScore: Math.max(0, Math.min(100, Math.round(parsed.overallScore))),
      projectedScore,
      concerns,
      recommendations,
      summary: parsed.summary,
      skinType: parsed.skinType,
      ageRange: parsed.ageRange,
    };
  } catch (error: unknown) {
    // Handle specific API errors
    if (error instanceof Anthropic.APIError) {
      if (error.status === 429) {
        throw new Error('Our skin analysis is experiencing high demand. Please try again in a moment.');
      }
      if (error.status === 400) {
        throw new Error(
          'We could not process this image. Please upload a clear, well-lit face photo in JPEG or PNG format.'
        );
      }
      console.error('[SkinAnalysis] Anthropic API error:', error.status, error.message);
      throw new Error('Skin analysis is temporarily unavailable. Please try again shortly.');
    }

    // Re-throw our own errors
    if (error instanceof Error && error.message.startsWith('Invalid image')) {
      throw error;
    }
    if (error instanceof Error && error.message.startsWith('Image data is too small')) {
      throw error;
    }
    if (error instanceof Error && error.message.startsWith('Could not parse')) {
      throw error;
    }
    if (error instanceof Error && error.message.startsWith('Incomplete analysis')) {
      throw error;
    }
    if (error instanceof Error && error.message.startsWith('Our skin analysis')) {
      throw error;
    }
    if (error instanceof Error && error.message.startsWith('We could not process')) {
      throw error;
    }

    console.error('[SkinAnalysis] Unexpected error:', error);
    throw new Error('An unexpected error occurred during skin analysis. Please try again.');
  }
}
