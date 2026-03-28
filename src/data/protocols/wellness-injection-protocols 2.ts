// ─── Wellness Injection Protocols ─────────────────────────────────────────────
// Complete vitamin and wellness injection protocols for Rani Beauty Clinic
// CRITICAL: "injection" only — never "infusion"

import type { WellnessProtocol } from './types';

// ─── Pre/Post Injection Care (Shared) ────────────────────────────────────────

export const WELLNESS_INJECTION_GENERAL_CARE = {
  preInjection: [
    'Hydrate well (minimum 16 oz water in the 2 hours before your appointment)',
    'Eat a light meal or snack before your appointment to prevent lightheadedness',
    'Wear loose-fitting clothing that allows easy access to the injection site',
    'Inform your provider of any new medications, supplements, or health changes',
    'Arrive on time to allow for intake assessment',
  ],
  postInjection: [
    'Apply gentle pressure to the injection site for 10-15 seconds',
    'Mild soreness at the injection site is normal and may last 24-48 hours',
    'Stay hydrated (drink an additional 16-32 oz water after your appointment)',
    'Avoid strenuous upper-body exercise for 24 hours if injection was in the arm',
    'Apply ice for 10 minutes if you experience soreness or mild swelling',
    'Contact the clinic if you experience redness that spreads, warmth, fever, or signs of allergic reaction',
  ],
};

export const WELLNESS_FREQUENCY_RECOMMENDATIONS = {
  maintenance: {
    b12: 'Every 1-2 weeks for deficiency; monthly for general wellness',
    biotin: 'Every 2-4 weeks',
    glutathione: 'Weekly for intensive courses; biweekly to monthly for maintenance',
    nad: 'Weekly during loading (4 weeks); weekly to biweekly maintenance',
    vitaminD: 'Weekly for 8 weeks (deficiency); monthly maintenance',
    triImmune: 'Weekly during cold/flu season or illness recovery; biweekly to monthly maintenance',
    lipoMino: 'Weekly for active weight management; biweekly for maintenance',
  },
  packages: {
    weeklyWellness: {
      name: 'Weekly Wellness Package',
      includes: ['B12 injection', 'Choice of one: Glutathione OR Tri-Immune boost'],
      frequency: 'Weekly',
      sessions: 4,
      savings: '15% savings vs individual pricing',
    },
    monthlyGlow: {
      name: 'Monthly Glow Package',
      includes: ['Glutathione injection', 'B12 injection', 'Biotin injection'],
      frequency: 'Monthly (all three in one visit)',
      sessions: 1,
      savings: '20% savings vs individual pricing',
    },
    weightLossSupport: {
      name: 'GLP-1 Support Package',
      includes: ['Lipo-Mino injection', 'B12 injection'],
      frequency: 'Weekly (added to GLP-1 injection visit)',
      sessions: 4,
      savings: '10% savings and combined appointment convenience',
    },
    immuneDefense: {
      name: 'Immune Defense Package',
      includes: ['Tri-Immune boost', 'Glutathione injection', 'Vitamin D3 injection'],
      frequency: 'Weekly for 4 weeks',
      sessions: 4,
      savings: '15% savings vs individual pricing',
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// B12 INJECTION PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const B12_INJECTION_PROTOCOL: WellnessProtocol = {
  id: 'wellness-b12',
  name: 'Vitamin B12 Injection Protocol',
  category: 'wellness',
  subcategory: 'vitamin-injection',
  description: 'Vitamin B12 (cobalamin) is essential for nerve function, red blood cell formation, DNA synthesis, and energy metabolism. Many adults are deficient due to dietary restrictions, medications (PPIs, metformin), aging, or GI conditions. Injectable B12 bypasses GI absorption entirely, providing rapid and complete bioavailability. We use methylcobalamin, the most bioactive form.',
  clinicalIndication: 'B12 deficiency (< 400 pg/mL), fatigue, brain fog, neuropathy symptoms, anemia, vegetarian/vegan diet, medication-induced depletion, GLP-1 therapy support',

  medication: 'Methylcobalamin 1000 mcg/mL (preferred) or Cyanocobalamin 1000 mcg/mL',
  dosingSchedule: [
    { week: 1, dose: '1000 mcg', frequency: 'Once weekly', route: 'Intramuscular injection', notes: 'Methylcobalamin is preferred (bioactive form, no conversion needed). Cyanocobalamin may be used if methylcobalamin is unavailable.' },
    { week: 4, dose: '1000 mcg', frequency: 'Once weekly', route: 'Intramuscular injection', notes: 'Continue weekly for the first month. Assess energy and symptom improvement.' },
    { week: 8, dose: '1000 mcg', frequency: 'Biweekly', route: 'Intramuscular injection', notes: 'Transition to biweekly if B12 levels are improving and symptoms are resolving.' },
    { week: 12, dose: '1000 mcg', frequency: 'Monthly', route: 'Intramuscular injection', notes: 'Maintenance phase. Recheck B12 levels. Continue monthly for ongoing support.' },
  ],
  route: 'Intramuscular injection',
  injectionSites: ['Deltoid muscle (preferred for quick visits)', 'Gluteus medius'],
  siteRotationProtocol: 'Alternate between left and right deltoid. Use gluteus for patients who prefer or if deltoid is not suitable.',

  labRequirements: [
    { testName: 'Serum B12 level', frequency: 'Baseline, then quarterly', timing: 'Before starting supplementation', criticalValues: '< 200 pg/mL (severe deficiency)' },
    { testName: 'Methylmalonic acid (MMA)', frequency: 'Baseline if B12 is borderline', timing: 'More sensitive marker of B12 deficiency', criticalValues: '> 0.4 micromol/L (functional deficiency)' },
    { testName: 'Homocysteine', frequency: 'Baseline if B12 is borderline', timing: 'Elevated in B12 and folate deficiency', criticalValues: '> 15 micromol/L' },
    { testName: 'CBC with differential', frequency: 'Baseline', timing: 'Check for macrocytic anemia' },
    { testName: 'Folate level', frequency: 'Baseline', timing: 'B12 and folate work together' },
  ],
  monitoringIntervals: 'Monthly for first 3 months, then quarterly',
  vitalsRequired: ['Blood pressure'],

  contraindications: [
    'Known allergy to cobalamin, cobalt, or any excipients',
    'Leber hereditary optic neuropathy (cyanocobalamin form)',
  ],
  precautions: [
    'Hypokalemia risk during B12 repletion in severely deficient patients (B12 stimulates RBC production, consuming potassium)',
    'Polycythemia vera (B12 supports RBC production)',
    'Gout (B12 repletion can increase uric acid transiently)',
    'Concurrent anticoagulant use (rare interaction)',
  ],
  potentialSideEffects: [
    'Injection site soreness (most common, mild, resolves in 24 hours)',
    'Mild diarrhea (uncommon)',
    'Itching or rash at injection site (rare)',
    'Flushing or warm sensation (rare, transient)',
    'Headache (uncommon)',
    'Nausea (very rare)',
    'Hypokalemia during repletion of severe deficiency (monitor)',
  ],
  drugInteractions: [
    'Metformin: reduces B12 absorption (B12 injection bypasses this issue)',
    'Proton pump inhibitors (PPIs): reduce B12 absorption from food',
    'Colchicine: may reduce B12 absorption',
    'Chloramphenicol: may reduce response to B12 therapy',
    'Aminosalicylic acid: reduces B12 absorption',
  ],
  riskLevel: 'low',

  onsetTime: 'Many patients report improved energy within 24-48 hours of first injection. Full repletion of deficiency takes 4-8 weeks.',
  expectedTimeline: 'Weekly injections for 4-8 weeks (loading), then monthly maintenance.',
  expectedResults: [
    'Improved energy and reduced fatigue',
    'Better mental clarity and focus',
    'Improved mood and reduced irritability',
    'Better sleep quality',
    'Resolution of neuropathy symptoms (tingling, numbness) if B12-related',
    'Improved red blood cell production',
    'Better hair and nail health over time',
    'Enhanced exercise performance and recovery',
  ],
  maintenanceProtocol: 'Monthly B12 injection for ongoing wellness. Quarterly B12 level monitoring. Patients on GLP-1 therapy, PPIs, or metformin may need biweekly maintenance.',

  aftercare: [
    { timeframe: 'Immediately post-injection', instruction: 'Mild sting during injection is normal. Apply pressure for 10 seconds.', priority: 'important' },
    { timeframe: 'First 24 hours', instruction: 'You may notice a boost in energy. Injection site may be slightly sore. Ice for 10 minutes if needed.', priority: 'recommended' },
    { timeframe: 'Ongoing', instruction: 'Continue dietary sources of B12 (meat, fish, eggs, dairy) or take a sublingual supplement between injections for additional support.', priority: 'recommended' },
  ],

  consentRequirements: {
    formId: 'consent-wellness-b12',
    formName: 'Vitamin B12 Injection Consent',
    expiresInDays: 365,
    requiresWitness: false,
    requiresPhotoConsent: false,
  },
  cptCodes: [
    { code: '96372', description: 'Therapeutic injection, intramuscular' },
    { code: 'J3420', description: 'Vitamin B12 injection, cyanocobalamin, up to 1000 mcg' },
  ],
  prescriptionRequired: false,
  documentationRequirements: [
    'Informed consent',
    'Injection site, dose, and lot number',
    'B12 level on file (if available)',
    'Side effect assessment',
  ],

  pricing: { min: 25, max: 45, unit: 'per injection' },
  sessionDuration: 10,

  tags: ['b12', 'vitamin', 'energy', 'injection', 'methylcobalamin', 'wellness'],
  relatedProtocols: ['wellness-biotin', 'wellness-lipomino', 'glp1-semaglutide'],
  lastUpdated: '2026-03-26',
};

// ═══════════════════════════════════════════════════════════════════════════════
// BIOTIN INJECTION PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const BIOTIN_INJECTION_PROTOCOL: WellnessProtocol = {
  id: 'wellness-biotin',
  name: 'Biotin Injection Protocol',
  category: 'wellness',
  subcategory: 'vitamin-injection',
  description: 'Biotin (vitamin B7) is essential for healthy hair, skin, and nails. It supports keratin production, the structural protein that makes up hair, skin, and nails. Injectable biotin delivers therapeutic doses directly into the bloodstream, bypassing digestive absorption limitations for more reliable results.',
  clinicalIndication: 'Hair thinning, brittle nails, skin health support, biotin deficiency, adjunct to hair restoration treatments',

  medication: 'Biotin (vitamin B7) 10 mg/mL',
  dosingSchedule: [
    { week: 1, dose: '5-10 mg', frequency: 'Once weekly', route: 'Intramuscular injection', notes: 'Start at 5 mg for first injection to assess tolerance.' },
    { week: 4, dose: '10 mg', frequency: 'Once weekly', route: 'Intramuscular injection', notes: 'Increase to 10 mg if tolerated. Weekly for first 4-6 weeks for loading.' },
    { week: 8, dose: '10 mg', frequency: 'Every 2-4 weeks', route: 'Intramuscular injection', notes: 'Transition to maintenance. Hair results typically begin to show around this time.' },
  ],
  route: 'Intramuscular injection',
  injectionSites: ['Deltoid muscle', 'Gluteus medius'],
  siteRotationProtocol: 'Alternate between left and right deltoid or gluteus.',

  labRequirements: [
    { testName: 'Biotin level (if available)', frequency: 'Baseline', timing: 'Not widely available but helpful if offered' },
    { testName: 'Thyroid panel', frequency: 'Baseline', timing: 'Rule out thyroid-related hair loss' },
    { testName: 'Iron/ferritin', frequency: 'Baseline', timing: 'Iron deficiency is a common cause of hair loss' },
  ],
  monitoringIntervals: 'Monthly for first 3 months, then quarterly',
  vitalsRequired: ['Blood pressure'],

  contraindications: [
    'Known allergy to biotin',
  ],
  precautions: [
    'CRITICAL: Biotin can cause falsely abnormal lab results for thyroid, cardiac troponin, and hormone tests. Discontinue biotin supplementation 72 hours before any blood work.',
    'Patients on thyroid medication should be aware of interference with thyroid lab monitoring',
    'Smokers may have lower biotin levels',
  ],
  potentialSideEffects: [
    'Injection site soreness (mild)',
    'Acne breakout (rare, usually temporary as body adjusts)',
    'Nausea (very rare)',
    'Lab interference (discontinue 72 hours before labs)',
  ],
  drugInteractions: [
    'Anticonvulsants (carbamazepine, phenytoin, phenobarbital): deplete biotin',
    'Antibiotics: long-term use may reduce biotin-producing gut bacteria',
    'Lab test interference: thyroid tests, troponin, hormone panels',
  ],
  riskLevel: 'low',

  onsetTime: 'Nail improvement: 4-6 weeks. Hair changes: 2-3 months. Full hair growth cycle benefits: 6+ months.',
  expectedTimeline: 'Loading phase (weekly for 4-6 weeks), then maintenance every 2-4 weeks. Visible hair and nail improvement in 2-3 months.',
  expectedResults: [
    'Stronger, thicker nails with reduced breakage',
    'Reduced hair shedding',
    'Improved hair thickness and growth rate',
    'Better skin health and appearance',
    'Enhanced keratin production',
  ],
  maintenanceProtocol: 'Biweekly to monthly injections for ongoing support. Combine with oral biotin 5000 mcg daily between injections for best results.',

  aftercare: [
    { timeframe: 'Post-injection', instruction: 'Mild soreness is normal. Apply pressure for 10 seconds.', priority: 'important' },
    { timeframe: 'Before blood work', instruction: 'Stop ALL biotin supplementation (oral and injectable) 72 hours before any lab draws. Biotin causes false lab results.', priority: 'critical' },
    { timeframe: 'Ongoing', instruction: 'Support results with a balanced diet rich in eggs, nuts, sweet potatoes, and spinach. Use gentle hair care products.', priority: 'recommended' },
  ],

  consentRequirements: {
    formId: 'consent-wellness-biotin',
    formName: 'Biotin Injection Consent',
    expiresInDays: 365,
    requiresWitness: false,
    requiresPhotoConsent: true,
  },
  cptCodes: [
    { code: '96372', description: 'Therapeutic injection, intramuscular' },
    { code: 'J3490', description: 'Unclassified drugs (biotin injection)' },
  ],
  prescriptionRequired: false,
  documentationRequirements: [
    'Informed consent',
    'Injection documentation',
    'Lab interference warning documented',
    'Baseline hair/nail photos (with consent)',
  ],

  pricing: { min: 35, max: 50, unit: 'per injection' },
  sessionDuration: 10,

  tags: ['biotin', 'vitamin', 'hair', 'nails', 'skin', 'injection', 'wellness'],
  relatedProtocols: ['wellness-b12', 'wellness-glutathione', 'peptide-ghkcu'],
  lastUpdated: '2026-03-26',
};

// ═══════════════════════════════════════════════════════════════════════════════
// VITAMIN D3 INJECTION PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const VITAMIN_D3_INJECTION_PROTOCOL: WellnessProtocol = {
  id: 'wellness-vitamind',
  name: 'Vitamin D3 Injection Protocol',
  category: 'wellness',
  subcategory: 'vitamin-injection',
  description: 'Vitamin D3 (cholecalciferol) is critical for bone health, immune function, mood regulation, and over 200 genetic functions. Deficiency is extremely common, affecting an estimated 40-50% of adults, especially in the Pacific Northwest where sun exposure is limited. Injectable vitamin D provides rapid repletion for moderate to severe deficiency and patients with absorption issues.',
  clinicalIndication: 'Vitamin D deficiency (< 30 ng/mL), severe deficiency (< 20 ng/mL), malabsorption syndromes, weight loss surgery patients, immune support, mood support, bone health',

  medication: 'Cholecalciferol (Vitamin D3) 100,000-600,000 IU/mL (intramuscular formulation)',
  dosingSchedule: [
    { week: 1, dose: 'Severe deficiency (< 20): 300,000 IU IM. Moderate deficiency (20-30): 100,000-200,000 IU IM', frequency: 'Single dose', route: 'Intramuscular injection', notes: 'High-dose IM injection provides depot effect, slowly releasing over 2-3 months.' },
    { week: 4, dose: 'Recheck 25-OH Vitamin D level', frequency: 'Lab check', route: 'N/A', notes: 'Levels should begin to rise. Oral supplementation (5000 IU daily) can be added.' },
    { week: 8, dose: '100,000-200,000 IU if still below 40 ng/mL', frequency: 'Single dose', route: 'Intramuscular injection', notes: 'Repeat injection if levels have not reached optimal range (40-60 ng/mL).' },
    { week: 12, dose: 'Maintenance: 50,000-100,000 IU every 2-3 months', frequency: 'Every 2-3 months', route: 'Intramuscular injection', notes: 'Maintenance dosing to keep levels in optimal range. Adjust based on labs.' },
  ],
  route: 'Intramuscular injection (deep IM)',
  injectionSites: ['Gluteus medius (preferred for larger volume)', 'Vastus lateralis (lateral thigh)'],
  siteRotationProtocol: 'Alternate sides with each injection. Deep IM injection is required for proper absorption.',

  labRequirements: [
    { testName: '25-OH Vitamin D', frequency: 'Baseline, 4 weeks, then quarterly', timing: 'Before starting repletion', criticalValues: '< 10 ng/mL (severe); > 100 ng/mL (toxicity risk)' },
    { testName: 'Serum calcium', frequency: 'Baseline, then with vitamin D levels', timing: 'Vitamin D increases calcium absorption', criticalValues: '> 10.5 mg/dL' },
    { testName: 'PTH (parathyroid hormone)', frequency: 'Baseline', timing: 'Elevated PTH with low D suggests secondary hyperparathyroidism' },
    { testName: 'Magnesium level', frequency: 'Baseline', timing: 'Magnesium is required for vitamin D metabolism' },
    { testName: 'Phosphorus', frequency: 'Baseline', timing: 'Part of calcium-phosphorus balance' },
  ],
  monitoringIntervals: 'Every 4 weeks during repletion, then quarterly during maintenance',
  vitalsRequired: ['Blood pressure'],

  contraindications: [
    'Hypercalcemia (serum calcium > 10.5 mg/dL)',
    'Vitamin D toxicity (25-OH > 100 ng/mL)',
    'Primary hyperparathyroidism (uncontrolled)',
    'Sarcoidosis or other granulomatous diseases (can cause hypercalcemia)',
    'Known allergy to vitamin D3 or carrier oil',
  ],
  precautions: [
    'Kidney disease (impaired vitamin D metabolism)',
    'History of kidney stones (vitamin D increases calcium absorption)',
    'Concurrent calcium supplementation (monitor total calcium intake)',
    'Concurrent thiazide diuretics (reduce calcium excretion)',
    'Granulomatous diseases (lymphoma, tuberculosis, sarcoidosis)',
  ],
  potentialSideEffects: [
    'Injection site pain (most common with IM injection; can be significant)',
    'Mild nausea (uncommon)',
    'Hypercalcemia symptoms if over-repleted (thirst, frequent urination, confusion, nausea)',
    'Metallic taste (rare, transient)',
  ],
  drugInteractions: [
    'Thiazide diuretics: increased hypercalcemia risk',
    'Digoxin: hypercalcemia from vitamin D can cause digoxin toxicity',
    'Orlistat: reduces vitamin D absorption (less relevant for injection form)',
    'Cholestyramine: reduces vitamin D absorption (less relevant for injection)',
    'Steroids: may decrease vitamin D effectiveness',
    'Anticonvulsants: may increase vitamin D metabolism',
  ],
  riskLevel: 'low',

  onsetTime: 'Lab levels begin to rise within 1-2 weeks. Symptom improvement over 4-8 weeks.',
  expectedTimeline: 'Repletion over 4-8 weeks, then quarterly maintenance injections.',
  expectedResults: [
    'Improved energy and reduced fatigue',
    'Better mood and reduced seasonal affective symptoms',
    'Strengthened immune function',
    'Improved bone health and reduced fracture risk',
    'Better muscle function and reduced pain',
    'Improved sleep quality',
    'Better calcium absorption and utilization',
    'Potential improvement in autoimmune conditions',
  ],
  maintenanceProtocol: 'Quarterly IM injection (50,000-100,000 IU) to maintain levels at 40-60 ng/mL. Supplement with oral D3 5000 IU daily in between. Recheck levels quarterly.',

  aftercare: [
    { timeframe: 'Post-injection', instruction: 'IM injection may cause soreness at the injection site for 2-3 days. This is normal for the depot formulation. Apply warm compress if uncomfortable.', priority: 'important' },
    { timeframe: 'Ongoing', instruction: 'Take vitamin D with a fat-containing meal if supplementing orally (improves absorption). Include vitamin K2 (100-200 mcg daily) to direct calcium to bones rather than arteries.', priority: 'recommended' },
    { timeframe: 'Symptom monitoring', instruction: 'Contact clinic if you experience excessive thirst, frequent urination, nausea, or confusion (signs of hypercalcemia).', priority: 'critical' },
  ],

  consentRequirements: {
    formId: 'consent-wellness-vitamind',
    formName: 'Vitamin D3 Injection Consent',
    expiresInDays: 365,
    requiresWitness: false,
    requiresPhotoConsent: false,
  },
  cptCodes: [
    { code: '96372', description: 'Therapeutic injection, intramuscular' },
    { code: 'J3490', description: 'Unclassified drugs (vitamin D3 injection)' },
  ],
  prescriptionRequired: true,
  documentationRequirements: [
    'Informed consent',
    'Baseline vitamin D level documented',
    'Dose, lot number, injection site',
    'Follow-up vitamin D level results',
    'Calcium monitoring results',
  ],

  pricing: { min: 40, max: 75, unit: 'per injection' },
  sessionDuration: 10,

  tags: ['vitamin-d', 'vitamin', 'immune', 'bone-health', 'injection', 'wellness', 'mood'],
  relatedProtocols: ['wellness-b12', 'wellness-triimmune', 'hormone-thyroid'],
  lastUpdated: '2026-03-26',
};

// ═══════════════════════════════════════════════════════════════════════════════
// TRI-IMMUNE BOOST PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const TRI_IMMUNE_PROTOCOL: WellnessProtocol = {
  id: 'wellness-triimmune',
  name: 'Tri-Immune Boost Injection Protocol',
  category: 'wellness',
  subcategory: 'vitamin-injection',
  description: 'Our Tri-Immune Boost combines three powerful immune-supporting nutrients in a single injection: high-dose Vitamin C (ascorbic acid), Zinc sulfate, and Glutathione. This triple-action formula strengthens immune defense, provides potent antioxidant protection, and supports the body\'s natural detoxification pathways. Ideal during cold and flu season, before travel, or during illness recovery.',
  clinicalIndication: 'Immune support, cold/flu prevention, illness recovery, pre-travel immune boost, seasonal wellness, oxidative stress reduction',

  medication: 'Ascorbic acid (Vitamin C) 500 mg + Zinc sulfate 5 mg + Glutathione 200 mg',
  dosingSchedule: [
    { week: 1, dose: 'Vitamin C 500 mg + Zinc 5 mg + Glutathione 200 mg', frequency: 'Once weekly', route: 'Intramuscular injection', notes: 'Standard immune boost. Ideal for weekly maintenance during cold/flu season.' },
    { week: 2, dose: 'Same combination', frequency: '1-2x weekly during active illness', route: 'Intramuscular injection', notes: 'May increase to twice weekly during acute illness or high-exposure periods.' },
    { week: 4, dose: 'Same combination', frequency: 'Weekly to biweekly', route: 'Intramuscular injection', notes: 'Transition to biweekly for maintenance after acute phase.' },
  ],
  route: 'Intramuscular injection',
  injectionSites: ['Deltoid muscle', 'Gluteus medius'],
  siteRotationProtocol: 'Alternate between left and right deltoid or gluteus.',

  labRequirements: [
    { testName: 'CBC with differential', frequency: 'Baseline if using for chronic immune support', timing: 'Assess immune cell counts' },
    { testName: 'Vitamin C level', frequency: 'Optional baseline', timing: 'If deficiency is suspected' },
    { testName: 'Zinc level', frequency: 'Optional baseline', timing: 'Zinc deficiency impairs immune function' },
  ],
  monitoringIntervals: 'As needed; no strict monitoring required for healthy patients',
  vitalsRequired: ['Blood pressure'],

  contraindications: [
    'Known allergy to any component (vitamin C, zinc, glutathione)',
    'Hemochromatosis (vitamin C increases iron absorption)',
    'G6PD deficiency (high-dose vitamin C can cause hemolytic anemia)',
    'History of calcium oxalate kidney stones (high-dose vitamin C)',
  ],
  precautions: [
    'Kidney stones history (moderate vitamin C doses in this protocol are generally safe)',
    'Iron overload conditions',
    'Concurrent zinc supplementation (total zinc should not exceed 40 mg daily)',
    'Copper deficiency risk with long-term zinc supplementation',
  ],
  potentialSideEffects: [
    'Injection site soreness (most common)',
    'Mild nausea (uncommon)',
    'Metallic taste from zinc (brief, resolves in minutes)',
    'Mild stomach upset (rare)',
    'Dizziness (rare, usually from vasovagal response to injection)',
  ],
  drugInteractions: [
    'Chemotherapy: consult oncologist before high-dose antioxidants',
    'Warfarin: vitamin C in high doses may affect INR',
    'Bortezomib: vitamin C may reduce effectiveness',
    'Copper supplements: zinc competes with copper absorption',
    'Iron supplements: vitamin C enhances iron absorption',
  ],
  riskLevel: 'low',

  onsetTime: 'Immune support begins immediately. Patients often report feeling better within 24-48 hours during acute illness.',
  expectedTimeline: 'Immediate immune support. Weekly during cold/flu season for prevention.',
  expectedResults: [
    'Enhanced immune defense',
    'Faster recovery from colds and other viral illnesses',
    'Reduced severity and duration of illness',
    'Improved antioxidant protection',
    'Better detoxification support via glutathione',
    'Increased energy during illness recovery',
    'Enhanced white blood cell function',
  ],
  maintenanceProtocol: 'Weekly during cold/flu season (October-March). Biweekly to monthly during other months. Can be used on-demand before travel or during illness.',

  aftercare: [
    { timeframe: 'Post-injection', instruction: 'Stay hydrated. You may notice increased energy within hours.', priority: 'recommended' },
    { timeframe: 'During illness', instruction: 'Rest, hydrate aggressively, and continue anti-inflammatory diet. The injection works best alongside proper rest and nutrition.', priority: 'important' },
    { timeframe: 'Ongoing', instruction: 'Support immune function with adequate sleep, stress management, and nutrient-rich diet.', priority: 'recommended' },
  ],

  consentRequirements: {
    formId: 'consent-wellness-triimmune',
    formName: 'Tri-Immune Boost Injection Consent',
    expiresInDays: 365,
    requiresWitness: false,
    requiresPhotoConsent: false,
  },
  cptCodes: [
    { code: '96372', description: 'Therapeutic injection, intramuscular' },
    { code: 'J3490', description: 'Unclassified drugs (tri-immune compound)' },
  ],
  prescriptionRequired: false,
  documentationRequirements: [
    'Informed consent',
    'Injection documentation (components, dose, site, lot)',
    'Indication documented',
  ],

  pricing: { min: 60, max: 85, unit: 'per injection' },
  sessionDuration: 10,

  tags: ['tri-immune', 'vitamin-c', 'zinc', 'glutathione', 'immune', 'injection', 'wellness'],
  relatedProtocols: ['wellness-b12', 'wellness-vitamind', 'peptide-glutathione'],
  lastUpdated: '2026-03-26',
};

// ═══════════════════════════════════════════════════════════════════════════════
// LIPO-MINO INJECTION PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const LIPO_MINO_PROTOCOL: WellnessProtocol = {
  id: 'wellness-lipomino',
  name: 'Lipo-Mino Injection Protocol (MIC + B Complex)',
  category: 'wellness',
  subcategory: 'vitamin-injection',
  description: 'Our Lipo-Mino injection combines lipotropic agents (MIC: Methionine, Inositol, Choline) with B-complex vitamins to support fat metabolism, energy production, and liver function. Methionine aids fat breakdown and detoxification. Inositol supports insulin signaling and fat transport. Choline prevents fat accumulation in the liver. Combined with B1, B2, B5, B6, and B12 for comprehensive metabolic support.',
  clinicalIndication: 'Weight management support, sluggish metabolism, liver support, low energy, adjunct to GLP-1 therapy, body composition optimization',

  medication: 'MIC (Methionine 25 mg + Inositol 50 mg + Choline 50 mg) + B1 50 mg + B2 5 mg + B5 5 mg + B6 5 mg + B12 1000 mcg + L-Carnitine 100 mg',
  dosingSchedule: [
    { week: 1, dose: '1 mL', frequency: 'Once weekly', route: 'Intramuscular injection', notes: 'Start weekly for active weight management support.' },
    { week: 4, dose: '1 mL', frequency: 'Once weekly', route: 'Intramuscular injection', notes: 'Continue weekly. Best combined with exercise and proper nutrition.' },
    { week: 8, dose: '1 mL', frequency: 'Weekly to biweekly', route: 'Intramuscular injection', notes: 'May transition to biweekly once weight management goals are progressing.' },
  ],
  route: 'Intramuscular injection',
  injectionSites: ['Gluteus medius (preferred)', 'Deltoid muscle', 'Vastus lateralis'],
  siteRotationProtocol: 'Rotate between gluteus, deltoid, and thigh. Gluteus preferred for the larger injection volume.',

  labRequirements: [
    { testName: 'Hepatic function panel', frequency: 'Baseline', timing: 'Lipotropics support liver function' },
    { testName: 'Lipid panel', frequency: 'Baseline, then quarterly', timing: 'Monitor lipid metabolism changes' },
    { testName: 'B12 level', frequency: 'Baseline', timing: 'Lipo-Mino contains B12' },
  ],
  monitoringIntervals: 'Monthly weight and progress check; quarterly labs if used long-term',
  vitalsRequired: ['Weight', 'BMI', 'Blood pressure'],

  contraindications: [
    'Known allergy to any MIC component or B vitamins',
    'Severe liver disease or active hepatitis',
    'Trimethylaminuria (fish odor syndrome) — choline can worsen',
    'B12 allergy or cobalt allergy',
  ],
  precautions: [
    'Kidney disease (B vitamin clearance)',
    'Concurrent B12 supplementation (avoid excess)',
    'Sulfa allergy (some formulations use sulfur-containing compounds)',
    'Gout (B12 can transiently increase uric acid)',
  ],
  potentialSideEffects: [
    'Injection site soreness (most common)',
    'Mild nausea (uncommon)',
    'Upset stomach (uncommon)',
    'Mild diarrhea (rare)',
    'Increased urination (expected, supports detoxification)',
    'Mild headache (rare)',
    'Increased energy (desired effect, may cause difficulty sleeping if injected late in the day)',
  ],
  drugInteractions: [
    'Metformin: additional B12 support is beneficial',
    'Levodopa: B6 can reduce levodopa effectiveness (discuss with prescriber)',
    'Phenytoin: B vitamins may affect levels',
    'Chloramphenicol: may reduce B12 response',
  ],
  riskLevel: 'low',

  onsetTime: 'Energy boost often within 24-48 hours. Weight management support builds over 4-6 weeks of consistent use.',
  expectedTimeline: 'Weekly for 8-12 weeks for active weight management, then biweekly to monthly maintenance.',
  expectedResults: [
    'Enhanced fat metabolism and energy from fat stores',
    'Improved energy levels and metabolic rate',
    'Better liver function and detoxification',
    'Support for body composition goals (when combined with diet and exercise)',
    'Reduced brain fog from B-complex support',
    'Improved cholesterol and lipid metabolism',
    'Enhanced exercise performance and recovery',
  ],
  maintenanceProtocol: 'Weekly during active weight management. Biweekly to monthly for maintenance. Especially beneficial as adjunct to GLP-1 therapy.',

  aftercare: [
    { timeframe: 'Post-injection', instruction: 'Mild soreness is normal. Drink plenty of water to support metabolic processes and detoxification.', priority: 'important' },
    { timeframe: 'Same day', instruction: 'Best results when combined with physical activity. Try to exercise within 24 hours of injection.', priority: 'recommended' },
    { timeframe: 'Ongoing', instruction: 'Maintain balanced, protein-rich diet. The injection supports metabolism but is most effective alongside healthy habits.', priority: 'important' },
  ],

  consentRequirements: {
    formId: 'consent-wellness-lipomino',
    formName: 'Lipo-Mino Injection Consent',
    expiresInDays: 365,
    requiresWitness: false,
    requiresPhotoConsent: false,
  },
  cptCodes: [
    { code: '96372', description: 'Therapeutic injection, intramuscular' },
    { code: 'J3490', description: 'Unclassified drugs (lipotropic compound)' },
  ],
  prescriptionRequired: false,
  documentationRequirements: [
    'Informed consent',
    'Injection documentation (components, dose, site, lot)',
    'Weight tracking',
    'Side effect assessment',
  ],

  pricing: { min: 35, max: 55, unit: 'per injection' },
  sessionDuration: 10,

  tags: ['lipo-mino', 'mic', 'lipotropic', 'b-complex', 'weight-loss', 'metabolism', 'injection', 'wellness'],
  relatedProtocols: ['wellness-b12', 'glp1-semaglutide', 'glp1-tirzepatide'],
  lastUpdated: '2026-03-26',
};

// ═══════════════════════════════════════════════════════════════════════════════
// NAD+ IV PROTOCOL (administered in clinic)
// ═══════════════════════════════════════════════════════════════════════════════

export const NAD_IV_PROTOCOL: WellnessProtocol = {
  id: 'wellness-nad-iv',
  name: 'NAD+ IV Protocol (In-Clinic Administration)',
  category: 'wellness',
  subcategory: 'injection-therapy',
  description: 'High-dose NAD+ delivered intravenously for maximum cellular impact. IV administration allows for larger therapeutic doses than IM injection, with direct delivery to the bloodstream. Our NAD+ IV protocol is administered in a private, comfortable treatment suite with continuous monitoring. This is our premium anti-aging and cellular restoration treatment.',
  clinicalIndication: 'Cellular restoration, anti-aging, cognitive enhancement, addiction recovery support, post-illness recovery, athletic performance, chronic fatigue',

  medication: 'NAD+ (nicotinamide adenine dinucleotide) IV solution',
  dosingSchedule: [
    { week: 1, dose: '250-500 mg', frequency: '1-2x in first week', route: 'Intravenous (slow drip)', notes: 'First session at 250 mg over 2-3 hours to assess tolerance. NAD+ IV must be administered slowly to minimize side effects.' },
    { week: 2, dose: '500 mg', frequency: '1-2x per week', route: 'Intravenous', notes: 'Loading phase continues. Increase dose if 250 mg was well tolerated.' },
    { week: 3, dose: '500 mg', frequency: '1-2x per week', route: 'Intravenous', notes: 'Complete loading phase. Many patients report significant cognitive and energy improvement.' },
    { week: 4, dose: '500 mg', frequency: 'Once weekly', route: 'Intravenous', notes: 'End of loading. Transition to maintenance.' },
    { week: 8, dose: '250-500 mg', frequency: 'Biweekly to monthly', route: 'Intravenous', notes: 'Maintenance phase. Frequency based on individual response and goals.' },
  ],
  route: 'Intravenous (slow drip over 2-4 hours)',
  injectionSites: ['Antecubital vein (preferred)', 'Dorsal hand vein', 'Forearm vein'],
  siteRotationProtocol: 'Rotate between arms. Antecubital is preferred for comfort during extended administration.',

  labRequirements: [
    { testName: 'Comprehensive metabolic panel', frequency: 'Baseline and quarterly', timing: 'Before starting protocol' },
    { testName: 'CBC', frequency: 'Baseline', timing: 'Before starting' },
    { testName: 'Hepatic function', frequency: 'Baseline and quarterly', timing: 'NAD+ metabolized by liver' },
    { testName: 'Fasting glucose', frequency: 'Baseline', timing: 'NAD+ affects glucose metabolism' },
    { testName: 'Uric acid', frequency: 'Baseline', timing: 'NAD+ metabolism produces uric acid' },
  ],
  monitoringIntervals: 'Continuous monitoring during IV administration. Monthly follow-up during loading. Quarterly during maintenance.',
  vitalsRequired: ['Blood pressure (before, during, after)', 'Heart rate (before, during, after)', 'O2 saturation (during)', 'Temperature'],

  contraindications: [
    'Active liver disease',
    'Acute gout flare',
    'Uncontrolled hypertension',
    'Active infection or fever',
    'Known allergy to NAD+ or IV components',
    'Pregnancy or breastfeeding',
  ],
  precautions: [
    'History of gout (monitor uric acid)',
    'Diabetes (monitor glucose during and after)',
    'Niacin sensitivity (related pathway)',
    'Rate sensitivity (must be administered slowly; too fast causes chest tightness, nausea)',
    'First-time patients must be monitored for the entire session',
    'Ensure IV patency throughout (extravasation is painful)',
  ],
  potentialSideEffects: [
    'Chest tightness or pressure (rate-dependent; slow drip rate resolves this)',
    'Nausea (rate-dependent)',
    'Flushing and warmth',
    'Abdominal cramping',
    'Headache',
    'Muscle cramping',
    'Lightheadedness',
    'IV site discomfort',
    'Increased heart rate (transient, rate-dependent)',
    'Brain fog during administration that clears after (paradoxical initial effect)',
  ],
  drugInteractions: [
    'Niacin supplements: additive flushing',
    'Blood pressure medications: NAD+ may transiently affect BP',
    'Diabetes medications: monitor glucose',
    'Immunosuppressants: discuss with prescriber',
  ],
  riskLevel: 'moderate',

  onsetTime: 'Many patients report enhanced mental clarity and energy within hours of first treatment. Cumulative benefits build over the loading phase.',
  expectedTimeline: '4-week loading phase (8-12 sessions), then biweekly to monthly maintenance.',
  expectedResults: [
    'Significant improvement in mental clarity and focus',
    'Enhanced cellular energy production',
    'Improved sleep quality and depth',
    'Better exercise recovery and performance',
    'Anti-aging benefits at the cellular level',
    'Improved mood and reduced anxiety',
    'Enhanced DNA repair mechanisms',
    'Potential improvement in neurodegenerative conditions',
    'Reduced inflammation',
    'Improved metabolic function',
  ],
  maintenanceProtocol: 'Biweekly to monthly IV sessions, supplemented with IM NAD+ injections between IV appointments for sustained benefits.',

  aftercare: [
    { timeframe: 'During treatment', instruction: 'Remain seated comfortably. Report any chest tightness, nausea, or discomfort immediately (drip rate will be adjusted). Light reading, music, or rest is encouraged.', priority: 'critical' },
    { timeframe: 'Immediately after', instruction: 'Remain in clinic for 15 minutes post-completion. Drink water. You may feel a surge of energy.', priority: 'important' },
    { timeframe: 'First 24 hours', instruction: 'Stay very well hydrated. Some patients experience enhanced energy; others feel tired and sleep deeply. Both are normal responses.', priority: 'important' },
    { timeframe: 'Ongoing', instruction: 'Support NAD+ levels between sessions with adequate sleep, regular exercise, and reduced alcohol consumption. Intermittent fasting may also support NAD+ pathways.', priority: 'recommended' },
  ],

  consentRequirements: {
    formId: 'consent-wellness-nad-iv',
    formName: 'NAD+ IV Therapy Consent',
    expiresInDays: 365,
    requiresWitness: true,
    requiresPhotoConsent: false,
  },
  cptCodes: [
    { code: '96365', description: 'IV therapy, first hour' },
    { code: '96366', description: 'IV therapy, each additional hour' },
    { code: 'J3490', description: 'Unclassified drugs (NAD+)' },
  ],
  prescriptionRequired: true,
  documentationRequirements: [
    'Informed consent with IV-specific risks discussed',
    'Baseline labs reviewed',
    'IV start documentation (site, gauge, attempts)',
    'Drip rate and total dose documented',
    'Vital signs at baseline, 30 minutes, hourly, and completion',
    'Side effect documentation during and after',
    'Patient discharge condition documented',
  ],

  pricing: { min: 400, max: 750, unit: 'per session' },
  sessionDuration: 180,

  tags: ['nad+', 'iv-therapy', 'anti-aging', 'cellular-health', 'cognitive', 'energy', 'premium', 'wellness'],
  relatedProtocols: ['peptide-nad', 'peptide-glutathione', 'wellness-b12'],
  lastUpdated: '2026-03-26',
};

// ─── Export All Wellness Injection Protocols ─────────────────────────────────

export const WELLNESS_INJECTION_PROTOCOLS: WellnessProtocol[] = [
  B12_INJECTION_PROTOCOL,
  BIOTIN_INJECTION_PROTOCOL,
  VITAMIN_D3_INJECTION_PROTOCOL,
  TRI_IMMUNE_PROTOCOL,
  LIPO_MINO_PROTOCOL,
  NAD_IV_PROTOCOL,
];
