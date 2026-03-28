// ─── Injectable Treatment Protocols ─────────────────────────────────────────
// 20 comprehensive injectable protocols for Rani Beauty Clinic
// CRITICAL: "injection" only — never "infusion"

import type { InjectableProtocol } from './types';

export const INJECTABLE_PROTOCOLS: InjectableProtocol[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // NEUROTOXIN PROTOCOLS (10)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'botox-forehead',
    name: 'Botox — Forehead Lines',
    category: 'injectable',
    subcategory: 'neurotoxin',
    treatmentArea: 'Forehead (frontalis muscle)',
    description: 'Neuromodulator injection to soften horizontal forehead lines by relaxing the frontalis muscle. Achieves a naturally smooth forehead while preserving brow position and expressiveness.',
    clinicalIndication: 'Moderate to severe horizontal forehead rhytids (dynamic and static)',

    product: 'onabotulinumtoxinA (Botox Cosmetic)',
    unitsOrSyringes: '10–30 units (typically 15–20 units)',
    dilution: '2.5 mL preservative-free saline per 100-unit vial (4 units/0.1 mL)',
    needleGauge: '30G or 32G 0.5-inch needle',

    anatomyLandmarks: [
      'Frontalis muscle — superficial, just beneath dermis',
      'Temporal fusion line (lateral boundary)',
      'Hairline (superior boundary — stay 1–2 cm below)',
      'Supraorbital rim (inferior boundary — stay 2 cm above brow)',
      'Sentinel vein (avoid medial brow area)',
    ],
    injectionTechnique: 'Serial puncture technique with 4–8 injection points evenly distributed across the forehead in 1–2 horizontal rows. Inject superficially into the frontalis muscle belly. Use a "V" or "M" pattern to maintain natural brow arch. Always treat with glabellar complex to prevent compensatory brow ptosis.',
    injectionDepth: 'Intradermal to superficial intramuscular (2–3 mm depth)',
    injectionPoints: 6,
    aspirationRequired: false,

    contraindications: [
      'Known hypersensitivity to botulinum toxin or albumin',
      'Infection at proposed injection site',
      'Neuromuscular disorders (myasthenia gravis, Lambert-Eaton)',
      'Pregnancy or breastfeeding',
      'Aminoglycoside antibiotics within 7 days',
      'Previous adverse reaction to botulinum toxin',
    ],
    precautions: [
      'Assess brow position — low-set brows may drop further',
      'Reduce dose in patients with thin/weak frontalis',
      'Assess forehead reliance — some patients depend on frontalis for brow elevation',
      'Avoid in patients with significant brow ptosis',
      'Use lower doses in first-time patients',
    ],
    potentialComplications: [
      'Brow ptosis (most common — from over-treatment)',
      'Asymmetry',
      'Headache (transient, 24–48 hours)',
      'Bruising at injection sites',
      'Spock brow (lateral brow elevation from uneven treatment)',
      'Heavy or frozen appearance',
    ],
    emergencyKit: [
      'Epinephrine auto-injector',
      'Ice packs',
      'Topical arnica',
      'Antihistamine (diphenhydramine)',
    ],
    riskLevel: 'low',
    difficultyLevel: 'beginner',

    onsetTime: '3–5 days (full effect at 14 days)',
    peakResults: '2 weeks post-injection',
    duration: '3–4 months',
    expectedResults: [
      'Softened horizontal forehead lines',
      'Smoother forehead appearance at rest',
      'Preserved natural facial expression with proper dosing',
      'Slight brow elevation possible with strategic placement',
    ],
    touchUpTimeline: '2 weeks post-initial treatment',
    retreatmentInterval: '3–4 months (do not retreat before 90 days)',

    aftercare: [
      { timeframe: 'First 4 hours', instruction: 'Remain upright; avoid lying flat', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'No strenuous exercise, saunas, or hot yoga', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'Do not rub, massage, or apply pressure to treated area', priority: 'critical' },
      { timeframe: 'First 48 hours', instruction: 'Avoid alcohol consumption', priority: 'important' },
      { timeframe: 'First 2 weeks', instruction: 'Avoid facial treatments, chemical peels, or laser procedures', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Gently exercise forehead muscles by raising eyebrows for 1–2 hours post-injection to enhance uptake', priority: 'recommended' },
    ],

    consentRequirements: {
      formId: 'CONSENT-NEUROTOXIN-001',
      formName: 'Neurotoxin Injection Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '64615', description: 'Chemodenervation of muscle(s); muscle(s) innervated by facial nerve', modifier: '59' },
      { code: 'J0585', description: 'OnabotulinumtoxinA per unit' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs (frontal, oblique)',
      'Units injected per site mapped on facial diagram',
      'Lot number and expiration date of product',
      'Patient tolerance and immediate post-injection assessment',
      'Consent form signed and witnessed',
    ],

    pricing: { min: 250, max: 450, unit: 'per treatment area' },
    sessionDuration: 15,

    tags: ['botox', 'neurotoxin', 'forehead', 'wrinkles', 'anti-aging', 'preventative'],
    relatedProtocols: ['botox-glabella', 'botox-brow-lift', 'botox-crows-feet'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'botox-glabella',
    name: 'Botox — Glabella (11s / Frown Lines)',
    category: 'injectable',
    subcategory: 'neurotoxin',
    treatmentArea: 'Glabellar complex (procerus, corrugator supercilii, depressor supercilii)',
    description: 'Targeted neuromodulator injection to soften vertical frown lines between the brows. The most-studied and FDA-approved indication for cosmetic botulinum toxin.',
    clinicalIndication: 'Moderate to severe glabellar rhytids',

    product: 'onabotulinumtoxinA (Botox Cosmetic)',
    unitsOrSyringes: '20–25 units (FDA-approved dose: 20 units)',
    dilution: '2.5 mL preservative-free saline per 100-unit vial',
    needleGauge: '30G 0.5-inch needle',

    anatomyLandmarks: [
      'Procerus muscle — midline, between the brows',
      'Corrugator supercilii — deep to frontalis, originates from medial supraorbital rim',
      'Depressor supercilii — thin muscle contributing to medial brow depression',
      'Supratrochlear and supraorbital neurovascular bundles (avoid)',
      'Orbital rim (do not inject below)',
    ],
    injectionTechnique: 'Standard 5-point injection pattern: 1 injection into procerus (midline) and 2 injections into each corrugator (medial and lateral heads). Pinch corrugator between thumb and forefinger to isolate muscle. Inject deep into corrugator body, superficial into procerus. Maintain needle perpendicular to skin for procerus, angled laterally and superiorly for corrugator.',
    injectionDepth: 'Procerus: intradermal/superficial (2 mm); Corrugator: intramuscular (4–6 mm, deep to frontalis)',
    injectionPoints: 5,
    aspirationRequired: false,

    contraindications: [
      'Known hypersensitivity to botulinum toxin or albumin',
      'Infection at proposed injection site',
      'Neuromuscular disorders (myasthenia gravis, Lambert-Eaton)',
      'Pregnancy or breastfeeding',
      'Active dermatitis or psoriasis in treatment area',
    ],
    precautions: [
      'Assess for pre-existing eyelid ptosis',
      'Stay above orbital rim to avoid levator palpebrae involvement',
      'Consider lower doses in patients over 65 with muscle atrophy',
      'Note asymmetry in baseline brow position',
    ],
    potentialComplications: [
      'Eyelid ptosis (0.5–5% incidence — from diffusion to levator palpebrae)',
      'Brow asymmetry',
      'Bruising (especially near supratrochlear vessels)',
      'Headache (transient)',
      'Diplopia (rare)',
    ],
    emergencyKit: [
      'Apraclonidine 0.5% ophthalmic drops (for ptosis)',
      'Ice packs',
      'Topical arnica',
      'Epinephrine auto-injector',
    ],
    riskLevel: 'low',
    difficultyLevel: 'beginner',

    onsetTime: '2–5 days',
    peakResults: '10–14 days',
    duration: '3–4 months',
    expectedResults: [
      'Significant softening of vertical frown lines',
      'Smoother, more relaxed appearance between brows',
      'Reduction in "angry" or "tired" resting expression',
      'Mild medial brow elevation in some patients',
    ],
    touchUpTimeline: '2 weeks post-initial treatment',
    retreatmentInterval: '3–4 months',

    aftercare: [
      { timeframe: 'First 4 hours', instruction: 'Remain upright; avoid lying flat', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'No strenuous exercise or heat exposure', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'Do not rub or massage treatment area', priority: 'critical' },
      { timeframe: 'First 48 hours', instruction: 'Avoid blood-thinning supplements (fish oil, vitamin E)', priority: 'important' },
      { timeframe: '2 weeks', instruction: 'Schedule touch-up appointment if asymmetry noted', priority: 'recommended' },
    ],

    consentRequirements: {
      formId: 'CONSENT-NEUROTOXIN-001',
      formName: 'Neurotoxin Injection Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '64615', description: 'Chemodenervation of muscle(s); muscle(s) innervated by facial nerve' },
      { code: 'J0585', description: 'OnabotulinumtoxinA per unit' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs (frontal, animation)',
      'Units per injection site on diagram',
      'Product lot number and expiration',
      'Signed consent form',
    ],

    pricing: { min: 250, max: 400, unit: 'per treatment area' },
    sessionDuration: 15,

    tags: ['botox', 'neurotoxin', 'glabella', 'frown-lines', '11s', 'anti-aging'],
    relatedProtocols: ['botox-forehead', 'botox-brow-lift', 'botox-crows-feet'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'botox-crows-feet',
    name: 'Botox — Crow\'s Feet',
    category: 'injectable',
    subcategory: 'neurotoxin',
    treatmentArea: 'Lateral canthal lines (orbicularis oculi — lateral portion)',
    description: 'Neuromodulator injection targeting the lateral orbicularis oculi to soften dynamic crow\'s feet wrinkles while maintaining natural eye crinkle on smile.',
    clinicalIndication: 'Moderate to severe lateral canthal lines',

    product: 'onabotulinumtoxinA (Botox Cosmetic)',
    unitsOrSyringes: '12–24 units per side (typically 12 units per side / 24 total)',
    dilution: '2.5 mL preservative-free saline per 100-unit vial',
    needleGauge: '30G or 32G 0.5-inch needle',

    anatomyLandmarks: [
      'Lateral orbital rim — palpate as lateral boundary',
      'Orbicularis oculi muscle — lateral portion',
      'Zygomatic arch — inferior boundary',
      'Temporal branch of facial nerve (deep, protected by fascia)',
      'Lateral canthal tendon',
    ],
    injectionTechnique: 'Three injection points per side in a fan or crow\'s foot pattern, 1–1.5 cm lateral to the orbital rim. Inject superficially into the lateral orbicularis oculi. Space injections 1 cm apart. Ask patient to smile to identify maximal contraction lines. Pinch skin to confirm superficial placement.',
    injectionDepth: 'Intradermal to very superficial intramuscular (1–2 mm)',
    injectionPoints: 6,
    aspirationRequired: false,

    contraindications: [
      'Known hypersensitivity to botulinum toxin',
      'Active infection at injection site',
      'Pregnancy or breastfeeding',
      'Neuromuscular disorders',
      'Significant lower eyelid laxity or ectropion risk',
    ],
    precautions: [
      'Assess lower eyelid tone — snap-back test',
      'Stay lateral to orbital rim to prevent diplopia',
      'Reduce dose if thin skin or significant sun damage',
      'Avoid treating if dry eye syndrome is present',
    ],
    potentialComplications: [
      'Bruising (common — thin skin with superficial vessels)',
      'Asymmetric smile',
      'Lower eyelid laxity or ectropion (rare)',
      'Diplopia (very rare — from diffusion to lateral rectus)',
      'Cheek ptosis (from treating too inferiorly)',
    ],
    emergencyKit: ['Ice packs', 'Topical arnica', 'Epinephrine auto-injector'],
    riskLevel: 'low',
    difficultyLevel: 'beginner',

    onsetTime: '3–5 days',
    peakResults: '14 days',
    duration: '3–4 months',
    expectedResults: [
      'Softened crow\'s feet lines at rest and in animation',
      'Smoother periorbital area',
      'More youthful eye appearance',
      'Natural crinkle preserved with proper dosing',
    ],
    touchUpTimeline: '2 weeks post-treatment',
    retreatmentInterval: '3–4 months',

    aftercare: [
      { timeframe: 'First 4 hours', instruction: 'Avoid lying flat', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'No exercise, heat, or alcohol', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'Do not rub or press on treated area', priority: 'critical' },
      { timeframe: 'First 48 hours', instruction: 'Apply arnica gel if bruising occurs', priority: 'recommended' },
    ],

    consentRequirements: {
      formId: 'CONSENT-NEUROTOXIN-001',
      formName: 'Neurotoxin Injection Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '64615', description: 'Chemodenervation of muscle(s); muscle(s) innervated by facial nerve' },
      { code: 'J0585', description: 'OnabotulinumtoxinA per unit' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs at rest and smiling',
      'Units and injection points mapped bilaterally',
      'Product lot number',
      'Signed consent form',
    ],

    pricing: { min: 200, max: 350, unit: 'per treatment (both sides)' },
    sessionDuration: 15,

    tags: ['botox', 'neurotoxin', 'crows-feet', 'periorbital', 'anti-aging'],
    relatedProtocols: ['botox-forehead', 'botox-glabella', 'filler-under-eye'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'botox-lip-flip',
    name: 'Botox — Lip Flip',
    category: 'injectable',
    subcategory: 'neurotoxin',
    treatmentArea: 'Upper lip (orbicularis oris — superior border)',
    description: 'Micro-dose neuromodulator injection along the upper lip vermillion border to gently evert the lip, creating the appearance of a fuller upper lip without dermal filler. Ideal for patients wanting subtle enhancement.',
    clinicalIndication: 'Thin upper lip with visible vermillion, gummy smile (mild), perioral lines',

    product: 'onabotulinumtoxinA (Botox Cosmetic)',
    unitsOrSyringes: '4–8 units total',
    dilution: '2.5 mL preservative-free saline per 100-unit vial',
    needleGauge: '32G 0.5-inch needle',

    anatomyLandmarks: [
      'Orbicularis oris — upper lip sphincter muscle',
      'Vermillion border — white roll',
      'Cupid\'s bow — central landmarks',
      'Philtral columns',
      'Superior labial artery (deep, 3–5 mm from vermillion)',
    ],
    injectionTechnique: 'Place 4–6 micro-injections (1–2 units each) along the white roll of the upper lip vermillion border. Two injections flanking each philtral column, and one at each lateral commissure. Inject very superficially into the orbicularis oris. Less is more — conservative dosing prevents functional impairment.',
    injectionDepth: 'Very superficial intradermal (1 mm into orbicularis oris)',
    injectionPoints: 4,
    aspirationRequired: false,

    contraindications: [
      'Known allergy to botulinum toxin',
      'Active cold sore or perioral infection',
      'Pregnancy or breastfeeding',
      'Recent dental work within 2 weeks',
      'Wind instrument musicians (functional impairment risk)',
    ],
    precautions: [
      'Warn patient about temporary difficulty with straws and whistling',
      'Start conservatively — can always add at touch-up',
      'Not a substitute for lip filler in patients wanting volume',
      'May feel unusual for 1–2 weeks as patient adjusts',
    ],
    potentialComplications: [
      'Difficulty drinking from a straw (most common)',
      'Drooling (rare, from over-dosing)',
      'Asymmetry of lip eversion',
      'Speech changes (rare)',
      'Inability to pucker or whistle',
    ],
    emergencyKit: ['Ice packs', 'Topical arnica'],
    riskLevel: 'low',
    difficultyLevel: 'intermediate',

    onsetTime: '3–5 days',
    peakResults: '10–14 days',
    duration: '2–3 months (shorter than other areas)',
    expectedResults: [
      'Subtle upper lip eversion showing more vermillion',
      'Slightly fuller appearance of upper lip',
      'Softened perioral lines',
      'More defined Cupid\'s bow',
    ],
    touchUpTimeline: '2 weeks post-treatment',
    retreatmentInterval: '2–3 months',

    aftercare: [
      { timeframe: 'First 4 hours', instruction: 'Avoid eating hot foods or drinking with straws', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'No kissing or pressure on lips', priority: 'important' },
      { timeframe: 'First 24 hours', instruction: 'Avoid lipstick or lip products for 4 hours', priority: 'recommended' },
      { timeframe: 'First week', instruction: 'Be patient — full effect takes 10–14 days', priority: 'recommended' },
    ],

    consentRequirements: {
      formId: 'CONSENT-NEUROTOXIN-001',
      formName: 'Neurotoxin Injection Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '64615', description: 'Chemodenervation of muscle(s); muscle(s) innervated by facial nerve' },
      { code: 'J0585', description: 'OnabotulinumtoxinA per unit' },
    ],
    documentationRequirements: [
      'Pre-treatment lip photographs (rest and smile)',
      'Units per injection point',
      'Product lot number',
      'Signed consent',
    ],

    pricing: { min: 100, max: 200, unit: 'per treatment' },
    sessionDuration: 10,

    tags: ['botox', 'lip-flip', 'lips', 'neurotoxin', 'subtle-enhancement'],
    relatedProtocols: ['filler-lips-subtle', 'filler-lips-full', 'botox-gummy-smile'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'botox-masseter',
    name: 'Botox — Masseter (Jawline Slimming / TMJ)',
    category: 'injectable',
    subcategory: 'neurotoxin',
    treatmentArea: 'Masseter muscle (bilateral)',
    description: 'High-dose neuromodulator injection into the masseter muscle for jawline slimming and/or TMJ/bruxism relief. Produces a slimmer, more V-shaped lower face contour over 4–6 weeks as the muscle gradually atrophies.',
    clinicalIndication: 'Masseteric hypertrophy, TMJ dysfunction, bruxism, square jawline reshaping',

    product: 'onabotulinumtoxinA (Botox Cosmetic)',
    unitsOrSyringes: '25–50 units per side (50–100 units total)',
    dilution: '2.5 mL preservative-free saline per 100-unit vial',
    needleGauge: '30G 1-inch needle',

    anatomyLandmarks: [
      'Masseter muscle — palpate by asking patient to clench',
      'Mandibular angle — posterior-inferior corner',
      'Parotid gland — posterior to masseter (avoid)',
      'Facial artery and vein — anterior border of masseter',
      'Marginal mandibular nerve — runs along inferior border of mandible',
      'Zygomatic arch — superior boundary',
    ],
    injectionTechnique: 'Have patient clench jaw to identify masseter bulk. Place 3–5 injection points per side in the lower two-thirds of the muscle belly, avoiding the upper third (near zygomatic arch and parotid). Inject deep into the muscle body. Space injections 1 cm apart. Stay within a triangle bounded by the mandibular angle, anterior masseter border, and mid-ramus point.',
    injectionDepth: 'Deep intramuscular (5–10 mm depending on muscle thickness)',
    injectionPoints: 8,
    aspirationRequired: true,

    contraindications: [
      'Known allergy to botulinum toxin',
      'Active infection at injection site',
      'Pregnancy or breastfeeding',
      'Neuromuscular disorders',
      'Significantly thin masseter (no hypertrophy present)',
    ],
    precautions: [
      'Assess bite strength — patients with weak bite may not be candidates',
      'Warn about temporary jaw fatigue with chewy foods',
      'May take 2–3 sessions to see full slimming effect',
      'Avoid parotid gland (posterior border)',
      'Keep injections in lower 2/3 of muscle',
    ],
    potentialComplications: [
      'Jaw fatigue with prolonged chewing',
      'Asymmetric jawline (from unequal dosing)',
      'Difficulty chewing hard foods temporarily',
      'Smile asymmetry (rare — from risorius involvement)',
      'Parotid gland injury (if injected too posteriorly)',
      'Paradoxical masseteric bulging (very rare)',
    ],
    emergencyKit: ['Ice packs', 'Topical arnica', 'Epinephrine auto-injector'],
    riskLevel: 'moderate',
    difficultyLevel: 'intermediate',

    onsetTime: '1–2 weeks (functional); 4–6 weeks (slimming visible)',
    peakResults: '6–8 weeks for jaw slimming; 2 weeks for TMJ relief',
    duration: '4–6 months',
    expectedResults: [
      'Slimmer, more V-shaped lower face contour',
      'Reduced jaw clenching and grinding',
      'Decreased TMJ pain and tension headaches',
      'Softer jawline appearance',
      'Progressive improvement with repeat treatments',
    ],
    touchUpTimeline: '4 weeks if insufficient reduction',
    retreatmentInterval: '4–6 months (may extend with repeated treatments)',

    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'Avoid chewing gum or very hard foods', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'No exercise or heat exposure', priority: 'important' },
      { timeframe: 'First 2 weeks', instruction: 'Report any difficulty swallowing or smile asymmetry', priority: 'critical' },
      { timeframe: 'Ongoing', instruction: 'Wear night guard if prescribed for bruxism', priority: 'recommended' },
    ],

    consentRequirements: {
      formId: 'CONSENT-NEUROTOXIN-002',
      formName: 'Masseter Botox Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '64615', description: 'Chemodenervation of muscle(s); muscle(s) innervated by facial nerve' },
      { code: 'J0585', description: 'OnabotulinumtoxinA per unit' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs (frontal, lateral, oblique)',
      'Jaw width measurements',
      'Units per injection point bilateral diagram',
      'Product lot number',
      'TMJ assessment if applicable',
      'Signed consent',
    ],

    pricing: { min: 500, max: 1000, unit: 'per treatment (both sides)' },
    sessionDuration: 20,

    tags: ['botox', 'masseter', 'jawline', 'slimming', 'tmj', 'bruxism', 'face-contouring'],
    relatedProtocols: ['filler-jawline', 'filler-chin', 'botox-neck-bands'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'botox-neck-bands',
    name: 'Botox — Neck Bands (Platysmal Bands)',
    category: 'injectable',
    subcategory: 'neurotoxin',
    treatmentArea: 'Platysma muscle (anterior cervical bands)',
    description: 'Neuromodulator injection along visible platysmal bands to soften neck banding and create a smoother, more youthful neckline. Often combined with jawline treatments for comprehensive rejuvenation.',
    clinicalIndication: 'Visible platysmal bands, tech neck lines, neck rejuvenation',

    product: 'onabotulinumtoxinA (Botox Cosmetic)',
    unitsOrSyringes: '20–60 units total (10–30 per band)',
    dilution: '2.5 mL preservative-free saline per 100-unit vial',
    needleGauge: '30G 0.5-inch needle',

    anatomyLandmarks: [
      'Platysma bands — ask patient to tense neck (grimace/strain)',
      'Anterior border of sternocleidomastoid',
      'External jugular vein (lateral — avoid)',
      'Thyroid cartilage (midline landmark)',
      'Submental space',
    ],
    injectionTechnique: 'Grasp each platysmal band between thumb and forefinger. Inject 2–4 units every 1–1.5 cm along each band, from jawline to mid-neck. Keep injections superficial, directly into the platysma. For horizontal necklines, use serial micro-injections (1–2 units) intradermally along each line. Nefertiti Lift: inject along jawline at platysma insertion points.',
    injectionDepth: 'Intradermal to very superficial intramuscular (platysma is thin — 1–2 mm)',
    injectionPoints: 10,
    aspirationRequired: false,

    contraindications: [
      'Known allergy to botulinum toxin',
      'Dysphagia or swallowing disorders',
      'Pregnancy or breastfeeding',
      'Neuromuscular disorders',
      'Significantly loose or redundant neck skin (surgical candidate)',
    ],
    precautions: [
      'Start conservatively — neck area is more prone to diffusion',
      'Avoid deep injection near laryngeal structures',
      'Reduce dose in thin patients with minimal muscle mass',
      'Stay superficial to avoid dysphagia risk',
      'Not effective for excess skin or submental fat',
    ],
    potentialComplications: [
      'Dysphagia (difficulty swallowing) — most concerning',
      'Neck weakness or head drop (rare)',
      'Bruising',
      'Asymmetric results',
      'Voice changes (very rare)',
    ],
    emergencyKit: ['Ice packs', 'Topical arnica', 'Epinephrine auto-injector'],
    riskLevel: 'moderate',
    difficultyLevel: 'advanced',

    onsetTime: '5–7 days',
    peakResults: '2–3 weeks',
    duration: '3–4 months',
    expectedResults: [
      'Softened platysmal bands',
      'Smoother neck contour',
      'More defined jawline (with Nefertiti Lift)',
      'Reduced "turkey neck" appearance',
    ],
    touchUpTimeline: '3 weeks post-treatment',
    retreatmentInterval: '3–4 months',

    aftercare: [
      { timeframe: 'First 4 hours', instruction: 'Remain upright; avoid bending over', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'Monitor swallowing — report any difficulty immediately', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'No exercise or neck manipulation', priority: 'important' },
      { timeframe: 'First 48 hours', instruction: 'Avoid necklaces or tight collars', priority: 'recommended' },
    ],

    consentRequirements: {
      formId: 'CONSENT-NEUROTOXIN-003',
      formName: 'Neck/Platysma Botox Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '64616', description: 'Chemodenervation of muscle(s); neck muscle(s)' },
      { code: 'J0585', description: 'OnabotulinumtoxinA per unit' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs (frontal, lateral, neck tensed)',
      'Injection point map with units',
      'Product lot number',
      'Swallowing assessment pre/post',
      'Signed consent',
    ],

    pricing: { min: 400, max: 800, unit: 'per treatment' },
    sessionDuration: 20,

    tags: ['botox', 'neck', 'platysma', 'nefertiti-lift', 'anti-aging', 'neck-bands'],
    relatedProtocols: ['botox-masseter', 'filler-jawline', 'sofwave-neck'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'botox-bunny-lines',
    name: 'Botox — Bunny Lines',
    category: 'injectable',
    subcategory: 'neurotoxin',
    treatmentArea: 'Dorsal nose (nasalis muscle)',
    description: 'Subtle neuromodulator injection to smooth diagonal lines on the nose that appear during smiling or scrunching. A finishing touch that complements forehead and glabellar treatment.',
    clinicalIndication: 'Nasal scrunch lines, compensatory bunny lines post-glabellar treatment',

    product: 'onabotulinumtoxinA (Botox Cosmetic)',
    unitsOrSyringes: '4–10 units total (2–5 per side)',
    dilution: '2.5 mL preservative-free saline per 100-unit vial',
    needleGauge: '32G 0.5-inch needle',

    anatomyLandmarks: [
      'Nasalis muscle — transverse part',
      'Dorsal nasal sidewall',
      'Angular vein/artery (medial canthus — avoid)',
      'Levator labii superioris alaeque nasi (lateral boundary)',
    ],
    injectionTechnique: 'Ask patient to scrunch nose to identify bunny lines. Place 1–2 injections per side into the nasalis muscle on the upper lateral nasal sidewall. Inject superficially. Keep injections at the junction of the nasal bone and upper lateral cartilage.',
    injectionDepth: 'Intradermal (1–2 mm)',
    injectionPoints: 4,
    aspirationRequired: false,

    contraindications: [
      'Known allergy to botulinum toxin',
      'Active nasal infection',
      'Pregnancy or breastfeeding',
      'Recent rhinoplasty (within 6 months)',
    ],
    precautions: [
      'Avoid injecting too laterally (levator labii involvement causes upper lip ptosis)',
      'Very small doses needed — start conservatively',
      'Often done as an add-on to glabellar treatment',
    ],
    potentialComplications: [
      'Upper lip ptosis (if injected too laterally/inferiorly)',
      'Nasal tip drooping (if injected too low)',
      'Bruising',
      'Asymmetry',
    ],
    emergencyKit: ['Ice packs', 'Topical arnica'],
    riskLevel: 'low',
    difficultyLevel: 'intermediate',

    onsetTime: '3–5 days',
    peakResults: '14 days',
    duration: '3–4 months',
    expectedResults: [
      'Smooth nasal sidewalls during facial animation',
      'Elimination of diagonal nose wrinkles',
      'More polished overall facial appearance',
    ],
    touchUpTimeline: '2 weeks',
    retreatmentInterval: '3–4 months',

    aftercare: [
      { timeframe: 'First 4 hours', instruction: 'Do not touch or press on nose', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'Avoid glasses that rest on injection site', priority: 'important' },
      { timeframe: 'First 24 hours', instruction: 'No exercise or heat', priority: 'important' },
    ],

    consentRequirements: {
      formId: 'CONSENT-NEUROTOXIN-001',
      formName: 'Neurotoxin Injection Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '64615', description: 'Chemodenervation of muscle(s); muscle(s) innervated by facial nerve' },
      { code: 'J0585', description: 'OnabotulinumtoxinA per unit' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs (frontal, scrunching)',
      'Units per injection point',
      'Product lot number',
      'Signed consent',
    ],

    pricing: { min: 75, max: 150, unit: 'per treatment' },
    sessionDuration: 5,

    tags: ['botox', 'bunny-lines', 'nose', 'neurotoxin', 'finishing-touch'],
    relatedProtocols: ['botox-glabella', 'botox-forehead', 'filler-nose'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'botox-gummy-smile',
    name: 'Botox — Gummy Smile Correction',
    category: 'injectable',
    subcategory: 'neurotoxin',
    treatmentArea: 'Levator labii superioris alaeque nasi (LLSAN) at alar crease',
    description: 'Precision neuromodulator injection to reduce excessive gingival display during smiling by relaxing the muscles responsible for upper lip elevation. Creates a more balanced, confident smile.',
    clinicalIndication: 'Excessive gingival display (>3 mm) during smiling',

    product: 'onabotulinumtoxinA (Botox Cosmetic)',
    unitsOrSyringes: '2–6 units total (1–3 per side)',
    dilution: '2.5 mL preservative-free saline per 100-unit vial',
    needleGauge: '32G 0.5-inch needle',

    anatomyLandmarks: [
      'Levator labii superioris alaeque nasi (LLSAN) — at alar groove',
      'Yonsei point — junction of alar groove and nasolabial fold',
      'Angular artery (avoid)',
      'Nasal ala',
    ],
    injectionTechnique: 'Identify the Yonsei point — the junction where the alar groove meets the nasolabial fold. Inject 1–3 units bilaterally at this point, deep to the skin but superficial to the maxilla. Ask patient to smile broadly before and after to assess. Can add injection point into compressor naris for additional effect.',
    injectionDepth: 'Intramuscular (3–4 mm)',
    injectionPoints: 2,
    aspirationRequired: false,

    contraindications: [
      'Known allergy to botulinum toxin',
      'Pregnancy or breastfeeding',
      'Bony or dental cause of gummy smile (not muscular)',
      'Active perioral infection',
    ],
    precautions: [
      'Very precise dosing — even 1 unit too much can affect smile',
      'Differentiate muscular vs. skeletal vs. dental gummy smile',
      'Start with lowest effective dose',
      'Warn about temporary smile asymmetry during onset',
    ],
    potentialComplications: [
      'Asymmetric smile',
      'Elongated upper lip appearance',
      'Difficulty smiling naturally',
      'Nasolabial fold deepening',
      'Upper lip ptosis (over-treatment)',
    ],
    emergencyKit: ['Ice packs', 'Topical arnica'],
    riskLevel: 'moderate',
    difficultyLevel: 'advanced',

    onsetTime: '3–5 days',
    peakResults: '14 days',
    duration: '2–4 months',
    expectedResults: [
      'Reduced gingival display by 2–4 mm',
      'More balanced and confident smile',
      'Natural lip position at rest maintained',
    ],
    touchUpTimeline: '2 weeks post-treatment',
    retreatmentInterval: '3–4 months',

    aftercare: [
      { timeframe: 'First 4 hours', instruction: 'Avoid rubbing nose or upper lip area', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'No vigorous facial expressions or exercise', priority: 'important' },
      { timeframe: 'First week', instruction: 'Smile may feel different — this normalizes', priority: 'recommended' },
    ],

    consentRequirements: {
      formId: 'CONSENT-NEUROTOXIN-001',
      formName: 'Neurotoxin Injection Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '64615', description: 'Chemodenervation of muscle(s); muscle(s) innervated by facial nerve' },
      { code: 'J0585', description: 'OnabotulinumtoxinA per unit' },
    ],
    documentationRequirements: [
      'Pre-treatment smile photographs (frontal)',
      'Gingival display measurement in mm',
      'Units per injection point',
      'Product lot number',
      'Signed consent',
    ],

    pricing: { min: 100, max: 200, unit: 'per treatment' },
    sessionDuration: 10,

    tags: ['botox', 'gummy-smile', 'smile-correction', 'neurotoxin'],
    relatedProtocols: ['botox-lip-flip', 'filler-lips-subtle'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'botox-chin-dimpling',
    name: 'Botox — Chin Dimpling (Peau d\'Orange)',
    category: 'injectable',
    subcategory: 'neurotoxin',
    treatmentArea: 'Mentalis muscle',
    description: 'Neuromodulator injection into the mentalis to smooth chin dimpling (peau d\'orange or "golf ball" chin) and create a smoother chin contour. Often paired with chin filler for optimal results.',
    clinicalIndication: 'Mentalis hyperactivity causing pebbled/dimpled chin appearance',

    product: 'onabotulinumtoxinA (Botox Cosmetic)',
    unitsOrSyringes: '4–8 units total',
    dilution: '2.5 mL preservative-free saline per 100-unit vial',
    needleGauge: '30G 0.5-inch needle',

    anatomyLandmarks: [
      'Mentalis muscle — paired muscles at chin tip',
      'Mental foramen (lateral — contains mental nerve, avoid)',
      'Labiomental crease (superior boundary)',
      'Chin pad soft tissue',
    ],
    injectionTechnique: 'Place 2 injection points into the mentalis muscle, one on each side of the midline chin, just below the labiomental crease. Inject into the muscle belly at moderate depth. Can add a midline injection if dimpling is severe. Avoid injecting near the mental foramen (laterally at premolar region).',
    injectionDepth: 'Intramuscular (3–5 mm)',
    injectionPoints: 2,
    aspirationRequired: false,

    contraindications: [
      'Known allergy to botulinum toxin',
      'Active chin/perioral infection',
      'Pregnancy or breastfeeding',
      'Chin implant or recent chin surgery',
    ],
    precautions: [
      'Avoid over-treatment — can cause lower lip incompetence',
      'Assess for depressor labii inferioris proximity',
      'Chin pad may feel soft/weak temporarily',
    ],
    potentialComplications: [
      'Lower lip incompetence (drooling)',
      'Difficulty with labial sounds (P, B)',
      'Asymmetry',
      'Bruising',
    ],
    emergencyKit: ['Ice packs', 'Topical arnica'],
    riskLevel: 'low',
    difficultyLevel: 'intermediate',

    onsetTime: '3–5 days',
    peakResults: '14 days',
    duration: '3–4 months',
    expectedResults: [
      'Smooth chin contour without dimpling',
      'Elimination of peau d\'orange texture',
      'Enhanced chin filler results when combined',
    ],
    touchUpTimeline: '2 weeks',
    retreatmentInterval: '3–4 months',

    aftercare: [
      { timeframe: 'First 4 hours', instruction: 'Do not press or rub chin', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'No exercise or heat exposure', priority: 'important' },
      { timeframe: 'First 48 hours', instruction: 'Report any drooling or lip weakness', priority: 'critical' },
    ],

    consentRequirements: {
      formId: 'CONSENT-NEUROTOXIN-001',
      formName: 'Neurotoxin Injection Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '64615', description: 'Chemodenervation of muscle(s); muscle(s) innervated by facial nerve' },
      { code: 'J0585', description: 'OnabotulinumtoxinA per unit' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs (frontal, chin close-up with mentalis activation)',
      'Units per injection point',
      'Product lot number',
      'Signed consent',
    ],

    pricing: { min: 100, max: 200, unit: 'per treatment' },
    sessionDuration: 10,

    tags: ['botox', 'chin', 'dimpling', 'mentalis', 'neurotoxin'],
    relatedProtocols: ['filler-chin', 'botox-neck-bands', 'filler-jawline'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'botox-brow-lift',
    name: 'Botox — Chemical Brow Lift',
    category: 'injectable',
    subcategory: 'neurotoxin',
    treatmentArea: 'Lateral orbicularis oculi, procerus, corrugator (strategic placement)',
    description: 'Strategic neuromodulator placement to achieve a non-surgical brow lift by relaxing the depressors of the brow while preserving the frontalis elevator. Creates a subtle, elegant arch elevation of 1–3 mm.',
    clinicalIndication: 'Mild brow ptosis, desire for more open/lifted eye appearance',

    product: 'onabotulinumtoxinA (Botox Cosmetic)',
    unitsOrSyringes: '2–6 units for brow lift component (in addition to standard upper face treatment)',
    dilution: '2.5 mL preservative-free saline per 100-unit vial',
    needleGauge: '30G or 32G 0.5-inch needle',

    anatomyLandmarks: [
      'Lateral brow fat pad — injection target zone',
      'Tail of the brow — lateral aspect',
      'Lateral orbital rim',
      'Orbicularis oculi — lateral portion (brow depressor)',
      'Frontalis — avoid treating lateral brow portion (maintains lift)',
    ],
    injectionTechnique: 'Place 2–4 units just beneath the lateral brow tail into the orbicularis oculi at the level of the orbital rim. This relaxes the brow depressor, allowing the unopposed frontalis to elevate the lateral brow. Must be combined with glabellar treatment to relax the medial brow depressors. When treating the forehead, intentionally reduce/omit doses in the lateral forehead to allow frontalis-mediated brow lift.',
    injectionDepth: 'Superficial intramuscular (2–3 mm) at orbital rim',
    injectionPoints: 2,
    aspirationRequired: false,

    contraindications: [
      'Known allergy to botulinum toxin',
      'Significant brow ptosis (surgical candidate)',
      'Deep-set eyes with heavy brow bone',
      'Pregnancy or breastfeeding',
    ],
    precautions: [
      'Requires careful assessment of existing brow position and frontalis strength',
      'Over-elevation can create surprised or "Spock" appearance',
      'Must be customized based on individual anatomy and goals',
      'Not effective for significant skin laxity',
    ],
    potentialComplications: [
      'Spock brow (over-elevation of lateral brow)',
      'Asymmetric brow position',
      'Headache from altered frontalis tension',
      'Heavy brow feeling if frontalis over-treated',
    ],
    emergencyKit: ['Ice packs', 'Topical arnica'],
    riskLevel: 'moderate',
    difficultyLevel: 'advanced',

    onsetTime: '5–7 days',
    peakResults: '2 weeks',
    duration: '3–4 months',
    expectedResults: [
      'Subtle lateral brow elevation of 1–3 mm',
      'More open, refreshed eye appearance',
      'Enhanced brow arch',
      'Youthful brow position restoration',
    ],
    touchUpTimeline: '2–3 weeks post-treatment',
    retreatmentInterval: '3–4 months',

    aftercare: [
      { timeframe: 'First 4 hours', instruction: 'Remain upright', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'Avoid rubbing brow area', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'No exercise or heat', priority: 'important' },
      { timeframe: '2 weeks', instruction: 'Return for assessment and fine-tuning', priority: 'recommended' },
    ],

    consentRequirements: {
      formId: 'CONSENT-NEUROTOXIN-001',
      formName: 'Neurotoxin Injection Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '64615', description: 'Chemodenervation of muscle(s); muscle(s) innervated by facial nerve' },
      { code: 'J0585', description: 'OnabotulinumtoxinA per unit' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs (frontal, oblique, brow measurements)',
      'Injection map with units',
      'Brow height measurements pre/post',
      'Product lot number',
      'Signed consent',
    ],

    pricing: { min: 150, max: 300, unit: 'per treatment (add-on to upper face)' },
    sessionDuration: 10,

    tags: ['botox', 'brow-lift', 'non-surgical', 'eye-opening', 'anti-aging'],
    relatedProtocols: ['botox-forehead', 'botox-glabella', 'botox-crows-feet'],
    lastUpdated: '2026-03-01',
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DERMAL FILLER PROTOCOLS (10)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: 'filler-lips-subtle',
    name: 'Lip Filler — Subtle Enhancement',
    category: 'injectable',
    subcategory: 'dermal-filler',
    treatmentArea: 'Upper and lower lips (vermillion body and border)',
    description: 'Conservative hyaluronic acid injection for natural lip enhancement. Focuses on hydration, border definition, and subtle volume restoration. The "your lips but better" approach — no one should be able to tell.',
    clinicalIndication: 'Mild lip volume loss, asymmetry correction, vermillion border definition',

    product: 'Hyaluronic acid filler (Restylane Kysse or Juvederm Volbella)',
    unitsOrSyringes: '0.5–1.0 mL (half to one syringe)',
    needleGauge: '27G needle or 25G cannula',

    anatomyLandmarks: [
      'Vermillion border (white roll)',
      'Cupid\'s bow peaks',
      'Philtral columns',
      'Oral commissures',
      'Wet-dry line (mucosal border)',
      'Superior and inferior labial arteries (deep — 3–5 mm from vermillion)',
    ],
    injectionTechnique: 'Begin with vermillion border definition using serial puncture or linear threading along the white roll. Add small bolus deposits (0.05–0.1 mL) into the vermillion body for subtle volume. Focus on Cupid\'s bow definition. Maintain or slightly enhance the natural lip ratio (lower lip slightly fuller than upper). Use cannula from lateral commissure for body filling to reduce vascular risk. Mold gently after injection.',
    injectionDepth: 'Border: intradermal at white roll (1–2 mm); Body: submucosal (3–4 mm)',
    injectionPoints: 8,
    aspirationRequired: true,

    contraindications: [
      'Known allergy to hyaluronic acid or lidocaine',
      'Active cold sore or perioral infection',
      'Pregnancy or breastfeeding',
      'Autoimmune connective tissue disease (relative)',
      'Recent dental procedure within 2 weeks',
      'History of anaphylaxis to HA products',
    ],
    precautions: [
      'Review vascular anatomy — superior and inferior labial arteries',
      'Have hyaluronidase readily available',
      'Aspirate before every injection point',
      'Stop immediately if blanching, severe pain, or dusky discoloration occurs',
      'Avoid if history of cold sores without prophylactic antiviral',
    ],
    potentialComplications: [
      'Bruising and swelling (very common, expected)',
      'Asymmetry',
      'Nodule or lump formation',
      'Herpes simplex reactivation',
      'Vascular occlusion (rare but serious — requires immediate hyaluronidase)',
      'Granuloma formation (rare)',
      'Migration',
    ],
    emergencyKit: [
      'Hyaluronidase (1,500 units reconstituted)',
      'Nitroglycerin paste 2%',
      'Warm compresses',
      'Aspirin 325 mg',
      'Epinephrine auto-injector',
      'Ice packs',
    ],
    riskLevel: 'moderate',
    difficultyLevel: 'intermediate',

    onsetTime: 'Immediate (swelling settles in 7–14 days)',
    peakResults: '2–4 weeks (after swelling resolves)',
    duration: '6–12 months',
    expectedResults: [
      'Naturally enhanced lip volume',
      'More defined vermillion border',
      'Improved lip symmetry',
      'Better hydrated, plumper texture',
      'Enhanced Cupid\'s bow',
    ],
    touchUpTimeline: '2–4 weeks post-initial treatment',
    retreatmentInterval: '6–12 months (or sooner for layering)',

    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'Apply ice packs 10 min on / 10 min off to reduce swelling', priority: 'critical' },
      { timeframe: 'First 48 hours', instruction: 'Avoid hot foods, alcohol, and strenuous exercise', priority: 'critical' },
      { timeframe: 'First 48 hours', instruction: 'Do not kiss, use straws, or apply lipstick', priority: 'important' },
      { timeframe: 'First week', instruction: 'Sleep elevated; avoid sleeping face-down', priority: 'important' },
      { timeframe: 'First 2 weeks', instruction: 'Avoid dental procedures, facial treatments, or heat exposure', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Contact clinic immediately if white blanching, severe/increasing pain, or dusky blue discoloration occurs', priority: 'critical' },
    ],

    consentRequirements: {
      formId: 'CONSENT-FILLER-001',
      formName: 'Dermal Filler Injection Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '11950', description: 'Subcutaneous injection of filling material (1 cc or less)' },
      { code: 'Q2026', description: 'Injection, Restylane, 0.1 mL' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs (frontal, oblique, profile)',
      'Product name, lot number, expiration date',
      'Volume injected per area',
      'Injection technique and sites documented',
      'Aspiration performed at each site',
      'Post-injection assessment and photos',
      'Signed consent',
    ],

    pricing: { min: 450, max: 750, unit: 'per syringe' },
    sessionDuration: 30,

    tags: ['filler', 'lips', 'subtle', 'natural', 'hyaluronic-acid', 'enhancement'],
    relatedProtocols: ['filler-lips-full', 'botox-lip-flip', 'botox-gummy-smile'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'filler-lips-full',
    name: 'Lip Filler — Full Volume Enhancement',
    category: 'injectable',
    subcategory: 'dermal-filler',
    treatmentArea: 'Upper and lower lips (full augmentation)',
    description: 'Comprehensive lip augmentation with hyaluronic acid for patients seeking noticeable but proportional volume enhancement. Addresses both border definition and body volume for a full, lush lip result.',
    clinicalIndication: 'Moderate to significant lip volume loss, desire for fuller lip appearance, lip asymmetry correction',

    product: 'Hyaluronic acid filler (Juvederm Ultra XC, Restylane Kysse, or RHA 2)',
    unitsOrSyringes: '1.0–2.0 mL (1–2 syringes, may stage over 2 sessions)',
    needleGauge: '27G needle and/or 25G cannula',

    anatomyLandmarks: [
      'Vermillion border and white roll',
      'Cupid\'s bow and philtral columns',
      'Oral commissures',
      'Wet-dry line',
      'Superior and inferior labial arteries',
      'Modiolus (lateral oral commissure)',
    ],
    injectionTechnique: 'Staged approach — border first, then body. Use linear threading along vermillion border for definition. Bolus technique (0.1–0.2 mL per depot) in the lip body for volume. Cannula entry from lateral commissure for deeper body filling. Tent the lip body with retrograde linear threading. Address upper lip:lower lip ratio (aim for 1:1.6 golden ratio). Mold between injections. Consider staging 1 syringe per session for new patients.',
    injectionDepth: 'Border: intradermal (1–2 mm); Body: submucosal to intramuscular (3–6 mm)',
    injectionPoints: 12,
    aspirationRequired: true,

    contraindications: [
      'Known allergy to hyaluronic acid or lidocaine',
      'Active herpes simplex outbreak',
      'Pregnancy or breastfeeding',
      'Autoimmune disease (relative)',
      'Unrealistic expectations',
      'Existing silicone or permanent lip filler',
    ],
    precautions: [
      'Prescribe antiviral prophylaxis for patients with HSV history',
      'Have hyaluronidase ready — prepared, not just on shelf',
      'Stage larger volumes over multiple sessions',
      'Check vascular anatomy with Doppler if available',
      'Aspirate at every injection point — no exceptions',
    ],
    potentialComplications: [
      'Significant swelling (3–7 days)',
      'Bruising',
      'Asymmetry',
      'Lumps or irregularity',
      'Vascular occlusion (emergency)',
      'Herpes reactivation',
      'Tyndall effect (if placed too superficially)',
      'Biofilm or delayed inflammatory reaction',
    ],
    emergencyKit: [
      'Hyaluronidase (1,500 units reconstituted)',
      'Nitroglycerin paste 2%',
      'Warm compresses',
      'Aspirin 325 mg',
      'Epinephrine auto-injector',
      'Ice packs',
    ],
    riskLevel: 'moderate',
    difficultyLevel: 'intermediate',

    onsetTime: 'Immediate (significant swelling 3–7 days)',
    peakResults: '2–4 weeks',
    duration: '9–12 months',
    expectedResults: [
      'Noticeably fuller, more voluminous lips',
      'Defined vermillion border and Cupid\'s bow',
      'Improved lip proportion and symmetry',
      'Youthful, plump lip texture',
    ],
    touchUpTimeline: '2–4 weeks',
    retreatmentInterval: '9–12 months for maintenance',

    aftercare: [
      { timeframe: 'First 48 hours', instruction: 'Ice frequently — 10 min on / 10 min off', priority: 'critical' },
      { timeframe: 'First 48 hours', instruction: 'No kissing, straws, or pressure on lips', priority: 'critical' },
      { timeframe: 'First 72 hours', instruction: 'Avoid hot foods, alcohol, strenuous exercise', priority: 'important' },
      { timeframe: 'First week', instruction: 'Sleep elevated on back; avoid face-down position', priority: 'important' },
      { timeframe: 'First 2 weeks', instruction: 'No dental work, facials, or chemical peels', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Seek immediate care for blanching, severe pain, or blue/purple discoloration', priority: 'critical' },
    ],

    consentRequirements: {
      formId: 'CONSENT-FILLER-001',
      formName: 'Dermal Filler Injection Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '11950', description: 'Subcutaneous injection of filling material (1 cc or less)' },
      { code: '11951', description: 'Subcutaneous injection of filling material (1.1–5.0 cc)' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs',
      'Product, lot number, expiration for each syringe',
      'Volume injected per area',
      'Aspiration documented',
      'Post-injection assessment',
      'Signed consent',
    ],

    pricing: { min: 650, max: 1400, unit: 'per syringe (1–2 syringes typical)' },
    sessionDuration: 45,

    tags: ['filler', 'lips', 'volume', 'augmentation', 'hyaluronic-acid'],
    relatedProtocols: ['filler-lips-subtle', 'botox-lip-flip', 'filler-nasolabial'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'filler-nasolabial',
    name: 'Filler — Nasolabial Folds',
    category: 'injectable',
    subcategory: 'dermal-filler',
    treatmentArea: 'Nasolabial folds (smile lines)',
    description: 'Hyaluronic acid injection to soften nasolabial folds — the creases running from the nose to the corners of the mouth. Restores volume loss in the midface that causes fold deepening.',
    clinicalIndication: 'Moderate to severe nasolabial folds, midface volume loss',

    product: 'Hyaluronic acid filler (Restylane, Juvederm Vollure, or RHA 3)',
    unitsOrSyringes: '1.0–2.0 mL (1 syringe per side typical)',
    needleGauge: '27G needle or 25G cannula',

    anatomyLandmarks: [
      'Nasolabial fold crease',
      'Angular artery (runs along fold — dangerous)',
      'Facial artery (crosses mandible, runs medial to fold)',
      'Pyriform aperture (nasal base)',
      'Modiolus',
      'Levator labii superioris',
    ],
    injectionTechnique: 'Cannula technique preferred for safety (entry point at lateral fold). Linear threading or fanning deep to the fold. Alternatively, serial puncture with needle using deep bolus technique (supraperiosteal). Inject beneath the fold, not directly into it. Support the midface — consider cheek augmentation first if significant midface deflation is present. Cross-hatch technique for broad folds.',
    injectionDepth: 'Deep dermal to supraperiosteal (4–8 mm depending on technique)',
    injectionPoints: 6,
    aspirationRequired: true,

    contraindications: [
      'Known allergy to hyaluronic acid',
      'Active infection at treatment site',
      'Pregnancy or breastfeeding',
      'Recent dental procedures within 2 weeks',
      'Permanent filler in the area',
    ],
    precautions: [
      'Careful vascular anatomy review — angular artery is in the treatment zone',
      'Cannula strongly recommended over needle for this area',
      'Address midface volume loss first (cheeks) before treating folds directly',
      'Avoid over-filling — can create unnatural "parentheses" appearance',
    ],
    potentialComplications: [
      'Bruising and swelling',
      'Asymmetry',
      'Vascular occlusion of angular artery (serious — can cause nasal necrosis)',
      'Nodules',
      'Tyndall effect',
      'Over-correction creating puffy appearance',
    ],
    emergencyKit: [
      'Hyaluronidase (1,500 units reconstituted)',
      'Nitroglycerin paste 2%',
      'Warm compresses',
      'Aspirin 325 mg',
      'Epinephrine auto-injector',
    ],
    riskLevel: 'moderate',
    difficultyLevel: 'intermediate',

    onsetTime: 'Immediate',
    peakResults: '2 weeks',
    duration: '9–18 months (depending on product)',
    expectedResults: [
      'Softened nasolabial folds',
      'More youthful midface contour',
      'Smoother transition from cheek to lip area',
      'Reduced shadow in the fold',
    ],
    touchUpTimeline: '2–4 weeks',
    retreatmentInterval: '9–18 months',

    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'Ice to reduce swelling', priority: 'important' },
      { timeframe: 'First 48 hours', instruction: 'Avoid strenuous exercise and alcohol', priority: 'important' },
      { timeframe: 'First 2 weeks', instruction: 'No dental procedures or facial massage', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Report any white spots, severe pain, or skin changes immediately', priority: 'critical' },
    ],

    consentRequirements: {
      formId: 'CONSENT-FILLER-001',
      formName: 'Dermal Filler Injection Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '11950', description: 'Subcutaneous injection of filling material (1 cc or less)' },
      { code: '11951', description: 'Subcutaneous injection of filling material (1.1–5.0 cc)' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs',
      'Product/lot details',
      'Volume per side',
      'Technique documented (needle vs cannula)',
      'Aspiration performed',
      'Signed consent',
    ],

    pricing: { min: 650, max: 1200, unit: 'per syringe' },
    sessionDuration: 30,

    tags: ['filler', 'nasolabial', 'smile-lines', 'midface', 'anti-aging'],
    relatedProtocols: ['filler-cheeks', 'filler-marionette', 'filler-lips-subtle'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'filler-marionette',
    name: 'Filler — Marionette Lines',
    category: 'injectable',
    subcategory: 'dermal-filler',
    treatmentArea: 'Marionette lines (oral commissure to jawline)',
    description: 'Hyaluronic acid injection to soften marionette lines and lift downturned oral commissures. Addresses the "sad" or "angry" resting expression caused by perioral volume loss and gravitational descent.',
    clinicalIndication: 'Moderate to severe marionette lines, downturned oral commissures, prejowl sulcus',

    product: 'Hyaluronic acid filler (Restylane Defyne, Juvederm Vollure, or RHA 3)',
    unitsOrSyringes: '1.0–2.0 mL total',
    needleGauge: '25G cannula preferred',

    anatomyLandmarks: [
      'Marionette line (oral commissure to jawline)',
      'Depressor anguli oris muscle',
      'Mental artery and nerve (avoid)',
      'Facial artery (crosses mandible — critical to avoid)',
      'Prejowl sulcus',
      'Modiolus',
    ],
    injectionTechnique: 'Cannula approach preferred — entry point lateral to fold at jawline level. Deep plane injection, supraperiosteal, with fanning technique from medial mandible to oral commissure. Build volume beneath the fold, not within it. Address the prejowl sulcus to create a smooth jawline. Can add small bolus at oral commissure to lift the corner of the mouth. Botox to the depressor anguli oris can enhance results.',
    injectionDepth: 'Deep — supraperiosteal (5–8 mm)',
    injectionPoints: 4,
    aspirationRequired: true,

    contraindications: [
      'Known allergy to HA filler',
      'Active infection',
      'Pregnancy or breastfeeding',
      'Permanent fillers in the area',
      'Significant jowling (surgical candidate)',
    ],
    precautions: [
      'Map facial artery before injection',
      'Cannula strongly preferred for safety',
      'Often requires combination with chin/jawline filler',
      'Don\'t chase the line — volumize the deficit',
    ],
    potentialComplications: [
      'Bruising',
      'Swelling',
      'Asymmetry',
      'Vascular compromise (facial artery territory)',
      'Nodules',
      'Stiffness in the lower face',
    ],
    emergencyKit: [
      'Hyaluronidase (1,500 units reconstituted)',
      'Nitroglycerin paste 2%',
      'Warm compresses',
      'Aspirin 325 mg',
    ],
    riskLevel: 'moderate',
    difficultyLevel: 'advanced',

    onsetTime: 'Immediate',
    peakResults: '2 weeks',
    duration: '9–15 months',
    expectedResults: [
      'Softened marionette lines',
      'Lifted oral commissures',
      'Reduced "sad" or "angry" resting expression',
      'Smoother jawline contour',
    ],
    touchUpTimeline: '2–4 weeks',
    retreatmentInterval: '9–15 months',

    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'Ice and arnica to reduce swelling', priority: 'important' },
      { timeframe: 'First 48 hours', instruction: 'Avoid extreme facial expressions', priority: 'important' },
      { timeframe: 'First 2 weeks', instruction: 'No dental work or facial massage', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Report any skin color changes, severe pain, or vision changes immediately', priority: 'critical' },
    ],

    consentRequirements: {
      formId: 'CONSENT-FILLER-001',
      formName: 'Dermal Filler Injection Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '11950', description: 'Subcutaneous injection of filling material (1 cc or less)' },
      { code: '11951', description: 'Subcutaneous injection of filling material (1.1–5.0 cc)' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs',
      'Product/lot/volume documentation',
      'Technique (cannula vs needle)',
      'Signed consent',
    ],

    pricing: { min: 650, max: 1200, unit: 'per syringe' },
    sessionDuration: 30,

    tags: ['filler', 'marionette', 'lower-face', 'anti-aging', 'oral-commissure'],
    relatedProtocols: ['filler-nasolabial', 'filler-chin', 'filler-jawline'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'filler-cheeks',
    name: 'Filler — Cheek Augmentation / Midface Volumization',
    category: 'injectable',
    subcategory: 'dermal-filler',
    treatmentArea: 'Malar and submalar cheeks, midface',
    description: 'Strategic midface volume restoration with hyaluronic acid to lift and contour the cheeks. The cornerstone of full-face rejuvenation — restoring cheek volume lifts the lower face, softens nasolabial folds, and opens the under-eye area.',
    clinicalIndication: 'Midface volume loss, flattened cheek contour, malar/submalar hollowing',

    product: 'Hyaluronic acid filler (Juvederm Voluma, Restylane Lyft, or RHA 4)',
    unitsOrSyringes: '1.0–3.0 mL per side (2–6 mL total)',
    needleGauge: '25G or 22G cannula (preferred); 27G needle for specific points',

    anatomyLandmarks: [
      'Malar eminence (highest point of cheekbone)',
      'Submalar triangle (hollow below cheekbone)',
      'Infraorbital foramen and nerve',
      'Transverse facial artery',
      'Parotid duct (Stensen\'s duct)',
      'Zygomatic arch',
      'Malar fat pad',
    ],
    injectionTechnique: 'Cannula technique with entry point at lateral mid-cheek or near nasolabial fold. Deep supraperiosteal injection on the malar eminence for lift, submalar fanning for volume. Bolus technique on bone for structure, then fanning in the submalar space. Build a "scaffold" with deep product, then soften contours superficially if needed. Assess from all angles during injection.',
    injectionDepth: 'Supraperiosteal and deep subcutaneous (6–12 mm)',
    injectionPoints: 6,
    aspirationRequired: true,

    contraindications: [
      'Known allergy to HA filler',
      'Active skin infection',
      'Pregnancy or breastfeeding',
      'Malar festoons or severe skin laxity',
      'History of malar implants (relative)',
    ],
    precautions: [
      'Avoid infraorbital neurovascular bundle',
      'Stay deep — superficial injection causes visible lumps',
      'Assess symmetry from frontal and 45-degree angles',
      'Address cheeks before treating nasolabial folds for better outcomes',
    ],
    potentialComplications: [
      'Asymmetry',
      'Swelling (can be significant for 5–7 days)',
      'Bruising',
      'Migration or displacement',
      'Tyndall effect (if too superficial)',
      'Vascular occlusion (rare)',
      'Malar edema (rare, prolonged)',
    ],
    emergencyKit: [
      'Hyaluronidase (1,500 units reconstituted)',
      'Nitroglycerin paste 2%',
      'Warm compresses',
      'Aspirin 325 mg',
    ],
    riskLevel: 'moderate',
    difficultyLevel: 'intermediate',

    onsetTime: 'Immediate',
    peakResults: '2–4 weeks',
    duration: '12–24 months (Voluma can last up to 2 years)',
    expectedResults: [
      'Restored cheek volume and contour',
      'Lifted midface with improved projection',
      'Softened nasolabial folds (indirect lift)',
      'More youthful facial shape',
      'Improved under-eye appearance (indirect support)',
    ],
    touchUpTimeline: '2–4 weeks',
    retreatmentInterval: '12–24 months',

    aftercare: [
      { timeframe: 'First 48 hours', instruction: 'Ice to reduce swelling; sleep elevated', priority: 'important' },
      { timeframe: 'First 48 hours', instruction: 'Avoid strenuous exercise', priority: 'important' },
      { timeframe: 'First 2 weeks', instruction: 'No facial massage, facial treatments, or sleeping on face', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Report any vision changes or severe pain immediately', priority: 'critical' },
    ],

    consentRequirements: {
      formId: 'CONSENT-FILLER-001',
      formName: 'Dermal Filler Injection Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '11950', description: 'Subcutaneous injection of filling material (1 cc or less)' },
      { code: '11951', description: 'Subcutaneous injection of filling material (1.1–5.0 cc)' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs (all angles)',
      'Product/lot details per syringe',
      'Volume and technique per area',
      'Aspiration documented',
      'Signed consent',
    ],

    pricing: { min: 750, max: 1500, unit: 'per syringe' },
    sessionDuration: 45,

    tags: ['filler', 'cheeks', 'midface', 'volumization', 'contouring', 'anti-aging'],
    relatedProtocols: ['filler-nasolabial', 'filler-under-eye', 'filler-temples'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'filler-chin',
    name: 'Filler — Chin Augmentation',
    category: 'injectable',
    subcategory: 'dermal-filler',
    treatmentArea: 'Chin (mentum)',
    description: 'Non-surgical chin augmentation with hyaluronic acid filler to improve facial profile, add projection, and balance facial proportions. Ideal for patients with a recessed chin or desire for stronger jawline definition.',
    clinicalIndication: 'Chin recession, weak chin profile, facial proportion imbalance, chin dimpling (combined with Botox)',

    product: 'Hyaluronic acid filler (Juvederm Voluma, Restylane Lyft, or Radiesse)',
    unitsOrSyringes: '1.0–3.0 mL',
    needleGauge: '25G cannula or 27G needle',

    anatomyLandmarks: [
      'Pogonion (most anterior chin point)',
      'Mental protuberance',
      'Mental foramen and nerve (avoid — at premolar level)',
      'Mentalis muscle',
      'Submental artery',
      'Labiomental crease',
    ],
    injectionTechnique: 'Deep supraperiosteal bolus technique on the chin bone at the pogonion for anterior projection. Layer with fanning technique for width. Cannula from lateral chin entry for safety. Can combine needle bolus on bone (structural) with cannula fanning (contouring). Assess profile view during injection. Combine with Botox to mentalis for chin dimpling.',
    injectionDepth: 'Supraperiosteal (on bone, 8–12 mm deep)',
    injectionPoints: 4,
    aspirationRequired: true,

    contraindications: [
      'Known allergy to HA filler',
      'Active infection',
      'Pregnancy or breastfeeding',
      'Chin implant (relative — discuss with surgeon)',
      'Severe microgenia requiring surgical intervention',
    ],
    precautions: [
      'Map mental foramen before injection',
      'Stay medial and deep to avoid mental nerve',
      'Avoid labiomental crease over-filling (unnatural)',
      'Assess from profile view during treatment',
    ],
    potentialComplications: [
      'Asymmetry',
      'Swelling',
      'Bruising',
      'Mental nerve paresthesia (if injected near foramen)',
      'Product displacement',
      'Chin heaviness feeling (temporary)',
    ],
    emergencyKit: [
      'Hyaluronidase (if HA product used)',
      'Ice packs',
      'Topical arnica',
    ],
    riskLevel: 'moderate',
    difficultyLevel: 'intermediate',

    onsetTime: 'Immediate',
    peakResults: '2 weeks',
    duration: '12–24 months',
    expectedResults: [
      'Improved chin projection',
      'More balanced facial profile',
      'Enhanced jawline definition',
      'Stronger lower face contour',
    ],
    touchUpTimeline: '2–4 weeks',
    retreatmentInterval: '12–24 months',

    aftercare: [
      { timeframe: 'First 48 hours', instruction: 'Avoid pressure on chin (no chin resting on hands)', priority: 'critical' },
      { timeframe: 'First 48 hours', instruction: 'Ice for swelling', priority: 'important' },
      { timeframe: 'First 2 weeks', instruction: 'No dental work', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Report numbness or tingling that persists beyond 48 hours', priority: 'critical' },
    ],

    consentRequirements: {
      formId: 'CONSENT-FILLER-001',
      formName: 'Dermal Filler Injection Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '11950', description: 'Subcutaneous injection of filling material (1 cc or less)' },
      { code: '11951', description: 'Subcutaneous injection of filling material (1.1–5.0 cc)' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs (frontal, profile, oblique)',
      'Product/lot/volume',
      'Injection points and technique',
      'Signed consent',
    ],

    pricing: { min: 750, max: 1500, unit: 'per syringe' },
    sessionDuration: 30,

    tags: ['filler', 'chin', 'augmentation', 'profile', 'contouring'],
    relatedProtocols: ['filler-jawline', 'botox-chin-dimpling', 'filler-marionette'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'filler-jawline',
    name: 'Filler — Jawline Contouring',
    category: 'injectable',
    subcategory: 'dermal-filler',
    treatmentArea: 'Jawline (mandibular border from angle to chin)',
    description: 'Precision jawline sculpting with high-G-prime hyaluronic acid filler to create a sharp, defined jawline contour. Addresses prejowl sulcus, jawline irregularity, and loss of mandibular definition.',
    clinicalIndication: 'Weak jawline definition, prejowl sulcus, early jowling, desire for sculpted jawline',

    product: 'Hyaluronic acid filler (Juvederm Volux, Restylane Defyne, RHA 4, or Radiesse)',
    unitsOrSyringes: '2.0–6.0 mL total (bilateral)',
    needleGauge: '22G or 25G cannula',

    anatomyLandmarks: [
      'Mandibular border (palpable bony edge)',
      'Mandibular angle (gonial angle)',
      'Prejowl sulcus',
      'Facial artery (crosses mandible anterior to masseter)',
      'Marginal mandibular nerve',
      'Parotid gland (posterior)',
    ],
    injectionTechnique: 'Cannula technique — entry point at chin or mandibular angle. Deep supraperiosteal injection along the mandibular border in a linear threading technique. Build structural support at the mandibular angle with bolus technique, then connect with linear deposits along the border. Address prejowl sulcus separately. Assess symmetry from frontal and sub-chin views. Often requires 2+ syringes per side for full effect.',
    injectionDepth: 'Supraperiosteal (on bone)',
    injectionPoints: 8,
    aspirationRequired: true,

    contraindications: [
      'Known allergy to HA filler',
      'Active infection',
      'Pregnancy or breastfeeding',
      'Significant jowling (surgical candidate)',
      'Mandibular implants (relative)',
    ],
    precautions: [
      'Map facial artery crossing point at mandible',
      'Stay on bone — avoid superficial injection',
      'Large volume area — be mindful of total HA load per session',
      'May need multiple sessions for dramatic results',
    ],
    potentialComplications: [
      'Asymmetry',
      'Significant swelling (3–7 days)',
      'Bruising',
      'Product displacement if superficial',
      'Vascular compromise of facial artery',
      'Marginal mandibular nerve paresis (very rare)',
    ],
    emergencyKit: [
      'Hyaluronidase (1,500 units reconstituted)',
      'Nitroglycerin paste 2%',
      'Warm compresses',
      'Aspirin 325 mg',
    ],
    riskLevel: 'moderate',
    difficultyLevel: 'advanced',

    onsetTime: 'Immediate',
    peakResults: '2–4 weeks',
    duration: '12–18 months',
    expectedResults: [
      'Sharp, defined jawline contour',
      'Improved facial profile and proportion',
      'Smoother jawline silhouette',
      'Reduced appearance of jowling',
      'Enhanced lower face structure',
    ],
    touchUpTimeline: '4 weeks',
    retreatmentInterval: '12–18 months',

    aftercare: [
      { timeframe: 'First 48 hours', instruction: 'Ice frequently; sleep elevated', priority: 'important' },
      { timeframe: 'First 48 hours', instruction: 'Avoid chewing gum or very hard foods', priority: 'important' },
      { timeframe: 'First 2 weeks', instruction: 'No facial massage or sleeping on side', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Report any skin discoloration, severe pain, or changes in sensation', priority: 'critical' },
    ],

    consentRequirements: {
      formId: 'CONSENT-FILLER-001',
      formName: 'Dermal Filler Injection Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '11951', description: 'Subcutaneous injection of filling material (1.1–5.0 cc)' },
      { code: '11952', description: 'Subcutaneous injection of filling material (5.1–10.0 cc)' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs (all angles including sub-chin)',
      'Product/lot/volume per side',
      'Injection technique documented',
      'Signed consent',
    ],

    pricing: { min: 750, max: 1500, unit: 'per syringe (2–4 syringes typical)' },
    sessionDuration: 45,

    tags: ['filler', 'jawline', 'contouring', 'sculpting', 'lower-face'],
    relatedProtocols: ['filler-chin', 'botox-masseter', 'filler-marionette'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'filler-under-eye',
    name: 'Filler — Under-Eye (Tear Trough)',
    category: 'injectable',
    subcategory: 'dermal-filler',
    treatmentArea: 'Tear trough / infraorbital hollow',
    description: 'Delicate hyaluronic acid injection to address under-eye hollowing and dark circles caused by volume loss. One of the highest-satisfaction procedures when performed correctly on the right candidate. Requires expert injector assessment.',
    clinicalIndication: 'Tear trough deformity, infraorbital hollowing, volume-related dark circles',

    product: 'Hyaluronic acid filler (Restylane-L, Belotero Balance, or Juvederm Volbella)',
    unitsOrSyringes: '0.5–1.0 mL total (0.25–0.5 per side)',
    needleGauge: '25G cannula (strongly preferred)',

    anatomyLandmarks: [
      'Tear trough ligament (orbicularis retaining ligament)',
      'Infraorbital rim',
      'Infraorbital foramen and nerve',
      'Angular artery and vein (medial canthus — high risk)',
      'Orbicularis oculi muscle',
      'Orbital septum (do not inject above)',
    ],
    injectionTechnique: 'Cannula technique from lateral entry point (temporal or mid-cheek). Deep supraperiosteal injection below the orbicularis muscle and above the periosteum. Very small aliquots (0.05–0.1 mL) deposited in a fan pattern. Stay on bone, below the orbital rim. Never inject above the orbital rim. Ultra-conservative volume — under-correction is far safer than over-correction. Feather product across the hollow. Patient should be reclined to neutral position to assess.',
    injectionDepth: 'Supraperiosteal (deep to orbicularis oculi, on the maxillary bone)',
    injectionPoints: 4,
    aspirationRequired: true,

    contraindications: [
      'Known allergy to HA filler',
      'Significant lower eyelid fat prolapse (bags — surgical candidate)',
      'Festoons or malar mounds',
      'Very thin skin with visible vasculature',
      'History of lower eyelid surgery (relative)',
      'Pregnancy or breastfeeding',
      'Allergic predisposition to chronic edema',
    ],
    precautions: [
      'This is an advanced technique — expert injector only',
      'Cannula use is strongly recommended',
      'Tyndall effect risk is high with superficial injection',
      'Malar edema risk — screen for allergies, thyroid, and sinus issues',
      'Under-correct — easier to add than remove',
      'Proper patient selection is critical',
    ],
    potentialComplications: [
      'Tyndall effect (blue discoloration from superficial HA)',
      'Malar edema (persistent swelling)',
      'Bruising (common in thin periorbital skin)',
      'Lumps and irregularity',
      'Vascular occlusion (angular artery — vision-threatening)',
      'Blindness (extremely rare — retinal artery occlusion)',
      'Chronic edema',
    ],
    emergencyKit: [
      'Hyaluronidase (1,500 units reconstituted — immediately available)',
      'Nitroglycerin paste 2%',
      'Timolol 0.5% ophthalmic',
      'Anterior chamber paracentesis kit',
      'Aspirin 325 mg',
      'Warm compresses',
      'Epinephrine auto-injector',
    ],
    riskLevel: 'high',
    difficultyLevel: 'expert',

    onsetTime: 'Immediate (swelling 7–14 days in this area)',
    peakResults: '3–4 weeks',
    duration: '12–18 months',
    expectedResults: [
      'Reduced under-eye hollowing',
      'Diminished dark circles (volume-related)',
      'Smoother under-eye contour',
      'More rested, refreshed appearance',
    ],
    touchUpTimeline: '4 weeks (after all swelling resolves)',
    retreatmentInterval: '12–18 months',

    aftercare: [
      { timeframe: 'First 48 hours', instruction: 'Ice gently — 5 min on / 5 min off (do not press firmly)', priority: 'critical' },
      { timeframe: 'First 48 hours', instruction: 'Sleep elevated; avoid sleeping face-down', priority: 'critical' },
      { timeframe: 'First week', instruction: 'Avoid eye rubbing, contact lens insertion if possible, and eye makeup', priority: 'important' },
      { timeframe: 'First 2 weeks', instruction: 'No exercise, alcohol, or blood thinners', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Any sudden vision changes, severe pain, or white skin patches — call 911 and clinic immediately', priority: 'critical' },
    ],

    consentRequirements: {
      formId: 'CONSENT-FILLER-002',
      formName: 'Tear Trough/Periorbital Filler Informed Consent',
      expiresInDays: 365,
      requiresWitness: true,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '11950', description: 'Subcutaneous injection of filling material (1 cc or less)' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs (all angles, close-up eyes)',
      'Snap-back test and lower lid laxity assessment',
      'Product/lot/volume per side',
      'Cannula entry point and technique',
      'Aspiration documented at all points',
      'Vision check pre and post procedure',
      'Signed consent with witness',
    ],

    pricing: { min: 650, max: 1100, unit: 'per treatment (both eyes)' },
    sessionDuration: 30,

    tags: ['filler', 'under-eye', 'tear-trough', 'dark-circles', 'advanced', 'expert'],
    relatedProtocols: ['filler-cheeks', 'filler-temples', 'botox-crows-feet'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'filler-temples',
    name: 'Filler — Temple Augmentation',
    category: 'injectable',
    subcategory: 'dermal-filler',
    treatmentArea: 'Temporal fossa',
    description: 'Volume restoration of the temporal hollows to reverse one of the earliest and most aging signs of facial volume loss. Creates a smoother, more youthful transition from forehead to cheeks and improves the "heart-shaped" face contour.',
    clinicalIndication: 'Temporal hollowing, temporal wasting, "hourglass" skull appearance',

    product: 'Hyaluronic acid filler (Juvederm Voluma, Restylane Lyft) or Radiesse (diluted)',
    unitsOrSyringes: '1.0–3.0 mL per side',
    needleGauge: '22G or 25G cannula (strongly preferred)',

    anatomyLandmarks: [
      'Temporal fossa — concavity lateral to eye',
      'Temporal fusion line (superior boundary)',
      'Zygomatic arch (inferior boundary)',
      'Superficial temporal artery and vein (posterior — pulsation palpable)',
      'Deep temporal artery (deep — runs on temporalis muscle)',
      'Temporal branch of facial nerve (superficial)',
      'Sentinel vein (marks lateral orbit)',
    ],
    injectionTechnique: 'Cannula technique with entry point at temporal hairline or lateral to the brow. Deep injection — either supraperiosteal (on temporal bone) or deep to the temporalis muscle. Do not inject into the muscle itself. Fan product across the temporal fossa. Avoid the superficial temporal artery (palpate pulsation before injection). Stay deep and posterior to minimize nerve and vessel risk.',
    injectionDepth: 'Supraperiosteal or sub-muscular (deep to temporalis, on bone)',
    injectionPoints: 4,
    aspirationRequired: true,

    contraindications: [
      'Known allergy to HA filler',
      'Active temporal infection or headache',
      'Pregnancy or breastfeeding',
      'Temporal arteritis (rule out in patients over 50)',
      'Anticoagulation therapy (relative)',
    ],
    precautions: [
      'Palpate superficial temporal artery before injection',
      'Cannula use is critical — numerous danger vessels in this area',
      'Stay deep — superficial injection causes visible lumps',
      'High-risk vascular zone — vision loss reported from temple injections',
    ],
    potentialComplications: [
      'Bruising (common)',
      'Asymmetry',
      'Vascular occlusion of temporal vessels',
      'Vision loss (via deep temporal artery to ophthalmic circulation)',
      'Visible lumps (if too superficial)',
      'Temporal nerve palsy (rare)',
    ],
    emergencyKit: [
      'Hyaluronidase (1,500 units reconstituted — immediately available)',
      'Nitroglycerin paste 2%',
      'Timolol 0.5% ophthalmic',
      'Aspirin 325 mg',
      'Warm compresses',
    ],
    riskLevel: 'high',
    difficultyLevel: 'advanced',

    onsetTime: 'Immediate',
    peakResults: '2 weeks',
    duration: '12–18 months',
    expectedResults: [
      'Restored temporal volume',
      'Smoother, more youthful facial contour',
      'Improved "heart shape" face appearance',
      'Better frame for the upper face',
    ],
    touchUpTimeline: '2–4 weeks',
    retreatmentInterval: '12–18 months',

    aftercare: [
      { timeframe: 'First 48 hours', instruction: 'Ice gently; avoid pressure on temples', priority: 'important' },
      { timeframe: 'First 48 hours', instruction: 'No eyeglasses that rest on temples if possible', priority: 'important' },
      { timeframe: 'First 2 weeks', instruction: 'No exercise or heat exposure', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Report any vision changes, severe headache, or skin color changes immediately', priority: 'critical' },
    ],

    consentRequirements: {
      formId: 'CONSENT-FILLER-003',
      formName: 'Temple/Periorbital Filler Informed Consent',
      expiresInDays: 365,
      requiresWitness: true,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '11950', description: 'Subcutaneous injection of filling material (1 cc or less)' },
      { code: '11951', description: 'Subcutaneous injection of filling material (1.1–5.0 cc)' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs (all angles)',
      'Superficial temporal artery palpation documented',
      'Product/lot/volume per side',
      'Cannula entry point and depth',
      'Vision check pre and post',
      'Signed consent with witness',
    ],

    pricing: { min: 750, max: 1500, unit: 'per syringe (1–2 per side)' },
    sessionDuration: 30,

    tags: ['filler', 'temples', 'volume-restoration', 'anti-aging', 'advanced'],
    relatedProtocols: ['filler-cheeks', 'filler-under-eye', 'botox-forehead'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'filler-hands',
    name: 'Filler — Hand Rejuvenation',
    category: 'injectable',
    subcategory: 'dermal-filler',
    treatmentArea: 'Dorsal hands',
    description: 'Volume restoration of the dorsal hands to camouflage visible tendons, veins, and bony prominences. Hands are a telltale sign of aging — this treatment creates a smoother, more youthful hand appearance.',
    clinicalIndication: 'Volume loss of dorsal hands, visible tendons and veins, skeletal appearance',

    product: 'Hyaluronic acid filler (Restylane Lyft — FDA-approved for hands) or Radiesse (diluted)',
    unitsOrSyringes: '1.0–2.0 mL per hand',
    needleGauge: '25G cannula or 27G needle',

    anatomyLandmarks: [
      'Dorsal hand — between metacarpal bones',
      'Extensor tendons (visible, avoid direct injection)',
      'Dorsal venous arch (superficial — visible)',
      'Intermetacarpal spaces',
      'Dorsal digital arteries',
    ],
    injectionTechnique: 'Single or dual entry point technique with cannula in the dorsal hand web spaces. Fan product in a deep subcutaneous plane between the extensor tendons. Alternatively, use needle bolus technique between metacarpals with deep injection beneath the venous plexus. Massage/mold extensively after injection to distribute product evenly. Make a fist to check contour. Tent the skin when injecting to stay in the proper plane.',
    injectionDepth: 'Deep subcutaneous, beneath venous plexus (3–5 mm)',
    injectionPoints: 6,
    aspirationRequired: true,

    contraindications: [
      'Known allergy to HA filler',
      'Active hand infection or dermatitis',
      'Pregnancy or breastfeeding',
      'Raynaud\'s disease (relative)',
      'Carpal tunnel syndrome (relative)',
    ],
    precautions: [
      'Extensive venous network — bruising is common',
      'Stay deep to venous plexus',
      'Massage thoroughly after injection',
      'Warn patient about 5–7 days swelling',
    ],
    potentialComplications: [
      'Bruising (very common)',
      'Swelling (can be significant — 5–7 days)',
      'Lumps or unevenness',
      'Vascular occlusion (digital artery — rare)',
      'Difficulty gripping for 24–48 hours',
    ],
    emergencyKit: [
      'Hyaluronidase',
      'Nitroglycerin paste 2%',
      'Warm compresses',
      'Ice packs',
    ],
    riskLevel: 'moderate',
    difficultyLevel: 'intermediate',

    onsetTime: 'Immediate',
    peakResults: '2 weeks',
    duration: '6–12 months',
    expectedResults: [
      'Smoother dorsal hand contour',
      'Reduced visibility of veins and tendons',
      'More youthful hand appearance',
      'Improved skin quality with HA hydration',
    ],
    touchUpTimeline: '2–4 weeks',
    retreatmentInterval: '6–12 months',

    aftercare: [
      { timeframe: 'First 24 hours', instruction: 'Avoid gripping heavy objects', priority: 'important' },
      { timeframe: 'First 48 hours', instruction: 'Ice for swelling; elevate hands when resting', priority: 'important' },
      { timeframe: 'First week', instruction: 'Avoid hand-intensive exercise (weights, yoga)', priority: 'important' },
      { timeframe: 'First 2 weeks', instruction: 'No manicures or hand treatments', priority: 'recommended' },
    ],

    consentRequirements: {
      formId: 'CONSENT-FILLER-001',
      formName: 'Dermal Filler Injection Informed Consent',
      expiresInDays: 365,
      requiresWitness: false,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '11950', description: 'Subcutaneous injection of filling material (1 cc or less)' },
      { code: '11951', description: 'Subcutaneous injection of filling material (1.1–5.0 cc)' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs (dorsal hands, flat and fist positions)',
      'Product/lot/volume per hand',
      'Signed consent',
    ],

    pricing: { min: 750, max: 1200, unit: 'per hand' },
    sessionDuration: 30,

    tags: ['filler', 'hands', 'rejuvenation', 'volume-restoration', 'anti-aging'],
    relatedProtocols: ['filler-cheeks', 'filler-temples'],
    lastUpdated: '2026-03-01',
  },

  {
    id: 'filler-nose',
    name: 'Filler — Liquid Rhinoplasty (Non-Surgical Nose Job)',
    category: 'injectable',
    subcategory: 'dermal-filler',
    treatmentArea: 'Nasal dorsum, tip, and radix',
    description: 'Non-surgical nose reshaping using hyaluronic acid filler to smooth dorsal humps, lift the nasal tip, correct asymmetry, or refine the nasal profile. A high-risk, high-reward procedure requiring expert injector skills.',
    clinicalIndication: 'Dorsal hump camouflage, nasal tip ptosis, post-rhinoplasty refinement, minor nasal asymmetry',

    product: 'Hyaluronic acid filler (Restylane-L or Juvederm Voluma)',
    unitsOrSyringes: '0.3–1.0 mL (conservative dosing essential)',
    needleGauge: '27G needle (precision required)',

    anatomyLandmarks: [
      'Nasal dorsum (bridge)',
      'Radix (root of nose at glabella)',
      'Tip-defining points (dome)',
      'Dorsal nasal artery (branch of ophthalmic — HIGH risk)',
      'Lateral nasal artery',
      'Columella',
      'Nasal bones and upper/lower lateral cartilages',
    ],
    injectionTechnique: 'Very small bolus injections (0.05–0.1 mL) placed precisely on the nasal dorsum to camouflage humps by filling the supra- and infra-tip break points. For tip elevation, inject at the base of the columella or supratip area. Stay midline and deep (on cartilage/bone). Use linear threading on dorsum. Aspirate at every single injection point. Have hyaluronidase drawn and ready. This is the highest-risk filler area on the face.',
    injectionDepth: 'Supraperiosteal/supraperichondrial (directly on bone and cartilage)',
    injectionPoints: 4,
    aspirationRequired: true,

    contraindications: [
      'Known allergy to HA filler',
      'Previous rhinoplasty with compromised blood supply (relative)',
      'Active nasal infection or skin disease',
      'Pregnancy or breastfeeding',
      'Permanent filler already in the nose',
      'History of nasal vascular events',
    ],
    precautions: [
      'This is the HIGHEST-RISK area for filler — expert only',
      'The nose is an end-artery territory — vascular occlusion can cause necrosis or blindness',
      'Aspirate at every injection point — mandatory',
      'Use minimum effective volume',
      'Have hyaluronidase prepared before beginning',
      'Low-pressure injection technique only',
      'Cannot add projection to a nose — only camouflage and smooth',
    ],
    potentialComplications: [
      'Skin necrosis (nasal tip — poor collateral blood supply)',
      'Blindness (retinal artery occlusion via dorsal nasal artery)',
      'Vascular occlusion (immediate emergency)',
      'Bruising and swelling',
      'Asymmetry',
      'Alar compromise',
      'Infection',
    ],
    emergencyKit: [
      'Hyaluronidase (1,500 units reconstituted — DRAWN UP and ready)',
      'Nitroglycerin paste 2%',
      'Timolol 0.5% ophthalmic drops',
      'Aspirin 325 mg',
      'Warm compresses',
      'Anterior chamber paracentesis kit',
      'Epinephrine auto-injector',
    ],
    riskLevel: 'high',
    difficultyLevel: 'expert',

    onsetTime: 'Immediate',
    peakResults: '1–2 weeks',
    duration: '9–12 months',
    expectedResults: [
      'Smoother nasal profile',
      'Camouflaged dorsal hump',
      'Improved nasal symmetry',
      'Subtle tip refinement',
      'Enhanced nasal bridge height',
    ],
    touchUpTimeline: '2–4 weeks',
    retreatmentInterval: '9–12 months',

    aftercare: [
      { timeframe: 'First 4 hours', instruction: 'Do not touch, press, or wear glasses on nose', priority: 'critical' },
      { timeframe: 'First 24 hours', instruction: 'Avoid bending over or lying flat', priority: 'critical' },
      { timeframe: 'First 48 hours', instruction: 'No exercise, alcohol, or heat', priority: 'critical' },
      { timeframe: 'First 2 weeks', instruction: 'No nose blowing forcefully; no nasal strips', priority: 'important' },
      { timeframe: 'Ongoing', instruction: 'Any skin color change, vision changes, or severe pain — call 911 and clinic immediately', priority: 'critical' },
    ],

    consentRequirements: {
      formId: 'CONSENT-FILLER-004',
      formName: 'Non-Surgical Rhinoplasty Informed Consent (High Risk)',
      expiresInDays: 365,
      requiresWitness: true,
      requiresPhotoConsent: true,
    },
    cptCodes: [
      { code: '11950', description: 'Subcutaneous injection of filling material (1 cc or less)' },
    ],
    documentationRequirements: [
      'Pre-treatment photographs (all angles including base view)',
      'Previous rhinoplasty history documented',
      'Vascular anatomy assessment',
      'Product/lot/volume at each injection point',
      'Aspiration at every point documented',
      'Vision check pre and post',
      'Emergency protocol reviewed with team',
      'Signed consent with witness',
    ],

    pricing: { min: 750, max: 1500, unit: 'per treatment' },
    sessionDuration: 30,

    tags: ['filler', 'nose', 'liquid-rhinoplasty', 'non-surgical', 'contouring', 'expert', 'high-risk'],
    relatedProtocols: ['botox-bunny-lines', 'filler-cheeks', 'filler-chin'],
    lastUpdated: '2026-03-01',
  },
];

export default INJECTABLE_PROTOCOLS;
