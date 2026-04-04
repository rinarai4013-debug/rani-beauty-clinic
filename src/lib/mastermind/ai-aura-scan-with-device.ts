/**
 * AI-Powered Aura Scan with Hexagon Aura 3D Device Images
 *
 * UPGRADED engine that uses ACTUAL medical-grade 3D imaging data from the
 * Hexagon Aura scanner instead of just a patient selfie. Sends Claude:
 *
 * 1. Front-facing 3D render
 * 2. BrownAreas hyperpigmentation heat map
 * 3. RedAreas vascular/redness map
 * 4. Wrinkles depth overlay
 * 5. Pores analysis
 * 6. Smoothness wireframe mesh
 * 7. Distances/measurements (if available)
 * 8. Patient intake data
 *
 * This produces clinical-grade, image-verified analysis — the scores
 * are ACTUALLY derived from what the medical device captured, not
 * estimated from a phone photo.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AuraDeviceScan } from '@/lib/mastermind/aura-device-integration';
import type { AuraScanResult } from '@/types/mastermind';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import { runAuraScan } from '@/lib/mastermind/aura-scan';

// ── CONSTANTS ──

const AI_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 8192;
const REQUEST_TIMEOUT_MS = 90_000; // 90s — more images to analyze
const LOG_PREFIX = '[AI Aura Device Scan]';

// ── SYSTEM PROMPT ──

function buildDeviceScanSystemPrompt(): string {
  return `You are the Aura Skin Scan™ AI engine for Rani Beauty Clinic, a luxury medical aesthetics clinic in Renton, WA. You are analyzing MEDICAL-GRADE 3D SKIN IMAGING from a Hexagon Aura 3D scanner — this is NOT a selfie, this is professional diagnostic imaging.

YOUR ROLE:
- Perform precise, clinical-grade skin analysis from the provided Aura 3D scanner images
- Each image represents a different diagnostic layer captured by the scanner
- Cross-reference the scanner findings with the patient's intake data
- Generate zone-by-zone scores that are ACTUALLY based on what the images show
- Provide analysis suitable for a medical aesthetics provider

IMAGE INTERPRETATION GUIDE:

1. FRONT VIEW (Base 3D Render): The patient's face captured in high-resolution 3D. Use this as your baseline for overall skin assessment, facial structure, and visible concerns.

2. BROWN AREAS (Hyperpigmentation Heat Map): This image highlights hyperpigmentation using color intensity. Darker/more saturated areas indicate higher concentrations of melanin deposits — solar lentigines, melasma, post-inflammatory hyperpigmentation (PIH), or age spots. Areas with no highlight are clear.

3. RED AREAS (Vascular/Redness Map): This image highlights vascular activity and surface redness. Red areas indicate rosacea, telangiectasia (broken capillaries), erythema, inflammation, or active irritation. The intensity of red correlates with severity.

4. WRINKLES (Depth Overlay): Colored line overlays showing wrinkle location and depth. Yellow lines = mild/fine lines. Green lines = moderate wrinkles. Blue/purple = deep wrinkles or folds. Line density indicates the concentration of wrinkling in each area.

5. PORES (Pore Analysis): This image shows pore visibility and size distribution. Larger, more visible dots/marks indicate enlarged or congested pores. Areas with heavy marking have greater pore visibility. Compare cheeks, nose, forehead, and chin.

6. SMOOTHNESS (Wireframe Texture Mesh): A wireframe mesh overlay showing surface texture irregularity. Uniform, smooth mesh = good skin texture. Irregular, distorted mesh = rough texture, scarring, or surface irregularity. Tighter mesh density = finer texture.

7. DISTANCES (Facial Measurements): If provided, this shows precise millimeter measurements between facial landmark points. Use these for anatomical assessment and treatment planning (e.g., filler placement, symmetry analysis).

ANALYSIS FRAMEWORK:

1. ZONE-BY-ZONE ASSESSMENT: Analyze each facial zone by cross-referencing ALL scanner layers:
   - Forehead, Glabella, Periorbital (L/R), Temples (L/R)
   - Cheeks (L/R), Nasolabial (L/R), Lips
   - Marionette (L/R), Jawline, Chin, Neck

2. AUCA 5-CATEGORY SCORING (1.0-5.0 scale, 1=minimal, 5=severe):
   - Wrinkles: Score based on the ACTUAL wrinkle overlay — count visible lines, assess depth from color
   - Texture: Score based on the ACTUAL smoothness mesh — assess uniformity
   - Brown Spots: Score based on the ACTUAL hyperpigmentation map — assess coverage and intensity
   - Red Areas: Score based on the ACTUAL redness map — assess distribution and intensity
   - Pores: Score based on the ACTUAL pore analysis — assess visibility and density

3. SKIN HEALTH DIMENSIONS (0-100 each):
   Hydration, Elasticity, Texture, Tone, Clarity, Firmness, Radiance, Protection

4. CONCERN DETECTION with severity and zone mapping

5. PREDICTIVE MODELING for with/without treatment trajectories

6. TREATMENT READINESS assessment

IMPORTANT CLINICAL NOTES:
- Rani Beauty Clinic performs IM INJECTIONS only — never use the word "infusion"
- Be specific about injection sites, units, and product recommendations
- Treatment references: Botox, Dermal Fillers, HydraFacial, RF Microneedling, Sofwave, PicoWay, VI Peel, PRX-T33, Laser Hair Removal
- Use Glogau classification (I-IV) and Fitzpatrick typing (I-VI)
- Your analysis is backed by ACTUAL scanner data — be confident and specific in your findings
- Where the scanner shows clear evidence, state it definitively rather than hedging

RESPONSE FORMAT:
You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no explanation outside the JSON.`;
}

// ── USER PROMPT ──

function buildDeviceAnalysisPrompt(
  intakeData: Partial<ConsultationFormData>
): string {
  const age = calculateAge(intakeData.dob);
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });

  const concerns = (intakeData.skinConcerns as string[]) || [];
  const targetAreas = (intakeData.targetAreas as string[]) || [];
  const skinType = (intakeData.skinType as string) || 'unknown';
  const goals = (intakeData.goals as string) || 'Not specified';
  const budget = (intakeData.budget as string) || 'Not specified';
  const treatmentHistory = (intakeData.treatmentHistory as string) || 'None provided';
  const treatmentInterests = (intakeData.treatmentInterests as string[]) || [];

  return `PATIENT INTAKE DATA:
- Age: ${age} years old (DOB: ${intakeData.dob || 'unknown'})
- Self-reported skin type: ${skinType}
- Primary concerns: ${concerns.join(', ') || 'none specified'}
- Target areas: ${targetAreas.join(', ') || 'none specified'}
- Treatment interests: ${treatmentInterests.join(', ') || 'none specified'}
- Goals: ${goals}
- Budget tier: ${budget}
- Treatment/skincare history: ${treatmentHistory}

SCANNER IMAGES PROVIDED (in order):
1. Front View — base 3D render
2. Brown Areas — hyperpigmentation heat map
3. Red Areas — vascular/redness map
4. Wrinkles — depth overlay with color-coded lines
5. Pores — pore visibility analysis
6. Smoothness — wireframe texture mesh
${intakeData ? '7. Distances — facial measurements (if included)' : ''}

Cross-reference the patient's SELF-REPORTED concerns with what the scanner ACTUALLY shows.
Note any discrepancies — the scanner may reveal concerns the patient hasn't noticed yet.

ENVIRONMENTAL CONTEXT:
- Current month: ${currentMonth}
- Location: Pacific Northwest (Renton, WA)

Return a JSON object with this EXACT schema:

{
  "auraScore": {
    "overall": <number 0-100>,
    "grade": <"A+" | "A" | "B" | "C" | "D" | "F">,
    "label": <"Exceptional" | "Excellent" | "Good" | "Fair" | "Needs Attention" | "Requires Intervention">,
    "breakdown": {
      "hydration": <0-100>, "elasticity": <0-100>, "texture": <0-100>, "tone": <0-100>,
      "clarity": <0-100>, "firmness": <0-100>, "radiance": <0-100>, "protection": <0-100>
    },
    "skinAge": <number>,
    "chronologicalAge": ${age},
    "skinAgeDelta": <number>,
    "percentile": <0-100>
  },
  "auraDeviceAnalysis": {
    "categories": [
      { "category": "wrinkles", "label": "Wrinkles", "absoluteScore": <1.0-5.0>, "peerScore": <-3.0 to +3.0>, "severity": <"mild"|"moderate"|"severe">, "description": "<based on actual wrinkle overlay>" },
      { "category": "texture", "label": "Texture", "absoluteScore": <1.0-5.0>, "peerScore": <-3.0 to +3.0>, "severity": <"mild"|"moderate"|"severe">, "description": "<based on actual smoothness mesh>" },
      { "category": "brownSpots", "label": "Brown Spots", "absoluteScore": <1.0-5.0>, "peerScore": <-3.0 to +3.0>, "severity": <"mild"|"moderate"|"severe">, "description": "<based on actual hyperpigmentation map>" },
      { "category": "redAreas", "label": "Red Areas", "absoluteScore": <1.0-5.0>, "peerScore": <-3.0 to +3.0>, "severity": <"mild"|"moderate"|"severe">, "description": "<based on actual redness map>" },
      { "category": "pores", "label": "Pores", "absoluteScore": <1.0-5.0>, "peerScore": <-3.0 to +3.0>, "severity": <"mild"|"moderate"|"severe">, "description": "<based on actual pore analysis>" }
    ],
    "compositeSkinScore": <weighted average>,
    "scoringMode": "absolute"
  },
  "zoneAnalysis": [
    {
      "zone": <FacialZone>,
      "zoneName": "<display name>",
      "overallScore": <0-100>,
      "skinAge": <number>,
      "concerns": [{ "type": "<concern>", "severity": <0-100>, "treatmentPriority": <1-5> }],
      "recommendations": ["<treatment>"]
    }
  ],
  "detectedConcerns": [
    {
      "id": "<concern_type_N>",
      "concern": <"wrinkles"|"volume_loss"|"acne"|"scarring"|"pigmentation"|"redness"|"texture"|"pores"|"laxity"|"double_chin"|"dark_circles"|"lip_enhancement"|"neck_chest_aging">,
      "severity": <"mild"|"moderate"|"severe">,
      "score": <0-100>,
      "zones": [<FacialZone strings>],
      "trending": <"improving"|"stable"|"worsening">,
      "urgency": <"low"|"medium"|"high">,
      "description": "<warm luxury brand voice>",
      "clinicalNote": "<clinical terminology for provider>"
    }
  ],
  "predictiveMetrics": {
    "withoutIntervention": {
      "sixMonths": { "auraScore": <N>, "skinAge": <N>, "topConcerns": [<strings>], "newConcernsEmerging": [<strings>] },
      "oneYear": { "auraScore": <N>, "skinAge": <N>, "topConcerns": [<strings>], "newConcernsEmerging": [<strings>] },
      "threeYears": { "auraScore": <N>, "skinAge": <N>, "topConcerns": [<strings>], "newConcernsEmerging": [<strings>] },
      "fiveYears": { "auraScore": <N>, "skinAge": <N>, "topConcerns": [<strings>], "newConcernsEmerging": [<strings>] }
    },
    "withTreatment": {
      "threeMonths": { "auraScore": <N>, "skinAge": <N>, "topConcerns": [<strings>], "newConcernsEmerging": [] },
      "sixMonths": { "auraScore": <N>, "skinAge": <N>, "topConcerns": [<strings>], "newConcernsEmerging": [] },
      "oneYear": { "auraScore": <N>, "skinAge": <N>, "topConcerns": [<strings>], "newConcernsEmerging": [] }
    },
    "riskFactors": [{ "factor": "<name>", "impact": <"low"|"medium"|"high">, "description": "<explanation>" }]
  },
  "treatmentReadiness": {
    "readyForTreatment": <boolean>,
    "requiredPrep": [<strings>],
    "seasonalConsiderations": [<strings>],
    "skinBarrierStatus": <"compromised"|"adequate"|"strong">
  },
  "skinAnalysis": {
    "fitzpatrickType": <1-6>,
    "fitzpatrickDescription": "<description>",
    "glogauScale": <1-4>,
    "glogauDescription": "<description>",
    "skinHealthScore": {
      "overall": <0-100>,
      "dimensions": { "hydration": <0-100>, "elasticity": <0-100>, "texture": <0-100>, "tone": <0-100>, "clarity": <0-100>, "firmness": <0-100>, "radiance": <0-100>, "protection": <0-100> }
    },
    "agingPatterns": [{ "type": <"expression_lines"|"gravity"|"volume_loss"|"sun_damage">, "severity": <"mild"|"moderate"|"advanced">, "areas": [<strings>], "recommendedTreatments": [<strings>] }],
    "treatmentPriority": [{ "rank": <N>, "concern": <SkinConcern>, "urgency": <"high"|"medium"|"low">, "recommendedTreatment": "<treatment>", "rationale": "<rationale>" }],
    "skincareRoutine": { "morning": [], "evening": [], "weekly": [] },
    "benchmarkComparison": { "ageGroup": "<e.g. 40s>", "percentile": <0-100>, "areasBetterThanPeers": [<strings>], "areasForImprovement": [<strings>] }
  },
  "medicalFlags": [{ "flag": "<description>", "severity": <"info"|"warning"|"critical">, "action": "<recommended action>", "relatedTreatments": [<strings>] }]
}

ZONE OPTIONS: "forehead", "glabella", "periorbital_left", "periorbital_right", "temples_left", "temples_right", "cheeks_left", "cheeks_right", "nasolabial_left", "nasolabial_right", "lips", "marionette_left", "marionette_right", "jawline", "chin", "neck", "decolletage"

Include at least 6-8 zones (you have detailed scanner data for each).
Include 3-6 detected concerns ranked by severity — base these on ACTUAL scanner findings.
Include 2-4 risk factors.

Return ONLY the JSON object. No markdown, no code fences.`;
}

// ── MAIN EXPORT ──

/**
 * Run AI-powered Aura Scan using ACTUAL Hexagon Aura 3D device images.
 *
 * Sends multiple diagnostic images (front, brown areas, red areas, wrinkles,
 * pores, smoothness, distances) to Claude for comprehensive multi-modal analysis.
 *
 * Falls back to rule-based scan if Claude API fails.
 */
export async function runAIAuraScanWithDevice(
  deviceScan: AuraDeviceScan,
  intakeData: Partial<ConsultationFormData>
): Promise<AuraScanResult> {
  const scanId = `aura_device_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const startTime = Date.now();

  // Guard: no API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(`${LOG_PREFIX} ANTHROPIC_API_KEY not set — falling back to rule-based scan`);
    return fallbackScan(intakeData, scanId);
  }

  try {
    console.info(`${LOG_PREFIX} Starting device-image AI analysis (scan ${scanId})`);
    console.info(`${LOG_PREFIX} Patient: ${deviceScan.patientName}, Date: ${deviceScan.scanDate}`);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build the content blocks — images first, then the text prompt
    const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];

    // Helper to add an image block
    const addImage = (dataUrl: string, label: string) => {
      if (!dataUrl || !dataUrl.startsWith('data:image/')) return;
      const { base64, mediaType } = parseDataUrl(dataUrl);
      contentBlocks.push({
        type: 'text',
        text: `[${label}]`,
      });
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp',
          data: base64,
        },
      });
    };

    // Add core diagnostic images in order
    addImage(deviceScan.images.front, 'FRONT VIEW — Base 3D Render');
    addImage(deviceScan.images.brownAreas, 'BROWN AREAS — Hyperpigmentation Heat Map');
    addImage(deviceScan.images.redAreas, 'RED AREAS — Vascular/Redness Map');
    addImage(deviceScan.images.wrinkles, 'WRINKLES — Depth Overlay');
    addImage(deviceScan.images.pores, 'PORES — Pore Analysis');
    addImage(deviceScan.images.smoothness, 'SMOOTHNESS — Wireframe Texture Mesh');

    // Add optional measurement images
    if (deviceScan.images.distancesFront) {
      addImage(deviceScan.images.distancesFront, 'DISTANCES (Front) — Facial Measurements in mm');
    }
    if (deviceScan.images.distancesRight) {
      addImage(deviceScan.images.distancesRight, 'DISTANCES (Right) — Side Measurements in mm');
    }
    if (deviceScan.images.anglesLeft) {
      addImage(deviceScan.images.anglesLeft, 'ANGLES (Left) — Facial Angles in Degrees');
    }
    if (deviceScan.images.anglesRight) {
      addImage(deviceScan.images.anglesRight, 'ANGLES (Right) — Profile Angles in Degrees');
    }

    // Add the overview if available
    if (deviceScan.images.overview) {
      addImage(deviceScan.images.overview, 'OVERVIEW — Combined Skin Type Analysis');
    }

    const imageCount = contentBlocks.filter((b) => b.type === 'image').length;
    console.info(`${LOG_PREFIX} Sending ${imageCount} scanner images to Claude`);

    // Add the analysis prompt as the final text block
    contentBlocks.push({
      type: 'text',
      text: buildDeviceAnalysisPrompt(intakeData),
    });

    // Call Claude
    const response = await Promise.race([
      anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: MAX_TOKENS,
        system: buildDeviceScanSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: contentBlocks,
          },
        ],
      }),
      createTimeout(REQUEST_TIMEOUT_MS),
    ]);

    const latency = Date.now() - startTime;
    console.info(`${LOG_PREFIX} Claude response received in ${latency}ms (${imageCount} images analyzed)`);

    // Extract text content
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text content in Claude response');
    }

    // Parse JSON
    const rawJson = extractJson(textBlock.text);
    const parsed = JSON.parse(rawJson);

    // Assemble validated result
    const result = assembleResult(parsed, scanId);

    console.info(
      `${LOG_PREFIX} Device scan analysis complete: score=${result.auraScore.overall}/100 ` +
      `(${result.auraScore.grade}), skinAge=${result.auraScore.skinAge}, ` +
      `concerns=${result.detectedConcerns.length}, images=${imageCount}, latency=${latency}ms`
    );

    return result;
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error(
      `${LOG_PREFIX} Device AI analysis failed after ${latency}ms — falling back:`,
      error instanceof Error ? error.message : error
    );

    return fallbackScan(intakeData, scanId);
  }
}

// ── RESPONSE ASSEMBLY ──

function assembleResult(
  parsed: Record<string, unknown>,
  scanId: string
): AuraScanResult {
  const raw = parsed as Record<string, any>;

  return {
    scanId,
    timestamp: new Date().toISOString(),
    auraScore: validateAuraScore(raw.auraScore || {}),
    auraDeviceAnalysis: validateDeviceAnalysis(raw.auraDeviceAnalysis || {}),
    zoneAnalysis: validateZoneAnalysis(raw.zoneAnalysis || []),
    detectedConcerns: validateConcerns(raw.detectedConcerns || []),
    predictiveMetrics: validatePredictiveMetrics(raw.predictiveMetrics || {}),
    treatmentReadiness: validateTreatmentReadiness(raw.treatmentReadiness || {}),
    skinAnalysis: validateSkinAnalysis(raw.skinAnalysis || {}),
    medicalFlags: validateMedicalFlags(raw.medicalFlags || []),
  };
}

// ── VALIDATION HELPERS ──
// (Mirrors the validation from ai-aura-scan.ts to ensure type safety)

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function scoreToGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function gradeToLabel(grade: string): string {
  const map: Record<string, string> = {
    'A+': 'Exceptional',
    A: 'Excellent',
    B: 'Good',
    C: 'Fair',
    D: 'Needs Attention',
    F: 'Requires Intervention',
  };
  return map[grade] || 'Fair';
}

function validateAuraScore(raw: Record<string, any>) {
  const overall = clamp(raw.overall ?? 65, 0, 100);
  const validGrades = ['A+', 'A', 'B', 'C', 'D', 'F'] as const;
  const grade = validGrades.includes(raw.grade) ? raw.grade : scoreToGrade(overall);
  const validLabels = ['Exceptional', 'Excellent', 'Good', 'Fair', 'Needs Attention', 'Requires Intervention'];
  const label = validLabels.includes(raw.label) ? raw.label : gradeToLabel(grade);

  const breakdown = {
    hydration: clamp(Math.round(raw.breakdown?.hydration ?? 60), 0, 100),
    elasticity: clamp(Math.round(raw.breakdown?.elasticity ?? 60), 0, 100),
    texture: clamp(Math.round(raw.breakdown?.texture ?? 60), 0, 100),
    tone: clamp(Math.round(raw.breakdown?.tone ?? 60), 0, 100),
    clarity: clamp(Math.round(raw.breakdown?.clarity ?? 60), 0, 100),
    firmness: clamp(Math.round(raw.breakdown?.firmness ?? 60), 0, 100),
    radiance: clamp(Math.round(raw.breakdown?.radiance ?? 60), 0, 100),
    protection: clamp(Math.round(raw.breakdown?.protection ?? 60), 0, 100),
  };

  const skinAge = Math.round(raw.skinAge ?? 40);
  const chronologicalAge = Math.round(raw.chronologicalAge ?? 35);

  return {
    overall: Math.round(overall),
    grade: grade as 'A+' | 'A' | 'B' | 'C' | 'D' | 'F',
    label,
    breakdown,
    skinAge,
    chronologicalAge,
    skinAgeDelta: skinAge - chronologicalAge,
    percentile: clamp(Math.round(raw.percentile ?? 50), 0, 100),
  };
}

function validateDeviceAnalysis(raw: Record<string, any>) {
  type SkinCat = 'wrinkles' | 'texture' | 'brownSpots' | 'redAreas' | 'pores';
  const validCategories: SkinCat[] = ['wrinkles', 'texture', 'brownSpots', 'redAreas', 'pores'];
  const rawCategories: any[] = Array.isArray(raw.categories) ? raw.categories : [];

  const labelMap: Record<string, string> = {
    wrinkles: 'Wrinkles',
    texture: 'Texture',
    brownSpots: 'Brown Spots',
    redAreas: 'Red Areas',
    pores: 'Pores',
  };

  const categories = validCategories.map((cat) => {
    const found = rawCategories.find((c: any) => c?.category === cat) || {};
    const validSev = ['mild', 'moderate', 'severe'] as const;
    return {
      category: cat,
      label: found.label || labelMap[cat] || cat,
      absoluteScore: clamp(Number(found.absoluteScore) || 2.0, 1.0, 5.0),
      peerScore: clamp(Number(found.peerScore) || 0, -3.0, 3.0),
      severity: (validSev.includes(found.severity) ? found.severity : 'mild') as 'mild' | 'moderate' | 'severe',
      description: String(found.description || `${labelMap[cat]} analysis from 3D scan.`),
    };
  });

  const composite =
    Number(raw.compositeSkinScore) ||
    categories.reduce((sum, c) => sum + c.absoluteScore, 0) / categories.length;

  return {
    categories,
    compositeSkinScore: Math.round(composite * 10) / 10,
    scoringMode: 'absolute' as const,
  };
}

function validateZoneAnalysis(raw: any[]) {
  const validZones = [
    'forehead', 'glabella', 'periorbital_left', 'periorbital_right',
    'temples_left', 'temples_right', 'cheeks_left', 'cheeks_right',
    'nasolabial_left', 'nasolabial_right', 'lips', 'marionette_left',
    'marionette_right', 'jawline', 'chin', 'neck', 'decolletage',
  ];

  if (!Array.isArray(raw) || raw.length === 0) {
    // Return minimal default zones
    return ['forehead', 'cheeks_left', 'cheeks_right', 'jawline'].map((z) => ({
      zone: z as any,
      zoneName: z.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      overallScore: 60,
      skinAge: 40,
      concerns: [],
      recommendations: [],
    }));
  }

  return raw
    .filter((z: any) => z && validZones.includes(z.zone))
    .map((z: any) => ({
      zone: z.zone,
      zoneName: String(z.zoneName || z.zone),
      overallScore: clamp(Math.round(z.overallScore ?? 60), 0, 100),
      skinAge: Math.round(z.skinAge ?? 40),
      concerns: Array.isArray(z.concerns)
        ? z.concerns.map((c: any) => ({
            type: String(c.type || 'unknown'),
            severity: clamp(Number(c.severity) || 30, 0, 100),
            treatmentPriority: clamp(Math.round(c.treatmentPriority ?? 3), 1, 5),
          }))
        : [],
      recommendations: Array.isArray(z.recommendations) ? z.recommendations.map(String) : [],
    }));
}

function validateConcerns(raw: any[]) {
  if (!Array.isArray(raw)) return [];

  const validConcerns = [
    'wrinkles', 'volume_loss', 'acne', 'scarring', 'pigmentation',
    'redness', 'texture', 'pores', 'laxity', 'double_chin',
    'dark_circles', 'lip_enhancement', 'neck_chest_aging',
  ];
  const validSev = ['mild', 'moderate', 'severe'];
  const validTrending = ['improving', 'stable', 'worsening'];
  const validUrgency = ['low', 'medium', 'high'];

  return raw
    .filter((c: any) => c && validConcerns.includes(c.concern))
    .map((c: any) => ({
      id: String(c.id || `concern_${c.concern}_${Math.random().toString(36).slice(2, 5)}`),
      concern: c.concern,
      severity: (validSev.includes(c.severity) ? c.severity : 'mild') as any,
      score: clamp(Math.round(c.score ?? 40), 0, 100),
      zones: Array.isArray(c.zones) ? c.zones : [],
      trending: (validTrending.includes(c.trending) ? c.trending : 'stable') as any,
      urgency: (validUrgency.includes(c.urgency) ? c.urgency : 'medium') as any,
      description: String(c.description || ''),
      clinicalNote: String(c.clinicalNote || ''),
    }));
}

function validatePredictiveMetrics(raw: Record<string, any>) {
  const defaultState = { auraScore: 60, skinAge: 40, topConcerns: [], newConcernsEmerging: [] };
  const validateState = (s: any) => ({
    auraScore: clamp(Math.round(s?.auraScore ?? 60), 0, 100),
    skinAge: Math.round(s?.skinAge ?? 40),
    topConcerns: Array.isArray(s?.topConcerns) ? s.topConcerns.map(String) : [],
    newConcernsEmerging: Array.isArray(s?.newConcernsEmerging) ? s.newConcernsEmerging.map(String) : [],
  });

  return {
    withoutIntervention: {
      sixMonths: validateState(raw.withoutIntervention?.sixMonths || defaultState),
      oneYear: validateState(raw.withoutIntervention?.oneYear || defaultState),
      threeYears: validateState(raw.withoutIntervention?.threeYears || defaultState),
      fiveYears: validateState(raw.withoutIntervention?.fiveYears || defaultState),
    },
    withTreatment: {
      threeMonths: validateState(raw.withTreatment?.threeMonths || defaultState),
      sixMonths: validateState(raw.withTreatment?.sixMonths || defaultState),
      oneYear: validateState(raw.withTreatment?.oneYear || defaultState),
    },
    riskFactors: Array.isArray(raw.riskFactors)
      ? raw.riskFactors.map((r: any) => ({
          factor: String(r.factor || ''),
          impact: ['low', 'medium', 'high'].includes(r.impact) ? r.impact : 'medium',
          description: String(r.description || ''),
        }))
      : [],
  };
}

function validateTreatmentReadiness(raw: Record<string, any>) {
  const validBarrier = ['compromised', 'adequate', 'strong'];
  return {
    readyForTreatment: raw.readyForTreatment !== false,
    requiredPrep: Array.isArray(raw.requiredPrep) ? raw.requiredPrep.map(String) : [],
    seasonalConsiderations: Array.isArray(raw.seasonalConsiderations) ? raw.seasonalConsiderations.map(String) : [],
    skinBarrierStatus: (validBarrier.includes(raw.skinBarrierStatus) ? raw.skinBarrierStatus : 'adequate') as any,
  };
}

function validateSkinAnalysis(raw: Record<string, any>) {
  const dims = raw.skinHealthScore?.dimensions || {};
  return {
    fitzpatrickType: clamp(Math.round(raw.fitzpatrickType ?? 3), 1, 6) as any,
    fitzpatrickDescription: String(raw.fitzpatrickDescription || 'Type III'),
    glogauScale: clamp(Math.round(raw.glogauScale ?? 2), 1, 4) as any,
    glogauDescription: String(raw.glogauDescription || 'Type II'),
    skinHealthScore: {
      overall: clamp(Math.round(raw.skinHealthScore?.overall ?? 65), 0, 100),
      dimensions: {
        hydration: clamp(Math.round(dims.hydration ?? 60), 0, 100),
        elasticity: clamp(Math.round(dims.elasticity ?? 60), 0, 100),
        texture: clamp(Math.round(dims.texture ?? 60), 0, 100),
        tone: clamp(Math.round(dims.tone ?? 60), 0, 100),
        clarity: clamp(Math.round(dims.clarity ?? 60), 0, 100),
        firmness: clamp(Math.round(dims.firmness ?? 60), 0, 100),
        radiance: clamp(Math.round(dims.radiance ?? 60), 0, 100),
        protection: clamp(Math.round(dims.protection ?? 60), 0, 100),
      },
    },
    agingPatterns: Array.isArray(raw.agingPatterns)
      ? raw.agingPatterns.map((p: any) => ({
          type: p.type || 'expression_lines',
          severity: ['mild', 'moderate', 'advanced'].includes(p.severity) ? p.severity : 'mild',
          areas: Array.isArray(p.areas) ? p.areas.map(String) : [],
          recommendedTreatments: Array.isArray(p.recommendedTreatments) ? p.recommendedTreatments.map(String) : [],
        }))
      : [],
    treatmentPriority: Array.isArray(raw.treatmentPriority)
      ? raw.treatmentPriority.map((t: any) => ({
          rank: Number(t.rank) || 1,
          concern: t.concern || 'wrinkles',
          urgency: ['high', 'medium', 'low'].includes(t.urgency) ? t.urgency : 'medium',
          recommendedTreatment: String(t.recommendedTreatment || ''),
          rationale: String(t.rationale || ''),
        }))
      : [],
    skincareRoutine: {
      morning: Array.isArray(raw.skincareRoutine?.morning) ? raw.skincareRoutine.morning : [],
      evening: Array.isArray(raw.skincareRoutine?.evening) ? raw.skincareRoutine.evening : [],
      weekly: Array.isArray(raw.skincareRoutine?.weekly) ? raw.skincareRoutine.weekly : [],
    },
    benchmarkComparison: {
      ageGroup: String(raw.benchmarkComparison?.ageGroup || '30s-40s'),
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

function validateMedicalFlags(raw: any[]) {
  if (!Array.isArray(raw)) return [];
  return raw.map((f: any) => ({
    flag: String(f.flag || ''),
    severity: ['info', 'warning', 'critical'].includes(f.severity) ? f.severity : 'info',
    action: String(f.action || ''),
    relatedTreatments: Array.isArray(f.relatedTreatments) ? f.relatedTreatments.map(String) : [],
  }));
}

// ── UTILITY HELPERS ──

function calculateAge(dob: string | undefined): number {
  if (!dob) return 35; // default assumption
  try {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(18, Math.min(100, age));
  } catch {
    return 35;
  }
}

function parseDataUrl(dataUrl: string): { base64: string; mediaType: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL format');
  }
  return { mediaType: match[1], base64: match[2] };
}

function extractJson(text: string): string {
  // Try to find JSON in the response — strip markdown fences if present
  let cleaned = text.trim();

  // Remove markdown code fences
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  // Find the first { and last } to extract the JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
  );
}

async function fallbackScan(
  intakeData: Partial<ConsultationFormData>,
  scanId: string
): Promise<AuraScanResult> {
  const result = await runAuraScan(intakeData);
  return { ...result, scanId };
}
