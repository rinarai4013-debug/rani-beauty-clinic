/**
 * AI-Powered Mastermind Plan Generator
 *
 * Uses Claude AI (claude-sonnet-4-20250514) to generate truly personalized
 * treatment plans based on Aura Scan results, intake data, and the full
 * Rani Beauty Clinic service catalog.
 *
 * Falls back to rule-based generator if AI call fails.
 */

import { getAnthropicClient } from '@/lib/ai/client';
import type {
  AuraScanResult,
  MastermindPlan,
  MastermindTreatment,
  TreatmentSequenceItem,
  FacialZone,
} from '@/types/mastermind';
import type { Contraindication } from '@/types/ai-treatment';
import type { ConsultationFormData } from '@/lib/consultation/schema';
import type { UnifiedService } from '@/data/services/unified-catalog';
import type { GeneratedPackage } from '@/lib/plan-builder/types';
import { generateMastermindPlan } from './plan-generator';

// ── Constants ──

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 8192;
const DEFAULT_FINANCING_APR = 0.1499; // 14.99% — Cherry/PatientFi standard
const FINANCING_TERMS = [12, 24] as const;

// ── Amortization ──

/**
 * Calculate monthly payment using proper amortized loan formula.
 * Formula: P * [r(1+r)^n] / [(1+r)^n - 1]
 * where P = principal, r = monthly rate (APR/12), n = number of months
 */
export function calculateMonthlyPayment(
  principal: number,
  apr: number,
  months: number
): number {
  if (principal <= 0 || months <= 0) return 0;
  if (apr <= 0) return Math.round(principal / months);

  const monthlyRate = apr / 12;
  const compoundFactor = Math.pow(1 + monthlyRate, months);
  const payment = principal * (monthlyRate * compoundFactor) / (compoundFactor - 1);

  return Math.round(payment);
}

// ── Catalog Formatter ──

function formatCatalogForPrompt(catalog: UnifiedService[]): string {
  // Group by category for readability
  const grouped = new Map<string, UnifiedService[]>();
  for (const svc of catalog) {
    const list = grouped.get(svc.category) || [];
    list.push(svc);
    grouped.set(svc.category, list);
  }

  const lines: string[] = [];
  for (const [category, services] of grouped) {
    lines.push(`\n### ${category.toUpperCase()}`);
    for (const svc of services) {
      const sessions = svc.sessions > 1 ? ` | ${svc.sessions} sessions recommended` : '';
      const financing = svc.financingEligible ? ' | Financing available' : '';
      const concerns = svc.concerns.length > 0 ? ` | Treats: ${svc.concerns.join(', ')}` : '';
      const areas = svc.bodyAreas.length > 0 ? ` | Areas: ${svc.bodyAreas.join(', ')}` : '';
      lines.push(
        `- **${svc.name}** (ID: ${svc.id}) — $${svc.price}/session, ${svc.duration}min${sessions}${financing}${concerns}${areas}`
      );
      lines.push(`  ${svc.description}`);
    }
  }

  return lines.join('\n');
}

// ── Scan Result Formatter ──

function formatScanForPrompt(scan: AuraScanResult): string {
  const { auraScore, zoneAnalysis, detectedConcerns, predictiveMetrics, treatmentReadiness, skinAnalysis, medicalFlags, auraDeviceAnalysis } = scan;

  const lines: string[] = [
    '## AURA SCORE',
    `Overall: ${auraScore.overall}/100 (${auraScore.grade} — ${auraScore.label})`,
    `Skin Age: ${auraScore.skinAge} (Chronological: ${auraScore.chronologicalAge}, Delta: ${auraScore.skinAgeDelta > 0 ? '+' : ''}${auraScore.skinAgeDelta})`,
    `Percentile: ${auraScore.percentile}th percentile for age/skin type`,
    '',
    '### Score Breakdown (0-100 each):',
    ...Object.entries(auraScore.breakdown).map(([dim, score]) => `- ${dim}: ${score}`),
    '',
    '### AUCA Device Analysis:',
    ...auraDeviceAnalysis.categories.map(c =>
      `- ${c.label}: ${c.absoluteScore.toFixed(1)}/5 (${c.severity}) — ${c.description}`
    ),
    '',
    '## ZONE-BY-ZONE ANALYSIS',
    ...zoneAnalysis.map(z => {
      const concerns = z.concerns.map(c => `${c.type} (severity: ${c.severity}/100, priority: ${c.treatmentPriority})`).join('; ');
      return `- **${z.zoneName}** (${z.zone}): Score ${z.overallScore}/100, Skin Age ${z.skinAge}\n  Concerns: ${concerns}\n  Recs: ${z.recommendations.join(', ')}`;
    }),
    '',
    '## DETECTED CONCERNS',
    ...detectedConcerns.map(c =>
      `- **${c.concern}** (${c.severity}, score ${c.score}/100, urgency: ${c.urgency}, trending: ${c.trending})\n  Zones: ${c.zones.join(', ')}\n  Clinical: ${c.clinicalNote}`
    ),
    '',
    '## PREDICTIVE METRICS',
    `Without treatment at 6mo: Aura ${predictiveMetrics.withoutIntervention.sixMonths.auraScore}, Skin Age ${predictiveMetrics.withoutIntervention.sixMonths.skinAge}`,
    `Without treatment at 1yr: Aura ${predictiveMetrics.withoutIntervention.oneYear.auraScore}, Skin Age ${predictiveMetrics.withoutIntervention.oneYear.skinAge}`,
    `With treatment at 3mo: Aura ${predictiveMetrics.withTreatment.threeMonths.auraScore}, Skin Age ${predictiveMetrics.withTreatment.threeMonths.skinAge}`,
    `With treatment at 6mo: Aura ${predictiveMetrics.withTreatment.sixMonths.auraScore}, Skin Age ${predictiveMetrics.withTreatment.sixMonths.skinAge}`,
    `With treatment at 1yr: Aura ${predictiveMetrics.withTreatment.oneYear.auraScore}, Skin Age ${predictiveMetrics.withTreatment.oneYear.skinAge}`,
    '',
    'Risk factors: ' + predictiveMetrics.riskFactors.map(r => `${r.factor} (${r.impact}): ${r.description}`).join('; '),
    '',
    '## TREATMENT READINESS',
    `Ready: ${treatmentReadiness.readyForTreatment}`,
    `Skin barrier: ${treatmentReadiness.skinBarrierStatus}`,
    treatmentReadiness.requiredPrep.length > 0 ? `Required prep: ${treatmentReadiness.requiredPrep.join(', ')}` : '',
    treatmentReadiness.seasonalConsiderations.length > 0 ? `Seasonal notes: ${treatmentReadiness.seasonalConsiderations.join(', ')}` : '',
    '',
    '## SKIN ANALYSIS',
    `Fitzpatrick Type: ${skinAnalysis.fitzpatrickType} — ${skinAnalysis.fitzpatrickDescription}`,
    `Glogau Scale: ${skinAnalysis.glogauScale} — ${skinAnalysis.glogauDescription}`,
  ];

  if (medicalFlags.length > 0) {
    lines.push('', '## MEDICAL FLAGS');
    medicalFlags.forEach(f => lines.push(`- ${JSON.stringify(f)}`));
  }

  return lines.filter(l => l !== undefined).join('\n');
}

// ── Intake Formatter ──

function formatIntakeForPrompt(intake: Partial<ConsultationFormData>): string {
  const lines: string[] = [
    '## PATIENT INTAKE DATA',
    intake.firstName ? `Name: ${intake.firstName} ${intake.lastName || ''}`.trim() : '',
    intake.dob ? `DOB: ${intake.dob}` : '',
    intake.skinConcerns ? `Skin Concerns: ${(intake.skinConcerns as string[]).join(', ')}` : '',
    intake.targetAreas ? `Target Areas: ${(intake.targetAreas as string[]).join(', ')}` : '',
    intake.treatmentInterests ? `Treatment Interests: ${(intake.treatmentInterests as string[]).join(', ')}` : '',
    intake.skinType ? `Skin Type: ${intake.skinType}` : '',
    intake.treatmentHistory ? `Treatment History: ${intake.treatmentHistory}` : '',
    intake.goals ? `Goals: ${intake.goals}` : '',
    intake.timeline ? `Timeline Preference: ${intake.timeline}` : '',
    intake.budget ? `Budget Range: ${intake.budget}` : '',
    '',
    '### Medical History:',
    `Pregnant: ${intake.pregnant ? 'YES' : 'No'}`,
    `Breastfeeding: ${intake.breastfeeding ? 'YES' : 'No'}`,
    `Blood Thinners: ${intake.bloodThinners ? 'YES' : 'No'}`,
    `Keloid History: ${intake.keloidHistory ? 'YES' : 'No'}`,
    `Active Skin Infection: ${intake.activeSkinInfection ? 'YES' : 'No'}`,
    `Recent Sun Exposure: ${intake.recentSunExposure ? 'YES' : 'No'}`,
    `Isotretinoin (Accutane) History: ${intake.isotretinoinHistory ? 'YES' : 'No'}`,
    intake.isotretinoinEndDate ? `Isotretinoin End Date: ${intake.isotretinoinEndDate}` : '',
    `Autoimmune Condition: ${intake.hasAutoimmune ? 'YES' : 'No'}`,
    `Sun Protection Habit: ${intake.sunProtectionHabit || 'unknown'}`,
    `Smoking Status: ${intake.smokingStatus || 'unknown'}`,
  ];

  return lines.filter(l => l !== '').join('\n');
}

// ── System Prompt ──

function buildSystemPrompt(): string {
  return `You are the Rani Beauty Clinic Mastermind AI — a clinical aesthetics expert generating personalized treatment plans. You combine deep knowledge of medical aesthetics, skin biology, and treatment synergies to create optimal plans.

CRITICAL RULES:
- Rani Beauty Clinic does IM INJECTIONS only. NEVER use the word "infusion." Always say "injection."
- Brand voice for patient-facing text: luxury, confident, clinically-assured, educational + aspirational. "Your personalized journey..." not "treatment list."
- Provider-facing text: clinical, precise, evidence-based. Use proper medical terminology.
- Only recommend treatments from the provided service catalog with EXACT prices.
- Never invent treatments or prices that aren't in the catalog.
- Consider all contraindications and medical flags seriously.
- If a patient is pregnant or breastfeeding, exclude injectables, lasers, chemical peels, and RF microneedling.
- If isotretinoin was used within 6 months, exclude lasers, peels, and microneedling.

AFTERCARE MUST BE TREATMENT-SPECIFIC (not generic):
- Botox: Don't lie down for 4 hours, no rubbing injection sites, no strenuous exercise for 24 hours, results in 3-5 days, full effect at 14 days.
- Dermal Fillers: Apply ice gently, no exercise for 24 hours, sleep face-up first night, avoid facials for 2 weeks, mild swelling 1-3 days normal.
- RF Microneedling: No active skincare ingredients (retinoids, AHAs, vitamin C) for 72 hours, no makeup for 24 hours, no sun for 72 hours, redness resolves in 2-3 days.
- Chemical Peels (VI Peel): Don't wash face for 4 hours after, no picking peeling skin, no retinoids for 10 days, no sun for 7 days, peeling days 3-7.
- BioRePeel: Zero downtime, no retinoids for 3 days, SPF 30+ daily.
- PRX-T33: No retinoids for 3-5 days, keep hydrated, SPF daily.
- Sofwave: Mild redness a few hours, no excessive heat for 24 hours, results develop over 3-6 months.
- Laser treatments: Avoid sun 2 weeks, no retinoids for 7 days, redness 3-5 days.
- HydraFacial: No makeup for 6 hours, no harsh products for 48 hours.
- Wellness Injections: Continue hydrating, mild injection site soreness normal.

FINANCING:
- Use amortized payment formula: monthlyPayment = principal * (rate * (1+rate)^months) / ((1+rate)^months - 1)
- Standard APR: 14.99%
- Offer 12-month and 24-month terms
- Only for packages over $500

You MUST respond with valid JSON matching the exact schema specified in the user prompt.`;
}

// ── Response Schema Definition (sent in user prompt) ──

function getResponseSchemaDescription(): string {
  return `
RESPOND WITH VALID JSON ONLY. No markdown, no code fences, no explanation outside the JSON.

The JSON must match this exact structure:

{
  "recommendations": {
    "primary": [TreatmentObject, ...],      // Essential treatments (1-3)
    "complementary": [TreatmentObject, ...], // Synergistic treatments (1-3)
    "maintenance": [TreatmentObject, ...]    // Long-term treatments (1-3)
  },
  "sequencing": [SequenceObject, ...],
  "packages": [
    { "tier": "Start", ... },
    { "tier": "Transform", ... },
    { "tier": "Elite", ... }
  ],
  "aftercarePreview": [AftercareObject, ...],
  "aiSummary": {
    "patientFacing": "string (warm luxury voice, 2-4 sentences, personalized)",
    "providerFacing": "string (clinical precision, 2-4 sentences)",
    "keyHighlights": ["string", "string", "string", "string"],
    "addressedConcerns": [
      { "concern": "string", "solution": "string", "timeline": "string" }
    ]
  },
  "contraindications": [ContraindicationObject, ...]
}

TreatmentObject:
{
  "id": "tx_<serviceId>",
  "treatmentName": "string (from catalog)",
  "category": "string (from catalog)",
  "targetConcerns": ["string", ...],
  "targetZones": ["forehead" | "glabella" | "periorbital_left" | "periorbital_right" | "temples_left" | "temples_right" | "cheeks_left" | "cheeks_right" | "nasolabial_left" | "nasolabial_right" | "lips" | "marionette_left" | "marionette_right" | "jawline" | "chin" | "neck" | "decolletage"],
  "sessionsRequired": number,
  "intervalBetweenSessions": "string",
  "expectedImprovement": "string (specific, not generic)",
  "timeToResults": "string",
  "longevity": "string",
  "perSession": number (exact catalog price),
  "totalEstimate": number (perSession * sessionsRequired),
  "priority": "essential" | "recommended" | "optional",
  "urgency": "immediate" | "within-3-months" | "when-ready",
  "downtime": "string",
  "riskLevel": "minimal" | "low" | "moderate",
  "contraindications": ["string", ...],
  "synergiesWith": ["tx_<otherId>", ...],
  "aiConfidence": number (0-100),
  "aiReasoning": "string (patient-facing, warm, explains WHY this treatment for THIS patient)",
  "clinicalRationale": "string (provider-facing, precise, references zone analysis data)"
}

SequenceObject:
{
  "phase": 1 | 2 | 3,
  "phaseName": "string",
  "duration": "string (e.g. '0-2 weeks')",
  "treatments": [{ "treatmentId": "tx_<id>", "week": number, "sessionNumber": number }],
  "expectedMilestone": "string"
}

Package (3 tiers required):
{
  "tier": "Start" | "Transform" | "Elite",
  "name": "string (creative name)",
  "subtitle": "string",
  "price": number (discounted total),
  "originalPrice": number (sum of all line items at full price),
  "discount": number (percentage, Start: 5-8%, Transform: 12-15%, Elite: 15-20%),
  "sessions": number (total sessions across all treatments),
  "lineItems": [{ "service": "string", "qty": number, "unitPrice": number, "total": number }],
  "monthlyPayment12": number (amortized at 14.99% APR over 12 months),
  "monthlyPayment24": number (amortized at 14.99% APR over 24 months),
  "highlighted": boolean (true ONLY for Transform),
  "extras": ["string", ...],
  "bestFor": "string",
  "resultIntensity": "string",
  "concernsAddressed": ["string", ...],
  "whyBest": "string (only for Transform tier — explain why it's the best value)",
  "savingsVsStandalone": number (originalPrice - price)
}

AftercareObject:
{
  "treatmentId": "tx_<id>",
  "immediateAftercare": ["string", ...] (treatment-specific, NOT generic),
  "weekOneGuidance": ["string", ...],
  "productsRecommended": [{ "product": "string", "reason": "string" }]
}

ContraindicationObject:
{
  "treatment": "string",
  "reason": "string",
  "severity": "absolute" | "relative" | "caution",
  "medicalFactor": "string",
  "recommendation": "string"
}`;
}

// ── AI Call ──

async function callClaudeForPlan(
  scanResult: AuraScanResult,
  intakeData: Partial<ConsultationFormData>,
  catalog: UnifiedService[]
): Promise<string> {
  const client = getAnthropicClient();

  const userPrompt = `Generate a personalized Mastermind treatment plan for this patient.

${formatScanForPrompt(scanResult)}

${formatIntakeForPrompt(intakeData)}

## RANI BEAUTY CLINIC — COMPLETE SERVICE CATALOG (use EXACT prices)
${formatCatalogForPrompt(catalog)}

## INSTRUCTIONS
1. Analyze the patient's Aura Score breakdown, zone analysis, and detected concerns.
2. Cross-reference with their stated goals, concerns, treatment interests, budget, and timeline.
3. Check all medical flags and contraindications — exclude treatments that are unsafe.
4. Select the optimal combination of treatments from the catalog above.
5. Create 3 package tiers:
   - "Start": Essential treatments only (the minimum to address top 1-2 concerns)
   - "Transform": Primary + complementary treatments (addresses all major concerns with synergistic combinations)
   - "Elite": Everything in Transform + maintenance + Rx skincare + extra sessions
6. Calculate financing with AMORTIZED payments (not simple division):
   - Formula: monthlyPayment = price * (r * (1+r)^n) / ((1+r)^n - 1) where r = 0.1499/12, n = months
7. Write treatment-specific aftercare (see system prompt for protocols).
8. Write personalized narratives — patient-facing should feel luxurious and caring, provider-facing should be clinically precise.

${getResponseSchemaDescription()}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: buildSystemPrompt(),
    messages: [{ role: 'user', content: userPrompt }],
  });

  // Extract text content from response
  const textBlock = response.content.find(block => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in Claude response');
  }

  return textBlock.text;
}

// ── Response Parser ──

interface AIRawPlan {
  recommendations: {
    primary: AIRawTreatment[];
    complementary: AIRawTreatment[];
    maintenance: AIRawTreatment[];
  };
  sequencing: TreatmentSequenceItem[];
  packages: AIRawPackage[];
  aftercarePreview: {
    treatmentId: string;
    immediateAftercare: string[];
    weekOneGuidance: string[];
    productsRecommended: { product: string; reason: string }[];
  }[];
  aiSummary: {
    patientFacing: string;
    providerFacing: string;
    keyHighlights: string[];
    addressedConcerns: { concern: string; solution: string; timeline: string }[];
  };
  contraindications: Contraindication[];
}

interface AIRawTreatment {
  id: string;
  treatmentName: string;
  category: string;
  targetConcerns: string[];
  targetZones: string[];
  sessionsRequired: number;
  intervalBetweenSessions: string;
  expectedImprovement: string;
  timeToResults: string;
  longevity: string;
  perSession: number;
  totalEstimate: number;
  priority: string;
  urgency: string;
  downtime: string;
  riskLevel: string;
  contraindications: string[];
  synergiesWith: string[];
  aiConfidence: number;
  aiReasoning: string;
  clinicalRationale: string;
}

interface AIRawPackage {
  tier: string;
  name: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  discount: number;
  sessions: number;
  lineItems: { service: string; qty: number; unitPrice: number; total: number }[];
  monthlyPayment12: number;
  monthlyPayment24: number;
  highlighted: boolean;
  extras: string[];
  bestFor: string;
  resultIntensity: string;
  concernsAddressed: string[];
  whyBest?: string;
  savingsVsStandalone: number;
}

const VALID_ZONES = new Set<FacialZone>([
  'forehead', 'glabella', 'periorbital_left', 'periorbital_right',
  'temples_left', 'temples_right', 'cheeks_left', 'cheeks_right',
  'nasolabial_left', 'nasolabial_right', 'lips', 'marionette_left',
  'marionette_right', 'jawline', 'chin', 'neck', 'decolletage',
]);

function sanitizeTreatment(raw: AIRawTreatment): MastermindTreatment {
  const validZones = (raw.targetZones || []).filter(
    (z): z is FacialZone => VALID_ZONES.has(z as FacialZone)
  );

  const priority = ['essential', 'recommended', 'optional'].includes(raw.priority)
    ? (raw.priority as MastermindTreatment['priority'])
    : 'recommended';

  const urgency = ['immediate', 'within-3-months', 'when-ready'].includes(raw.urgency)
    ? (raw.urgency as MastermindTreatment['urgency'])
    : 'within-3-months';

  const riskLevel = ['minimal', 'low', 'moderate'].includes(raw.riskLevel)
    ? (raw.riskLevel as MastermindTreatment['riskLevel'])
    : 'low';

  return {
    id: raw.id || `tx_unknown_${Date.now().toString(36)}`,
    treatmentName: raw.treatmentName || 'Unknown Treatment',
    category: raw.category || 'consultation',
    targetConcerns: raw.targetConcerns || [],
    targetZones: validZones.length > 0 ? validZones : ['forehead'],
    sessionsRequired: Math.max(1, raw.sessionsRequired || 1),
    intervalBetweenSessions: raw.intervalBetweenSessions || 'As needed',
    expectedImprovement: raw.expectedImprovement || 'Improvement expected',
    timeToResults: raw.timeToResults || '2-4 weeks',
    longevity: raw.longevity || '3-6 months',
    perSession: Math.max(0, raw.perSession || 0),
    totalEstimate: Math.max(0, raw.totalEstimate || 0),
    priority,
    urgency,
    downtime: raw.downtime || 'Minimal',
    riskLevel,
    contraindications: raw.contraindications || [],
    synergiesWith: raw.synergiesWith || [],
    aiConfidence: Math.min(100, Math.max(0, raw.aiConfidence || 75)),
    aiReasoning: raw.aiReasoning || '',
    clinicalRationale: raw.clinicalRationale || '',
  };
}

function sanitizePackage(raw: AIRawPackage): GeneratedPackage {
  const tier = (['Start', 'Transform', 'Elite'] as const).find(t => t === raw.tier) || 'Start';

  // Recalculate financing with proper amortization to override any AI arithmetic errors
  const price = Math.max(0, raw.price || 0);
  const monthlyPayment12 = calculateMonthlyPayment(price, DEFAULT_FINANCING_APR, 12);
  const monthlyPayment24 = calculateMonthlyPayment(price, DEFAULT_FINANCING_APR, 24);

  return {
    tier,
    name: raw.name || `${tier} Package`,
    subtitle: raw.subtitle || '',
    price,
    originalPrice: Math.max(price, raw.originalPrice || price),
    discount: Math.min(50, Math.max(0, raw.discount || 0)),
    sessions: Math.max(1, raw.sessions || 1),
    lineItems: (raw.lineItems || []).map(li => ({
      service: li.service || 'Treatment',
      qty: Math.max(1, li.qty || 1),
      unitPrice: Math.max(0, li.unitPrice || 0),
      total: Math.max(0, li.total || 0),
    })),
    monthlyPayment12,
    monthlyPayment24,
    highlighted: tier === 'Transform',
    extras: raw.extras || [],
    bestFor: raw.bestFor || '',
    resultIntensity: raw.resultIntensity || '',
    concernsAddressed: raw.concernsAddressed || [],
    ...(tier === 'Transform' && raw.whyBest ? { whyBest: raw.whyBest } : {}),
    savingsVsStandalone: Math.max(0, raw.savingsVsStandalone || 0),
  };
}

function sanitizeContraindication(raw: Partial<Contraindication>): Contraindication {
  const severity = (['absolute', 'relative', 'caution'] as const).find(s => s === raw.severity) || 'caution';
  return {
    treatment: raw.treatment || 'Unknown',
    reason: raw.reason || 'Review with provider',
    severity,
    medicalFactor: raw.medicalFactor || 'unspecified',
    recommendation: raw.recommendation || 'Discuss with your provider',
  };
}

function parseAIResponse(responseText: string): AIRawPlan {
  // Strip markdown code fences if the model wrapped the JSON
  let cleaned = responseText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '');
  }

  const parsed = JSON.parse(cleaned);

  // Basic shape validation
  if (!parsed.recommendations || !parsed.packages || !parsed.aiSummary) {
    throw new Error('AI response missing required top-level fields');
  }

  return parsed as AIRawPlan;
}

function buildPlanFromAIResponse(raw: AIRawPlan): Omit<MastermindPlan, 'planId' | 'generatedAt'> {
  const recommendations = {
    primary: (raw.recommendations.primary || []).map(sanitizeTreatment),
    complementary: (raw.recommendations.complementary || []).map(sanitizeTreatment),
    maintenance: (raw.recommendations.maintenance || []).map(sanitizeTreatment),
  };

  // Ensure at least one primary treatment
  if (recommendations.primary.length === 0) {
    if (recommendations.complementary.length > 0) {
      recommendations.primary.push(recommendations.complementary.shift()!);
    } else if (recommendations.maintenance.length > 0) {
      recommendations.primary.push(recommendations.maintenance.shift()!);
    }
  }

  // Sanitize sequencing
  const sequencing: TreatmentSequenceItem[] = (raw.sequencing || []).map(seq => ({
    phase: Math.min(3, Math.max(1, seq.phase || 1)),
    phaseName: seq.phaseName || `Phase ${seq.phase}`,
    duration: seq.duration || 'TBD',
    treatments: (seq.treatments || []).map(t => ({
      treatmentId: t.treatmentId || '',
      week: Math.max(1, t.week || 1),
      sessionNumber: Math.max(1, t.sessionNumber || 1),
    })),
    expectedMilestone: seq.expectedMilestone || '',
  }));

  // Sanitize packages — ensure all 3 tiers exist
  const packageMap = new Map<string, GeneratedPackage>();
  for (const pkg of (raw.packages || [])) {
    const sanitized = sanitizePackage(pkg);
    packageMap.set(sanitized.tier, sanitized);
  }

  // Fill missing tiers with sensible defaults based on primary treatments
  const allTreatments = [...recommendations.primary, ...recommendations.complementary, ...recommendations.maintenance];
  for (const tier of ['Start', 'Transform', 'Elite'] as const) {
    if (!packageMap.has(tier)) {
      const price = tier === 'Start' ? 500 : tier === 'Transform' ? 2000 : 4000;
      packageMap.set(tier, {
        tier,
        name: `${tier} Package`,
        subtitle: '',
        price,
        originalPrice: Math.round(price * 1.1),
        discount: 10,
        sessions: allTreatments.length,
        lineItems: [],
        monthlyPayment12: calculateMonthlyPayment(price, DEFAULT_FINANCING_APR, 12),
        monthlyPayment24: calculateMonthlyPayment(price, DEFAULT_FINANCING_APR, 24),
        highlighted: tier === 'Transform',
        extras: [],
        bestFor: '',
        resultIntensity: '',
        concernsAddressed: [],
        savingsVsStandalone: 0,
      });
    }
  }

  const packages = ['Start', 'Transform', 'Elite'].map(tier => packageMap.get(tier)!);

  // Sanitize aftercare
  const aftercarePreview = (raw.aftercarePreview || []).map(ac => ({
    treatmentId: ac.treatmentId || '',
    immediateAftercare: ac.immediateAftercare || [],
    weekOneGuidance: ac.weekOneGuidance || [],
    productsRecommended: (ac.productsRecommended || []).map(p => ({
      product: p.product || '',
      reason: p.reason || '',
    })),
  }));

  // Sanitize AI summary
  const aiSummary = {
    patientFacing: raw.aiSummary.patientFacing || '',
    providerFacing: raw.aiSummary.providerFacing || '',
    keyHighlights: raw.aiSummary.keyHighlights || [],
    addressedConcerns: (raw.aiSummary.addressedConcerns || []).map(ac => ({
      concern: ac.concern || '',
      solution: ac.solution || '',
      timeline: ac.timeline || '',
    })),
  };

  // Sanitize contraindications
  const contraindications = (raw.contraindications || []).map(sanitizeContraindication);

  return {
    recommendations,
    sequencing,
    packages,
    aftercarePreview,
    aiSummary,
    contraindications,
  };
}

// ── Main Export ──

/**
 * Generate a personalized treatment plan using Claude AI.
 *
 * Sends the patient's full Aura Scan, intake data, and the complete
 * Rani service catalog to Claude, which produces a deeply personalized
 * plan with treatment-specific aftercare, proper financing calculations,
 * and luxury brand-voice narratives.
 *
 * Falls back to the rule-based plan-generator.ts if AI fails.
 */
export async function generateAIPlan(
  scanResult: AuraScanResult,
  intakeData: Partial<ConsultationFormData>,
  catalog: UnifiedService[]
): Promise<MastermindPlan> {
  const planId = `plan_ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    // Call Claude AI
    const responseText = await callClaudeForPlan(scanResult, intakeData, catalog);

    // Parse and sanitize the response
    const rawPlan = parseAIResponse(responseText);
    const planData = buildPlanFromAIResponse(rawPlan);

    // Recalculate all package financing server-side for accuracy
    const packages = planData.packages.map(pkg => ({
      ...pkg,
      monthlyPayment12: calculateMonthlyPayment(pkg.price, DEFAULT_FINANCING_APR, 12),
      monthlyPayment24: calculateMonthlyPayment(pkg.price, DEFAULT_FINANCING_APR, 24),
      savingsVsStandalone: Math.max(0, pkg.originalPrice - pkg.price),
    }));

    return {
      planId,
      generatedAt: new Date().toISOString(),
      recommendations: planData.recommendations,
      sequencing: planData.sequencing,
      packages,
      aftercarePreview: planData.aftercarePreview,
      aiSummary: planData.aiSummary,
      contraindications: planData.contraindications,
    };
  } catch (error) {
    console.error('[AI Plan Generator] Claude AI call failed, falling back to rule-based:', error);

    // Fallback to existing rule-based generator
    try {
      const fallbackPlan = generateMastermindPlan(scanResult, intakeData);
      return {
        ...fallbackPlan,
        planId, // Use the AI plan ID to signal it was attempted
      };
    } catch (fallbackError) {
      console.error('[AI Plan Generator] Rule-based fallback also failed:', fallbackError);
      throw new Error(
        `AI plan generation failed: ${error instanceof Error ? error.message : String(error)}. ` +
        `Fallback also failed: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
      );
    }
  }
}
