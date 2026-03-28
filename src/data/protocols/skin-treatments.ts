// ─── Skin Treatment Protocols ────────────────────────────────────────────────
// 15 comprehensive skin treatment protocols for Rani Beauty Clinic
// CRITICAL: "injection" only — never "infusion"

import type { SkinTreatmentProtocol } from './types';

export const SKIN_TREATMENT_PROTOCOLS: SkinTreatmentProtocol[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // HYDRAFACIAL (3 tiers)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'hydrafacial-signature',
    name: 'HydraFacial — Signature',
    category: 'skin-treatment',
    subcategory: 'hydrafacial',
    treatmentArea: 'Full face',
    description: 'The signature HydraFacial experience combining cleansing, exfoliation, extraction, hydration, and antioxidant protection in one seamless treatment. Vortex-Fusion technology delivers instant results with zero downtime.',
    clinicalIndication: 'General skin maintenance, dull complexion, mild congestion, dehydration, first-time facial client',

    steps: [
      { stepNumber: 1, name: 'Cleanse + Peel', duration: 10, description: 'Vortex-Cleansing tip opens pores with gentle exfoliation. GlySal solution (glycolic + salicylic acid) loosens debris and softens the skin surface.', products: ['Activ-4 cleanser', 'GlySal peel solution'] },
      { stepNumber: 2, name: 'Extract + Hydrate', duration: 15, description: 'Painless vortex suction extracts blackheads, sebum, and impurities from pores. Simultaneously, hydrating Beta-HD serum is delivered deep into the skin.', products: ['Beta-HD serum'] },
      { stepNumber: 3, name: 'Fuse + Protect', duration: 10, description: 'Vortex-Fusion delivers antioxidant serum with peptides and hyaluronic acid to nourish and protect newly cleansed skin.', products: ['Antiox+ serum (antioxidants + peptides)'] },
      { stepNumber: 4, name: 'LED Light Therapy', duration: 10, description: 'Red and near-infrared LED light therapy to boost collagen synthesis, reduce inflammation, and enhance treatment results.', products: ['LED device'] },
      { stepNumber: 5, name: 'Moisturize + SPF', duration: 5, description: 'Application of hydrating moisturizer and broad-spectrum SPF to seal in results and protect.', products: ['HydraFacial daily essentials moisturizer', 'SPF 50+'] },
    ],
    totalDuration: 50,
    productsUsed: ['Activ-4', 'GlySal', 'Beta-HD', 'Antiox+', 'LED panel', 'SPF 50+'],

    frequencyRecommendation: 'Every 4 weeks for optimal maintenance',
    seriesProtocol: '3 monthly sessions for initial skin restoration, then monthly maintenance',
    resultsTimeline: 'Immediate glow and hydration; cumulative improvement in skin clarity, tone, and texture over a series of treatments',
    maintenanceSchedule: 'Monthly for ongoing results; can extend to 6–8 weeks for maintenance clients',

    contraindications: [
      'Active rosacea flare (proceed with caution, skip peel)',
      'Active cold sore outbreak',
      'Severe sunburn',
      'Open wounds or abrasions',
      'Allergy to salicylic or glycolic acid',
    ],
    precautions: [
      'Reduce suction intensity for sensitive or rosacea-prone skin',
      'Skip GlySal step for very sensitive skin — use gentler alternative',
      'Avoid if recent aggressive peeling or laser treatment within 2 weeks',
    ],
    potentialComplications: [
      'Mild redness (resolves within 30 minutes)',
      'Temporary tightness',
      'Rare: mild irritation from acid peel step',
    ],
    riskLevel: 'low',

    preCare: [
      'No retinoids for 48 hours before',
      'No facial waxing for 48 hours before',
      'Arrive with clean skin or allow time for makeup removal',
    ],
    aftercare: [
      { timeframe: 'Immediately', instruction: 'Skin may appear flushed — this is normal and resolves quickly', priority: 'recommended' },
      { timeframe: 'First 24 hours', instruction: 'Avoid harsh exfoliants or active ingredients', priority: 'important' },
      { timeframe: 'First 48 hours', instruction: 'Apply SPF 50+ diligently', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Maintain daily SPF and gentle hydrating skincare', priority: 'recommended' },
    ],
    downtime: 'None — "red carpet ready" immediately after',

    consentRequirements: {
      formId: 'CONSENT-FACIAL-001',
      formName: 'Facial Treatment Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: false,
    },
    cptCodes: [
      { code: '97140', description: 'Manual therapy techniques (one or more regions)' },
    ],

    pricing: { min: 225, max: 225, unit: 'per session' },
    sessionDuration: 60,

    tags: ['hydrafacial', 'signature', 'maintenance', 'glow', 'hydration', 'no-downtime'],
    relatedProtocols: ['hydrafacial-deluxe', 'hydrafacial-platinum', 'dermaplaning'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'hydrafacial-deluxe',
    name: 'HydraFacial — Deluxe (with Boosters)',
    category: 'skin-treatment',
    subcategory: 'hydrafacial',
    treatmentArea: 'Full face with targeted booster zones',
    description: 'Enhanced HydraFacial with targeted booster serums customized to the client\'s primary skin concern. Includes lymphatic drainage, dermaplaning add-on, and extended LED therapy for a premium facial experience.',
    clinicalIndication: 'Specific skin concerns (pigmentation, aging, acne), special occasion prep, enhanced results',

    steps: [
      { stepNumber: 1, name: 'Lymphatic Drainage', duration: 8, description: 'Manual lymphatic drainage technique to de-puff, improve circulation, and prepare skin for optimal product absorption.', products: [] },
      { stepNumber: 2, name: 'Dermaplaning', duration: 10, description: 'Gentle blade exfoliation to remove vellus hair (peach fuzz) and surface dead skin cells for smoother texture.', products: ['Surgical blade #10'] },
      { stepNumber: 3, name: 'Cleanse + Peel', duration: 10, description: 'Vortex-Cleansing with GlySal acid peel to loosen debris from freshly dermapraned skin.', products: ['Activ-4', 'GlySal'] },
      { stepNumber: 4, name: 'Extract + Hydrate', duration: 15, description: 'Deep pore extraction via vortex suction with simultaneous hydrating serum delivery.', products: ['Beta-HD'] },
      { stepNumber: 5, name: 'Targeted Booster', duration: 10, description: 'Custom booster serum selected for client concern — Britenol (pigmentation), CTGF (growth factors/aging), or Rozatrol (redness/rosacea).', products: ['Selected booster serum'] },
      { stepNumber: 6, name: 'Fuse + Protect', duration: 8, description: 'Antioxidant and peptide serum infused via Vortex-Fusion.', products: ['Antiox+'] },
      { stepNumber: 7, name: 'Extended LED Therapy', duration: 15, description: 'Extended red + near-infrared LED session for enhanced collagen stimulation and anti-inflammatory benefits.', products: ['LED panel'] },
      { stepNumber: 8, name: 'Finish', duration: 5, description: 'Luxury moisturizer application with targeted eye cream and SPF.', products: ['Moisturizer', 'Eye cream', 'SPF 50+'] },
    ],
    totalDuration: 81,
    productsUsed: ['Activ-4', 'GlySal', 'Beta-HD', 'Selected booster', 'Antiox+', 'LED panel', 'Eye cream', 'SPF 50+'],

    frequencyRecommendation: 'Every 4 weeks',
    seriesProtocol: '3 monthly sessions for targeted concern improvement, then monthly maintenance',
    resultsTimeline: 'Immediate visible glow and smoothness; booster benefits develop over 1–2 weeks; cumulative improvement over series',
    maintenanceSchedule: 'Monthly for optimal results',

    contraindications: [
      'Active rosacea flare (skip dermaplaning, adjust suction)',
      'Cold sore outbreak',
      'Active acne cysts (avoid dermaplaning)',
      'Allergy to booster ingredients',
      'Recent aggressive peeling within 2 weeks',
    ],
    precautions: [
      'Select booster based on thorough skin assessment',
      'Skip dermaplaning for active acne or very sensitive skin',
      'Reduce suction for thin or compromised skin barrier',
    ],
    potentialComplications: [
      'Mild redness (30–60 minutes)',
      'Temporary sensitivity from dermaplaning',
      'Rare: minor nicks from dermaplaning blade',
    ],
    riskLevel: 'low',

    preCare: [
      'No retinoids for 48 hours',
      'No waxing for 48 hours',
      'Arrive clean or allow extra time for makeup removal',
    ],
    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'Avoid harsh exfoliants, retinoids, and active acids', priority: 'important' },
      { timeframe: 'First 48 hours', instruction: 'Apply SPF 50+ diligently (dermaplaning increases sun sensitivity)', priority: 'critical' },
      { timeframe: 'Ongoing', instruction: 'Use hydrating, barrier-supporting skincare', priority: 'recommended' },
    ],
    downtime: 'None',

    consentRequirements: {
      formId: 'CONSENT-FACIAL-001',
      formName: 'Facial Treatment Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: false,
    },
    cptCodes: [
      { code: '97140', description: 'Manual therapy techniques' },
    ],

    pricing: { min: 325, max: 375, unit: 'per session' },
    sessionDuration: 90,

    tags: ['hydrafacial', 'deluxe', 'booster', 'dermaplaning', 'led', 'premium'],
    relatedProtocols: ['hydrafacial-signature', 'hydrafacial-platinum', 'led-red'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'hydrafacial-platinum',
    name: 'HydraFacial — Platinum Experience',
    category: 'skin-treatment',
    subcategory: 'hydrafacial',
    treatmentArea: 'Full face, neck, and decolletage',
    description: 'The ultimate HydraFacial experience. Everything in the Deluxe, plus neck and decolletage treatment, advanced lymphatic drainage, dual booster application, and an extended mask therapy. Our most luxurious and results-driven facial.',
    clinicalIndication: 'Comprehensive skin rejuvenation, event preparation, VIP experience, significant skin concerns requiring multi-zone treatment',

    steps: [
      { stepNumber: 1, name: 'Advanced Lymphatic Drainage', duration: 12, description: 'Full face, neck, and decolletage lymphatic drainage protocol with sculpting massage technique.', products: [] },
      { stepNumber: 2, name: 'Dermaplaning', duration: 10, description: 'Full-face dermaplaning for maximum product penetration and surface smoothness.', products: ['Surgical blade #10'] },
      { stepNumber: 3, name: 'Deep Cleanse + Peel (Face, Neck, Chest)', duration: 15, description: 'Extended Vortex-Cleansing treatment covering face, neck, and upper chest with appropriate acid peel.', products: ['Activ-4', 'GlySal'] },
      { stepNumber: 4, name: 'Precision Extraction', duration: 15, description: 'Thorough extraction across all zones with extended attention to congested areas.', products: ['Beta-HD'] },
      { stepNumber: 5, name: 'Dual Booster Protocol', duration: 12, description: 'Two targeted boosters applied — one for primary concern, one for secondary concern (e.g., brightening + anti-aging).', products: ['Primary booster', 'Secondary booster'] },
      { stepNumber: 6, name: 'Hydrafusion + Peptides', duration: 10, description: 'Deep hydration with concentrated peptide and growth factor serum across all treatment zones.', products: ['Antiox+', 'Growth factor serum'] },
      { stepNumber: 7, name: 'Alginate Mask Therapy', duration: 15, description: 'Cooling alginate mask application to seal in actives, reduce inflammation, and provide deep hydration while client relaxes.', products: ['Alginate mask powder'] },
      { stepNumber: 8, name: 'Extended LED Therapy', duration: 20, description: 'Full-panel LED therapy covering face, neck, and chest simultaneously. Red + NIR wavelengths.', products: ['LED panel'] },
      { stepNumber: 9, name: 'Luxe Finish', duration: 8, description: 'Premium moisturizer, eye cream, lip treatment, and broad-spectrum SPF application.', products: ['Premium moisturizer', 'Eye cream', 'Lip treatment', 'SPF 50+'] },
    ],
    totalDuration: 117,
    productsUsed: ['Activ-4', 'GlySal', 'Beta-HD', 'Dual boosters', 'Antiox+', 'Growth factors', 'Alginate mask', 'LED panel', 'Premium finish products'],

    frequencyRecommendation: 'Monthly or as a special occasion treatment',
    seriesProtocol: '3 monthly treatments for transformation, then monthly or bi-monthly maintenance',
    resultsTimeline: 'Immediate dramatic glow and skin quality improvement; progressive improvement over series; cumulative collagen stimulation from LED',
    maintenanceSchedule: 'Monthly for peak results; every 6–8 weeks for maintenance',

    contraindications: [
      'Active rosacea flare',
      'Cold sore outbreak',
      'Active acne cysts on neck/chest',
      'Allergy to any product ingredients',
      'Severe sunburn on neck or chest',
    ],
    precautions: [
      'Extended treatment — ensure patient comfort throughout',
      'Chest skin is more sensitive — adjust suction and peel',
      'Two boosters should address complementary (not redundant) concerns',
    ],
    potentialComplications: [
      'Mild redness across all zones (resolves 1–2 hours)',
      'Temporary sensitivity',
      'Occasional breakout in first 48 hours (purging from deep extraction)',
    ],
    riskLevel: 'low',

    preCare: [
      'No retinoids for 48 hours',
      'No chest/neck waxing for 48 hours',
      'Arrive clean; wear comfortable clothing with accessible neckline',
    ],
    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'Avoid active ingredients on all treated areas', priority: 'important' },
      { timeframe: 'First 48 hours', instruction: 'Apply SPF 50+ on face, neck, and chest', priority: 'critical' },
      { timeframe: 'First week', instruction: 'Use gentle, hydrating products only', priority: 'recommended' },
    ],
    downtime: 'None — immediate glow',

    consentRequirements: {
      formId: 'CONSENT-FACIAL-001',
      formName: 'Facial Treatment Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: false,
    },
    cptCodes: [
      { code: '97140', description: 'Manual therapy techniques' },
    ],

    pricing: { min: 450, max: 550, unit: 'per session' },
    sessionDuration: 120,

    tags: ['hydrafacial', 'platinum', 'luxury', 'vip', 'comprehensive', 'event-prep'],
    relatedProtocols: ['hydrafacial-signature', 'hydrafacial-deluxe', 'led-red'],
    lastUpdated: '2026-03-01',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHEMICAL PEELS (5)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'peel-superficial',
    name: 'Chemical Peel — Superficial (Glycolic/Lactic)',
    category: 'skin-treatment',
    subcategory: 'chemical-peel',
    treatmentArea: 'Full face',
    description: 'Light alpha-hydroxy acid peel targeting the stratum corneum for gentle exfoliation. Excellent entry-level peel for brightening, mild congestion, and skin texture improvement with virtually no downtime.',
    clinicalIndication: 'Mild hyperpigmentation, dull complexion, light acne, first-time peel patient, skin prep before advanced treatments',

    steps: [
      { stepNumber: 1, name: 'Cleanse', duration: 5, description: 'Double cleanse to remove all makeup, oil, and debris.', products: ['Pre-peel cleanser'] },
      { stepNumber: 2, name: 'Degrease', duration: 3, description: 'Acetone or alcohol prep to remove residual oils for even acid penetration.', products: ['Pre-peel prep solution'] },
      { stepNumber: 3, name: 'Acid Application', duration: 5, description: 'Apply glycolic acid (30–50%) or lactic acid (40–60%) in even strokes. Monitor skin response and patient sensation.', products: ['Glycolic acid 30–50% or Lactic acid 40–60%'] },
      { stepNumber: 4, name: 'Timed Dwell', duration: 5, description: 'Allow acid to dwell for 2–5 minutes based on skin tolerance and desired depth. Monitor for erythema level.', notes: 'Neutralize immediately if frosting, excessive erythema, or patient distress' },
      { stepNumber: 5, name: 'Neutralize', duration: 3, description: 'Apply neutralizing solution (sodium bicarbonate) to stop acid activity. Rinse thoroughly with cool water.', products: ['Neutralizing solution'] },
      { stepNumber: 6, name: 'Soothe + Protect', duration: 5, description: 'Apply calming serum, hydrating moisturizer, and broad-spectrum SPF.', products: ['Calming serum', 'Moisturizer', 'SPF 50+'] },
    ],
    totalDuration: 26,
    productsUsed: ['Pre-peel cleanser', 'Prep solution', 'AHA acid', 'Neutralizer', 'Calming serum', 'SPF 50+'],

    frequencyRecommendation: 'Every 2–4 weeks',
    seriesProtocol: '4–6 sessions, gradually increasing concentration',
    resultsTimeline: 'Immediate brightness; mild flaking days 2–3; progressive improvement over series',
    maintenanceSchedule: 'Every 4–6 weeks once desired result achieved',

    contraindications: [
      'Active cold sore',
      'Open wounds or sunburn',
      'Isotretinoin within 6 months',
      'Allergy to glycolic or lactic acid',
      'Pregnancy (glycolic — discuss with physician)',
    ],
    precautions: [
      'Start at lower concentrations and progress',
      'Monitor skin response during dwell time — neutralize early if needed',
      'Lactic acid preferred for sensitive or dry skin types',
      'Glycolic acid preferred for oily or acne-prone skin',
    ],
    potentialComplications: [
      'Erythema (expected — resolves 2–4 hours)',
      'Mild stinging during application',
      'Light flaking days 2–3',
      'Post-inflammatory hyperpigmentation (rare with superficial peels)',
    ],
    riskLevel: 'low',

    preCare: [
      'Discontinue retinoids 3–5 days before',
      'No waxing for 1 week before',
      'Introduce AHA-containing products 2 weeks before to assess tolerance',
    ],
    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'No retinoids, AHAs/BHAs, or vitamin C serums', priority: 'critical' },
      { timeframe: 'First week', instruction: 'Apply SPF 50+ every 2 hours when outdoors', priority: 'critical' },
      { timeframe: 'First week', instruction: 'Use gentle cleanser and heavy moisturizer; do not pick or peel flaking skin', priority: 'important' },
    ],
    downtime: 'Minimal — mild redness for hours; possible light flaking for 2–3 days',

    consentRequirements: {
      formId: 'CONSENT-PEEL-001',
      formName: 'Chemical Peel Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '17360', description: 'Chemical exfoliation for acne (e.g., acne paste, acid)' },
    ],

    pricing: { min: 125, max: 200, unit: 'per session' },
    sessionDuration: 30,

    tags: ['chemical-peel', 'superficial', 'glycolic', 'lactic', 'brightening', 'gentle'],
    relatedProtocols: ['peel-medium', 'peel-vi', 'hydrafacial-signature'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'peel-medium',
    name: 'Chemical Peel — Medium Depth (TCA)',
    category: 'skin-treatment',
    subcategory: 'chemical-peel',
    treatmentArea: 'Full face',
    description: 'Medium-depth TCA (trichloroacetic acid) peel penetrating to the papillary dermis for more significant skin resurfacing. Addresses moderate photodamage, deeper pigmentation, fine lines, and acne scars. Requires social downtime.',
    clinicalIndication: 'Moderate photodamage, fine lines, acne scars (mild-moderate), stubborn pigmentation, skin texture irregularity',

    steps: [
      { stepNumber: 1, name: 'Cleanse', duration: 5, description: 'Thorough cleansing and degreasing of the skin.', products: ['Pre-peel cleanser', 'Acetone prep'] },
      { stepNumber: 2, name: 'Application', duration: 8, description: 'Apply TCA 15–35% in even, measured strokes. Use cotton-tipped applicators or gauze. Apply zone by zone (forehead, cheeks, nose, chin, perioral, periorbital).', products: ['TCA 15–35%'] },
      { stepNumber: 3, name: 'Monitor Frosting', duration: 5, description: 'Observe for frosting endpoints. Level I (pink with streaky white) = superficial-medium. Level II (white frost with pink showing through) = medium. Level III (solid white frost) = deep medium. Fan for patient comfort.', notes: 'Self-neutralizing — do not add neutralizer' },
      { stepNumber: 4, name: 'Cool + Soothe', duration: 5, description: 'Apply cool compresses and soothing emollient once desired frosting level achieved. TCA is self-neutralizing.', products: ['Cool compresses', 'Post-peel emollient'] },
      { stepNumber: 5, name: 'Protect', duration: 5, description: 'Apply thick barrier emollient and physical sunscreen. Provide aftercare kit.', products: ['Barrier cream', 'Physical SPF', 'Aftercare kit'] },
    ],
    totalDuration: 28,
    productsUsed: ['Pre-peel cleanser', 'Acetone', 'TCA solution', 'Cool compresses', 'Barrier emollient', 'Physical SPF'],

    frequencyRecommendation: 'Every 3–6 months',
    seriesProtocol: '1–3 sessions depending on severity of concern',
    resultsTimeline: 'Day 1–3: redness and tightness; Day 3–7: peeling (can be significant); Day 7–14: fresh, glowing skin emerges; Full results at 4–6 weeks as collagen remodeling completes',
    maintenanceSchedule: 'Every 4–6 months; alternate with lighter peels monthly',

    contraindications: [
      'Active cold sore (prescribe prophylaxis if proceeding)',
      'Isotretinoin within 12 months',
      'Pregnancy or breastfeeding',
      'Fitzpatrick V–VI (high risk of PIH)',
      'Active inflammatory skin conditions',
      'Recent facial surgery within 6 months',
      'Poor wound healing history',
    ],
    precautions: [
      'Pre-treat with retinoid and hydroquinone 4 weeks prior for best results and reduced PIH risk',
      'Fitzpatrick III–IV: proceed cautiously with lower concentrations',
      'Patient must commit to downtime and aftercare compliance',
      'Prescribe antiviral prophylaxis (valacyclovir 500mg BID starting day before)',
    ],
    potentialComplications: [
      'Significant peeling and crusting (5–10 days)',
      'Post-inflammatory hyperpigmentation (higher in darker skin types)',
      'Infection (rare with proper aftercare)',
      'Scarring (rare)',
      'Herpes reactivation',
      'Demarcation lines at treatment boundary',
    ],
    riskLevel: 'moderate',

    preCare: [
      'Pre-treat with tretinoin and hydroquinone 4% for 2–4 weeks',
      'Discontinue retinoids 1 week before peel',
      'Start valacyclovir prophylaxis day before treatment',
      'No waxing or laser for 2 weeks before',
      'Arrange social downtime (7–10 days)',
    ],
    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'Apply thick barrier emollient every 2 hours; expect tightness and warmth', priority: 'critical' },
      { timeframe: 'Day 1–7', instruction: 'Do NOT pick, peel, or scrub flaking skin — let it shed naturally', priority: 'critical' },
      { timeframe: 'Day 1–14', instruction: 'Apply gentle cleanser, barrier cream, and physical sunscreen only; no active ingredients', priority: 'critical' },
      { timeframe: 'Week 2–4', instruction: 'Gradually reintroduce skincare; resume retinoid at week 3', priority: 'important' },
      { timeframe: 'First 3 months', instruction: 'Strict SPF 50+ daily and sun avoidance', priority: 'critical' },
    ],
    downtime: 'Significant — 7–10 days of visible peeling. Social downtime required.',

    consentRequirements: {
      formId: 'CONSENT-PEEL-002',
      formName: 'Medium/Deep Chemical Peel Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '15788', description: 'Chemical peel, facial; epidermal' },
      { code: '15789', description: 'Chemical peel, facial; dermal' },
    ],

    pricing: { min: 300, max: 500, unit: 'per session' },
    sessionDuration: 45,

    tags: ['chemical-peel', 'medium-depth', 'tca', 'resurfacing', 'photodamage'],
    relatedProtocols: ['peel-superficial', 'peel-vi', 'rf-microneedling-face'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'peel-vi',
    name: 'VI Peel',
    category: 'skin-treatment',
    subcategory: 'chemical-peel',
    treatmentArea: 'Full face (variants available for body)',
    description: 'VI Peel is a medium-depth blended peel combining TCA, salicylic acid, retinoic acid, phenol, and vitamin C. Self-neutralizing and applied in-office with the peel left on for 4–6 hours post-treatment. Available in 5 formulations targeting specific concerns.',
    clinicalIndication: 'Acne, acne scars, melasma, hyperpigmentation, aging, sun damage, skin tone evening',

    steps: [
      { stepNumber: 1, name: 'Cleanse + Prep', duration: 5, description: 'Cleanse with provided pre-peel cleanser. Degrease with prep solution.', products: ['VI Peel prep pads'] },
      { stepNumber: 2, name: 'Apply Peel Layer 1', duration: 5, description: 'Apply first layer of VI Peel solution using applicator pads. Cover entire face evenly. Patient may feel tingling/stinging.', products: ['VI Peel solution'] },
      { stepNumber: 3, name: 'Apply Peel Layer 2', duration: 3, description: 'Apply second layer to areas of concern (pigmentation, acne zones). Builds depth in targeted areas.', products: ['VI Peel solution'] },
      { stepNumber: 4, name: 'Numbing Layer', duration: 3, description: 'Apply numbing pad over peel to reduce stinging and lock in the peel.', products: ['VI Peel numbing solution'] },
      { stepNumber: 5, name: 'Post-Peel Kit Instructions', duration: 8, description: 'Review aftercare protocol with patient. Provide take-home kit with towelettes, SPF, moisturizer, and post-peel protectant. Patient leaves with peel on face (washes off at home 4–6 hours later).', products: ['VI Peel aftercare kit'] },
    ],
    totalDuration: 24,
    productsUsed: ['VI Peel prep', 'VI Peel solution', 'Numbing solution', 'Take-home aftercare kit'],

    frequencyRecommendation: 'Every 4–6 weeks for acne; every 6–8 weeks for anti-aging',
    seriesProtocol: '3–4 peels spaced 4–6 weeks apart for optimal results',
    resultsTimeline: 'Day 1–2: tightness; Day 3: peeling begins; Day 4–7: active peeling; Day 7–10: fresh, smooth skin revealed. Full collagen remodeling at 4–6 weeks.',
    maintenanceSchedule: 'Every 2–3 months for maintenance',

    contraindications: [
      'Allergy to any VI Peel ingredients (phenol, aspirin/salicylic acid)',
      'Pregnancy or breastfeeding',
      'Active cold sore',
      'Open wounds',
      'Isotretinoin within 6 months',
    ],
    precautions: [
      'Select appropriate VI Peel variant for the concern',
      'VI Peel Original: anti-aging general; Advanced: enhanced anti-aging; Precision Plus: pigmentation/melasma; Purify: acne; Body: body areas',
      'Safe for all skin types including Fitzpatrick V–VI (Precision Plus ideal for hyperpigmentation in darker skin)',
    ],
    potentialComplications: [
      'Moderate peeling (3–7 days)',
      'Temporary darkening before peeling',
      'Mild stinging during application',
      'Post-inflammatory hyperpigmentation (uncommon)',
      'Infection (rare)',
    ],
    riskLevel: 'low',

    preCare: [
      'Stop retinoids 3–5 days before',
      'No waxing for 1 week',
      'Antiviral prophylaxis for HSV-positive patients',
    ],
    aftercare: [
      { timeframe: '4–6 hours post-application', instruction: 'Wash off peel with gentle cleanser provided in kit', priority: 'critical' },
      { timeframe: 'Day 1', instruction: 'Apply VI Peel post-peel protectant; begin towelette use', priority: 'critical' },
      { timeframe: 'Day 1–7', instruction: 'Do NOT peel, pick, or pull peeling skin; let it shed naturally', priority: 'critical' },
      { timeframe: 'Day 1–14', instruction: 'Apply SPF 50+ and VI Peel post-peel repair cream per kit instructions', priority: 'critical' },
    ],
    downtime: 'Moderate — visible peeling days 3–7. Social downtime 5–7 days.',

    consentRequirements: {
      formId: 'CONSENT-PEEL-003',
      formName: 'VI Peel Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '15788', description: 'Chemical peel, facial; epidermal' },
    ],

    pricing: { min: 325, max: 325, unit: 'per session (any variant)' },
    sessionDuration: 30,

    tags: ['vi-peel', 'chemical-peel', 'acne', 'pigmentation', 'melasma', 'all-skin-types'],
    relatedProtocols: ['peel-biorepeel', 'peel-prx', 'peel-medium'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'peel-biorepeel',
    name: 'BioRePeel',
    category: 'skin-treatment',
    subcategory: 'chemical-peel',
    treatmentArea: 'Face (also available for neck, body, intimate areas, underarms, hands)',
    description: 'BioRePeel is a biphasic TCA-based peel that provides the benefits of a chemical peel without the peeling. The innovative two-phase (lipophilic + hydrophilic) formula penetrates and exfoliates while simultaneously nourishing the skin. No downtime bio-stimulating peel.',
    clinicalIndication: 'Dull skin, mild acne, fine lines, uneven texture, enlarged pores, first-time peel patients who cannot tolerate downtime',

    steps: [
      { stepNumber: 1, name: 'Cleanse', duration: 5, description: 'Double cleanse and degrease the skin to remove all impurities.', products: ['Gentle cleanser', 'Prep solution'] },
      { stepNumber: 2, name: 'BioRePeel Application', duration: 3, description: 'Apply BioRePeel solution evenly across the face using provided applicator. Massage gently in circular motions to activate biphasic formulation.', products: ['BioRePeel CL3 FND'] },
      { stepNumber: 3, name: 'Activation Massage', duration: 5, description: 'Continue gentle circular massage for 5 minutes. Patient will feel mild tingling. The mechanical action activates the peel.', notes: 'Self-neutralizing — no separate neutralizer needed' },
      { stepNumber: 4, name: 'Remove', duration: 3, description: 'Remove with damp gauze and rinse with cool water. Skin should appear refreshed and slightly flushed.', products: ['Damp gauze'] },
      { stepNumber: 5, name: 'Post-Peel Soothe', duration: 5, description: 'Apply calming serum, moisturizer, and SPF.', products: ['Hyaluronic acid serum', 'Moisturizer', 'SPF 50+'] },
    ],
    totalDuration: 21,
    productsUsed: ['BioRePeel CL3 FND', 'Gentle cleanser', 'HA serum', 'SPF 50+'],

    frequencyRecommendation: 'Every 1–2 weeks for initial series',
    seriesProtocol: '4–6 sessions, 1–2 weeks apart',
    resultsTimeline: 'Immediate brightness and smoothness; progressive improvement with each session; cumulative results after full series',
    maintenanceSchedule: 'Monthly after initial series',

    contraindications: [
      'Active cold sore',
      'Open wounds',
      'Allergy to TCA or peel ingredients',
      'Pregnancy (discuss with physician)',
    ],
    precautions: [
      'Genuinely minimal downtime — excellent for peel-anxious patients',
      'Can be combined with other treatments (HydraFacial, microneedling)',
      'Available for body areas at different price points',
      'Safe for all skin types',
    ],
    potentialComplications: [
      'Mild redness (30–60 minutes)',
      'Tingling during application',
      'Very rarely: mild flaking at days 2–3',
    ],
    riskLevel: 'low',

    preCare: [
      'Stop retinoids 48 hours before',
      'Arrive with clean skin',
    ],
    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'Avoid active ingredients (retinoids, AHAs, vitamin C)', priority: 'important' },
      { timeframe: 'First 48 hours', instruction: 'Apply SPF 50+ daily', priority: 'critical' },
      { timeframe: 'Ongoing', instruction: 'Maintain hydrating skincare routine', priority: 'recommended' },
    ],
    downtime: 'None — truly zero downtime. Return to work/activities immediately.',

    consentRequirements: {
      formId: 'CONSENT-PEEL-001',
      formName: 'Chemical Peel Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: false,
    },
    cptCodes: [
      { code: '17360', description: 'Chemical exfoliation for acne' },
    ],

    pricing: { min: 275, max: 575, unit: 'per session (area dependent)' },
    sessionDuration: 60,

    tags: ['biorepeel', 'chemical-peel', 'no-downtime', 'biphasic', 'bio-stimulating'],
    relatedProtocols: ['peel-prx', 'peel-vi', 'hydrafacial-signature'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'peel-prx',
    name: 'PRX-T33 (BioRevitalization Peel)',
    category: 'skin-treatment',
    subcategory: 'chemical-peel',
    treatmentArea: 'Full face',
    description: 'PRX-T33 is a non-peeling biorevitalization treatment combining high-concentration TCA (33%), low-dose hydrogen peroxide, and kojic acid. It stimulates deep dermal collagen without causing epidermal damage or traditional peeling. The "no-peel" peel for instant skin tightening and glow.',
    clinicalIndication: 'Skin laxity, fine lines, scars (including stretch marks), skin dullness, patients who want TCA-level results without peeling',

    steps: [
      { stepNumber: 1, name: 'Cleanse', duration: 5, description: 'Deep cleanse and degrease the skin.', products: ['Pre-treatment cleanser'] },
      { stepNumber: 2, name: 'PRX-T33 Application', duration: 8, description: 'Apply PRX-T33 solution and massage vigorously into the skin using firm circular pressure with fingertips or gauze. The hydrogen peroxide neutralizes TCA at the epidermal level, allowing it to penetrate to the dermis without causing surface frosting or peeling.', products: ['PRX-T33 solution'] },
      { stepNumber: 3, name: 'Repeat Application', duration: 5, description: 'Apply second (and optional third) coat with continued massage. Skin will appear flushed and feel warm and tight.', products: ['PRX-T33 solution'], notes: '2–3 coats typical. More coats = deeper stimulation.' },
      { stepNumber: 4, name: 'Neutralize + Rinse', duration: 3, description: 'Remove excess product with damp gauze and rinse. Apply WiQo neutralizing cream.', products: ['WiQo Nourishing cream'] },
      { stepNumber: 5, name: 'Post-Treatment Serum + SPF', duration: 5, description: 'Apply WiQo smoothing fluid (for oily) or nourishing cream (for dry) and SPF.', products: ['WiQo post-treatment products', 'SPF 50+'] },
    ],
    totalDuration: 26,
    productsUsed: ['PRX-T33 solution', 'WiQo nourishing cream', 'WiQo smoothing fluid', 'SPF 50+'],

    frequencyRecommendation: 'Every 1–2 weeks for initial series',
    seriesProtocol: '4–5 sessions, 1–2 weeks apart, with WiQo home-care between sessions',
    resultsTimeline: 'Immediate tightening and glow; progressive collagen stimulation over weeks; optimal results after full series at 8–10 weeks',
    maintenanceSchedule: 'Monthly after initial series',

    contraindications: [
      'Active herpes outbreak',
      'Open wounds or active dermatitis',
      'Allergy to any ingredients',
      'Pregnancy (due to kojic acid)',
    ],
    precautions: [
      'Requires vigorous massage technique — provider must be trained',
      'WiQo home-care system is integral to results',
      'No peeling = no downtime, but collagen results take time',
      'Can combine with microneedling for enhanced results',
    ],
    potentialComplications: [
      'Temporary redness and warmth (resolves 30–60 minutes)',
      'Mild stinging during vigorous application',
      'Very rare: irritation if product enters eyes',
    ],
    riskLevel: 'low',

    preCare: [
      'Clean skin, no makeup',
      'No specific prep required',
    ],
    aftercare: [
      { timeframe: 'Immediately', instruction: 'Mild redness and tightness are normal and resolve quickly', priority: 'recommended' },
      { timeframe: 'Daily', instruction: 'Use WiQo home-care products as directed between sessions', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Apply SPF 50+ daily', priority: 'important' },
    ],
    downtime: 'None — zero peeling, zero downtime',

    consentRequirements: {
      formId: 'CONSENT-PEEL-001',
      formName: 'Chemical Peel Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: false,
    },
    cptCodes: [
      { code: '17360', description: 'Chemical exfoliation for acne' },
    ],

    pricing: { min: 475, max: 475, unit: 'per session' },
    sessionDuration: 60,

    tags: ['prx-t33', 'biorevitalization', 'no-peel', 'collagen', 'tightening', 'no-downtime'],
    relatedProtocols: ['peel-biorepeel', 'peel-vi', 'rf-microneedling-face'],
    lastUpdated: '2026-03-01',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MECHANICAL TREATMENTS (2)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'microdermabrasion',
    name: 'Microdermabrasion',
    category: 'skin-treatment',
    subcategory: 'mechanical',
    treatmentArea: 'Full face',
    description: 'Crystal or diamond-tip mechanical exfoliation of the epidermis to remove dead skin cells, improve texture, and stimulate cell turnover. A gentle yet effective treatment suitable for most skin types. Often combined with other modalities.',
    clinicalIndication: 'Dull complexion, mild acne, superficial scars, large pores, fine lines, skin prep for product penetration',

    steps: [
      { stepNumber: 1, name: 'Cleanse', duration: 5, description: 'Double cleanse to remove all makeup and surface debris.', products: ['Gentle cleanser'] },
      { stepNumber: 2, name: 'Microdermabrasion', duration: 20, description: 'Diamond-tip handpiece moved across skin in systematic passes. Suction removes exfoliated cells. Adjust suction and tip coarseness per skin area and condition. 2 passes per zone.', products: ['Diamond-tip handpiece'] },
      { stepNumber: 3, name: 'Soothe + Hydrate', duration: 5, description: 'Apply calming hyaluronic acid serum and hydrating moisturizer.', products: ['HA serum', 'Moisturizer'] },
      { stepNumber: 4, name: 'Protect', duration: 3, description: 'Apply SPF 50+ sunscreen.', products: ['SPF 50+'] },
    ],
    totalDuration: 33,
    productsUsed: ['Gentle cleanser', 'Diamond-tip handpiece', 'HA serum', 'Moisturizer', 'SPF 50+'],

    frequencyRecommendation: 'Every 2–4 weeks',
    seriesProtocol: '6 sessions for visible improvement',
    resultsTimeline: 'Immediate smoothness and glow; progressive improvement over series',
    maintenanceSchedule: 'Monthly',

    contraindications: [
      'Active acne cysts or inflamed acne',
      'Rosacea (can worsen)',
      'Active cold sore',
      'Sunburn',
      'Recent facial peel or laser within 2 weeks',
      'Blood-thinning medications (relative — increased bruising)',
    ],
    precautions: [
      'Reduce suction and coarseness for sensitive skin',
      'Avoid active acne lesions',
      'Not as effective as chemical peels for pigmentation',
    ],
    potentialComplications: [
      'Mild redness (1–2 hours)',
      'Sensitivity',
      'Rare: petechiae from suction (too aggressive)',
    ],
    riskLevel: 'low',

    preCare: ['No retinoids for 48 hours', 'Arrive with clean skin'],
    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'No active ingredients; gentle products only', priority: 'important' },
      { timeframe: 'First 48 hours', instruction: 'Apply SPF 50+', priority: 'critical' },
    ],
    downtime: 'None',

    consentRequirements: {
      formId: 'CONSENT-FACIAL-001',
      formName: 'Facial Treatment Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: false,
    },
    cptCodes: [
      { code: '15786', description: 'Abrasion; single lesion (e.g., dermabrasion)' },
    ],

    pricing: { min: 125, max: 175, unit: 'per session' },
    sessionDuration: 45,

    tags: ['microdermabrasion', 'mechanical', 'exfoliation', 'gentle', 'maintenance'],
    relatedProtocols: ['dermaplaning', 'hydrafacial-signature', 'peel-superficial'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'dermaplaning',
    name: 'Dermaplaning',
    category: 'skin-treatment',
    subcategory: 'mechanical',
    treatmentArea: 'Full face',
    description: 'Manual exfoliation using a sterile surgical blade (#10) held at a 45-degree angle to gently remove the outermost layer of dead skin cells and vellus hair (peach fuzz). Creates an instantly smooth canvas for makeup and enhances product absorption.',
    clinicalIndication: 'Vellus hair (peach fuzz), dull complexion, rough texture, preparation for chemical peels or product application',

    steps: [
      { stepNumber: 1, name: 'Cleanse + Dry', duration: 5, description: 'Cleanse face thoroughly. Skin must be completely dry for blade to work effectively.', products: ['Gentle cleanser'] },
      { stepNumber: 2, name: 'Dermaplaning', duration: 25, description: 'Using a sterile #10 surgical blade, gently stroke the skin at a 45-degree angle in short, feathering motions. Work in sections: forehead, cheeks, chin, upper lip, jawline. Stretch the skin taut with the non-dominant hand.', products: ['Sterile surgical blade #10'], notes: 'Avoid active acne lesions, moles, and open wounds. Change blade every 2–3 zones.' },
      { stepNumber: 3, name: 'Soothe', duration: 5, description: 'Apply calming serum (hyaluronic acid) to freshly exfoliated skin.', products: ['HA serum'] },
      { stepNumber: 4, name: 'Protect', duration: 3, description: 'Apply moisturizer and SPF 50+.', products: ['Moisturizer', 'SPF 50+'] },
    ],
    totalDuration: 38,
    productsUsed: ['Gentle cleanser', 'Surgical blade #10', 'HA serum', 'Moisturizer', 'SPF 50+'],

    frequencyRecommendation: 'Every 3–4 weeks',
    seriesProtocol: 'Ongoing maintenance — no specific series needed',
    resultsTimeline: 'Immediately smooth, glowing skin; peach fuzz regrows at normal rate (does NOT grow back thicker)',
    maintenanceSchedule: 'Every 3–4 weeks',

    contraindications: [
      'Active acne breakout (inflammatory)',
      'Active cold sore or skin infection',
      'Isotretinoin within 6 months',
      'Sunburn',
      'Rosacea (can worsen flushing)',
    ],
    precautions: [
      'Hair does NOT grow back thicker — educate patients',
      'Avoid raised moles and active lesions',
      'Frequently combined with peels or HydraFacial for enhanced results',
      'Blade must be sterile and changed frequently',
    ],
    potentialComplications: [
      'Mild redness (resolves within an hour)',
      'Rare: superficial nick (if technique is improper)',
      'Temporary sensitivity to products',
    ],
    riskLevel: 'low',

    preCare: ['No retinoids for 48 hours', 'No facial waxing for 1 week'],
    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'No retinoids, AHAs, or vitamin C', priority: 'important' },
      { timeframe: 'First 48 hours', instruction: 'Apply SPF 50+ diligently — freshly exfoliated skin is more sun-sensitive', priority: 'critical' },
      { timeframe: 'Ongoing', instruction: 'Maintain hydrating skincare', priority: 'recommended' },
    ],
    downtime: 'None',

    consentRequirements: {
      formId: 'CONSENT-FACIAL-001',
      formName: 'Facial Treatment Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: false,
    },
    cptCodes: [
      { code: '97140', description: 'Manual therapy techniques' },
    ],

    pricing: { min: 49, max: 99, unit: 'per session (standalone or add-on)' },
    sessionDuration: 30,

    tags: ['dermaplaning', 'mechanical', 'exfoliation', 'peach-fuzz', 'smooth-skin'],
    relatedProtocols: ['hydrafacial-deluxe', 'peel-superficial', 'microdermabrasion'],
    lastUpdated: '2026-03-01',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LED LIGHT THERAPY (3)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'led-red',
    name: 'LED Light Therapy — Red (633nm)',
    category: 'skin-treatment',
    subcategory: 'light-therapy',
    treatmentArea: 'Full face',
    description: 'Red LED light therapy at 633nm wavelength to stimulate collagen production, accelerate wound healing, reduce inflammation, and improve overall skin quality. Non-thermal, non-invasive photobiomodulation.',
    clinicalIndication: 'Anti-aging, post-procedure healing, inflammation, rosacea, general skin health',

    steps: [
      { stepNumber: 1, name: 'Cleanse', duration: 5, description: 'Remove all makeup and skincare products. Skin must be clean and bare.', products: ['Gentle cleanser'] },
      { stepNumber: 2, name: 'Eye Protection', duration: 1, description: 'Place opaque goggles or eye shields on patient.', products: ['LED eye protection'] },
      { stepNumber: 3, name: 'LED Treatment', duration: 20, description: 'Position LED panel 1–2 inches from face. Red 633nm for 20 minutes. Patient relaxes comfortably.', products: ['LED panel — red 633nm'], notes: 'Can be standalone or post-treatment add-on' },
      { stepNumber: 4, name: 'Post-Treatment Products', duration: 5, description: 'Apply serum, moisturizer, and SPF while skin is in enhanced absorption mode.', products: ['Serum', 'Moisturizer', 'SPF'] },
    ],
    totalDuration: 31,
    productsUsed: ['LED panel (633nm red)', 'Eye protection', 'Serum', 'SPF'],

    frequencyRecommendation: '2–3 times per week for therapeutic effect; weekly for maintenance',
    seriesProtocol: '10–12 sessions for anti-aging protocol',
    resultsTimeline: 'Subtle immediate glow; cumulative benefits over 4–8 weeks of consistent treatment',
    maintenanceSchedule: 'Weekly or as add-on to other treatments',

    contraindications: [
      'Photosensitivity disorders (e.g., lupus, porphyria)',
      'Active use of photosensitizing medications (discuss)',
      'Epilepsy (relative — discuss flashing concerns)',
      'Active cancer in treatment area',
    ],
    precautions: [
      'Very safe — one of the lowest-risk treatments available',
      'Best as a complement to other treatments, not standalone for significant concerns',
      'Requires consistency for results — one-off treatments have minimal lasting benefit',
    ],
    potentialComplications: [
      'Virtually no side effects',
      'Rare: mild warmth or tingling',
      'Very rare: headache in sensitive individuals',
    ],
    riskLevel: 'low',

    preCare: ['Remove makeup; clean skin'],
    aftercare: [
      { timeframe: 'Immediately', instruction: 'Apply serum and moisturizer — skin is in enhanced absorption mode post-LED', priority: 'recommended' },
      { timeframe: 'Ongoing', instruction: 'Maintain consistent treatment schedule for best results', priority: 'recommended' },
    ],
    downtime: 'None',

    consentRequirements: {
      formId: 'CONSENT-FACIAL-001',
      formName: 'Facial Treatment Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: false,
    },
    cptCodes: [
      { code: '96567', description: 'Photodynamic therapy by external application of light' },
    ],

    pricing: { min: 49, max: 75, unit: 'per session (often add-on pricing)' },
    sessionDuration: 30,

    tags: ['led', 'red-light', 'photobiomodulation', 'collagen', 'anti-aging', 'healing', 'add-on'],
    relatedProtocols: ['led-blue', 'led-nir', 'hydrafacial-signature'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'led-blue',
    name: 'LED Light Therapy — Blue (415nm)',
    category: 'skin-treatment',
    subcategory: 'light-therapy',
    treatmentArea: 'Full face or targeted zones',
    description: 'Blue LED light therapy at 415nm wavelength targeting acne-causing P. acnes bacteria. Blue light destroys the porphyrins produced by bacteria, providing antimicrobial effects without antibiotics.',
    clinicalIndication: 'Active acne (mild-moderate), bacterial acne, acne prevention, oil reduction',

    steps: [
      { stepNumber: 1, name: 'Cleanse', duration: 5, description: 'Thorough cleansing to remove makeup and excess oil.', products: ['Gentle cleanser'] },
      { stepNumber: 2, name: 'Eye Protection', duration: 1, description: 'Place opaque goggles or shields.', products: ['LED eye protection'] },
      { stepNumber: 3, name: 'LED Treatment', duration: 20, description: 'Position blue LED panel over treatment area. 415nm wavelength for 20 minutes.', products: ['LED panel — blue 415nm'] },
      { stepNumber: 4, name: 'Post-Treatment', duration: 5, description: 'Apply lightweight oil-free moisturizer and SPF.', products: ['Oil-free moisturizer', 'SPF 50+'] },
    ],
    totalDuration: 31,
    productsUsed: ['LED panel (415nm blue)', 'Eye protection', 'Oil-free moisturizer', 'SPF'],

    frequencyRecommendation: '2–3 times per week for active acne',
    seriesProtocol: '8–12 sessions for acne clearing',
    resultsTimeline: 'Reduction in active lesions begins within 2–4 weeks of consistent treatment',
    maintenanceSchedule: 'Weekly for maintenance once acne is controlled',

    contraindications: [
      'Photosensitivity disorders',
      'Photosensitizing medications',
      'Not effective for cystic/nodular acne (needs medical management)',
    ],
    precautions: [
      'Blue light alone is insufficient for moderate-severe acne',
      'Works best as complement to topical acne regimen',
      'Can combine red + blue in same session for anti-inflammatory + antimicrobial',
    ],
    potentialComplications: [
      'Virtually none',
      'Rare: temporary dryness',
    ],
    riskLevel: 'low',

    preCare: ['Clean skin, no makeup'],
    aftercare: [
      { timeframe: 'Immediately', instruction: 'Apply oil-free moisturizer', priority: 'recommended' },
      { timeframe: 'Ongoing', instruction: 'Maintain acne skincare regimen; keep consistent LED schedule', priority: 'important' },
    ],
    downtime: 'None',

    consentRequirements: {
      formId: 'CONSENT-FACIAL-001',
      formName: 'Facial Treatment Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: false,
    },
    cptCodes: [
      { code: '96567', description: 'Photodynamic therapy by external application of light' },
    ],

    pricing: { min: 49, max: 75, unit: 'per session' },
    sessionDuration: 30,

    tags: ['led', 'blue-light', 'acne', 'antimicrobial', 'oil-control'],
    relatedProtocols: ['led-red', 'led-nir', 'peel-superficial'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'led-nir',
    name: 'LED Light Therapy — Near-Infrared (830nm)',
    category: 'skin-treatment',
    subcategory: 'light-therapy',
    treatmentArea: 'Full face or body areas',
    description: 'Near-infrared (NIR) LED at 830nm wavelength for deep tissue healing, inflammation reduction, and cellular energy enhancement. Penetrates deeper than red light to stimulate mitochondrial function and accelerate recovery.',
    clinicalIndication: 'Post-procedure healing, deep tissue inflammation, pain management, wound healing, muscle recovery',

    steps: [
      { stepNumber: 1, name: 'Preparation', duration: 3, description: 'Clean treatment area. Position patient comfortably.', products: [] },
      { stepNumber: 2, name: 'Eye Protection', duration: 1, description: 'Place eye shields (NIR is invisible but still reaches retina).', products: ['NIR-rated eye protection'] },
      { stepNumber: 3, name: 'NIR Treatment', duration: 20, description: 'Position NIR panel over treatment area. 830nm for 20 minutes. Patient may feel gentle warmth.', products: ['LED panel — NIR 830nm'] },
      { stepNumber: 4, name: 'Post-Treatment', duration: 3, description: 'Apply appropriate products for the treatment context.', products: ['Appropriate post-care products'] },
    ],
    totalDuration: 27,
    productsUsed: ['LED panel (830nm NIR)', 'Eye protection'],

    frequencyRecommendation: '2–3 times per week; daily post-procedure for accelerated healing',
    seriesProtocol: 'As needed based on healing requirements',
    resultsTimeline: 'Reduced inflammation within hours; accelerated healing visible within days; cumulative cellular benefits over weeks',
    maintenanceSchedule: 'As needed or weekly for general wellness',

    contraindications: [
      'Active cancer in treatment area',
      'Over thyroid gland (theoretical concern)',
      'Photosensitivity disorders',
    ],
    precautions: [
      'NIR is invisible — ensure device is functioning',
      'Eye protection still essential even though light is invisible',
      'Best used in combination with other treatments for enhanced healing',
    ],
    potentialComplications: [
      'None reported with proper use',
      'Mild warmth sensation',
    ],
    riskLevel: 'low',

    preCare: ['No specific preparation needed'],
    aftercare: [
      { timeframe: 'Immediately', instruction: 'Continue with normal routine or post-procedure care', priority: 'recommended' },
    ],
    downtime: 'None',

    consentRequirements: {
      formId: 'CONSENT-FACIAL-001',
      formName: 'Facial Treatment Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: false,
    },
    cptCodes: [
      { code: '96567', description: 'Photodynamic therapy by external application of light' },
    ],

    pricing: { min: 49, max: 75, unit: 'per session' },
    sessionDuration: 25,

    tags: ['led', 'near-infrared', 'nir', 'healing', 'inflammation', 'deep-tissue', 'recovery'],
    relatedProtocols: ['led-red', 'led-blue'],
    lastUpdated: '2026-03-01',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OXYGEN FACIAL
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'oxygen-facial',
    name: 'Oxygen Facial',
    category: 'skin-treatment',
    subcategory: 'oxygen',
    treatmentArea: 'Full face',
    description: 'Pressurized oxygen is used to deliver customized serums deep into the skin for instant hydration, plumping, and brightening. The oxygen stream enhances product absorption without needles or lasers. A celebrity-favorite "red carpet ready" treatment.',
    clinicalIndication: 'Dehydrated skin, dull complexion, event preparation, sensitive skin needing gentle treatment, smoker\'s complexion',

    steps: [
      { stepNumber: 1, name: 'Deep Cleanse', duration: 8, description: 'Double cleanse and gentle enzyme exfoliation to prepare skin for oxygen delivery.', products: ['Gentle cleanser', 'Enzyme exfoliant'] },
      { stepNumber: 2, name: 'Oxygen Serum Delivery', duration: 20, description: 'Using an oxygen concentrator and specialized wand, deliver pressurized stream of oxygen infused with hyaluronic acid, peptides, and vitamins directly into the skin. Cover entire face in systematic sections.', products: ['Oxygen concentrator', 'HA + peptide serum'] },
      { stepNumber: 3, name: 'Targeted Treatment', duration: 8, description: 'Apply concentrated serums to areas of concern (eye area, smile lines, forehead) using the oxygen wand for deeper penetration.', products: ['Targeted treatment serums'] },
      { stepNumber: 4, name: 'Mask', duration: 10, description: 'Apply hydrating sheet mask or cream mask while patient relaxes.', products: ['Hydrating mask'] },
      { stepNumber: 5, name: 'Finish', duration: 5, description: 'Remove mask, apply moisturizer and SPF.', products: ['Moisturizer', 'SPF 50+'] },
    ],
    totalDuration: 51,
    productsUsed: ['Oxygen concentrator', 'HA serum', 'Peptide complex', 'Vitamin serum', 'Hydrating mask', 'SPF 50+'],

    frequencyRecommendation: 'Every 1–4 weeks as desired',
    seriesProtocol: 'No specific series — treat as desired for glow and hydration',
    resultsTimeline: 'Immediate plumping, hydration, and glow. Effects last 1–2 weeks.',
    maintenanceSchedule: 'Weekly for events/special occasions; monthly for maintenance',

    contraindications: [
      'Active, inflamed acne (oxygen can feed bacteria)',
      'Claustrophobia with certain mask devices (rare)',
      'Allergy to any serum ingredients',
    ],
    precautions: [
      'Temporary benefit — not a structural treatment',
      'Manage expectations: excellent for glow, limited for deep concerns',
      'Best positioned as a luxury/event-prep treatment',
    ],
    potentialComplications: [
      'Virtually none',
      'Rare: slight sensitivity to pressurized air stream',
    ],
    riskLevel: 'low',

    preCare: ['No specific prep needed', 'Remove makeup before arriving or allow time'],
    aftercare: [
      { timeframe: 'Immediately', instruction: 'Enjoy the glow — no restrictions', priority: 'recommended' },
      { timeframe: 'Ongoing', instruction: 'Apply SPF daily', priority: 'recommended' },
    ],
    downtime: 'None',

    consentRequirements: {
      formId: 'CONSENT-FACIAL-001',
      formName: 'Facial Treatment Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: false,
    },
    cptCodes: [
      { code: '97140', description: 'Manual therapy techniques' },
    ],

    pricing: { min: 175, max: 250, unit: 'per session' },
    sessionDuration: 60,

    tags: ['oxygen', 'facial', 'hydration', 'glow', 'event-prep', 'red-carpet', 'gentle'],
    relatedProtocols: ['hydrafacial-signature', 'led-red', 'dermaplaning'],
    lastUpdated: '2026-03-01',
  },
];

export default SKIN_TREATMENT_PROTOCOLS;
