// ─── Laser & Device Treatment Protocols ─────────────────────────────────────
// 15 comprehensive laser/device protocols for Rani Beauty Clinic
// CRITICAL: "injection" only — never "infusion"

import type { LaserProtocol } from './types';

export const LASER_PROTOCOLS: LaserProtocol[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // LASER HAIR REMOVAL (6 body area variants)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'lhr-face',
    name: 'Laser Hair Removal — Face',
    category: 'laser',
    subcategory: 'hair-removal',
    treatmentArea: 'Full face (upper lip, chin, cheeks, sideburns, jawline)',
    description: 'Diode or Nd:YAG laser hair reduction targeting facial hair follicles. Settings are customized per Fitzpatrick type to ensure safe and effective treatment across all skin tones. Multiple sessions required for full reduction.',
    clinicalIndication: 'Unwanted facial hair, hirsutism, folliculitis barbae, PCOS-related facial hair',

    device: 'Diode 810nm / Nd:YAG 1064nm',
    handpiece: 'Large and small spot-size handpieces',
    defaultSettings: {
      wavelength: '810nm (Fitzpatrick I–IV) or 1064nm (Fitzpatrick V–VI)',
      energy: '20–40 J/cm²',
      pulseWidth: '30–100 ms',
      spotSize: '9–12 mm',
      fluence: '20–40 J/cm²',
      passes: 1,
      cooling: 'Integrated contact cooling or cryogen spray',
    },
    fitzpatrickSettings: [
      { skinType: 'I', settings: { energy: '30–40 J/cm²', pulseWidth: '30–50 ms', wavelength: '810nm' }, notes: 'Highest fluence tolerated. Monitor for erythema.' },
      { skinType: 'II', settings: { energy: '25–35 J/cm²', pulseWidth: '30–50 ms', wavelength: '810nm' }, notes: 'Standard settings. Good response expected.' },
      { skinType: 'III', settings: { energy: '20–30 J/cm²', pulseWidth: '40–60 ms', wavelength: '810nm' }, notes: 'Moderate fluence. Test patch recommended for first session.' },
      { skinType: 'IV', settings: { energy: '18–25 J/cm²', pulseWidth: '50–80 ms', wavelength: '810nm or 1064nm' }, notes: 'Consider Nd:YAG for added safety. Longer pulse widths.' },
      { skinType: 'V', settings: { energy: '15–22 J/cm²', pulseWidth: '60–100 ms', wavelength: '1064nm' }, notes: 'Nd:YAG only. Conservative fluence. Test patch mandatory.' },
      { skinType: 'VI', settings: { energy: '12–18 J/cm²', pulseWidth: '80–100 ms', wavelength: '1064nm' }, notes: 'Nd:YAG only. Lowest effective fluence. Extended pulse duration. Test patch mandatory.' },
    ],

    passCount: 1,
    overlapPercentage: 10,
    endpointIndicators: [
      'Perifollicular edema (goosebump-like appearance)',
      'Mild erythema surrounding follicles',
      'Slight singeing smell',
      'No blanching or blistering (over-treatment signs)',
    ],
    treatmentPattern: 'Grid pattern with 10% overlap, systematic coverage of entire treatment area',
    numSessions: '6–8 sessions',
    sessionInterval: '4–6 weeks (face)',

    contraindications: [
      'Active tan or sunburn in treatment area',
      'Pregnancy',
      'Active skin infection (herpes, folliculitis)',
      'Isotretinoin use within 6 months',
      'Gold therapy (contraindicated for laser)',
      'Photosensitizing medications',
      'Keloid-forming tendency in treatment area',
    ],
    precautions: [
      'Fitzpatrick V–VI: mandatory test patch 48 hours before first treatment',
      'Discontinue self-tanning products 2 weeks prior',
      'Shave treatment area 24 hours before (do not wax or pluck)',
      'Review medication list for photosensitizers',
      'Assess for hormonal causes of hair growth (PCOS, medications)',
    ],
    potentialComplications: [
      'Erythema and perifollicular edema (expected — resolves 24–48 hours)',
      'Burns and blisters (over-treatment or wrong settings for skin type)',
      'Hyperpigmentation (especially in darker skin types)',
      'Hypopigmentation (rare, usually temporary)',
      'Paradoxical hypertrichosis (rare — more common in face/neck)',
      'Scarring (very rare with proper settings)',
    ],
    riskLevel: 'low',
    difficultyLevel: 'intermediate',
    eyeProtection: 'Wavelength-specific laser safety goggles for patient and operator. Intra-oral eye shields if treating near orbital area.',

    preCare: [
      'Shave treatment area 24 hours before appointment',
      'Avoid sun exposure and tanning for 2–4 weeks prior',
      'Discontinue retinoids 1 week before',
      'No waxing, plucking, or threading for 4 weeks prior',
      'Remove all makeup and skincare products',
      'Apply topical anesthetic 30 minutes before if requested',
    ],
    aftercare: [
      { timeframe: 'Immediately', instruction: 'Apply soothing aloe vera or cooling gel', priority: 'important' },
      { timeframe: 'First 24 hours', instruction: 'Avoid hot showers, exercise, and sun exposure', priority: 'critical' },
      { timeframe: 'First 48 hours', instruction: 'No makeup on treated area; keep clean and dry', priority: 'important' },
      { timeframe: 'First 2 weeks', instruction: 'Apply SPF 50+ sunscreen daily; no tanning', priority: 'critical' },
      { timeframe: 'Ongoing', instruction: 'Shave only between sessions — never wax, pluck, or thread', priority: 'critical' },
    ],
    downtime: 'Minimal — redness and mild swelling for 24–48 hours',

    consentRequirements: {
      formId: 'CONSENT-LASER-001',
      formName: 'Laser Hair Removal Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '17380', description: 'Electrolysis epilation, each 30 minutes' },
    ],
    documentationRequirements: [
      'Fitzpatrick skin type assessment',
      'Pre-treatment photographs',
      'Device, settings, and spot size used',
      'Areas treated and number of pulses',
      'Immediate skin response documented',
      'Test patch results if applicable',
      'Signed consent',
    ],

    pricing: { min: 79, max: 275, unit: 'per session (area dependent)' },
    sessionDuration: 25,

    tags: ['laser-hair-removal', 'face', 'diode', 'ndyag', 'hair-reduction'],
    relatedProtocols: ['lhr-underarms', 'lhr-bikini', 'lhr-legs', 'lhr-body-male', 'lhr-full-body'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'lhr-underarms',
    name: 'Laser Hair Removal — Underarms',
    category: 'laser',
    subcategory: 'hair-removal',
    treatmentArea: 'Bilateral axillae (underarms)',
    description: 'Laser hair reduction for underarm hair. One of the most popular and effective laser hair removal areas due to the density and pigmentation of axillary hair. Most patients see significant permanent reduction within 6 sessions.',
    clinicalIndication: 'Unwanted underarm hair, folliculitis, ingrown hairs, hyperhidrosis-related grooming',

    device: 'Diode 810nm / Nd:YAG 1064nm',
    handpiece: 'Medium spot-size handpiece',
    defaultSettings: {
      wavelength: '810nm',
      energy: '25–40 J/cm²',
      pulseWidth: '30–60 ms',
      spotSize: '9–12 mm',
      passes: 1,
      cooling: 'Integrated contact cooling',
    },
    fitzpatrickSettings: [
      { skinType: 'I', settings: { energy: '35–40 J/cm²', pulseWidth: '30 ms' }, notes: 'High fluence well tolerated' },
      { skinType: 'II', settings: { energy: '30–38 J/cm²', pulseWidth: '30–40 ms' }, notes: 'Standard settings' },
      { skinType: 'III', settings: { energy: '25–32 J/cm²', pulseWidth: '40–50 ms' }, notes: 'Moderate settings' },
      { skinType: 'IV', settings: { energy: '20–28 J/cm²', pulseWidth: '50–60 ms', wavelength: '810nm or 1064nm' }, notes: 'Consider Nd:YAG' },
      { skinType: 'V', settings: { energy: '15–22 J/cm²', pulseWidth: '60–80 ms', wavelength: '1064nm' }, notes: 'Nd:YAG required' },
      { skinType: 'VI', settings: { energy: '12–18 J/cm²', pulseWidth: '80–100 ms', wavelength: '1064nm' }, notes: 'Nd:YAG only, conservative' },
    ],

    passCount: 1,
    overlapPercentage: 10,
    endpointIndicators: [
      'Perifollicular edema',
      'Mild erythema',
      'Hair singeing at surface',
    ],
    treatmentPattern: 'Systematic grid coverage with arm raised overhead',
    numSessions: '6 sessions',
    sessionInterval: '4–6 weeks',

    contraindications: [
      'Active tan or sunburn',
      'Pregnancy',
      'Active folliculitis (treat first)',
      'Recent use of deodorant with irritating ingredients',
      'Isotretinoin within 6 months',
    ],
    precautions: [
      'Shave 24 hours before; avoid deodorant day of treatment',
      'Check for skin sensitivity from deodorant products',
      'Axillary skin can be sensitive — start at lower settings',
    ],
    potentialComplications: [
      'Erythema and edema (expected)',
      'Burns (rare with proper settings)',
      'Hyperpigmentation of axillary skin',
      'Folliculitis (temporary)',
    ],
    riskLevel: 'low',
    difficultyLevel: 'beginner',
    eyeProtection: 'Wavelength-specific goggles for patient and operator',

    preCare: [
      'Shave 24 hours before',
      'No deodorant or antiperspirant day of treatment',
      'Avoid sun exposure for 2 weeks prior',
      'No waxing for 4 weeks prior',
    ],
    aftercare: [
      { timeframe: 'Immediately', instruction: 'Apply cooling aloe gel', priority: 'important' },
      { timeframe: 'First 24 hours', instruction: 'No deodorant, hot showers, or exercise', priority: 'critical' },
      { timeframe: 'First 48 hours', instruction: 'Wear loose-fitting clothing', priority: 'recommended' },
      { timeframe: 'Ongoing', instruction: 'Shave only between sessions; apply SPF if exposed', priority: 'important' },
    ],
    downtime: 'None — mild redness for 24 hours',

    consentRequirements: {
      formId: 'CONSENT-LASER-001',
      formName: 'Laser Hair Removal Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: false,
    },
    cptCodes: [
      { code: '17380', description: 'Electrolysis epilation, each 30 minutes' },
    ],
    documentationRequirements: [
      'Fitzpatrick assessment',
      'Device settings',
      'Number of pulses',
      'Skin response',
      'Signed consent',
    ],

    pricing: { min: 149, max: 149, unit: 'per session' },
    sessionDuration: 10,

    tags: ['laser-hair-removal', 'underarms', 'axillae'],
    relatedProtocols: ['lhr-face', 'lhr-bikini', 'lhr-full-body'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'lhr-bikini',
    name: 'Laser Hair Removal — Brazilian / Bikini',
    category: 'laser',
    subcategory: 'hair-removal',
    treatmentArea: 'Full Brazilian or bikini line',
    description: 'Comprehensive laser hair reduction for the bikini area, from standard bikini line to full Brazilian (labia to perianal). Intimate area requires careful attention to skin sensitivity and patient comfort.',
    clinicalIndication: 'Unwanted pubic/perianal hair, ingrown hairs, folliculitis, grooming preference',

    device: 'Diode 810nm / Nd:YAG 1064nm',
    handpiece: 'Medium spot-size handpiece',
    defaultSettings: {
      wavelength: '810nm',
      energy: '20–35 J/cm²',
      pulseWidth: '30–80 ms',
      spotSize: '9–12 mm',
      passes: 1,
      cooling: 'Integrated contact cooling',
    },
    fitzpatrickSettings: [
      { skinType: 'I', settings: { energy: '30–35 J/cm²', pulseWidth: '30–40 ms' }, notes: 'Standard high fluence' },
      { skinType: 'II', settings: { energy: '28–33 J/cm²', pulseWidth: '30–40 ms' }, notes: 'Standard settings' },
      { skinType: 'III', settings: { energy: '22–28 J/cm²', pulseWidth: '40–50 ms' }, notes: 'Moderate — skin color may differ from extremities' },
      { skinType: 'IV', settings: { energy: '18–25 J/cm²', pulseWidth: '50–60 ms' }, notes: 'Note: genital skin is often darker than other body areas' },
      { skinType: 'V', settings: { energy: '14–20 J/cm²', pulseWidth: '60–80 ms', wavelength: '1064nm' }, notes: 'Nd:YAG preferred; be especially conservative on labia' },
      { skinType: 'VI', settings: { energy: '12–16 J/cm²', pulseWidth: '80–100 ms', wavelength: '1064nm' }, notes: 'Nd:YAG only; very conservative on pigmented areas' },
    ],

    passCount: 1,
    overlapPercentage: 10,
    endpointIndicators: [
      'Perifollicular edema',
      'Mild erythema',
      'Patient reports warmth (not pain)',
    ],
    treatmentPattern: 'Systematic grid; patient positions for access to all areas; reduce settings on inner labia and perianal (thinner, more sensitive skin)',
    numSessions: '6–8 sessions',
    sessionInterval: '4–6 weeks',

    contraindications: [
      'Active STI or genital infection',
      'Pregnancy',
      'Active tan',
      'Open wounds or lesions',
      'Isotretinoin within 6 months',
    ],
    precautions: [
      'Genital skin is more sensitive and often more pigmented than extremities',
      'Reduce fluence on inner labia and perianal area',
      'Ensure patient comfort and privacy at all times',
      'Topical numbing cream recommended',
    ],
    potentialComplications: [
      'Erythema and edema',
      'Burns (higher risk on sensitive genital skin)',
      'Hyperpigmentation',
      'Folliculitis',
      'Blistering (if settings too aggressive)',
    ],
    riskLevel: 'low',
    difficultyLevel: 'intermediate',
    eyeProtection: 'Wavelength-specific goggles for patient and operator',

    preCare: [
      'Shave entire treatment area 24 hours before',
      'Apply topical numbing cream 30 minutes before if desired',
      'No waxing, sugaring, or plucking for 4 weeks prior',
      'Clean treatment area; no lotions or creams day of',
    ],
    aftercare: [
      { timeframe: 'Immediately', instruction: 'Apply soothing aloe gel', priority: 'important' },
      { timeframe: 'First 24 hours', instruction: 'Avoid tight clothing, hot baths, and sexual activity', priority: 'critical' },
      { timeframe: 'First 48 hours', instruction: 'No exercise or swimming', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Shave only between sessions; exfoliate gently after 1 week', priority: 'recommended' },
    ],
    downtime: 'None — redness for 24–48 hours',

    consentRequirements: {
      formId: 'CONSENT-LASER-001',
      formName: 'Laser Hair Removal Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: false,
    },
    cptCodes: [
      { code: '17380', description: 'Electrolysis epilation, each 30 minutes' },
    ],
    documentationRequirements: [
      'Fitzpatrick assessment',
      'Device settings per zone',
      'Patient comfort level',
      'Signed consent',
    ],

    pricing: { min: 135, max: 225, unit: 'per session' },
    sessionDuration: 20,

    tags: ['laser-hair-removal', 'bikini', 'brazilian', 'intimate'],
    relatedProtocols: ['lhr-legs', 'lhr-underarms', 'lhr-full-body'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'lhr-legs',
    name: 'Laser Hair Removal — Full Legs',
    category: 'laser',
    subcategory: 'hair-removal',
    treatmentArea: 'Full legs (bilateral — ankle to upper thigh)',
    description: 'Comprehensive laser hair reduction for the full leg area. Large treatment area requiring systematic coverage and stamina from both operator and patient. Excellent results due to thick, pigmented leg hair.',
    clinicalIndication: 'Unwanted leg hair, folliculitis, pseudofolliculitis',

    device: 'Diode 810nm / Nd:YAG 1064nm',
    handpiece: 'Large spot-size handpiece with high speed/large coverage',
    defaultSettings: {
      wavelength: '810nm',
      energy: '25–40 J/cm²',
      pulseWidth: '30–60 ms',
      spotSize: '12–15 mm (large spot for speed)',
      passes: 1,
      cooling: 'Integrated contact cooling',
    },
    fitzpatrickSettings: [
      { skinType: 'I', settings: { energy: '35–40 J/cm²', pulseWidth: '30 ms' }, notes: 'Excellent response expected' },
      { skinType: 'II', settings: { energy: '30–38 J/cm²', pulseWidth: '30–40 ms' }, notes: 'Standard settings; good contrast' },
      { skinType: 'III', settings: { energy: '25–33 J/cm²', pulseWidth: '40–50 ms' }, notes: 'Check for tan before proceeding' },
      { skinType: 'IV', settings: { energy: '20–28 J/cm²', pulseWidth: '50–60 ms' }, notes: 'Assess for recent sun exposure' },
      { skinType: 'V', settings: { energy: '15–22 J/cm²', pulseWidth: '60–80 ms', wavelength: '1064nm' }, notes: 'Nd:YAG only' },
      { skinType: 'VI', settings: { energy: '12–18 J/cm²', pulseWidth: '80–100 ms', wavelength: '1064nm' }, notes: 'Nd:YAG only; conservative approach' },
    ],

    passCount: 1,
    overlapPercentage: 10,
    endpointIndicators: ['Perifollicular edema', 'Mild erythema', 'Hair singeing'],
    treatmentPattern: 'Systematic vertical strips from ankle to thigh, anterior then posterior. Mark treated zones to avoid missed areas.',
    numSessions: '6–8 sessions',
    sessionInterval: '6–8 weeks (legs have longer hair cycle)',

    contraindications: [
      'Active tan or sunburn',
      'Pregnancy',
      'Isotretinoin within 6 months',
      'Varicose veins directly over laser path (relative)',
    ],
    precautions: [
      'Legs are the most sun-exposed area — verify no recent tanning',
      'Large area — monitor for cumulative thermal buildup',
      'Knees and ankles may need reduced settings (bonier, less subcutaneous tissue)',
    ],
    potentialComplications: [
      'Erythema and edema (expected)',
      'Burns (check for tan)',
      'Hyperpigmentation (sun-exposed area)',
      'Folliculitis',
    ],
    riskLevel: 'low',
    difficultyLevel: 'beginner',
    eyeProtection: 'Wavelength-specific goggles for patient and operator',

    preCare: [
      'Shave legs completely 24 hours before',
      'No sun exposure or self-tanner for 2–4 weeks',
      'No waxing for 4 weeks prior',
      'No lotions or creams on day of treatment',
    ],
    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'Apply aloe vera; avoid hot showers and exercise', priority: 'important' },
      { timeframe: 'First 2 weeks', instruction: 'Apply SPF 50+ sunscreen on legs daily', priority: 'critical' },
      { timeframe: 'First week', instruction: 'Avoid swimming pools and hot tubs', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Shave only between sessions; exfoliate gently after 1 week to prevent ingrowns', priority: 'recommended' },
    ],
    downtime: 'None',

    consentRequirements: {
      formId: 'CONSENT-LASER-001',
      formName: 'Laser Hair Removal Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: false,
    },
    cptCodes: [
      { code: '17380', description: 'Electrolysis epilation, each 30 minutes' },
    ],
    documentationRequirements: ['Fitzpatrick assessment', 'Device settings', 'Areas covered', 'Signed consent'],

    pricing: { min: 225, max: 375, unit: 'per session' },
    sessionDuration: 43,

    tags: ['laser-hair-removal', 'legs', 'full-legs'],
    relatedProtocols: ['lhr-bikini', 'lhr-full-body'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'lhr-body-male',
    name: 'Laser Hair Removal — Male (Chest/Back)',
    category: 'laser',
    subcategory: 'hair-removal',
    treatmentArea: 'Full chest and/or full back (male)',
    description: 'Large-area laser hair reduction for male body hair. Males typically require higher fluences and more sessions due to hormonal influences on hair growth. Systematic coverage is essential for these large zones.',
    clinicalIndication: 'Unwanted chest/back hair, folliculitis, grooming/aesthetic preference, athletic performance',

    device: 'Diode 810nm / Nd:YAG 1064nm',
    handpiece: 'Large spot-size handpiece',
    defaultSettings: {
      wavelength: '810nm',
      energy: '25–40 J/cm²',
      pulseWidth: '30–60 ms',
      spotSize: '12–15 mm',
      passes: 1,
      cooling: 'Integrated contact cooling',
    },
    fitzpatrickSettings: [
      { skinType: 'I', settings: { energy: '35–40 J/cm²', pulseWidth: '30 ms' }, notes: 'Standard high fluence' },
      { skinType: 'II', settings: { energy: '30–38 J/cm²', pulseWidth: '30–40 ms' }, notes: 'Good contrast expected' },
      { skinType: 'III', settings: { energy: '25–32 J/cm²', pulseWidth: '40–50 ms' }, notes: 'Moderate settings' },
      { skinType: 'IV', settings: { energy: '20–28 J/cm²', pulseWidth: '50–60 ms' }, notes: 'May need Nd:YAG' },
      { skinType: 'V', settings: { energy: '15–22 J/cm²', pulseWidth: '60–80 ms', wavelength: '1064nm' }, notes: 'Nd:YAG required' },
      { skinType: 'VI', settings: { energy: '12–18 J/cm²', pulseWidth: '80–100 ms', wavelength: '1064nm' }, notes: 'Nd:YAG only; conservative' },
    ],

    passCount: 1,
    overlapPercentage: 10,
    endpointIndicators: ['Perifollicular edema', 'Mild erythema', 'Hair singeing'],
    treatmentPattern: 'Grid pattern with overlap marking. Divide into quadrants for chest. Back treated in vertical strips from shoulders to waist.',
    numSessions: '8–10 sessions (male body hair more resistant)',
    sessionInterval: '6–8 weeks',

    contraindications: [
      'Active tan',
      'Open wounds or moles in treatment zone',
      'Isotretinoin within 6 months',
      'Photosensitizing medications',
    ],
    precautions: [
      'Male body hair is hormonally driven — may need more sessions and maintenance',
      'Large area — monitor thermal load and patient comfort',
      'Chest hair over nipples — reduce fluence or avoid',
      'Back requires two-person positioning',
    ],
    potentialComplications: [
      'Erythema (expected)',
      'Folliculitis',
      'Burns (large area — monitor settings)',
      'Incomplete reduction (hormonal influence)',
    ],
    riskLevel: 'low',
    difficultyLevel: 'beginner',
    eyeProtection: 'Wavelength-specific goggles for patient and operator',

    preCare: [
      'Shave treatment area 24 hours before (may need assistance for back)',
      'No sun exposure for 2–4 weeks',
      'No waxing for 4 weeks prior',
    ],
    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'Apply soothing gel; no tight shirts', priority: 'important' },
      { timeframe: 'First 48 hours', instruction: 'No exercise, hot showers, or saunas', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Apply SPF 50+ if areas are sun-exposed', priority: 'important' },
    ],
    downtime: 'None — redness 24 hours',

    consentRequirements: {
      formId: 'CONSENT-LASER-001',
      formName: 'Laser Hair Removal Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: false,
    },
    cptCodes: [
      { code: '17380', description: 'Electrolysis epilation, each 30 minutes' },
    ],
    documentationRequirements: ['Fitzpatrick assessment', 'Device settings', 'Areas and pulse count', 'Signed consent'],

    pricing: { min: 225, max: 375, unit: 'per area per session' },
    sessionDuration: 35,

    tags: ['laser-hair-removal', 'male', 'chest', 'back', 'body'],
    relatedProtocols: ['lhr-full-body', 'lhr-face'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'lhr-full-body',
    name: 'Laser Hair Removal — Full Body',
    category: 'laser',
    subcategory: 'hair-removal',
    treatmentArea: 'Complete body coverage (face to toes)',
    description: 'Comprehensive full-body laser hair reduction package. The ultimate convenience — all areas treated in one extended session. Best value for patients wanting widespread hair reduction.',
    clinicalIndication: 'Comprehensive hair reduction, hirsutism, personal preference',

    device: 'Diode 810nm / Nd:YAG 1064nm',
    handpiece: 'Large and small spot-size handpieces',
    defaultSettings: {
      wavelength: '810nm',
      energy: '20–40 J/cm² (varies by area)',
      pulseWidth: '30–100 ms (varies by area and skin type)',
      spotSize: '9–15 mm (area dependent)',
      passes: 1,
      cooling: 'Integrated contact cooling',
    },

    passCount: 1,
    overlapPercentage: 10,
    endpointIndicators: ['Perifollicular edema per zone', 'Mild erythema', 'Hair singeing'],
    treatmentPattern: 'Systematic coverage zone by zone: face, underarms, arms, chest/abs, bikini/Brazilian, legs, back. Settings adjusted per zone and skin type.',
    numSessions: '6–8 sessions',
    sessionInterval: '4–8 weeks (varies by area)',

    contraindications: [
      'Active tan or sunburn on any treatment area',
      'Pregnancy',
      'Isotretinoin within 6 months',
      'Widespread skin infection',
    ],
    precautions: [
      'Shave entire body 24 hours before — this is a significant prep commitment',
      'Adjust settings per body zone (face vs legs vs bikini)',
      'Monitor patient comfort throughout long session',
      'Schedule breaks during treatment',
    ],
    potentialComplications: [
      'Zone-specific erythema and edema',
      'Higher cumulative discomfort',
      'Zone-specific complications per area',
    ],
    riskLevel: 'low',
    difficultyLevel: 'intermediate',
    eyeProtection: 'Wavelength-specific goggles; intra-oral shields for facial treatment',

    preCare: [
      'Shave all treatment areas 24 hours before',
      'No sun exposure for 2–4 weeks on all areas',
      'No lotions, deodorant, or makeup day of treatment',
      'Consider topical numbing for sensitive areas',
    ],
    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'Apply soothing aloe gel; no hot showers, exercise, or pools', priority: 'critical' },
      { timeframe: 'First 48 hours', instruction: 'Wear loose, breathable clothing', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Apply SPF 50+ on all sun-exposed treated areas', priority: 'critical' },
    ],
    downtime: 'None — widespread mild redness for 24 hours',

    consentRequirements: {
      formId: 'CONSENT-LASER-001',
      formName: 'Laser Hair Removal Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: false,
    },
    cptCodes: [
      { code: '17380', description: 'Electrolysis epilation, each 30 minutes' },
    ],
    documentationRequirements: ['Fitzpatrick assessment', 'Settings per zone', 'Comprehensive zone coverage notes', 'Signed consent'],

    pricing: { min: 1199, max: 1199, unit: 'per session' },
    sessionDuration: 105,

    tags: ['laser-hair-removal', 'full-body', 'comprehensive', 'best-value'],
    relatedProtocols: ['lhr-face', 'lhr-underarms', 'lhr-bikini', 'lhr-legs', 'lhr-body-male'],
    lastUpdated: '2026-03-01',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PICOWAY PROTOCOLS (3)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'picoway-tattoo',
    name: 'PicoWay — Tattoo Removal',
    category: 'laser',
    subcategory: 'pigment',
    treatmentArea: 'Tattoo location (any body area)',
    description: 'PicoWay picosecond laser for tattoo removal. Ultra-short pulse durations shatter ink particles into smaller fragments than nanosecond lasers, enabling faster clearance with fewer sessions. Effective on multicolored tattoos including traditionally resistant blues and greens.',
    clinicalIndication: 'Tattoo removal (professional, amateur, cosmetic, traumatic)',

    device: 'PicoWay (Candela)',
    handpiece: 'PicoWay 532nm (red/orange/yellow), 785nm (blue/green), 1064nm (black/dark)',
    defaultSettings: {
      wavelength: '1064nm for black/dark; 532nm for reds; 785nm for blues/greens',
      energy: '200–400 mJ (spot size dependent)',
      pulseWidth: '300–450 picoseconds',
      spotSize: '2–6 mm (smaller = higher fluence)',
      fluence: '1.0–4.0 J/cm²',
      passes: 1,
      cooling: 'Forced air cooling (Zimmer)',
    },

    passCount: 1,
    overlapPercentage: 0,
    endpointIndicators: [
      'Immediate whitening/frosting of tattoo (steam cavitation)',
      'Pinpoint bleeding (acceptable in darker tattoos)',
      'Erythema surrounding tattoo',
      'Slight tissue swelling',
    ],
    treatmentPattern: 'Systematic coverage of entire tattoo. Start at one edge, proceed across with adjacent non-overlapping spots. Multiple wavelengths in same session for multicolor tattoos.',
    numSessions: '4–10+ sessions (amateur: 4–6; professional: 6–10+)',
    sessionInterval: '6–8 weeks',

    contraindications: [
      'Active tan over tattoo area',
      'Keloidal scarring tendency',
      'Pregnancy',
      'Active skin infection over tattoo',
      'Gold therapy',
      'Isotretinoin within 6 months',
    ],
    precautions: [
      'Assess tattoo ink colors to select wavelengths',
      'Cosmetic tattoos (eyebrows, lip liner) may darken — test patch first',
      'Traumatic tattoos may contain metal — proceed cautiously',
      'White and yellow inks are most resistant',
      'Patient must commit to multi-session treatment course',
    ],
    potentialComplications: [
      'Blistering and crusting (common — expected healing response)',
      'Hypopigmentation (temporary or permanent)',
      'Hyperpigmentation',
      'Incomplete removal (some colors/inks resistant)',
      'Scarring (rare with picosecond technology)',
      'Infection (if aftercare not followed)',
      'Paradoxical darkening of cosmetic tattoos',
    ],
    riskLevel: 'moderate',
    difficultyLevel: 'intermediate',
    eyeProtection: 'Wavelength-specific laser goggles; periorbital metal shields if near eyes',

    preCare: [
      'Avoid sun exposure on tattoo for 4 weeks prior',
      'Shave over tattoo if hair is present',
      'No retinoids for 1 week before',
      'Topical numbing cream applied 45–60 minutes before',
    ],
    aftercare: [
      { timeframe: 'Immediately', instruction: 'Apply antibiotic ointment and non-stick bandage', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'Keep bandage on; ice 10 min on/off for comfort', priority: 'important' },
      { timeframe: 'First 2 weeks', instruction: 'Keep clean and dry; apply antibiotic ointment 2x daily; do not pick blisters or scabs', priority: 'critical' },
      { timeframe: 'First 4 weeks', instruction: 'No sun exposure; apply SPF 50+ once healed', priority: 'critical' },
      { timeframe: 'Ongoing', instruction: 'No swimming or soaking until fully healed (2–3 weeks)', priority: 'important' },
    ],
    downtime: 'Moderate — blistering, crusting, and peeling for 1–3 weeks',

    consentRequirements: {
      formId: 'CONSENT-LASER-002',
      formName: 'Tattoo Removal Laser Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '17999', description: 'Unlisted procedure, skin, mucous membrane and subcutaneous tissue' },
    ],
    documentationRequirements: [
      'Pre-treatment tattoo photographs with ruler',
      'Tattoo dimensions, colors, and type (professional/amateur)',
      'Device settings per wavelength used',
      'Tissue response documented',
      'Session number and cumulative progress',
      'Signed consent',
    ],

    pricing: { min: 350, max: 600, unit: 'per session (size dependent)' },
    sessionDuration: 30,

    tags: ['picoway', 'tattoo-removal', 'picosecond', 'laser', 'pigment'],
    relatedProtocols: ['picoway-pigmentation', 'picoway-revitalization'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'picoway-pigmentation',
    name: 'PicoWay — Pigmentation Treatment',
    category: 'laser',
    subcategory: 'pigment',
    treatmentArea: 'Face, hands, decolletage (pigmented lesions)',
    description: 'PicoWay picosecond laser targeting melanin-containing pigmented lesions. Ultra-short pulses fragment melanin with minimal thermal damage, reducing downtime and risk of post-inflammatory hyperpigmentation compared to Q-switched lasers.',
    clinicalIndication: 'Lentigines (sun spots), melasma (adjunct), post-inflammatory hyperpigmentation, cafe-au-lait macules, freckles',

    device: 'PicoWay (Candela)',
    handpiece: 'PicoWay 532nm and/or 1064nm',
    defaultSettings: {
      wavelength: '532nm for superficial pigment; 1064nm for deeper pigment',
      energy: '100–300 mJ',
      pulseWidth: '300–450 picoseconds',
      spotSize: '3–6 mm',
      fluence: '0.5–2.5 J/cm²',
      passes: 1,
      cooling: 'Forced air cooling',
    },

    passCount: 1,
    overlapPercentage: 0,
    endpointIndicators: [
      'Immediate whitening/graying of lesion',
      'Subtle tissue swelling',
      'No blanching of surrounding skin',
    ],
    treatmentPattern: 'Target individual lesions with appropriate spot size. Slightly overlap edges of larger lesions. Avoid surrounding normal skin.',
    numSessions: '1–3 sessions for lentigines; 3–6 for diffuse pigmentation',
    sessionInterval: '4–6 weeks',

    contraindications: [
      'Active tan',
      'Melasma as primary indication (use as adjunct only)',
      'Pregnancy',
      'Active skin infection',
      'Suspicious pigmented lesion (rule out melanoma first)',
    ],
    precautions: [
      'ALL pigmented lesions must be assessed for atypia before treatment',
      'Melasma can worsen with aggressive laser — use cautiously',
      'Post-inflammatory hyperpigmentation risk higher in Fitzpatrick IV–VI',
      'Start conservatively; can increase at subsequent sessions',
    ],
    potentialComplications: [
      'Post-inflammatory hyperpigmentation (especially darker skin types)',
      'Hypopigmentation',
      'Blistering (if settings too aggressive)',
      'Incomplete clearance',
      'Recurrence (especially sun-induced lesions)',
    ],
    riskLevel: 'moderate',
    difficultyLevel: 'intermediate',
    eyeProtection: 'Wavelength-specific goggles; corneal shields if treating periorbital',

    preCare: [
      'Avoid sun exposure for 4 weeks',
      'Discontinue retinoids 1 week before',
      'Hydroquinone pre-treatment for 2–4 weeks (for PIH-prone patients)',
      'Dermatologic assessment of all pigmented lesions',
    ],
    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'Apply gentle moisturizer; avoid sun', priority: 'critical' },
      { timeframe: 'First week', instruction: 'Treated spots will darken then flake off — do not pick', priority: 'critical' },
      { timeframe: 'First 4 weeks', instruction: 'Apply SPF 50+ daily without exception', priority: 'critical' },
      { timeframe: 'Ongoing', instruction: 'Maintain strict sun protection to prevent recurrence', priority: 'important' },
    ],
    downtime: 'Minimal — darkened spots (1–2 weeks) that flake off naturally',

    consentRequirements: {
      formId: 'CONSENT-LASER-003',
      formName: 'Pigment Laser Treatment Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '17000', description: 'Destruction of benign lesion(s), first lesion' },
      { code: '17003', description: 'Destruction of benign lesion(s), each additional lesion' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs of all lesions',
      'Lesion assessment (rule out atypia)',
      'Device settings per lesion/area',
      'Tissue response',
      'Signed consent',
    ],

    pricing: { min: 350, max: 600, unit: 'per session' },
    sessionDuration: 30,

    tags: ['picoway', 'pigmentation', 'sun-spots', 'lentigines', 'picosecond'],
    relatedProtocols: ['picoway-tattoo', 'picoway-revitalization', 'ipl-pigment'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'picoway-revitalization',
    name: 'PicoWay Resolve — Skin Revitalization',
    category: 'laser',
    subcategory: 'skin-revitalization',
    treatmentArea: 'Full face, neck, decolletage',
    description: 'PicoWay Resolve fractional handpiece for overall skin revitalization. Creates laser-induced optical breakdown (LIOB) in the dermis to stimulate collagen and elastin remodeling without surface disruption. Minimal downtime with progressive skin quality improvement.',
    clinicalIndication: 'Fine lines, pore size, skin texture, acne scars (mild), early photodamage, overall skin quality improvement',

    device: 'PicoWay (Candela)',
    handpiece: 'PicoWay Resolve 532nm or 1064nm fractional handpiece',
    defaultSettings: {
      wavelength: '1064nm (standard) or 532nm (more superficial)',
      energy: '50–100 mJ per beam',
      pulseWidth: '300–450 picoseconds',
      spotSize: '6 mm holographic fractional',
      fluence: '0.5–1.5 J/cm²',
      passes: 3,
      cooling: 'Forced air cooling',
    },

    passCount: 3,
    overlapPercentage: 30,
    endpointIndicators: [
      'Mild erythema',
      'Subtle edema',
      'Slight warming of tissue',
      'No surface disruption',
    ],
    treatmentPattern: 'Full-face coverage with systematic passes. Overlap each pass by 30% for uniform coverage. Can increase passes on areas of concern (crow\'s feet, perioral lines, acne scars).',
    numSessions: '3–6 sessions',
    sessionInterval: '4–6 weeks',

    contraindications: [
      'Active tan',
      'Pregnancy',
      'Active acne or skin infection',
      'Isotretinoin within 6 months',
      'Unrealistic expectations (this is a gradual improvement)',
    ],
    precautions: [
      'Results are subtle and cumulative — set expectations',
      'Excellent "maintenance" laser between more aggressive treatments',
      'Can be combined with other modalities same day in some cases',
    ],
    potentialComplications: [
      'Mild erythema (24–48 hours)',
      'Edema (24 hours)',
      'Hyperpigmentation (rare with picosecond)',
      'Very low complication rate overall',
    ],
    riskLevel: 'low',
    difficultyLevel: 'beginner',
    eyeProtection: 'Wavelength-specific goggles; corneal shields if treating close to eyes',

    preCare: [
      'Avoid sun for 2 weeks',
      'Discontinue retinoids 3–5 days before',
      'Clean skin, no makeup',
    ],
    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'Apply gentle moisturizer; mild redness is normal', priority: 'important' },
      { timeframe: 'First week', instruction: 'Apply SPF 50+ daily; no retinoids for 5 days', priority: 'critical' },
      { timeframe: 'Ongoing', instruction: 'Maintain consistent skincare routine for best cumulative results', priority: 'recommended' },
    ],
    downtime: 'Minimal — mild redness for 24 hours. "Lunchtime" laser procedure.',

    consentRequirements: {
      formId: 'CONSENT-LASER-004',
      formName: 'Laser Skin Revitalization Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '17999', description: 'Unlisted procedure, skin, mucous membrane and subcutaneous tissue' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs',
      'Device settings and pass count',
      'Areas treated',
      'Signed consent',
    ],

    pricing: { min: 450, max: 650, unit: 'per session' },
    sessionDuration: 30,

    tags: ['picoway', 'resolve', 'revitalization', 'collagen', 'texture', 'anti-aging'],
    relatedProtocols: ['picoway-pigmentation', 'sofwave-face', 'rf-microneedling-face'],
    lastUpdated: '2026-03-01',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // IPL PROTOCOL
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'ipl-photofacial',
    name: 'IPL Photofacial — Vascular & Pigment',
    category: 'laser',
    subcategory: 'skin-revitalization',
    treatmentArea: 'Full face, neck, decolletage, hands',
    description: 'Intense Pulsed Light (IPL) photofacial targeting both vascular and pigmented concerns simultaneously. Broadband light selectively targets hemoglobin and melanin to reduce redness, broken capillaries, sun spots, and uneven tone. The gold standard for photodamage treatment.',
    clinicalIndication: 'Rosacea, telangiectasia, sun damage, lentigines, uneven skin tone, diffuse redness, broken blood vessels',

    device: 'Lumenis Stellar M22 or equivalent broadband IPL',
    handpiece: 'Universal IPL handpiece with filters',
    defaultSettings: {
      wavelength: '515–1200nm (broadband, filtered)',
      energy: '8–16 J/cm²',
      pulseWidth: '3–6 ms (dual pulse with 10–40 ms delay)',
      spotSize: '15 x 35 mm rectangular',
      passes: 1,
      cooling: 'Integrated sapphire contact cooling',
    },

    passCount: 1,
    overlapPercentage: 10,
    endpointIndicators: [
      'Pigmented lesions darken immediately',
      'Vascular lesions blanch or darken',
      'Mild erythema of surrounding skin',
      'Patient reports mild warmth/snap sensation',
    ],
    treatmentPattern: 'Full-face coverage in systematic rows. Single pulse per area with 10% overlap. Apply gel coupling medium. Start at forehead, work down. Avoid eyelids and eyebrows.',
    numSessions: '3–6 sessions',
    sessionInterval: '4 weeks',

    contraindications: [
      'Active tan or recent sun exposure (within 2–4 weeks)',
      'Fitzpatrick V–VI (risk of burns and hyperpigmentation)',
      'Pregnancy',
      'Photosensitizing medications (doxycycline, isotretinoin)',
      'Active herpes outbreak',
      'Melasma (may worsen)',
      'Gold therapy',
    ],
    precautions: [
      'NOT safe for dark skin types (Fitzpatrick V–VI) — use laser alternatives',
      'Reduce energy over bony prominences (forehead, nose, chin)',
      'Avoid treating over tattoos or permanent makeup',
      'Melasma can worsen dramatically with IPL — assess carefully',
      'Test patch recommended for first treatment',
    ],
    potentialComplications: [
      'Burns and blistering (wrong settings or tan)',
      'Hyperpigmentation (especially in darker skin types)',
      'Hypopigmentation',
      'Herpes reactivation',
      'Purpura (with vascular treatment — expected in some cases)',
      'Eye injury (if protection inadequate)',
    ],
    riskLevel: 'moderate',
    difficultyLevel: 'intermediate',
    eyeProtection: 'Opaque corneal shields for patient; IPL-rated goggles for operator. NEVER treat without eye protection.',

    preCare: [
      'Avoid sun exposure for 2–4 weeks',
      'Discontinue retinoids 1 week before',
      'No self-tanner for 2 weeks',
      'Review all medications for photosensitizers',
      'Antiviral prophylaxis if HSV history',
    ],
    aftercare: [
      { timeframe: 'Immediately', instruction: 'Apply soothing moisturizer; mild redness is normal', priority: 'important' },
      { timeframe: 'First 24 hours', instruction: 'Avoid hot showers, exercise, and alcohol', priority: 'important' },
      { timeframe: 'First 2 weeks', instruction: 'Dark spots will darken then flake off — do not pick or scrub', priority: 'critical' },
      { timeframe: 'First 4 weeks', instruction: 'Apply SPF 50+ sunscreen every single day without exception', priority: 'critical' },
      { timeframe: 'Ongoing', instruction: 'Maintain SPF regimen; schedule next session in 4 weeks', priority: 'important' },
    ],
    downtime: 'Minimal — redness (24 hours), darkened spots (5–10 days)',

    consentRequirements: {
      formId: 'CONSENT-LASER-005',
      formName: 'IPL/BBL Photofacial Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '17000', description: 'Destruction of benign lesion(s), first lesion' },
      { code: '17003', description: 'Destruction of benign lesion(s), each additional lesion' },
      { code: '96920', description: 'Laser treatment for inflammatory skin disease, total area less than 250 sq cm' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs',
      'Fitzpatrick type and tan assessment',
      'Device settings and filter used',
      'Areas treated',
      'Tissue response per zone',
      'Signed consent',
    ],

    pricing: { min: 350, max: 550, unit: 'per session' },
    sessionDuration: 30,

    tags: ['ipl', 'photofacial', 'rosacea', 'sun-damage', 'pigment', 'vascular'],
    relatedProtocols: ['picoway-pigmentation', 'picoway-revitalization'],
    lastUpdated: '2026-03-01',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SOFWAVE PROTOCOLS (2)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'sofwave-face',
    name: 'Sofwave — Face & Neck Lifting',
    category: 'laser',
    subcategory: 'skin-tightening',
    treatmentArea: 'Full face and neck',
    description: 'Sofwave SUPERB (Synchronous Ultrasound Parallel Beam) technology delivers focused ultrasound energy at 1.5mm depth to stimulate new collagen production. FDA-cleared for lifting the eyebrow, submental, and neck. Non-invasive with no downtime.',
    clinicalIndication: 'Mild to moderate skin laxity, brow lifting, submental laxity, jowling, neck laxity, fine lines',

    device: 'Sofwave',
    handpiece: 'Sofwave 7-beam transducer (SUPERB technology)',
    defaultSettings: {
      energy: '0.7–1.2 J (energy level 1–4)',
      depth: '1.5 mm (mid-dermis — consistent depth)',
      frequency: '7 parallel ultrasound beams per pulse',
      spotSize: '7 cm² per stamp',
      passes: 1,
      cooling: 'Integrated Sofcool cooling (epidermal protection)',
    },

    passCount: 1,
    overlapPercentage: 0,
    endpointIndicators: [
      'Patient reports warmth/heat sensation (desired)',
      'Slight erythema',
      'No visible skin disruption',
      'Real-time temperature monitoring on device',
    ],
    treatmentPattern: 'Systematic stamping across treatment zones: forehead, temples, periorbital, cheeks, jawline, submental, neck. Non-overlapping adjacent stamps. Device guides placement with real-time feedback.',
    numSessions: '1 session (optimal results at 3 months; can repeat annually)',
    sessionInterval: '12 months for maintenance',

    contraindications: [
      'Open wounds or active skin infection in treatment area',
      'Metallic implants in treatment area',
      'Pregnancy',
      'Severe skin laxity (surgical candidate)',
      'Pacemaker or implantable defibrillator',
    ],
    precautions: [
      'Set expectations — results develop gradually over 3 months',
      'Not a facelift replacement for significant laxity',
      'Can combine with other modalities (filler, Botox, lasers)',
      'Avoid over bony prominences at highest energy settings',
    ],
    potentialComplications: [
      'Mild erythema (1–2 hours)',
      'Temporary tenderness',
      'Very rare: temporary nerve paresthesia',
      'Extremely low adverse event profile',
    ],
    riskLevel: 'low',
    difficultyLevel: 'beginner',
    eyeProtection: 'No laser goggles required (ultrasound-based). Avoid direct treatment over the eyeball.',

    preCare: [
      'No specific prep required',
      'Clean skin, no makeup',
      'No anesthesia typically needed (well-tolerated)',
    ],
    aftercare: [
      { timeframe: 'Immediately', instruction: 'Resume normal activities; mild redness resolves quickly', priority: 'recommended' },
      { timeframe: 'Ongoing', instruction: 'Apply SPF daily; maintain skincare routine', priority: 'recommended' },
      { timeframe: '3 months', instruction: 'Schedule follow-up for before/after photos and assessment', priority: 'important' },
    ],
    downtime: 'None — truly zero downtime. Return to all activities immediately.',

    consentRequirements: {
      formId: 'CONSENT-DEVICE-001',
      formName: 'Sofwave HIFU Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '15839', description: 'Other procedures, non-invasive tissue tightening' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs (all angles)',
      'Energy level and stamp count per zone',
      'Patient comfort level',
      'Signed consent',
    ],

    pricing: { min: 2750, max: 4500, unit: 'per treatment' },
    sessionDuration: 45,

    tags: ['sofwave', 'skin-tightening', 'lifting', 'ultrasound', 'non-invasive', 'no-downtime'],
    relatedProtocols: ['sofwave-neck', 'rf-microneedling-face', 'filler-cheeks'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'sofwave-neck',
    name: 'Sofwave — Neck & Under-Chin Focus',
    category: 'laser',
    subcategory: 'skin-tightening',
    treatmentArea: 'Neck and submental region',
    description: 'Targeted Sofwave treatment focused on the neck and under-chin area. FDA-cleared for submental tissue lifting. Addresses "tech neck" lines, neck laxity, and submental fullness through collagen stimulation at precise 1.5mm depth.',
    clinicalIndication: 'Neck skin laxity, submental fullness, tech neck lines, platysmal banding',

    device: 'Sofwave',
    handpiece: 'Sofwave 7-beam transducer',
    defaultSettings: {
      energy: '0.6–1.0 J (slightly lower for neck sensitivity)',
      depth: '1.5 mm',
      frequency: '7 parallel beams per pulse',
      spotSize: '7 cm²',
      passes: 1,
      cooling: 'Integrated Sofcool cooling',
    },

    passCount: 1,
    overlapPercentage: 0,
    endpointIndicators: [
      'Warmth sensation',
      'Slight erythema',
      'No surface disruption',
    ],
    treatmentPattern: 'Systematic coverage of anterior neck (platysmal area), lateral neck, and submental (under-chin). Lower energy than face due to thinner skin.',
    numSessions: '1 session (repeat at 12 months)',
    sessionInterval: '12 months for maintenance',

    contraindications: [
      'Active skin infection',
      'Metallic implants in neck',
      'Pregnancy',
      'Thyroid conditions (relative — avoid over thyroid)',
      'Significant platysmal banding (Botox better first)',
    ],
    precautions: [
      'Neck skin is thinner — use lower energy settings than face',
      'Avoid thyroid region',
      'Results are gradual — set expectations at 3 months',
      'Combine with Botox for platysmal bands for comprehensive neck rejuvenation',
    ],
    potentialComplications: [
      'Mild erythema (1–2 hours)',
      'Temporary tenderness',
      'Very rare complications overall',
    ],
    riskLevel: 'low',
    difficultyLevel: 'beginner',
    eyeProtection: 'Not required (ultrasound)',

    preCare: [
      'Remove necklaces and jewelry',
      'Clean skin, no products',
    ],
    aftercare: [
      { timeframe: 'Immediately', instruction: 'Resume all normal activities', priority: 'recommended' },
      { timeframe: 'Ongoing', instruction: 'Apply SPF to neck; maintain skincare', priority: 'recommended' },
    ],
    downtime: 'None',

    consentRequirements: {
      formId: 'CONSENT-DEVICE-001',
      formName: 'Sofwave HIFU Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '15839', description: 'Other procedures, non-invasive tissue tightening' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs',
      'Energy settings and stamp count',
      'Signed consent',
    ],

    pricing: { min: 1500, max: 2500, unit: 'per treatment' },
    sessionDuration: 30,

    tags: ['sofwave', 'neck', 'skin-tightening', 'submental', 'tech-neck'],
    relatedProtocols: ['sofwave-face', 'botox-neck-bands', 'rf-microneedling-neck'],
    lastUpdated: '2026-03-01',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RF MICRONEEDLING PROTOCOLS (3)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'rf-microneedling-face',
    name: 'RF Microneedling — Face',
    category: 'laser',
    subcategory: 'rf-microneedling',
    treatmentArea: 'Full face',
    description: 'Radiofrequency microneedling delivers bipolar RF energy through insulated gold-plated needles at precise depths in the dermis. Creates controlled thermal zones for collagen remodeling, skin tightening, and pore refinement. Safe for all skin types including Fitzpatrick V–VI.',
    clinicalIndication: 'Skin laxity, large pores, acne scars, fine lines, skin texture irregularity, stretch marks',

    device: 'Potenza, Morpheus8, or Genius RF Microneedling',
    handpiece: 'Insulated gold-tipped microneedle array (24–49 needles)',
    defaultSettings: {
      energy: '30–65 mJ per needle (varies by device)',
      depth: '0.5–3.5 mm (adjustable per zone)',
      frequency: '1–2 MHz RF',
      spotSize: '24–49 needle array (1 cm² per stamp)',
      passes: 2,
      cooling: 'Pre- and post-treatment ice; topical numbing',
    },

    passCount: 2,
    overlapPercentage: 20,
    endpointIndicators: [
      'Pin-point bleeding (expected)',
      'Mild erythema',
      'Slight edema',
      'Uniform treatment pattern visible on skin',
    ],
    treatmentPattern: 'Systematic stamping across face: forehead, temples, cheeks, jawline, perioral, chin. Adjust needle depth per zone (deeper on cheeks, shallower on forehead and perioral). Two passes with 20% offset for uniform coverage.',
    numSessions: '3–4 sessions',
    sessionInterval: '4–6 weeks',

    contraindications: [
      'Active acne breakout or skin infection',
      'Isotretinoin within 6 months',
      'Pregnancy or breastfeeding',
      'Pacemaker or electronic implant',
      'Active cold sore outbreak',
      'Bleeding disorders or anticoagulation (relative)',
      'Keloid-prone skin',
    ],
    precautions: [
      'Apply topical numbing cream 45–60 minutes before',
      'Adjust depth per facial zone (avoid deep on thin skin areas)',
      'Safe for all Fitzpatrick types (advantage over lasers)',
      'Combine with PRP or growth factors for enhanced results',
    ],
    potentialComplications: [
      'Erythema (2–5 days)',
      'Edema (2–3 days)',
      'Pin-point bleeding (resolves minutes)',
      'Post-inflammatory hyperpigmentation (rare — safe for all skin types)',
      'Infection (very rare with proper aftercare)',
      'Scarring (very rare)',
      'Herpes reactivation',
    ],
    riskLevel: 'moderate',
    difficultyLevel: 'intermediate',
    eyeProtection: 'Not required (RF-based, not laser). Avoid treating directly over the eyelid.',

    preCare: [
      'Discontinue retinoids 5–7 days before',
      'No blood-thinning supplements for 1 week',
      'Antiviral prophylaxis if HSV history',
      'Apply topical numbing cream (BLT compound) 45 minutes before',
      'Clean face, no makeup',
    ],
    aftercare: [
      { timeframe: 'Immediately', instruction: 'Apply hyaluronic acid serum or growth factor serum', priority: 'important' },
      { timeframe: 'First 24 hours', instruction: 'No makeup, active ingredients, or retinoids', priority: 'critical' },
      { timeframe: 'First 48 hours', instruction: 'No exercise, hot showers, saunas, or swimming', priority: 'critical' },
      { timeframe: 'First week', instruction: 'Use gentle cleanser and moisturizer only; apply SPF 50+', priority: 'critical' },
      { timeframe: 'Day 5–7', instruction: 'Resume normal skincare routine including retinoids', priority: 'recommended' },
    ],
    downtime: 'Moderate — redness and mild swelling for 2–5 days. Social downtime 2–3 days.',

    consentRequirements: {
      formId: 'CONSENT-DEVICE-002',
      formName: 'RF Microneedling Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '17999', description: 'Unlisted procedure, skin, mucous membrane and subcutaneous tissue' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs',
      'Device, settings (energy, depth) per zone',
      'Number of stamps per zone',
      'Topical serums applied',
      'Signed consent',
    ],

    pricing: { min: 495, max: 850, unit: 'per session' },
    sessionDuration: 60,

    tags: ['rf-microneedling', 'face', 'collagen', 'skin-tightening', 'acne-scars', 'pores'],
    relatedProtocols: ['rf-microneedling-neck', 'rf-microneedling-body', 'sofwave-face'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'rf-microneedling-neck',
    name: 'RF Microneedling — Neck & Decolletage',
    category: 'laser',
    subcategory: 'rf-microneedling',
    treatmentArea: 'Neck and upper chest (decolletage)',
    description: 'RF microneedling adapted for the neck and decolletage — areas with thinner skin that require adjusted settings. Addresses crepey neck skin, horizontal neck lines, and chest wrinkles caused by sun damage and aging.',
    clinicalIndication: 'Neck crepiness, horizontal neck lines, decolletage wrinkles, tech neck, chest sun damage',

    device: 'Potenza, Morpheus8, or Genius RF Microneedling',
    handpiece: 'Insulated gold-tipped microneedle array',
    defaultSettings: {
      energy: '20–45 mJ per needle (lower than face)',
      depth: '0.5–2.0 mm (shallower than face)',
      frequency: '1–2 MHz RF',
      spotSize: '24–49 needle array',
      passes: 2,
      cooling: 'Topical numbing and post-treatment ice',
    },

    passCount: 2,
    overlapPercentage: 20,
    endpointIndicators: [
      'Pin-point bleeding',
      'Mild erythema',
      'Uniform pattern',
    ],
    treatmentPattern: 'Systematic coverage: anterior neck, lateral neck, decolletage. Shallower depth and lower energy than face due to thinner skin. Avoid thyroid region and prominent neck vessels.',
    numSessions: '3–4 sessions',
    sessionInterval: '4–6 weeks',

    contraindications: [
      'Active infection in treatment area',
      'Pregnancy',
      'Pacemaker',
      'Keloid tendency',
      'Isotretinoin within 6 months',
    ],
    precautions: [
      'Neck and chest skin is significantly thinner than face — reduce depth and energy',
      'More sensitive to treatment — ensure adequate numbing',
      'Chest skin heals slower than facial skin',
      'More prone to prolonged erythema on decolletage',
    ],
    potentialComplications: [
      'Erythema (3–7 days — longer than face)',
      'Edema',
      'Hyperpigmentation (chest is sun-exposed)',
      'Prolonged healing on decolletage',
    ],
    riskLevel: 'moderate',
    difficultyLevel: 'intermediate',
    eyeProtection: 'Not required',

    preCare: [
      'Discontinue retinoids 5–7 days before',
      'Apply topical numbing cream 45 minutes before',
      'Remove all jewelry (necklaces, chains)',
      'No sun exposure for 2 weeks prior',
    ],
    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'Apply hyaluronic acid serum; no active products', priority: 'critical' },
      { timeframe: 'First 48 hours', instruction: 'No exercise, heat, or tight collared shirts', priority: 'important' },
      { timeframe: 'First week', instruction: 'Gentle cleanser and moisturizer only; SPF 50+ on neck and chest', priority: 'critical' },
      { timeframe: 'Ongoing', instruction: 'Maintain SPF on decolletage (often forgotten area)', priority: 'important' },
    ],
    downtime: 'Moderate — redness 3–7 days; social downtime 3–4 days',

    consentRequirements: {
      formId: 'CONSENT-DEVICE-002',
      formName: 'RF Microneedling Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '17999', description: 'Unlisted procedure, skin, mucous membrane and subcutaneous tissue' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs',
      'Device settings per zone (neck vs chest)',
      'Signed consent',
    ],

    pricing: { min: 495, max: 750, unit: 'per session (add-on to face or standalone)' },
    sessionDuration: 45,

    tags: ['rf-microneedling', 'neck', 'decolletage', 'chest', 'skin-tightening'],
    relatedProtocols: ['rf-microneedling-face', 'sofwave-neck', 'botox-neck-bands'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'rf-microneedling-body',
    name: 'RF Microneedling — Body (Scars & Stretch Marks)',
    category: 'laser',
    subcategory: 'rf-microneedling',
    treatmentArea: 'Body areas — abdomen, thighs, arms, buttocks (acne scars, stretch marks)',
    description: 'Deep RF microneedling for body areas targeting acne scars and stretch marks. Deeper needle penetration with higher energy stimulates collagen remodeling in areas with thicker skin and deeper scarring. Significant improvement in texture and appearance over a treatment series.',
    clinicalIndication: 'Acne scars (body), stretch marks (striae rubra and alba), skin laxity on body, surgical scars',

    device: 'Potenza, Morpheus8 Body, or Genius RF Microneedling',
    handpiece: 'Deep-penetration body handpiece (longer needles)',
    defaultSettings: {
      energy: '40–80 mJ per needle',
      depth: '2.0–4.0 mm (deeper for body)',
      frequency: '1–2 MHz RF',
      spotSize: '24–49 needle array',
      passes: 2,
      cooling: 'Topical numbing and post-treatment cooling',
    },

    passCount: 2,
    overlapPercentage: 20,
    endpointIndicators: [
      'Pin-point bleeding',
      'Erythema',
      'Mild edema around treated scars',
    ],
    treatmentPattern: 'Target specific scar areas or stretch mark zones. Deeper settings for thick body skin. Multiple passes across scar/stretch mark tissue. Can combine with PRP for enhanced results.',
    numSessions: '4–6 sessions',
    sessionInterval: '4–6 weeks',

    contraindications: [
      'Active infection',
      'Pregnancy',
      'Pacemaker',
      'Keloid tendency (especially body scars)',
      'Isotretinoin within 6 months',
    ],
    precautions: [
      'Body skin is thicker — higher energy and deeper needles needed',
      'Stretch marks require patience — results are gradual over many sessions',
      'Red/new stretch marks respond better than white/mature ones',
      'Larger treatment areas may require extended numbing time',
    ],
    potentialComplications: [
      'Erythema (3–7 days)',
      'Edema',
      'Hyperpigmentation',
      'Prolonged healing on body areas',
      'Suboptimal results on mature (white) stretch marks',
    ],
    riskLevel: 'moderate',
    difficultyLevel: 'intermediate',
    eyeProtection: 'Not required',

    preCare: [
      'Apply topical numbing cream 60 minutes before (thicker application for body)',
      'Shave treatment area if needed',
      'No retinoids for 1 week',
    ],
    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'Apply healing serum; avoid tight clothing over treated area', priority: 'critical' },
      { timeframe: 'First 48 hours', instruction: 'No exercise or swimming', priority: 'important' },
      { timeframe: 'First week', instruction: 'Keep area moisturized; SPF if sun-exposed', priority: 'important' },
    ],
    downtime: 'Moderate — redness 3–5 days; bruising possible in treated areas',

    consentRequirements: {
      formId: 'CONSENT-DEVICE-002',
      formName: 'RF Microneedling Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '17999', description: 'Unlisted procedure, skin, mucous membrane and subcutaneous tissue' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs with measurements',
      'Scar/stretch mark classification',
      'Device settings per zone',
      'Signed consent',
    ],

    pricing: { min: 495, max: 850, unit: 'per session (area dependent)' },
    sessionDuration: 60,

    tags: ['rf-microneedling', 'body', 'acne-scars', 'stretch-marks', 'scars'],
    relatedProtocols: ['rf-microneedling-face', 'rf-microneedling-neck'],
    lastUpdated: '2026-03-01',
  },
];

export default LASER_PROTOCOLS;
