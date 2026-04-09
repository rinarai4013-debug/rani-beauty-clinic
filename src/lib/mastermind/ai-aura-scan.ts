/**
 * AI-Powered Aura Skin Scan™ — Claude Vision Analysis Engine
 *
 * Replaces the rule-based aura-scan.ts with genuine Claude AI analysis.
 * Sends the patient's photo (base64) + intake data as a multi-modal message
 * to Claude, which performs clinical-grade skin assessment and returns
 * structured results matching the AuraScanResult type.
 *
 * Fallback: If Claude call fails or no photo is provided, delegates to
 * the existing rule-based runAuraScan().
 */

import { getAnthropicClient, hasAnthropicClient } from '@/lib/ai/client';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import type { MedicalHistoryFormData } from '@/lib/consultation/medical-schema';
import type {
  AuraScanResult,
  AuraScore,
  AuraGrade,
  AuraDeviceAnalysis,
  CategoryScore,
  SkinAnalysisCategory,
  ZoneAnalysis,
  FacialZone,
  AuraConcern,
  ConcernSeverity,
  ConcernUrgency,
  PredictiveMetrics,
  PredictedState,
  TreatmentReadiness,
} from '@/types/mastermind';
import type {
  SkinAnalysis,
  SkinHealthScore,
  SkinDimensions,
  FitzpatrickType,
  GlogauScale,
  AgingPattern,
  AgingPatternType,
  TreatmentPriority,
  MedicalFlag,
  SkinConcern,
} from '@/types/ai-treatment';
import { runAuraScan } from '@/lib/mastermind/aura-scan';

// ── SKINCARE ROUTINE ANALYSIS INTERFACE ──

export interface SkincareProductVerdict {
  product: string;
  verdict: 'keep' | 'replace' | 'remove';
  reason: string;
}

export interface MissingSkincareStep {
  step: string;
  why: string;
  recommendedProduct: string;
}

export interface SkincareRoutineAnalysis {
  amProducts: SkincareProductVerdict[];
  pmProducts: SkincareProductVerdict[];
  missingSteps: MissingSkincareStep[];
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  summary: string;
}

// ── EXTENDED RESULT TYPE ──

export interface AIAuraScanResult extends AuraScanResult {
  skincareAnalysis?: SkincareRoutineAnalysis;
  aiPowered: boolean;
  modelUsed?: string;
  analysisLatencyMs?: number;
}

// ── CONSTANTS ──

const AI_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 8192;
const REQUEST_TIMEOUT_MS = 60_000; // 60 seconds
const LOG_PREFIX = '[AI Aura Scan]';

// ── CLAUDE PROMPT ──

function buildSystemPrompt(): string {
  return `You are the Aura Skin Scan™ AI engine for Rani Beauty Clinic, a luxury medical aesthetics clinic in Renton, WA. You are a board-certified dermatologist-level AI performing clinical skin assessments from patient photos and intake data.

YOUR ROLE:
- Perform precise, clinical-grade skin analysis from the provided facial photo
- Cross-reference visual findings with the patient's medical history, medications, allergies, and skincare routine
- Generate structured assessment data that drives personalized treatment plans
- Provide TWO voices: warm luxury brand voice for patient-facing descriptions, and clinical precision for provider-facing notes

ANALYSIS FRAMEWORK:

1. FACIAL ZONE ASSESSMENT — Analyze each zone independently:
   - Forehead: horizontal lines, sun damage, texture
   - Glabella (between brows): "11 lines," frown lines depth
   - Periorbital (eye area): crow's feet, dark circles, hollowing, crepey skin, malar bags
   - Temples: volume loss, vein visibility, hollowing
   - Cheeks: volume, pigmentation, pore size, texture, malar region
   - Nasolabial folds: depth, asymmetry
   - Lips: volume, vermillion border definition, perioral lines
   - Marionette lines: depth, jowling
   - Jawline: definition, laxity, submental fullness
   - Chin: texture, projection
   - Neck: bands, horizontal lines, texture, laxity
   - Decolletage (if visible): sun damage, texture, poikiloderma

2. AUCA 5-CATEGORY SCORING (matching AURA device format):
   - Wrinkles: 1.0-5.0 scale (1=minimal, 5=severe). Assess static + dynamic lines.
   - Texture: 1.0-5.0 scale. Assess surface smoothness, roughness, irregularity.
   - Brown Spots: 1.0-5.0 scale. Assess hyperpigmentation, solar lentigines, melasma, PIH.
   - Red Areas: 1.0-5.0 scale. Assess rosacea, telangiectasia, erythema, broken capillaries.
   - Pores: 1.0-5.0 scale. Assess pore size, visibility, congestion.
   For peer scores: -3.0 to +3.0 (negative = better than peers, positive = worse).

3. SKIN HEALTH DIMENSIONS (0-100 each):
   - Hydration, Elasticity, Texture, Tone, Clarity, Firmness, Radiance, Protection

4. SKIN AGE ESTIMATION:
   - Estimate the skin's apparent age based on visual assessment
   - Compare to chronological age from intake data
   - Factor in lifestyle indicators visible in the skin

5. CONCERN DETECTION:
   - Identify all visible skin concerns with severity (mild/moderate/severe)
   - Rate urgency (low/medium/high)
   - Map concerns to specific facial zones
   - Provide patient-friendly descriptions (warm, encouraging, luxury brand voice)
   - Provide clinical notes (precise medical terminology for providers)

6. PREDICTIVE MODELING:
   - Project skin trajectory with and without treatment
   - Account for aging rate, lifestyle factors, and current skin condition

7. TREATMENT READINESS:
   - Assess skin barrier integrity from visual cues
   - Consider seasonal factors (current month)
   - Flag any visible contraindications

8. SKINCARE ROUTINE ANALYSIS:
   - Evaluate each AM and PM product mentioned
   - Identify products helping vs hurting based on visible skin condition
   - Identify missing essential steps
   - Grade the overall routine

9. MEDICAL CROSS-REFERENCE:
   - Flag any visible signs that correlate with reported medical conditions
   - Note medication-related skin effects (e.g., blood thinner bruising, retinoid irritation)
   - Flag contraindications for common aesthetic treatments

IMPORTANT CLINICAL NOTES:
- Rani Beauty Clinic performs IM INJECTIONS only — never use the word "infusion"
- Be specific about injection sites, units, and product recommendations where relevant
- Treatment recommendations should reference actual services: Botox, Dermal Fillers, HydraFacial, RF Microneedling, Sofwave, PicoWay, VI Peel, PRX-T33, Laser Hair Removal
- Use Glogau classification (I-IV) and Fitzpatrick typing (I-VI) in clinical notes

RESPONSE FORMAT:
You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no explanation outside the JSON. The JSON must match the exact schema provided in the user message.`;
}

function buildAnalysisPrompt(
  intakeData: Partial<ConsultationFormData>,
  medicalData?: Partial<MedicalHistoryFormData>
): string {
  const age = calculateAge(intakeData.dob);
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
  const currentSeason = getSeason();

  // Build intake context
  const concerns = (intakeData.skinConcerns as string[]) || [];
  const targetAreas = (intakeData.targetAreas as string[]) || [];
  const skinType = (intakeData.skinType as string) || 'unknown';
  const treatmentHistory = (intakeData.treatmentHistory as string) || 'None provided';
  const goals = (intakeData.goals as string) || 'Not specified';
  const timeline = (intakeData.timeline as string) || 'Not specified';
  const budget = (intakeData.budget as string) || 'Not specified';
  const treatmentInterests = (intakeData.treatmentInterests as string[]) || [];

  // Build medical context
  let medicalContext = 'No medical history provided.';
  if (medicalData) {
    const flags: string[] = [];
    if (medicalData.pregnant) flags.push('Currently pregnant');
    if (medicalData.breastfeeding) flags.push('Currently breastfeeding');
    if (medicalData.bloodThinners) flags.push('On blood thinners');
    if (medicalData.keloidHistory) flags.push('History of keloids');
    if (medicalData.activeSkinInfection) flags.push('Active skin infection');
    if (medicalData.recentSunExposure) flags.push('Recent significant sun exposure');
    if (medicalData.isotretinoinHistory) {
      flags.push(`Isotretinoin history (end date: ${medicalData.isotretinoinEndDate || 'unknown'})`);
    }
    if (medicalData.hasAutoimmune && medicalData.autoimmuneConditions?.length) {
      flags.push(`Autoimmune: ${medicalData.autoimmuneConditions.join(', ')}`);
    }
    if (medicalData.hasMedications && medicalData.medications?.length) {
      const meds = medicalData.medications.map(
        (m) => `${m.name}${m.dosage ? ` ${m.dosage}` : ''}${m.frequency ? ` (${m.frequency})` : ''}`
      );
      flags.push(`Medications: ${meds.join('; ')}`);
    }
    if (medicalData.hasAllergies && medicalData.allergies?.length) {
      const allergies = medicalData.allergies.map(
        (a) => `${a.allergen}${a.severity ? ` (${a.severity})` : ''}${a.reaction ? `: ${a.reaction}` : ''}`
      );
      flags.push(`Allergies: ${allergies.join('; ')}`);
    }
    if (medicalData.smokingStatus && medicalData.smokingStatus !== 'never') {
      flags.push(`Smoking: ${medicalData.smokingStatus}`);
    }
    if (medicalData.sunProtectionHabit) {
      flags.push(`Sun protection: ${medicalData.sunProtectionHabit}`);
    }
    if (medicalData.waterIntake) flags.push(`Water intake: ${medicalData.waterIntake}`);
    if (medicalData.sleepQuality) flags.push(`Sleep quality: ${medicalData.sleepQuality}`);
    if (medicalData.stressLevel) flags.push(`Stress level: ${medicalData.stressLevel}`);

    if (medicalData.hasPastProcedures && medicalData.pastProcedures?.length) {
      const procs = medicalData.pastProcedures.map(
        (p) => `${p.procedure}${p.date ? ` (${p.date})` : ''}${p.satisfaction ? ` — satisfaction: ${p.satisfaction}/10` : ''}`
      );
      flags.push(`Past procedures: ${procs.join('; ')}`);
    }

    medicalContext = flags.length > 0 ? flags.join('\n  - ') : 'No significant medical history.';
    if (flags.length > 0) medicalContext = '  - ' + medicalContext;
  }

  // Skincare routine from treatment history (users often describe routine here)
  const skincareInfo = treatmentHistory.length > 5
    ? `Skincare/Treatment Details: "${treatmentHistory}"`
    : 'No skincare routine details provided.';

  return `PATIENT INTAKE DATA:
- Age: ${age} years old (DOB: ${intakeData.dob || 'unknown'})
- Self-reported skin type: ${skinType}
- Primary concerns: ${concerns.join(', ') || 'none specified'}
- Target areas: ${targetAreas.join(', ') || 'none specified'}
- Treatment interests: ${treatmentInterests.join(', ') || 'none specified'}
- Goals: ${goals}
- Timeline preference: ${timeline}
- Budget tier: ${budget}
- ${skincareInfo}

MEDICAL HISTORY:
${medicalContext}

ENVIRONMENTAL CONTEXT:
- Current month: ${currentMonth} (${currentSeason})
- Location: Pacific Northwest (Renton, WA) — moderate UV exposure region

ANALYSIS INSTRUCTIONS:
Analyze the provided facial photo in conjunction with the intake data above. Return a JSON object with this EXACT schema:

{
  "auraScore": {
    "overall": <number 0-100>,
    "grade": <"A+" | "A" | "B" | "C" | "D" | "F">,
    "label": <"Exceptional" | "Excellent" | "Good" | "Fair" | "Needs Attention" | "Requires Intervention">,
    "breakdown": {
      "hydration": <number 0-100>,
      "elasticity": <number 0-100>,
      "texture": <number 0-100>,
      "tone": <number 0-100>,
      "clarity": <number 0-100>,
      "firmness": <number 0-100>,
      "radiance": <number 0-100>,
      "protection": <number 0-100>
    },
    "skinAge": <number>,
    "chronologicalAge": ${age},
    "skinAgeDelta": <number — positive means skin looks older>,
    "percentile": <number 0-100 — vs peers of same age>
  },
  "auraDeviceAnalysis": {
    "categories": [
      {
        "category": "wrinkles",
        "label": "Wrinkles",
        "absoluteScore": <number 1.0-5.0>,
        "peerScore": <number -3.0 to +3.0>,
        "severity": <"mild" | "moderate" | "severe">,
        "description": "<patient-friendly description>"
      },
      {
        "category": "texture",
        "label": "Texture",
        "absoluteScore": <number 1.0-5.0>,
        "peerScore": <number -3.0 to +3.0>,
        "severity": <"mild" | "moderate" | "severe">,
        "description": "<patient-friendly description>"
      },
      {
        "category": "brownSpots",
        "label": "Brown Spots",
        "absoluteScore": <number 1.0-5.0>,
        "peerScore": <number -3.0 to +3.0>,
        "severity": <"mild" | "moderate" | "severe">,
        "description": "<patient-friendly description>"
      },
      {
        "category": "redAreas",
        "label": "Red Areas",
        "absoluteScore": <number 1.0-5.0>,
        "peerScore": <number -3.0 to +3.0>,
        "severity": <"mild" | "moderate" | "severe">,
        "description": "<patient-friendly description>"
      },
      {
        "category": "pores",
        "label": "Pores",
        "absoluteScore": <number 1.0-5.0>,
        "peerScore": <number -3.0 to +3.0>,
        "severity": <"mild" | "moderate" | "severe">,
        "description": "<patient-friendly description>"
      }
    ],
    "compositeSkinScore": <number — weighted average of peer scores>,
    "scoringMode": "absolute"
  },
  "zoneAnalysis": [
    {
      "zone": <FacialZone string>,
      "zoneName": "<display name>",
      "overallScore": <number 0-100>,
      "skinAge": <number>,
      "concerns": [
        { "type": "<concern name>", "severity": <number 0-100>, "treatmentPriority": <number 1-5> }
      ],
      "recommendations": ["<treatment recommendation strings>"]
    }
  ],
  "detectedConcerns": [
    {
      "id": "<unique id like concern_wrinkles_0>",
      "concern": <SkinConcern: "wrinkles" | "volume_loss" | "acne" | "scarring" | "pigmentation" | "redness" | "texture" | "pores" | "laxity" | "double_chin" | "dark_circles" | "lip_enhancement" | "neck_chest_aging">,
      "severity": <"mild" | "moderate" | "severe">,
      "score": <number 0-100 — higher means more severe>,
      "zones": [<FacialZone strings>],
      "trending": <"improving" | "stable" | "worsening">,
      "urgency": <"low" | "medium" | "high">,
      "description": "<warm, luxury brand voice — encouraging, educational, never alarming>",
      "clinicalNote": "<precise clinical terminology for provider>"
    }
  ],
  "predictiveMetrics": {
    "withoutIntervention": {
      "sixMonths": { "auraScore": <number>, "skinAge": <number>, "topConcerns": [<strings>], "newConcernsEmerging": [<strings>] },
      "oneYear": { "auraScore": <number>, "skinAge": <number>, "topConcerns": [<strings>], "newConcernsEmerging": [<strings>] },
      "threeYears": { "auraScore": <number>, "skinAge": <number>, "topConcerns": [<strings>], "newConcernsEmerging": [<strings>] },
      "fiveYears": { "auraScore": <number>, "skinAge": <number>, "topConcerns": [<strings>], "newConcernsEmerging": [<strings>] }
    },
    "withTreatment": {
      "threeMonths": { "auraScore": <number>, "skinAge": <number>, "topConcerns": [<strings>], "newConcernsEmerging": [] },
      "sixMonths": { "auraScore": <number>, "skinAge": <number>, "topConcerns": [<strings>], "newConcernsEmerging": [] },
      "oneYear": { "auraScore": <number>, "skinAge": <number>, "topConcerns": [<strings>], "newConcernsEmerging": [] }
    },
    "riskFactors": [
      { "factor": "<name>", "impact": <"low" | "medium" | "high">, "description": "<explanation>" }
    ]
  },
  "treatmentReadiness": {
    "readyForTreatment": <boolean>,
    "requiredPrep": [<strings>],
    "seasonalConsiderations": [<strings>],
    "skinBarrierStatus": <"compromised" | "adequate" | "strong">
  },
  "skinAnalysis": {
    "fitzpatrickType": <number 1-6>,
    "fitzpatrickDescription": "<e.g. Type III — Medium skin, tans gradually>",
    "glogauScale": <number 1-4>,
    "glogauDescription": "<e.g. Type II — Wrinkles in Motion>",
    "skinHealthScore": {
      "overall": <number 0-100>,
      "dimensions": { "hydration": <0-100>, "elasticity": <0-100>, "texture": <0-100>, "tone": <0-100>, "clarity": <0-100>, "firmness": <0-100>, "radiance": <0-100>, "protection": <0-100> }
    },
    "agingPatterns": [
      {
        "type": <"expression_lines" | "gravity" | "volume_loss" | "sun_damage">,
        "severity": <"mild" | "moderate" | "advanced">,
        "areas": [<area strings>],
        "recommendedTreatments": [<treatment strings>]
      }
    ],
    "treatmentPriority": [
      {
        "rank": <number>,
        "concern": <SkinConcern string>,
        "urgency": <"high" | "medium" | "low">,
        "recommendedTreatment": "<specific treatment>",
        "rationale": "<clinical rationale>"
      }
    ],
    "skincareRoutine": { "morning": [], "evening": [], "weekly": [] },
    "benchmarkComparison": {
      "ageGroup": "<e.g. 40s>",
      "percentile": <0-100>,
      "areasBetterThanPeers": [<strings>],
      "areasForImprovement": [<strings>]
    }
  },
  "medicalFlags": [
    {
      "flag": "<description>",
      "severity": <"info" | "warning" | "critical">,
      "action": "<recommended action>",
      "relatedTreatments": [<treatment strings>]
    }
  ],
  "skincareAnalysis": {
    "amProducts": [
      { "product": "<product name>", "verdict": <"keep" | "replace" | "remove">, "reason": "<why>" }
    ],
    "pmProducts": [
      { "product": "<product name>", "verdict": <"keep" | "replace" | "remove">, "reason": "<why>" }
    ],
    "missingSteps": [
      { "step": "<step name>", "why": "<clinical reason>", "recommendedProduct": "<specific product recommendation>" }
    ],
    "overallGrade": <"A" | "B" | "C" | "D" | "F">,
    "summary": "<1-2 sentence luxury brand voice summary of their routine>"
  }
}

ZONE OPTIONS (use only these): "forehead", "glabella", "periorbital_left", "periorbital_right", "temples_left", "temples_right", "cheeks_left", "cheeks_right", "nasolabial_left", "nasolabial_right", "lips", "marionette_left", "marionette_right", "jawline", "chin", "neck", "decolletage"

Include at least 4-6 zones in zoneAnalysis covering the most relevant areas visible in the photo.
Include 2-5 detected concerns ranked by severity.
Include at least 1-3 risk factors in predictiveMetrics.
For skincare analysis, evaluate any products mentioned in the intake. If none mentioned, provide recommended routine with missingSteps only.

Return ONLY the JSON object. No markdown formatting, no code fences, no commentary.`;
}

// ── MAIN EXPORT ──

/**
 * Run AI-powered Aura Skin Scan using Claude Vision.
 *
 * If a photo is provided, sends it to Claude for multi-modal analysis.
 * Falls back to rule-based scan if:
 * - No photo provided
 * - Claude API call fails
 * - API key not configured
 * - Response parsing fails
 *
 * @param intakeData - Patient intake form data
 * @param sourcePhotoUrl - Base64 data URL of patient photo (optional)
 * @param medicalData - Medical history form data (optional)
 * @returns AIAuraScanResult with optional skincareAnalysis
 */
export async function runAIAuraScan(
  intakeData: Partial<ConsultationFormData>,
  sourcePhotoUrl?: string,
  medicalData?: Partial<MedicalHistoryFormData>
): Promise<AIAuraScanResult> {
  const scanId = `aura_ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const startTime = Date.now();

  // Guard: no API key
  if (!hasAnthropicClient()) {
    console.warn(`${LOG_PREFIX} ANTHROPIC_API_KEY not set — falling back to rule-based scan`);
    return toAIResult(await runAuraScan(intakeData, medicalData), false, scanId);
  }

  // Guard: no photo — fall back to rule-based
  if (!sourcePhotoUrl || !sourcePhotoUrl.startsWith('data:image/')) {
    console.info(`${LOG_PREFIX} No valid photo provided — falling back to rule-based scan`);
    return toAIResult(await runAuraScan(intakeData, medicalData), false, scanId);
  }

  try {
    console.info(`${LOG_PREFIX} Starting AI analysis for scan ${scanId}`);

    // Extract base64 and media type from data URL
    const { base64, mediaType } = parseDataUrl(sourcePhotoUrl);

    // Initialize Anthropic client
    const anthropic = getAnthropicClient();

    // Build the multi-modal message
    const response = await Promise.race([
      anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: MAX_TOKENS,
        system: buildSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: buildAnalysisPrompt(intakeData, medicalData),
              },
            ],
          },
        ],
      }),
      createTimeout(REQUEST_TIMEOUT_MS),
    ]);

    const latency = Date.now() - startTime;
    console.info(`${LOG_PREFIX} Claude response received in ${latency}ms for scan ${scanId}`);

    // Extract text content from response
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    // Parse the JSON response
    const rawJson = extractJson(textBlock.text);
    const parsed = JSON.parse(rawJson);

    // Validate and assemble the result
    const result = assembleResult(parsed, scanId, latency);

    console.info(
      `${LOG_PREFIX} AI scan complete: score=${result.auraScore.overall}, ` +
      `grade=${result.auraScore.grade}, skinAge=${result.auraScore.skinAge}, ` +
      `concerns=${result.detectedConcerns.length}, latency=${latency}ms`
    );

    return result;
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(
      `${LOG_PREFIX} AI analysis failed after ${latency}ms — falling back to rule-based scan:`,
      error instanceof Error ? error.message : error
    );

    // Fallback to rule-based
    return toAIResult(await runAuraScan(intakeData, medicalData), false, scanId);
  }
}

// ── RESPONSE ASSEMBLY ──

/**
 * Assemble a validated AIAuraScanResult from Claude's parsed JSON output.
 * Applies bounds-checking and defaults to ensure type safety.
 */
function assembleResult(
  parsed: Record<string, unknown>,
  scanId: string,
  latencyMs: number
): AIAuraScanResult {
  const raw = parsed as Record<string, any>;

  // Aura Score
  const auraScore = validateAuraScore(raw.auraScore || {});

  // AUCA Device Analysis
  const auraDeviceAnalysis = validateDeviceAnalysis(raw.auraDeviceAnalysis || {});

  // Zone Analysis
  const zoneAnalysis = validateZoneAnalysis(raw.zoneAnalysis || []);

  // Detected Concerns
  const detectedConcerns = validateConcerns(raw.detectedConcerns || []);

  // Predictive Metrics
  const predictiveMetrics = validatePredictiveMetrics(raw.predictiveMetrics || {});

  // Treatment Readiness
  const treatmentReadiness = validateTreatmentReadiness(raw.treatmentReadiness || {});

  // Skin Analysis
  const skinAnalysis = validateSkinAnalysis(raw.skinAnalysis || {});

  // Medical Flags
  const medicalFlags = validateMedicalFlags(raw.medicalFlags || []);

  // Skincare Analysis (new)
  const skincareAnalysis = validateSkincareAnalysis(raw.skincareAnalysis);

  return {
    scanId,
    timestamp: new Date().toISOString(),
    auraScore,
    auraDeviceAnalysis,
    zoneAnalysis,
    detectedConcerns,
    predictiveMetrics,
    treatmentReadiness,
    skinAnalysis,
    medicalFlags,
    skincareAnalysis,
    aiPowered: true,
    modelUsed: AI_MODEL,
    analysisLatencyMs: latencyMs,
  };
}

// ── VALIDATION HELPERS ──

function validateAuraScore(raw: Record<string, any>): AuraScore {
  const overall = clamp(raw.overall ?? 65, 0, 100);
  const validGrades: AuraGrade[] = ['A+', 'A', 'B', 'C', 'D', 'F'];
  const grade = validGrades.includes(raw.grade) ? raw.grade : scoreToGrade(overall);
  const validLabels = ['Exceptional', 'Excellent', 'Good', 'Fair', 'Needs Attention', 'Requires Intervention'];
  const label = validLabels.includes(raw.label) ? raw.label : gradeToLabel(grade);

  const breakdown = validateDimensions(raw.breakdown || {});
  const skinAge = Math.round(raw.skinAge ?? 40);
  const chronologicalAge = Math.round(raw.chronologicalAge ?? 35);

  return {
    overall: Math.round(overall),
    grade,
    label,
    breakdown,
    skinAge,
    chronologicalAge,
    skinAgeDelta: skinAge - chronologicalAge,
    percentile: clamp(Math.round(raw.percentile ?? 50), 0, 100),
  };
}

function validateDimensions(raw: Record<string, any>): SkinDimensions {
  return {
    hydration: clamp(Math.round(raw.hydration ?? 60), 0, 100),
    elasticity: clamp(Math.round(raw.elasticity ?? 60), 0, 100),
    texture: clamp(Math.round(raw.texture ?? 60), 0, 100),
    tone: clamp(Math.round(raw.tone ?? 60), 0, 100),
    clarity: clamp(Math.round(raw.clarity ?? 60), 0, 100),
    firmness: clamp(Math.round(raw.firmness ?? 60), 0, 100),
    radiance: clamp(Math.round(raw.radiance ?? 60), 0, 100),
    protection: clamp(Math.round(raw.protection ?? 60), 0, 100),
  };
}

function validateDeviceAnalysis(raw: Record<string, any>): AuraDeviceAnalysis {
  const validCategories: SkinAnalysisCategory[] = ['wrinkles', 'texture', 'brownSpots', 'redAreas', 'pores'];
  const rawCategories: any[] = Array.isArray(raw.categories) ? raw.categories : [];

  const categories: CategoryScore[] = validCategories.map((cat) => {
    const found = rawCategories.find((c: any) => c?.category === cat) || {};
    const validSeverities: ConcernSeverity[] = ['mild', 'moderate', 'severe'];

    return {
      category: cat,
      label: found.label || formatCategoryLabel(cat),
      absoluteScore: clamp(Number(found.absoluteScore) || 2.0, 1.0, 5.0),
      peerScore: clamp(Number(found.peerScore) || 0, -3.0, 3.0),
      severity: validSeverities.includes(found.severity) ? found.severity : 'mild',
      description: String(found.description || `${formatCategoryLabel(cat)} assessment pending.`),
    };
  });

  return {
    categories,
    compositeSkinScore: Number(raw.compositeSkinScore) || calculateComposite(categories),
    scoringMode: 'absolute',
  };
}

function validateZoneAnalysis(raw: any[]): ZoneAnalysis[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return getDefaultZones();
  }

  const validZones: FacialZone[] = [
    'forehead', 'glabella', 'periorbital_left', 'periorbital_right',
    'temples_left', 'temples_right', 'cheeks_left', 'cheeks_right',
    'nasolabial_left', 'nasolabial_right', 'lips', 'marionette_left',
    'marionette_right', 'jawline', 'chin', 'neck', 'decolletage',
  ];

  return raw
    .filter((z: any) => z && validZones.includes(z.zone))
    .map((z: any) => ({
      zone: z.zone as FacialZone,
      zoneName: String(z.zoneName || z.zone),
      overallScore: clamp(Math.round(z.overallScore ?? 60), 0, 100),
      skinAge: Math.round(z.skinAge ?? 40),
      concerns: Array.isArray(z.concerns)
        ? z.concerns.slice(0, 5).map((c: any) => ({
            type: String(c.type || 'general'),
            severity: clamp(Math.round(c.severity ?? 50), 0, 100),
            treatmentPriority: clamp(Math.round(c.treatmentPriority ?? 3), 1, 5),
          }))
        : [],
      recommendations: Array.isArray(z.recommendations)
        ? z.recommendations.map(String)
        : [],
    }));
}

function validateConcerns(raw: any[]): AuraConcern[] {
  if (!Array.isArray(raw)) return [];

  const validConcerns: SkinConcern[] = [
    'wrinkles', 'volume_loss', 'acne', 'scarring', 'pigmentation',
    'redness', 'texture', 'pores', 'laxity', 'double_chin',
    'dark_circles', 'lip_enhancement', 'neck_chest_aging',
  ];
  const validSeverities: ConcernSeverity[] = ['mild', 'moderate', 'severe'];
  const validUrgencies: ConcernUrgency[] = ['low', 'medium', 'high'];
  const validTrending = ['improving', 'stable', 'worsening'] as const;

  return raw
    .filter((c: any) => c && validConcerns.includes(c.concern))
    .map((c: any) => ({
      id: String(c.id || `concern_${c.concern}_${Math.random().toString(36).slice(2, 6)}`),
      concern: c.concern as SkinConcern,
      severity: validSeverities.includes(c.severity) ? c.severity : 'moderate',
      score: clamp(Math.round(c.score ?? 50), 0, 100),
      zones: Array.isArray(c.zones) ? c.zones.filter((z: string) => typeof z === 'string') : [],
      trending: validTrending.includes(c.trending) ? c.trending : 'stable',
      urgency: validUrgencies.includes(c.urgency) ? c.urgency : 'medium',
      description: String(c.description || ''),
      clinicalNote: String(c.clinicalNote || ''),
    }));
}

function validatePredictiveMetrics(raw: Record<string, any>): PredictiveMetrics {
  const wo = raw.withoutIntervention || {};
  const wt = raw.withTreatment || {};

  return {
    withoutIntervention: {
      sixMonths: validatePredictedState(wo.sixMonths),
      oneYear: validatePredictedState(wo.oneYear),
      threeYears: validatePredictedState(wo.threeYears),
      fiveYears: validatePredictedState(wo.fiveYears),
    },
    withTreatment: {
      threeMonths: validatePredictedState(wt.threeMonths),
      sixMonths: validatePredictedState(wt.sixMonths),
      oneYear: validatePredictedState(wt.oneYear),
    },
    riskFactors: Array.isArray(raw.riskFactors)
      ? raw.riskFactors.map((rf: any) => ({
          factor: String(rf.factor || 'Unknown'),
          impact: ['low', 'medium', 'high'].includes(rf.impact) ? rf.impact : 'medium',
          description: String(rf.description || ''),
        }))
      : [],
  };
}

function validatePredictedState(raw: any): PredictedState {
  if (!raw) {
    return { auraScore: 60, skinAge: 40, topConcerns: [], newConcernsEmerging: [] };
  }
  return {
    auraScore: clamp(Math.round(raw.auraScore ?? 60), 0, 100),
    skinAge: Math.round(raw.skinAge ?? 40),
    topConcerns: Array.isArray(raw.topConcerns) ? raw.topConcerns.map(String) : [],
    newConcernsEmerging: Array.isArray(raw.newConcernsEmerging) ? raw.newConcernsEmerging.map(String) : [],
  };
}

function validateTreatmentReadiness(raw: Record<string, any>): TreatmentReadiness {
  const validBarrier = ['compromised', 'adequate', 'strong'] as const;
  return {
    readyForTreatment: raw.readyForTreatment !== false,
    requiredPrep: Array.isArray(raw.requiredPrep) ? raw.requiredPrep.map(String) : [],
    seasonalConsiderations: Array.isArray(raw.seasonalConsiderations) ? raw.seasonalConsiderations.map(String) : [],
    skinBarrierStatus: validBarrier.includes(raw.skinBarrierStatus)
      ? raw.skinBarrierStatus
      : 'adequate',
  };
}

function validateSkinAnalysis(raw: Record<string, any>): SkinAnalysis {
  const validAgingTypes: AgingPatternType[] = ['expression_lines', 'gravity', 'volume_loss', 'sun_damage'];
  const validSeverities = ['mild', 'moderate', 'advanced'] as const;

  return {
    fitzpatrickType: clamp(Math.round(raw.fitzpatrickType ?? 3), 1, 6) as FitzpatrickType,
    fitzpatrickDescription: String(raw.fitzpatrickDescription || 'Fitzpatrick Type III'),
    glogauScale: clamp(Math.round(raw.glogauScale ?? 2), 1, 4) as GlogauScale,
    glogauDescription: String(raw.glogauDescription || 'Type II — Wrinkles in Motion'),
    skinHealthScore: {
      overall: clamp(Math.round(raw.skinHealthScore?.overall ?? 65), 0, 100),
      dimensions: validateDimensions(raw.skinHealthScore?.dimensions || {}),
    },
    agingPatterns: Array.isArray(raw.agingPatterns)
      ? raw.agingPatterns
          .filter((ap: any) => ap && validAgingTypes.includes(ap.type))
          .map((ap: any) => ({
            type: ap.type as AgingPatternType,
            severity: validSeverities.includes(ap.severity) ? ap.severity : 'moderate',
            areas: Array.isArray(ap.areas) ? ap.areas.map(String) : [],
            recommendedTreatments: Array.isArray(ap.recommendedTreatments)
              ? ap.recommendedTreatments.map(String)
              : [],
          }))
      : [],
    treatmentPriority: Array.isArray(raw.treatmentPriority)
      ? raw.treatmentPriority.map((tp: any) => ({
          rank: Math.round(tp.rank ?? 1),
          concern: String(tp.concern || 'texture') as SkinConcern,
          urgency: ['high', 'medium', 'low'].includes(tp.urgency) ? tp.urgency : 'medium',
          recommendedTreatment: String(tp.recommendedTreatment || ''),
          rationale: String(tp.rationale || ''),
        }))
      : [],
    skincareRoutine: { morning: [], evening: [], weekly: [] },
    benchmarkComparison: {
      ageGroup: String(raw.benchmarkComparison?.ageGroup || '30s'),
      percentile: clamp(Math.round(raw.benchmarkComparison?.percentile ?? 50), 0, 100),
      areasBetterThanPeers: Array.isArray(raw.benchmarkComparison?.areasBetterThanPeers)
        ? raw.benchmarkComparison.areasBetterThanPeers.map(String)
        : [],
      areasForImprovement: Array.isArray(raw.benchmarkComparison?.areasForImprovement)
        ? raw.benchmarkComparison.areasForImprovement.map(String)
        : [],
    },
  };
}

function validateMedicalFlags(raw: any[]): MedicalFlag[] {
  if (!Array.isArray(raw)) return [];
  const validSeverities = ['info', 'warning', 'critical'] as const;

  return raw
    .filter((f: any) => f && f.flag)
    .map((f: any) => ({
      flag: String(f.flag),
      severity: validSeverities.includes(f.severity) ? f.severity : 'info',
      action: String(f.action || ''),
      relatedTreatments: Array.isArray(f.relatedTreatments) ? f.relatedTreatments.map(String) : [],
    }));
}

function validateSkincareAnalysis(raw: any): SkincareRoutineAnalysis | undefined {
  if (!raw) return undefined;

  const validVerdicts = ['keep', 'replace', 'remove'] as const;
  const validGrades = ['A', 'B', 'C', 'D', 'F'] as const;

  return {
    amProducts: Array.isArray(raw.amProducts)
      ? raw.amProducts.map((p: any) => ({
          product: String(p.product || ''),
          verdict: validVerdicts.includes(p.verdict) ? p.verdict : 'keep',
          reason: String(p.reason || ''),
        }))
      : [],
    pmProducts: Array.isArray(raw.pmProducts)
      ? raw.pmProducts.map((p: any) => ({
          product: String(p.product || ''),
          verdict: validVerdicts.includes(p.verdict) ? p.verdict : 'keep',
          reason: String(p.reason || ''),
        }))
      : [],
    missingSteps: Array.isArray(raw.missingSteps)
      ? raw.missingSteps.map((s: any) => ({
          step: String(s.step || ''),
          why: String(s.why || ''),
          recommendedProduct: String(s.recommendedProduct || ''),
        }))
      : [],
    overallGrade: validGrades.includes(raw.overallGrade) ? raw.overallGrade : 'C',
    summary: String(raw.summary || ''),
  };
}

// ── UTILITY FUNCTIONS ──

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function calculateAge(dob?: string): number {
  if (!dob) return 35;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function getSeason(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Fall';
  return 'Winter';
}

function parseDataUrl(dataUrl: string): { base64: string; mediaType: string } {
  // Format: data:image/jpeg;base64,/9j/4AAQ...
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!match) {
    throw new Error('Invalid data URL format — expected data:image/...;base64,...');
  }
  return {
    mediaType: match[1],
    base64: match[2],
  };
}

function extractJson(text: string): string {
  // Try to extract JSON from the response, handling potential markdown wrapping
  let cleaned = text.trim();

  // Remove markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }

  cleaned = cleaned.trim();

  // Verify it starts with { and ends with }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('No JSON object found in Claude response');
  }

  return cleaned.slice(firstBrace, lastBrace + 1);
}

function scoreToGrade(score: number): AuraGrade {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function gradeToLabel(grade: AuraGrade): string {
  const labels: Record<AuraGrade, string> = {
    'A+': 'Exceptional',
    A: 'Excellent',
    B: 'Good',
    C: 'Fair',
    D: 'Needs Attention',
    F: 'Requires Intervention',
  };
  return labels[grade];
}

function formatCategoryLabel(cat: SkinAnalysisCategory): string {
  const labels: Record<SkinAnalysisCategory, string> = {
    wrinkles: 'Wrinkles',
    texture: 'Texture',
    brownSpots: 'Brown Spots',
    redAreas: 'Red Areas',
    pores: 'Pores',
  };
  return labels[cat];
}

function calculateComposite(categories: CategoryScore[]): number {
  const weights = [0.25, 0.20, 0.20, 0.15, 0.20];
  return Math.round(
    categories.reduce((sum, cat, i) => sum + cat.peerScore * (weights[i] || 0.2), 0) * 10
  ) / 10;
}

function getDefaultZones(): ZoneAnalysis[] {
  return [
    { zone: 'forehead', zoneName: 'Forehead', overallScore: 65, skinAge: 40, concerns: [], recommendations: [] },
    { zone: 'cheeks_left', zoneName: 'Left Cheek', overallScore: 65, skinAge: 40, concerns: [], recommendations: [] },
    { zone: 'jawline', zoneName: 'Jawline', overallScore: 65, skinAge: 40, concerns: [], recommendations: [] },
  ];
}

function toAIResult(
  baseResult: AuraScanResult,
  aiPowered: boolean,
  scanId: string
): AIAuraScanResult {
  return {
    ...baseResult,
    scanId,
    aiPowered,
  };
}

function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`AI analysis timed out after ${ms}ms`)), ms);
  });
}
