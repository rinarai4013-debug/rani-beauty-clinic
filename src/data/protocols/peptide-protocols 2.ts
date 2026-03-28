// ─── Peptide Treatment Protocols ─────────────────────────────────────────────
// Complete peptide therapy protocols for Rani Beauty Clinic
// CRITICAL: "injection" only — never "infusion"

import type { WellnessProtocol } from './types';

// ─── Shared Peptide Constants ────────────────────────────────────────────────

export const PEPTIDE_STORAGE_AND_HANDLING = {
  generalRules: [
    'Store all reconstituted peptides at 36-46F (2-8C) in a dedicated medication refrigerator',
    'Protect from light (store in original packaging or amber vial)',
    'Do not freeze reconstituted peptides',
    'Lyophilized (powder) peptides may be stored at room temperature until reconstitution',
    'Reconstitute with bacteriostatic water (BAC water) only',
    'Use sterile technique during reconstitution (alcohol swab vial tops)',
    'Label all reconstituted vials with date, peptide name, concentration, and expiration',
    'Reconstituted peptides are generally stable for 28-30 days refrigerated',
    'Discard any peptide solution that appears cloudy, discolored, or contains particles',
    'Use insulin syringes (29-31G) for subcutaneous peptide injections',
  ],
  reconstitutionSteps: [
    'Remove lyophilized peptide vial and BAC water from refrigerator',
    'Allow vial to reach room temperature (5-10 minutes)',
    'Clean top of both vials with alcohol swab',
    'Draw desired volume of BAC water into syringe',
    'Inject BAC water slowly down the side of the peptide vial (do not spray directly onto powder)',
    'Gently swirl vial until fully dissolved (do not shake)',
    'Allow any bubbles to settle',
    'Label vial with reconstitution date, concentration, and 30-day expiration date',
    'Store immediately in refrigerator',
  ],
};

export const PEPTIDE_CYCLING_RECOMMENDATIONS = {
  generalPrinciple: 'Most peptides benefit from cycling to prevent receptor desensitization and maintain efficacy.',
  schedules: {
    growthHormoneReleasers: {
      peptides: ['Sermorelin', 'Ipamorelin', 'CJC-1295'],
      onCycle: '5 days on, 2 days off (weekdays on, weekends off)',
      alternateCycle: '3 months on, 1 month off',
      notes: 'Cycling prevents pituitary desensitization and maintains natural GH pulsatility',
    },
    healingPeptides: {
      peptides: ['BPC-157', 'TB-500'],
      onCycle: 'Daily for 4-8 weeks during active healing',
      maintenanceCycle: '2 weeks on, 2 weeks off for chronic conditions',
      notes: 'Can be used continuously during acute injury recovery. Cycle for chronic use.',
    },
    antiAgingPeptides: {
      peptides: ['GHK-Cu', 'Epithalon'],
      onCycle: '20-day intensive course, repeat every 4-6 months',
      alternateCycle: 'Daily topical use for GHK-Cu is acceptable long-term',
      notes: 'Periodic intensive courses provide cumulative benefits',
    },
    sexualHealthPeptides: {
      peptides: ['PT-141'],
      onCycle: 'As needed, no more than 8 doses per month',
      notes: 'Not for daily use. Minimum 24 hours between doses.',
    },
    metabolicPeptides: {
      peptides: ['NAD+'],
      onCycle: 'Loading phase: 2-3x weekly for 4 weeks. Maintenance: weekly or biweekly.',
      notes: 'NAD+ can be used long-term without traditional cycling',
    },
  },
};

export const PEPTIDE_STACKING_PROTOCOLS = {
  antiAgingStack: {
    name: 'Age Defense Stack',
    peptides: ['NAD+ injection', 'GHK-Cu', 'Sermorelin'],
    schedule: 'NAD+ weekly, GHK-Cu daily topical, Sermorelin 5 days on/2 off at bedtime',
    benefits: ['Cellular energy restoration', 'Skin repair and collagen production', 'Growth hormone optimization'],
    duration: '3-month initial course, then reassess',
    labMonitoring: ['IGF-1', 'Fasting glucose', 'NAD+ levels if available', 'Comprehensive metabolic panel'],
  },
  recoveryStack: {
    name: 'Recovery and Repair Stack',
    peptides: ['BPC-157', 'Glutathione injection'],
    schedule: 'BPC-157 twice daily (AM/PM) + Glutathione injection weekly',
    benefits: ['Accelerated tissue healing', 'Reduced inflammation', 'Antioxidant protection', 'Gut repair'],
    duration: '4-8 weeks for acute injuries, 8-12 weeks for chronic conditions',
    labMonitoring: ['CBC', 'CMP', 'Inflammatory markers (hs-CRP, ESR)'],
  },
  performanceStack: {
    name: 'Performance Optimization Stack',
    peptides: ['Sermorelin', 'BPC-157', 'NAD+'],
    schedule: 'Sermorelin at bedtime (5/2 cycling), BPC-157 morning, NAD+ weekly injection',
    benefits: ['Growth hormone support', 'Tissue recovery', 'Cellular energy', 'Improved sleep quality'],
    duration: '3-month cycles with 1-month break',
    labMonitoring: ['IGF-1', 'Full hormone panel', 'CMP', 'Lipid panel'],
  },
  detoxStack: {
    name: 'Detox and Glow Stack',
    peptides: ['Glutathione injection', 'NAD+', 'GHK-Cu'],
    schedule: 'Glutathione injection weekly, NAD+ biweekly, GHK-Cu daily topical',
    benefits: ['Master antioxidant support', 'Cellular detoxification', 'Skin brightening', 'Anti-aging'],
    duration: 'Ongoing with periodic lab monitoring',
    labMonitoring: ['Liver function panel', 'CBC', 'Vitamin and mineral panel'],
  },
};

export const PEPTIDE_CONTRAINDICATIONS_GENERAL = [
  'Active cancer or history of cancer within 5 years (growth-promoting peptides)',
  'Pregnancy or breastfeeding',
  'Active infection at injection site',
  'Known hypersensitivity to specific peptide or excipients',
  'Severe hepatic impairment (affects peptide metabolism)',
  'Severe renal impairment (affects peptide clearance)',
  'Children under 18 (unless specifically indicated and supervised)',
];

// ═══════════════════════════════════════════════════════════════════════════════
// NAD+ INJECTION PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const NAD_INJECTION_PROTOCOL: WellnessProtocol = {
  id: 'peptide-nad',
  name: 'NAD+ Injection Protocol',
  category: 'wellness',
  subcategory: 'peptide',
  description: 'Nicotinamide adenine dinucleotide (NAD+) is a coenzyme present in every cell, essential for energy production, DNA repair, and cellular signaling. NAD+ levels decline significantly with age, contributing to metabolic dysfunction and accelerated aging. Our NAD+ injection protocol delivers this critical molecule directly for rapid absorption and cellular replenishment.',
  clinicalIndication: 'Age-related NAD+ decline, fatigue, cognitive fog, metabolic support, post-illness recovery, anti-aging, athletic performance recovery',

  medication: 'NAD+ (nicotinamide adenine dinucleotide) injection solution',
  dosingSchedule: [
    { week: 1, dose: '100-200 mg', frequency: '2-3x per week', route: 'Intramuscular injection', notes: 'Loading phase. Start at 100 mg for first injection to assess tolerance. Slow administration to minimize discomfort.' },
    { week: 2, dose: '200 mg', frequency: '2-3x per week', route: 'Intramuscular injection', notes: 'Continue loading phase. Patient may notice improved energy and mental clarity.' },
    { week: 3, dose: '200-250 mg', frequency: '2-3x per week', route: 'Intramuscular injection', notes: 'Loading phase continues. Assess response and adjust frequency.' },
    { week: 4, dose: '200-250 mg', frequency: '2x per week', route: 'Intramuscular injection', notes: 'End of loading phase. Transition to maintenance based on response.' },
    { week: 5, dose: '200-250 mg', frequency: 'Once weekly', route: 'Intramuscular injection', notes: 'Maintenance phase begins. Weekly injections sustain elevated NAD+ levels.' },
    { week: 8, dose: '200-250 mg', frequency: 'Once weekly or biweekly', route: 'Intramuscular injection', notes: 'Long-term maintenance. Frequency based on individual response and goals.' },
  ],
  route: 'Intramuscular injection (IM)',
  injectionSites: ['Deltoid muscle', 'Gluteus medius', 'Vastus lateralis (lateral thigh)'],
  siteRotationProtocol: 'Rotate between deltoid, gluteus, and thigh. Allow minimum 1 week between injections in the same site.',

  labRequirements: [
    { testName: 'Comprehensive metabolic panel', frequency: 'Baseline and 3 months', timing: 'Before starting and at 12-week review' },
    { testName: 'CBC', frequency: 'Baseline', timing: 'Before starting protocol' },
    { testName: 'Hepatic function panel', frequency: 'Baseline and 3 months', timing: 'NAD+ is processed by the liver' },
    { testName: 'Fasting glucose and insulin', frequency: 'Baseline', timing: 'NAD+ influences glucose metabolism' },
    { testName: 'NAD+ levels (if available)', frequency: 'Baseline and 3 months', timing: 'Specialty lab, not always available' },
  ],
  monitoringIntervals: 'Weekly during loading phase (first 4 weeks), monthly during maintenance',
  vitalsRequired: ['Blood pressure', 'Heart rate', 'Temperature'],

  contraindications: [
    ...PEPTIDE_CONTRAINDICATIONS_GENERAL,
    'Active liver disease or significantly elevated liver enzymes',
    'History of gout (NAD+ metabolism produces uric acid)',
    'Active alcohol use disorder (affects NAD+ metabolism)',
  ],
  precautions: [
    'History of gout or elevated uric acid (monitor levels)',
    'Concurrent use of niacin supplements (additive flushing)',
    'Diabetes (may affect blood glucose; monitor closely)',
    'First injection should be given at a lower dose to assess tolerance',
    'Administer injection slowly to reduce discomfort (NAD+ can cause a stinging sensation)',
  ],
  potentialSideEffects: [
    'Injection site pain or discomfort (most common, due to NAD+ acidity)',
    'Flushing and warmth (5-15 minutes post-injection, self-limiting)',
    'Nausea (mild, especially during first few injections)',
    'Lightheadedness (transient)',
    'Headache (uncommon, usually resolves within hours)',
    'Chest tightness (rare; if severe, discontinue and evaluate)',
    'GI discomfort (mild cramping, resolves within hours)',
  ],
  drugInteractions: [
    'Niacin/nicotinamide supplements: additive effects, increased flushing',
    'Blood pressure medications: NAD+ may transiently affect BP',
    'Diabetes medications: monitor blood glucose as NAD+ supports metabolic function',
    'Immunosuppressants: consult prescribing physician before starting',
  ],
  riskLevel: 'low',

  onsetTime: 'Many patients report improved energy and mental clarity within 24-48 hours of first injection. Full benefits develop over 4-6 weeks of loading.',
  expectedTimeline: '4-week loading phase, then ongoing weekly or biweekly maintenance. Cumulative benefits over 3-6 months.',
  expectedResults: [
    'Improved energy levels and reduced fatigue',
    'Enhanced mental clarity and cognitive function',
    'Better sleep quality',
    'Improved exercise recovery',
    'Cellular repair and DNA protection',
    'Anti-aging benefits at the cellular level',
    'Potential improvement in metabolic markers',
    'Enhanced mood and sense of well-being',
  ],
  maintenanceProtocol: 'Weekly or biweekly injections based on individual response. Annual lab monitoring. Some patients maintain benefits with monthly high-dose sessions after sustained loading.',

  aftercare: [
    { timeframe: 'Immediately post-injection', instruction: 'Remain seated for 5-10 minutes. Some flushing, warmth, or mild nausea is normal and resolves within 15 minutes.', priority: 'important' },
    { timeframe: 'First 2 hours', instruction: 'Stay hydrated. Avoid strenuous exercise. Mild injection site soreness is normal.', priority: 'important' },
    { timeframe: 'First 24 hours', instruction: 'You may notice improved energy and focus. Stay well hydrated (minimum 64 oz water).', priority: 'recommended' },
    { timeframe: 'Ongoing', instruction: 'Maintain consistent injection schedule. Support NAD+ with healthy sleep habits, exercise, and reduced alcohol consumption.', priority: 'important' },
  ],

  consentRequirements: {
    formId: 'consent-peptide-nad',
    formName: 'NAD+ Injection Therapy Consent',
    expiresInDays: 365,
    requiresWitness: false,
    requiresPhotoConsent: false,
  },
  cptCodes: [
    { code: '96372', description: 'Therapeutic injection, intramuscular' },
    { code: '99213', description: 'Office visit, established patient, low complexity' },
    { code: 'J3490', description: 'Unclassified drugs (NAD+)' },
  ],
  prescriptionRequired: true,
  documentationRequirements: [
    'Informed consent signed',
    'Baseline labs reviewed',
    'Injection documentation (site, dose, lot number)',
    'Side effect assessment',
    'Response assessment at each visit',
  ],

  pricing: { min: 150, max: 500, unit: 'per injection' },
  sessionDuration: 20,

  tags: ['nad+', 'peptide', 'anti-aging', 'energy', 'injection', 'cellular-health', 'recovery'],
  relatedProtocols: ['peptide-glutathione', 'peptide-sermorelin', 'wellness-b12'],
  lastUpdated: '2026-03-26',
};

// ═══════════════════════════════════════════════════════════════════════════════
// SERMORELIN PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const SERMORELIN_PROTOCOL: WellnessProtocol = {
  id: 'peptide-sermorelin',
  name: 'Sermorelin Growth Hormone Releasing Protocol',
  category: 'wellness',
  subcategory: 'peptide',
  description: 'Sermorelin is a growth hormone-releasing hormone (GHRH) analog that stimulates the pituitary gland to produce and release natural growth hormone (GH). Unlike synthetic GH, sermorelin works with your body\'s own feedback mechanisms, producing a more physiologic GH pulse pattern. Benefits include improved body composition, sleep quality, skin health, and recovery.',
  clinicalIndication: 'Age-related growth hormone decline, poor sleep quality, reduced exercise recovery, decreased lean muscle mass, increased body fat, skin aging',

  medication: 'Sermorelin acetate',
  dosingSchedule: [
    { week: 1, dose: '200 mcg', frequency: 'Nightly at bedtime', route: 'Subcutaneous injection', notes: 'Start at 200 mcg to assess tolerance. Inject 30-60 minutes before sleep on an empty stomach.' },
    { week: 2, dose: '200-300 mcg', frequency: 'Nightly at bedtime', route: 'Subcutaneous injection', notes: 'Increase to 300 mcg if well tolerated. Continue bedtime dosing.' },
    { week: 3, dose: '300 mcg', frequency: 'Nightly (5 days on, 2 off)', route: 'Subcutaneous injection', notes: 'Begin cycling schedule to prevent receptor desensitization.' },
    { week: 4, dose: '300 mcg', frequency: '5 days on, 2 days off', route: 'Subcutaneous injection', notes: 'Assess sleep quality improvement and early body composition changes.' },
    { week: 8, dose: '300-500 mcg', frequency: '5 days on, 2 days off', route: 'Subcutaneous injection', notes: 'May increase to 500 mcg if response is suboptimal and tolerance is good.' },
    { week: 12, dose: '300-500 mcg', frequency: '5 days on, 2 days off', route: 'Subcutaneous injection', notes: 'Check IGF-1 levels. Adjust dose to keep IGF-1 in upper third of age-appropriate range.' },
  ],
  route: 'Subcutaneous injection',
  injectionSites: ['Abdomen (periumbilical)', 'Upper outer thigh', 'Upper outer arm'],
  siteRotationProtocol: 'Rotate nightly between abdomen, thigh, and arm. The abdomen provides the most consistent absorption.',

  labRequirements: [
    { testName: 'IGF-1', frequency: 'Quarterly', timing: 'Baseline, 3 months, then every 3-6 months', criticalValues: '> 350 ng/mL or above age-appropriate range' },
    { testName: 'Fasting glucose', frequency: 'Quarterly', timing: 'GH can affect glucose metabolism', criticalValues: '> 126 mg/dL' },
    { testName: 'Fasting insulin', frequency: 'Quarterly', timing: 'Monitor insulin sensitivity' },
    { testName: 'Hemoglobin A1c', frequency: 'Biannually', timing: 'Baseline and every 6 months' },
    { testName: 'Comprehensive metabolic panel', frequency: 'Biannually', timing: 'Baseline and every 6 months' },
    { testName: 'Thyroid panel', frequency: 'Biannually', timing: 'GH can affect thyroid function' },
    { testName: 'PSA (men over 40)', frequency: 'Annually', timing: 'Baseline and annually' },
  ],
  monitoringIntervals: 'Monthly for first 3 months, then quarterly',
  vitalsRequired: ['Weight', 'Body fat percentage (if available)', 'Blood pressure'],

  contraindications: [
    ...PEPTIDE_CONTRAINDICATIONS_GENERAL,
    'Active cancer or history of cancer within 5 years',
    'Untreated or active pituitary tumors',
    'Elevated IGF-1 levels',
    'Uncontrolled diabetes',
    'Active proliferative retinopathy',
    'Severe obesity (BMI > 40) without concurrent weight management',
  ],
  precautions: [
    'Diabetes or insulin resistance (GH antagonizes insulin)',
    'History of carpal tunnel syndrome (may worsen)',
    'History of joint pain or edema',
    'Sleep apnea (may worsen initially)',
    'Concurrent corticosteroid use (may reduce effectiveness)',
    'Must be taken on empty stomach (food, especially fats and sugars, blunts GH release)',
  ],
  potentialSideEffects: [
    'Injection site reaction (redness, itching at injection site)',
    'Headache (usually first 1-2 weeks)',
    'Flushing (transient)',
    'Dizziness (uncommon)',
    'Water retention (mild, usually self-limiting)',
    'Joint stiffness (rare, dose-related)',
    'Vivid dreams (common and often reported as a positive effect)',
    'Increased hunger (mild, related to GH pulsatility)',
    'Numbness or tingling (rare, dose-related)',
  ],
  drugInteractions: [
    'Corticosteroids: may reduce GH response to sermorelin',
    'Insulin and diabetes medications: GH can increase blood glucose',
    'Thyroid medications: GH may increase T4 to T3 conversion',
    'Cyclooxygenase inhibitors: may alter GH release',
    'Other GHRH or GH secretagogues: additive effects',
  ],
  riskLevel: 'low',

  onsetTime: 'Improved sleep quality often within 1-2 weeks. Body composition changes over 3-6 months.',
  expectedTimeline: '3-6 months for full benefits. Ongoing maintenance recommended.',
  expectedResults: [
    'Improved sleep quality and deeper sleep cycles (often first benefit noticed)',
    'Increased lean muscle mass and reduced body fat',
    'Improved skin elasticity and thickness',
    'Enhanced exercise recovery',
    'Improved energy and vitality',
    'Better cognitive function and memory',
    'Stronger immune function',
    'Improved bone density over long-term use',
    'Enhanced sense of well-being',
  ],
  maintenanceProtocol: 'Continue at optimal dose on 5/2 cycling schedule. Reassess IGF-1 levels every 3-6 months. Consider 3-month cycles with 1-month breaks for long-term use.',

  aftercare: [
    { timeframe: 'Injection timing', instruction: 'Inject 30-60 minutes before sleep on an empty stomach (no food for 2 hours prior). Fats and sugars suppress GH release.', priority: 'critical' },
    { timeframe: 'Post-injection', instruction: 'Go to sleep within 30-60 minutes. The largest GH pulse occurs during deep sleep.', priority: 'important' },
    { timeframe: 'Daily', instruction: 'Avoid eating within 2 hours of injection. Regular exercise (especially resistance training) enhances GH response.', priority: 'important' },
    { timeframe: 'Weekly', instruction: 'Take 2 days off per week from injections to prevent receptor desensitization.', priority: 'critical' },
  ],

  consentRequirements: {
    formId: 'consent-peptide-sermorelin',
    formName: 'Sermorelin Peptide Therapy Consent',
    expiresInDays: 365,
    requiresWitness: false,
    requiresPhotoConsent: false,
  },
  cptCodes: [
    { code: '96372', description: 'Therapeutic injection, subcutaneous' },
    { code: '99213', description: 'Office visit, established patient' },
    { code: 'J3490', description: 'Unclassified drugs (sermorelin)' },
  ],
  prescriptionRequired: true,
  documentationRequirements: [
    'Informed consent',
    'Baseline labs including IGF-1',
    'Injection training documentation',
    'Dose and response tracking',
    'Quarterly IGF-1 monitoring results',
  ],

  pricing: { min: 250, max: 450, unit: 'per month' },
  sessionDuration: 15,

  tags: ['sermorelin', 'peptide', 'growth-hormone', 'anti-aging', 'sleep', 'body-composition', 'injection'],
  relatedProtocols: ['peptide-nad', 'peptide-bpc157', 'peptide-ghkcu'],
  lastUpdated: '2026-03-26',
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLUTATHIONE INJECTION PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const GLUTATHIONE_INJECTION_PROTOCOL: WellnessProtocol = {
  id: 'peptide-glutathione',
  name: 'Glutathione Injection Protocol',
  category: 'wellness',
  subcategory: 'peptide',
  description: 'Glutathione is the body\'s master antioxidant, playing a critical role in detoxification, immune function, and skin health. Oral supplementation has poor bioavailability, making direct injection the preferred delivery method for therapeutic doses. Our glutathione injection protocol supports detoxification, brightens skin tone, and strengthens immune defense.',
  clinicalIndication: 'Oxidative stress, skin brightening, detoxification support, immune support, post-illness recovery, environmental toxin exposure, hyperpigmentation',

  medication: 'L-Glutathione (reduced form)',
  dosingSchedule: [
    { week: 1, dose: '600-1000 mg', frequency: 'Once weekly', route: 'Intramuscular injection (push)', notes: 'Start at 600 mg. Administer as slow IM push over 2-3 minutes.' },
    { week: 2, dose: '1000 mg', frequency: 'Once weekly', route: 'Intramuscular injection (push)', notes: 'Increase to 1000 mg if tolerated well.' },
    { week: 4, dose: '1000-2000 mg', frequency: '1-2x weekly', route: 'Intramuscular injection (push)', notes: 'For intensive skin brightening or detox: twice weekly. Standard maintenance: once weekly.' },
    { week: 8, dose: '1000-2000 mg', frequency: 'Weekly or biweekly', route: 'Intramuscular injection (push)', notes: 'Transition to maintenance frequency based on goals.' },
  ],
  route: 'Intramuscular injection (slow push)',
  injectionSites: ['Gluteus medius (preferred for larger volume)', 'Deltoid muscle'],
  siteRotationProtocol: 'Alternate between left and right gluteus. Deltoid for lower volumes only (up to 1 mL).',

  labRequirements: [
    { testName: 'Hepatic function panel', frequency: 'Baseline', timing: 'Before starting protocol' },
    { testName: 'CBC', frequency: 'Baseline', timing: 'Before starting protocol' },
    { testName: 'Renal function', frequency: 'Baseline', timing: 'Before starting protocol' },
  ],
  monitoringIntervals: 'Monthly for first 3 months, then as needed',
  vitalsRequired: ['Blood pressure', 'Heart rate'],

  contraindications: [
    'Known allergy to glutathione or sulfur compounds',
    'Pregnancy or breastfeeding',
    'Severe asthma (inhaled glutathione can trigger bronchospasm; injection route is safer but caution advised)',
    'Active organ transplant recipients on immunosuppression',
  ],
  precautions: [
    'Sulfite sensitivity (not the same as sulfur allergy, but assess)',
    'Asthma history (monitor for any respiratory symptoms post-injection)',
    'Concurrent chemotherapy (consult oncologist; glutathione may interfere with certain agents)',
    'Zinc deficiency (glutathione metabolism requires zinc)',
  ],
  potentialSideEffects: [
    'Injection site soreness (most common)',
    'Mild bloating or cramping (uncommon)',
    'Headache (rare)',
    'Allergic reaction (very rare)',
    'Skin lightening (this is often a desired effect but should be discussed)',
    'Transient taste change (metallic taste, brief)',
  ],
  drugInteractions: [
    'Chemotherapy agents: may reduce efficacy of certain drugs (consult oncologist)',
    'Acetaminophen: glutathione supports acetaminophen detoxification',
    'Alcohol: heavy consumption depletes glutathione',
    'Statins: some evidence of protective synergy',
  ],
  riskLevel: 'low',

  onsetTime: 'Skin brightening typically visible after 4-6 weekly sessions. Energy and detox benefits may be felt sooner.',
  expectedTimeline: 'Initial results in 4-6 weeks. Optimal skin and detox results at 3-6 months.',
  expectedResults: [
    'Brighter, more even skin tone',
    'Reduced hyperpigmentation and dark spots',
    'Enhanced detoxification capacity',
    'Improved energy levels',
    'Strengthened immune function',
    'Reduced oxidative stress markers',
    'Improved liver function',
    'Better skin clarity and glow',
  ],
  maintenanceProtocol: 'Weekly to biweekly maintenance injections. Combine with oral NAC (N-acetyl cysteine) 600 mg daily to support endogenous glutathione production.',

  aftercare: [
    { timeframe: 'Immediately post-injection', instruction: 'Remain seated for 5 minutes. Some patients notice a mild sulfur taste that resolves within minutes.', priority: 'important' },
    { timeframe: 'First 24 hours', instruction: 'Stay well hydrated to support detoxification. Mild soreness at injection site is normal.', priority: 'recommended' },
    { timeframe: 'Ongoing', instruction: 'Support glutathione levels with sulfur-rich foods (broccoli, garlic, onions, eggs) and adequate vitamin C.', priority: 'recommended' },
  ],

  consentRequirements: {
    formId: 'consent-peptide-glutathione',
    formName: 'Glutathione Injection Therapy Consent',
    expiresInDays: 365,
    requiresWitness: false,
    requiresPhotoConsent: true,
  },
  cptCodes: [
    { code: '96372', description: 'Therapeutic injection, intramuscular' },
    { code: 'J3490', description: 'Unclassified drugs (glutathione)' },
  ],
  prescriptionRequired: false,
  documentationRequirements: [
    'Informed consent',
    'Injection documentation (site, dose, lot)',
    'Skin assessment and photos (with consent)',
    'Side effect monitoring',
  ],

  pricing: { min: 75, max: 150, unit: 'per injection' },
  sessionDuration: 15,

  tags: ['glutathione', 'antioxidant', 'skin-brightening', 'detox', 'immune', 'injection'],
  relatedProtocols: ['peptide-nad', 'wellness-triimmune', 'wellness-vitaminc'],
  lastUpdated: '2026-03-26',
};

// ═══════════════════════════════════════════════════════════════════════════════
// BPC-157 PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const BPC157_PROTOCOL: WellnessProtocol = {
  id: 'peptide-bpc157',
  name: 'BPC-157 Healing Peptide Protocol',
  category: 'wellness',
  subcategory: 'peptide',
  description: 'Body Protection Compound 157 (BPC-157) is a synthetic peptide derived from a naturally occurring protein in gastric juice. It has demonstrated powerful healing properties for tendons, ligaments, muscles, gut lining, and nerves. BPC-157 works by promoting angiogenesis (new blood vessel formation), stimulating growth factors, and modulating nitric oxide pathways.',
  clinicalIndication: 'Tendon and ligament injuries, muscle tears, joint inflammation, gut healing (leaky gut, IBS, IBD support), post-surgical recovery, nerve damage recovery',

  medication: 'BPC-157 (pentadecapeptide)',
  dosingSchedule: [
    { week: 1, dose: '250-500 mcg', frequency: 'Once or twice daily', route: 'Subcutaneous injection near injury site or abdomen', notes: 'For gut healing: inject subcutaneously in the abdomen. For musculoskeletal: inject as close to injury site as possible.' },
    { week: 2, dose: '250-500 mcg', frequency: 'Once or twice daily', route: 'Subcutaneous injection', notes: 'Twice daily dosing (AM and PM) provides faster healing for acute injuries.' },
    { week: 4, dose: '250-500 mcg', frequency: 'Once or twice daily', route: 'Subcutaneous injection', notes: 'Assess healing progress. Most acute injuries show significant improvement by week 4.' },
    { week: 6, dose: '250-500 mcg', frequency: 'Once daily', route: 'Subcutaneous injection', notes: 'May reduce to once daily as healing progresses.' },
    { week: 8, dose: '250 mcg', frequency: 'Once daily or every other day', route: 'Subcutaneous injection', notes: 'Taper to maintenance. For chronic conditions, cycle 2 weeks on/2 weeks off.' },
  ],
  route: 'Subcutaneous injection',
  injectionSites: [
    'Abdomen (for gut healing and systemic effects)',
    'Subcutaneous tissue near injury site (for targeted musculoskeletal healing)',
    'Upper outer thigh (general administration)',
  ],
  siteRotationProtocol: 'For targeted healing: inject within 2-3 inches of the injury site, rotating slightly each injection. For systemic/gut use: rotate quadrants of the abdomen.',

  labRequirements: [
    { testName: 'CBC', frequency: 'Baseline', timing: 'Before starting protocol' },
    { testName: 'Comprehensive metabolic panel', frequency: 'Baseline', timing: 'Before starting protocol' },
    { testName: 'Inflammatory markers (hs-CRP, ESR)', frequency: 'Baseline and 8 weeks', timing: 'To track healing progress' },
  ],
  monitoringIntervals: 'Biweekly during active healing phase, monthly during maintenance',
  vitalsRequired: ['Blood pressure', 'Heart rate'],

  contraindications: [
    ...PEPTIDE_CONTRAINDICATIONS_GENERAL,
    'Active malignancy (BPC-157 promotes angiogenesis)',
    'Active bleeding disorder or on anticoagulation (relative; discuss with prescriber)',
  ],
  precautions: [
    'History of cancer (angiogenesis-promoting effects require careful evaluation)',
    'Concurrent use of anticoagulants (theoretical increased bleeding at injection site)',
    'Multiple concurrent peptides (assess for interactions)',
    'Autoimmune conditions (immune-modulating effects; monitor closely)',
  ],
  potentialSideEffects: [
    'Injection site redness or mild irritation (most common, resolves quickly)',
    'Mild nausea (uncommon, usually with first few doses)',
    'Dizziness (rare)',
    'Hot or cold sensation at injection site (transient)',
    'Fatigue (rare, usually first week only)',
  ],
  drugInteractions: [
    'Anticoagulants: theoretical interaction, monitor for bruising',
    'NSAIDs: BPC-157 may reduce NSAID-induced GI damage (positive interaction)',
    'Growth factors or angiogenesis-promoting therapies: additive effects',
    'Alcohol: BPC-157 may have protective effects on alcohol-induced liver damage',
  ],
  riskLevel: 'low',

  onsetTime: 'Some patients report reduced pain within 3-7 days. Significant healing improvement typically seen by week 2-4.',
  expectedTimeline: '4-8 weeks for acute injuries, 8-12 weeks for chronic conditions. Gut healing may take 6-12 weeks.',
  expectedResults: [
    'Accelerated tendon and ligament healing',
    'Reduced inflammation and pain at injury site',
    'Improved gut lining integrity (reduced permeability)',
    'Faster post-surgical recovery',
    'Reduced joint inflammation',
    'Improved nerve healing and function',
    'Protection against NSAID-induced GI damage',
    'Enhanced overall tissue repair',
  ],
  maintenanceProtocol: 'After acute healing, transition to 2 weeks on/2 weeks off cycling. Discontinue when healing is complete. For chronic gut issues, longer maintenance may be appropriate.',

  aftercare: [
    { timeframe: 'Post-injection', instruction: 'Mild redness at injection site is normal. Do not ice the injection site (may reduce peptide activity). Light movement is encouraged.', priority: 'important' },
    { timeframe: 'Daily', instruction: 'Continue gentle movement and rehabilitation exercises as tolerated. BPC-157 works best in conjunction with appropriate physical therapy.', priority: 'important' },
    { timeframe: 'For gut healing', instruction: 'Follow anti-inflammatory diet. Eliminate processed foods, alcohol, and known food sensitivities during treatment.', priority: 'critical' },
  ],

  consentRequirements: {
    formId: 'consent-peptide-bpc157',
    formName: 'BPC-157 Peptide Therapy Consent',
    expiresInDays: 365,
    requiresWitness: false,
    requiresPhotoConsent: false,
  },
  cptCodes: [
    { code: '96372', description: 'Therapeutic injection, subcutaneous' },
    { code: 'J3490', description: 'Unclassified drugs (BPC-157)' },
  ],
  prescriptionRequired: true,
  documentationRequirements: [
    'Informed consent',
    'Injury/condition documentation',
    'Injection site and dose documentation',
    'Progress assessment at each visit',
    'Inflammatory marker tracking',
  ],

  pricing: { min: 200, max: 350, unit: 'per month (supply)' },
  sessionDuration: 15,

  tags: ['bpc-157', 'peptide', 'healing', 'gut-health', 'tendon', 'recovery', 'injection', 'anti-inflammatory'],
  relatedProtocols: ['peptide-glutathione', 'peptide-ghkcu', 'peptide-sermorelin'],
  lastUpdated: '2026-03-26',
};

// ═══════════════════════════════════════════════════════════════════════════════
// GHK-Cu PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const GHKCU_PROTOCOL: WellnessProtocol = {
  id: 'peptide-ghkcu',
  name: 'GHK-Cu Anti-Aging Peptide Protocol',
  category: 'wellness',
  subcategory: 'peptide',
  description: 'GHK-Cu (glycyl-L-histidyl-L-lysine copper) is a naturally occurring copper peptide that declines significantly with age. It is one of the most studied anti-aging peptides, with demonstrated effects on collagen synthesis, antioxidant enzyme production, DNA repair, stem cell activation, and tissue remodeling. Available as both injectable and topical formulations.',
  clinicalIndication: 'Skin aging, fine lines and wrinkles, post-procedure skin repair, wound healing, hair thinning, overall anti-aging',

  medication: 'GHK-Cu (copper peptide complex)',
  dosingSchedule: [
    { week: 1, dose: '200 mcg subcutaneous OR topical serum twice daily', frequency: 'Daily', route: 'Subcutaneous injection or topical application', notes: 'Injectable and topical can be used concurrently for accelerated results.' },
    { week: 2, dose: '200-500 mcg subcutaneous OR topical twice daily', frequency: 'Daily', route: 'Subcutaneous or topical', notes: 'Increase injectable dose if tolerated. Topical: apply to clean skin, AM and PM.' },
    { week: 4, dose: '500 mcg subcutaneous + topical twice daily', frequency: 'Daily for 20-day course', route: 'Subcutaneous + topical', notes: 'Intensive 20-day injectable course for maximum collagen stimulation.' },
    { week: 8, dose: 'Topical maintenance', frequency: 'Twice daily', route: 'Topical application', notes: 'After injectable course, maintain with topical. Repeat injectable course every 4-6 months.' },
  ],
  route: 'Subcutaneous injection and/or topical application',
  injectionSites: ['Abdomen (periumbilical)', 'Upper arm'],
  siteRotationProtocol: 'Rotate between abdomen and arm sites. For facial anti-aging, topical application is preferred over injection.',

  labRequirements: [
    { testName: 'Serum copper level', frequency: 'Baseline', timing: 'Before starting injectable protocol', criticalValues: '> 155 mcg/dL (copper excess)' },
    { testName: 'Ceruloplasmin', frequency: 'Baseline', timing: 'Assess copper metabolism' },
    { testName: 'Zinc level', frequency: 'Baseline', timing: 'Copper and zinc compete for absorption', criticalValues: '< 60 mcg/dL (zinc deficiency)' },
    { testName: 'Hepatic function', frequency: 'Baseline', timing: 'Copper is metabolized by the liver' },
  ],
  monitoringIntervals: 'Monthly during injectable course, quarterly during topical maintenance',
  vitalsRequired: ['Blood pressure'],

  contraindications: [
    ...PEPTIDE_CONTRAINDICATIONS_GENERAL,
    'Wilson\'s disease (copper storage disorder)',
    'Known copper allergy or sensitivity',
    'Elevated serum copper levels',
    'Severe liver disease (impaired copper metabolism)',
  ],
  precautions: [
    'Zinc supplementation may be needed to balance copper levels',
    'Do not apply topical GHK-Cu to open wounds or active infections',
    'Avoid use with strong acids (retinol, AHA/BHA) at the same time of day (use alternating AM/PM)',
    'Pregnant or breastfeeding patients should avoid injectable form (topical safety not established)',
  ],
  potentialSideEffects: [
    'Injection site redness (mild, transient)',
    'Skin tingling at application site (topical)',
    'Mild skin irritation if used with incompatible products',
    'Blue-green discoloration of skin if over-applied topically (rare, resolves)',
  ],
  drugInteractions: [
    'Zinc supplements: competitive absorption with copper',
    'Penicillamine: chelates copper, reduces GHK-Cu effectiveness',
    'Retinoids: may enhance effects but also increase irritation (alternate timing)',
    'Other copper supplements: risk of copper excess',
  ],
  riskLevel: 'low',

  onsetTime: 'Skin texture improvement often noticed within 2-4 weeks. Collagen rebuilding is a 3-6 month process.',
  expectedTimeline: '20-day injectable intensive course with ongoing topical maintenance. Repeat injectable courses every 4-6 months.',
  expectedResults: [
    'Improved skin firmness and elasticity',
    'Reduction in fine lines and wrinkles',
    'Enhanced skin tone and texture',
    'Increased collagen and elastin production',
    'Improved wound healing',
    'Potential hair growth stimulation (improved follicle health)',
    'Antioxidant enzyme upregulation (SOD, catalase)',
    'DNA repair activation',
    'Reduced skin inflammation',
  ],
  maintenanceProtocol: 'Topical GHK-Cu twice daily, ongoing. Repeat 20-day injectable course every 4-6 months for sustained deep-tissue benefits.',

  aftercare: [
    { timeframe: 'Post-injection', instruction: 'Mild redness is normal. Avoid direct sun exposure to injection sites for 24 hours.', priority: 'important' },
    { timeframe: 'Topical use', instruction: 'Apply to clean, dry skin. Allow to absorb for 5 minutes before applying other products. Use SPF 30+ during the day.', priority: 'important' },
    { timeframe: 'Ongoing', instruction: 'Support collagen production with vitamin C (oral and topical), adequate protein intake, and sun protection.', priority: 'recommended' },
  ],

  consentRequirements: {
    formId: 'consent-peptide-ghkcu',
    formName: 'GHK-Cu Peptide Therapy Consent',
    expiresInDays: 365,
    requiresWitness: false,
    requiresPhotoConsent: true,
  },
  cptCodes: [
    { code: '96372', description: 'Therapeutic injection, subcutaneous' },
    { code: 'J3490', description: 'Unclassified drugs (GHK-Cu)' },
  ],
  prescriptionRequired: true,
  documentationRequirements: [
    'Informed consent',
    'Copper and zinc baseline labs',
    'Skin assessment and baseline photos',
    'Injection/application documentation',
    'Progress photos at 30, 60, 90 days',
  ],

  pricing: { min: 150, max: 300, unit: 'per month' },
  sessionDuration: 15,

  tags: ['ghk-cu', 'copper-peptide', 'anti-aging', 'collagen', 'skin-repair', 'peptide', 'injection'],
  relatedProtocols: ['peptide-nad', 'peptide-sermorelin', 'peptide-glutathione'],
  lastUpdated: '2026-03-26',
};

// ═══════════════════════════════════════════════════════════════════════════════
// PT-141 PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const PT141_PROTOCOL: WellnessProtocol = {
  id: 'peptide-pt141',
  name: 'PT-141 (Bremelanotide) Protocol',
  category: 'wellness',
  subcategory: 'peptide',
  description: 'PT-141 (bremelanotide) is a melanocortin receptor agonist that works through the central nervous system to address sexual dysfunction. Unlike PDE5 inhibitors that work on blood flow alone, PT-141 activates melanocortin receptors in the brain, producing genuine sexual arousal and desire. FDA-approved for hypoactive sexual desire disorder (HSDD) in premenopausal women; also used off-label for men.',
  clinicalIndication: 'Hypoactive sexual desire disorder (HSDD), decreased libido, sexual dysfunction not responsive to other treatments',

  medication: 'Bremelanotide (PT-141)',
  dosingSchedule: [
    { week: 1, dose: '1.0 mg (test dose)', frequency: 'Once, 45 minutes before anticipated sexual activity', route: 'Subcutaneous injection', notes: 'First dose should be administered in clinic to monitor for side effects (especially blood pressure changes and nausea).' },
    { week: 2, dose: '1.75 mg', frequency: 'As needed, 45 minutes before activity', route: 'Subcutaneous injection', notes: 'Standard therapeutic dose. Do not exceed one dose per 24 hours.' },
    { week: 4, dose: '1.75 mg', frequency: 'As needed, max 8 doses per month', route: 'Subcutaneous injection', notes: 'Evaluate response. Most patients use 2-4 doses per month.' },
  ],
  route: 'Subcutaneous injection',
  injectionSites: ['Abdomen (preferred)', 'Upper thigh'],
  siteRotationProtocol: 'Rotate between sites. Given infrequent use, rotation is straightforward.',

  labRequirements: [
    { testName: 'Blood pressure assessment', frequency: 'Baseline and at test dose visit', timing: 'Before starting, monitor for BP elevation' },
    { testName: 'Hormone panel (testosterone, estrogen, progesterone)', frequency: 'Baseline', timing: 'Rule out hormonal causes of low libido' },
    { testName: 'Thyroid panel', frequency: 'Baseline', timing: 'Hypothyroidism can affect libido' },
    { testName: 'Mental health screening', frequency: 'Baseline', timing: 'Depression and medications can affect desire' },
  ],
  monitoringIntervals: 'Test dose in clinic, then follow-up at 1 month, quarterly thereafter',
  vitalsRequired: ['Blood pressure (pre and post first dose)', 'Heart rate'],

  contraindications: [
    'Uncontrolled hypertension (BP > 160/100)',
    'Known cardiovascular disease',
    'Pregnancy or breastfeeding',
    'Known hypersensitivity to bremelanotide',
    'Concurrent use of naltrexone (contraindicated combination)',
  ],
  precautions: [
    'Controlled hypertension (may cause transient BP increase of 6-12 mmHg)',
    'History of nausea with medications (nausea is most common side effect)',
    'Dark-skinned patients (may experience hyperpigmentation with repeated use)',
    'History of depression or mood disorders',
    'Concurrent PDE5 inhibitor use (caution, not contraindicated but monitor)',
    'Do not use more than 8 times per month',
    'Not recommended for use in postmenopausal women (limited data)',
  ],
  potentialSideEffects: [
    'Nausea (40%, most common, usually self-limiting within 2 hours)',
    'Flushing (20%)',
    'Headache (11%)',
    'Injection site reaction (5-10%)',
    'Transient blood pressure elevation (typically 6-12 mmHg systolic)',
    'Darkening of skin/hyperpigmentation with frequent use (dose-related, may be permanent)',
    'Darkening of gums (rare, reversible)',
    'Fatigue (uncommon)',
    'Nasal congestion (uncommon)',
  ],
  drugInteractions: [
    'Naltrexone: CONTRAINDICATED (reduces PT-141 effectiveness)',
    'PDE5 inhibitors (sildenafil, tadalafil): use with caution, monitor BP',
    'Antihypertensives: PT-141 may transiently increase BP',
    'SSRIs/SNRIs: may reduce PT-141 effectiveness (SSRIs commonly cause low libido)',
    'Alpha-blockers: additive hypotensive effects possible',
  ],
  riskLevel: 'moderate',

  onsetTime: '45 minutes to 2 hours. Effects may last up to 24 hours.',
  expectedTimeline: 'Effects from first use. Used as needed, not daily.',
  expectedResults: [
    'Increased sexual desire and arousal',
    'Enhanced sensitivity and pleasure',
    'Improved sexual satisfaction',
    'Works through central nervous system (genuine desire, not just physical response)',
    'Effective regardless of hormonal status',
  ],
  maintenanceProtocol: 'Use as needed, maximum 8 doses per month. No long-term taper needed. Reassess at quarterly visits.',

  aftercare: [
    { timeframe: 'First dose (in clinic)', instruction: 'Remain in clinic for 30 minutes post-injection for blood pressure monitoring. Nausea is common and typically resolves within 1-2 hours.', priority: 'critical' },
    { timeframe: 'Post-injection', instruction: 'If nausea occurs, ginger or anti-nausea medication can help. Effects begin within 45 minutes and may last up to 24 hours.', priority: 'important' },
    { timeframe: 'Ongoing', instruction: 'Do not use more than 8 doses per month. Do not exceed 1 dose per 24 hours. Report any persistent skin darkening.', priority: 'critical' },
  ],

  consentRequirements: {
    formId: 'consent-peptide-pt141',
    formName: 'PT-141 (Bremelanotide) Therapy Consent',
    expiresInDays: 365,
    requiresWitness: false,
    requiresPhotoConsent: false,
  },
  cptCodes: [
    { code: '96372', description: 'Therapeutic injection, subcutaneous' },
    { code: '99213', description: 'Office visit, established patient' },
    { code: 'J3490', description: 'Unclassified drugs (bremelanotide)' },
  ],
  prescriptionRequired: true,
  documentationRequirements: [
    'Informed consent with discussion of hyperpigmentation risk',
    'Baseline BP and hormone labs',
    'First-dose monitoring documentation',
    'Usage frequency tracking',
    'Skin assessment for pigmentation changes',
  ],

  pricing: { min: 100, max: 200, unit: 'per dose' },
  sessionDuration: 15,

  tags: ['pt-141', 'bremelanotide', 'peptide', 'sexual-health', 'libido', 'injection'],
  relatedProtocols: ['hormone-testosterone', 'peptide-nad'],
  lastUpdated: '2026-03-26',
};

// ─── Export All Peptide Protocols ─────────────────────────────────────────────

export const PEPTIDE_PROTOCOLS: WellnessProtocol[] = [
  NAD_INJECTION_PROTOCOL,
  SERMORELIN_PROTOCOL,
  GLUTATHIONE_INJECTION_PROTOCOL,
  BPC157_PROTOCOL,
  GHKCU_PROTOCOL,
  PT141_PROTOCOL,
];
