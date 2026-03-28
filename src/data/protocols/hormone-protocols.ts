// ─── Hormone Therapy Protocols ───────────────────────────────────────────────
// Complete hormone replacement and optimization protocols for Rani Beauty Clinic
// CRITICAL: "injection" only — never "infusion"

import type { WellnessProtocol } from './types';

// ─── Hormone Panel Interpretation Guide ──────────────────────────────────────

export const HORMONE_PANEL_INTERPRETATION = {
  women: {
    testosterone: {
      total: { optimal: '40-60 ng/dL', low: '< 25 ng/dL', high: '> 70 ng/dL', unit: 'ng/dL' },
      free: { optimal: '3-6 pg/mL', low: '< 2 pg/mL', high: '> 8 pg/mL', unit: 'pg/mL' },
      notes: 'Optimal range varies by age and menopausal status. Premenopausal women at the higher end, postmenopausal at the lower end.',
    },
    estradiol: {
      premenopausal: { optimal: '50-400 pg/mL (varies by cycle day)', follicular: '30-120 pg/mL', ovulation: '100-400 pg/mL', luteal: '50-250 pg/mL' },
      postmenopausal: { optimal: '20-50 pg/mL on therapy', untreated: '< 20 pg/mL' },
      notes: 'Always interpret in context of menstrual cycle phase for premenopausal women.',
    },
    progesterone: {
      follicular: '< 1 ng/mL',
      luteal: '5-20 ng/mL',
      postmenopausal: '< 0.5 ng/mL',
      onTherapy: '10-25 ng/mL (targeted range on supplementation)',
      notes: 'Low luteal progesterone suggests anovulation or luteal phase defect.',
    },
    dheas: {
      ageRange: [
        { age: '20-29', optimal: '150-350 mcg/dL' },
        { age: '30-39', optimal: '120-300 mcg/dL' },
        { age: '40-49', optimal: '80-250 mcg/dL' },
        { age: '50-59', optimal: '50-200 mcg/dL' },
        { age: '60+', optimal: '30-150 mcg/dL' },
      ],
      notes: 'DHEA-S declines approximately 2-3% per year after age 30.',
    },
  },
  men: {
    testosterone: {
      total: { optimal: '600-900 ng/dL', low: '< 300 ng/dL', borderline: '300-450 ng/dL', high: '> 1000 ng/dL', unit: 'ng/dL' },
      free: { optimal: '15-25 pg/mL', low: '< 9 pg/mL', high: '> 30 pg/mL', unit: 'pg/mL' },
      notes: 'Total testosterone should be drawn fasting, between 7-10 AM. Confirm low levels with repeat testing.',
    },
    estradiol: {
      optimal: '20-40 pg/mL',
      low: '< 15 pg/mL',
      high: '> 50 pg/mL',
      notes: 'Both low and high estradiol cause symptoms in men. Target 20-40 pg/mL on testosterone therapy.',
    },
    dheas: {
      ageRange: [
        { age: '20-29', optimal: '200-450 mcg/dL' },
        { age: '30-39', optimal: '150-400 mcg/dL' },
        { age: '40-49', optimal: '100-350 mcg/dL' },
        { age: '50-59', optimal: '80-300 mcg/dL' },
        { age: '60+', optimal: '50-250 mcg/dL' },
      ],
    },
    psa: {
      normal: '< 4.0 ng/mL',
      elevated: '> 4.0 ng/mL (requires urology referral)',
      notes: 'Baseline PSA required before starting testosterone. Monitor every 3-6 months in first year.',
    },
  },
  thyroid: {
    tsh: { optimal: '1.0-2.5 mIU/L', subclinicalHypo: '2.5-10 mIU/L', overt: '> 10 mIU/L', suppressed: '< 0.4 mIU/L' },
    freeT4: { optimal: '1.0-1.8 ng/dL', low: '< 0.8 ng/dL', high: '> 2.0 ng/dL' },
    freeT3: { optimal: '3.0-4.0 pg/mL', low: '< 2.5 pg/mL', high: '> 4.5 pg/mL' },
    reverseT3: { optimal: '< 15 ng/dL', elevated: '> 20 ng/dL', notes: 'Elevated rT3 indicates impaired T4-to-T3 conversion (stress, inflammation, illness).' },
    tpoAntibodies: { normal: '< 35 IU/mL', elevated: '> 35 IU/mL (suggests Hashimoto\'s thyroiditis)' },
    tgAntibodies: { normal: '< 20 IU/mL', elevated: '> 20 IU/mL' },
    notes: 'Always run full panel (TSH, free T4, free T3, reverse T3, TPO-Ab, Tg-Ab). TSH alone is insufficient for optimization.',
  },
};

// ─── Cross-Hormone Interactions ──────────────────────────────────────────────

export const CROSS_HORMONE_INTERACTIONS = [
  {
    hormones: ['Testosterone', 'Estradiol'],
    interaction: 'Testosterone aromatizes to estradiol. Higher testosterone doses may elevate estradiol, causing water retention, mood changes, or gynecomastia in men.',
    management: 'Monitor estradiol with every testosterone level. Consider DIM (diindolylmethane) or anastrozole if estradiol rises above optimal range.',
  },
  {
    hormones: ['Thyroid', 'Cortisol'],
    interaction: 'High cortisol increases reverse T3 production, blocking active T3 at the cellular level. Adrenal dysfunction must be addressed for thyroid therapy to be effective.',
    management: 'Assess cortisol (AM cortisol, 4-point salivary cortisol) before starting thyroid optimization. Address adrenal function first.',
  },
  {
    hormones: ['Testosterone', 'Thyroid'],
    interaction: 'Low thyroid function can reduce SHBG, altering free testosterone levels. Thyroid optimization may change testosterone requirements.',
    management: 'Optimize thyroid first, then reassess testosterone levels after 6-8 weeks of stable thyroid medication.',
  },
  {
    hormones: ['DHEA', 'Testosterone', 'Estradiol'],
    interaction: 'DHEA is a precursor to both testosterone and estradiol. Supplementation can increase levels of both downstream hormones.',
    management: 'Monitor testosterone and estradiol when supplementing DHEA. Start with low doses and titrate.',
  },
  {
    hormones: ['Progesterone', 'Cortisol'],
    interaction: 'Progesterone can be converted to cortisol via the pregnenolone steal pathway under stress. High stress may reduce progesterone levels.',
    management: 'Address stress and adrenal health. Progesterone supplementation may need higher doses in high-stress patients.',
  },
  {
    hormones: ['Insulin', 'Testosterone'],
    interaction: 'Insulin resistance lowers SHBG, increasing free testosterone in women (PCOS pattern) and may paradoxically lower total testosterone in men.',
    management: 'Assess fasting insulin and HOMA-IR. Address insulin resistance with lifestyle and medication before hormonal optimization.',
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TESTOSTERONE REPLACEMENT — WOMEN
// ═══════════════════════════════════════════════════════════════════════════════

export const TESTOSTERONE_WOMEN_PROTOCOL: WellnessProtocol = {
  id: 'hormone-testosterone-women',
  name: 'Testosterone Replacement Protocol (Women)',
  category: 'wellness',
  subcategory: 'hrt',
  description: 'Testosterone optimization for women experiencing symptoms of low testosterone: decreased libido, fatigue, reduced muscle tone, brain fog, and decreased motivation. Women produce testosterone naturally and require it for bone health, cognitive function, sexual health, and overall vitality. Our protocol uses carefully dosed testosterone to restore levels to the optimal physiologic range.',
  clinicalIndication: 'Low testosterone confirmed by labs (total T < 25 ng/dL or free T < 2 pg/mL) with correlating symptoms: low libido, fatigue, decreased muscle mass, brain fog, mood changes',

  medication: 'Testosterone cypionate (compounded for women) or testosterone cream',
  dosingSchedule: [
    { week: 1, dose: 'Injection: 5-10 mg weekly OR Cream: 1-2 mg daily', frequency: 'Injection: once weekly. Cream: daily', route: 'Intramuscular or subcutaneous injection; topical cream', notes: 'Start at lowest dose. Compounded testosterone for women is typically 200 mg/mL concentration, injecting 0.025-0.05 mL.' },
    { week: 4, dose: 'Maintain starting dose', frequency: 'Weekly injection or daily cream', route: 'IM/SubQ or topical', notes: 'Check labs at 4 weeks (trough level, draw morning of injection day). Assess symptoms.' },
    { week: 6, dose: 'Adjust based on labs: may increase to 10-15 mg weekly', frequency: 'Weekly', route: 'IM/SubQ or topical', notes: 'Target total T: 40-60 ng/dL, free T: 3-6 pg/mL. Increase only if below range with persistent symptoms.' },
    { week: 12, dose: 'Optimized dose (typically 5-15 mg weekly)', frequency: 'Weekly', route: 'IM/SubQ or topical', notes: 'Quarterly labs. Assess: testosterone, free T, estradiol, SHBG, CBC (hematocrit), lipid panel.' },
  ],
  route: 'Intramuscular or subcutaneous injection; topical cream (applied to inner wrist, inner thigh, or labia)',
  injectionSites: ['Deltoid (IM)', 'Abdomen (SubQ)', 'Gluteus (IM)', 'Upper thigh (SubQ)'],
  siteRotationProtocol: 'For weekly injections: rotate between deltoid, gluteus, and thigh. For SubQ: rotate abdomen quadrants.',

  labRequirements: [
    { testName: 'Total testosterone', frequency: 'Baseline, 4 weeks, then quarterly', timing: 'Draw at trough (morning of injection day)', criticalValues: '> 70 ng/dL in women' },
    { testName: 'Free testosterone', frequency: 'Baseline, 4 weeks, then quarterly', timing: 'Draw with total T' },
    { testName: 'Estradiol', frequency: 'Baseline, then quarterly', timing: 'Testosterone aromatizes to estrogen' },
    { testName: 'SHBG', frequency: 'Baseline, then biannually', timing: 'Affects free T calculation' },
    { testName: 'CBC with hematocrit', frequency: 'Baseline, then quarterly', timing: 'Testosterone can increase red blood cells', criticalValues: 'Hematocrit > 48% in women' },
    { testName: 'Lipid panel', frequency: 'Baseline, then biannually', timing: 'Monitor cholesterol' },
    { testName: 'Hepatic function', frequency: 'Baseline, then annually', timing: 'Testosterone is hepatically metabolized' },
    { testName: 'Comprehensive metabolic panel', frequency: 'Baseline, then biannually', timing: 'Overall metabolic health' },
    { testName: 'DHEA-S', frequency: 'Baseline', timing: 'Assess adrenal androgen contribution' },
    { testName: 'Progesterone (if premenopausal)', frequency: 'Baseline', timing: 'Day 21 of cycle' },
  ],
  monitoringIntervals: 'Every 4 weeks during titration (first 3 months), then quarterly once stable',
  vitalsRequired: ['Blood pressure', 'Weight', 'Heart rate'],

  contraindications: [
    'Pregnancy or planning pregnancy (testosterone is teratogenic)',
    'Breastfeeding',
    'Active breast cancer or estrogen-receptor-positive cancer history',
    'Polycythemia (hematocrit > 50%)',
    'Severe liver disease',
    'Uncontrolled cardiovascular disease',
    'Active endometrial cancer',
  ],
  precautions: [
    'PCOS (already elevated androgens; careful evaluation required)',
    'Acne-prone skin (testosterone may worsen)',
    'Female-pattern hair loss (monitor for worsening)',
    'Hirsutism risk (unwanted facial/body hair growth)',
    'Voice deepening (usually only at supratherapeutic doses, but irreversible)',
    'Concurrent estrogen or progesterone therapy (coordinate hormone optimization)',
    'History of blood clots (monitor hematocrit)',
  ],
  potentialSideEffects: [
    'Acne or oily skin (most common, dose-related)',
    'Increased body hair (mild at physiologic doses)',
    'Clitoral sensitivity or enlargement (at higher doses)',
    'Voice changes (rare at physiologic doses; irreversible)',
    'Mood changes (irritability at supratherapeutic levels)',
    'Fluid retention (mild)',
    'Injection site soreness',
    'Hair thinning (rare at physiologic doses)',
    'Elevated hematocrit',
    'Lipid changes (typically minimal at physiologic doses)',
  ],
  drugInteractions: [
    'Oral anticoagulants: testosterone may increase anticoagulant effect',
    'Insulin and diabetes medications: testosterone improves insulin sensitivity',
    'Corticosteroids: concurrent use may increase fluid retention',
    'Oral estrogen: increases SHBG, may reduce free testosterone',
    'Aromatase inhibitors: may be needed if estradiol rises',
  ],
  riskLevel: 'moderate',

  onsetTime: 'Libido and energy improvements often within 3-6 weeks. Full body composition effects over 3-6 months.',
  expectedTimeline: '3-month titration to optimal dose. Ongoing therapy with quarterly monitoring.',
  expectedResults: [
    'Improved libido and sexual function',
    'Increased energy and reduced fatigue',
    'Better cognitive clarity and focus',
    'Improved muscle tone and strength',
    'Enhanced mood and motivation',
    'Better exercise recovery',
    'Improved bone density (long-term)',
    'Enhanced sense of confidence and vitality',
  ],
  maintenanceProtocol: 'Continue at optimized dose with quarterly labs and annual comprehensive assessment. Adjust dose based on labs and symptoms.',

  aftercare: [
    { timeframe: 'Post-injection', instruction: 'Apply gentle pressure to injection site. Mild soreness is normal for 24-48 hours.', priority: 'important' },
    { timeframe: 'For topical cream', instruction: 'Apply to clean, dry skin. Wash hands thoroughly after application. Avoid skin-to-skin contact with children or partners at application site for 2 hours.', priority: 'critical' },
    { timeframe: 'Ongoing', instruction: 'Report any acne, increased body hair, voice changes, or mood changes promptly. These are dose-dependent and adjustable.', priority: 'critical' },
    { timeframe: 'Lab timing', instruction: 'For injection patients: draw blood on the morning of your injection day (trough level). For cream: draw blood 4-6 hours after application.', priority: 'important' },
  ],

  consentRequirements: {
    formId: 'consent-hormone-testosterone-women',
    formName: 'Testosterone Replacement Therapy Consent (Women)',
    expiresInDays: 365,
    requiresWitness: true,
    requiresPhotoConsent: false,
  },
  cptCodes: [
    { code: '96372', description: 'Therapeutic injection, intramuscular' },
    { code: '99214', description: 'Office visit, moderate complexity (hormone management)' },
    { code: 'J1071', description: 'Testosterone cypionate injection' },
  ],
  prescriptionRequired: true,
  deaSchedule: 'Schedule III controlled substance',
  documentationRequirements: [
    'Comprehensive history and symptom assessment',
    'Baseline labs reviewed and documented',
    'Informed consent with specific discussion of virilization risks',
    'Dose, route, frequency, and lot number documented',
    'Lab results reviewed at each follow-up',
    'Side effect assessment at each visit',
    'Dose adjustment rationale',
  ],

  pricing: { min: 150, max: 300, unit: 'per month' },
  sessionDuration: 20,

  tags: ['testosterone', 'hormone', 'women', 'hrt', 'libido', 'energy', 'injection'],
  relatedProtocols: ['hormone-testosterone-men', 'hormone-dhea', 'hormone-thyroid', 'peptide-pt141'],
  lastUpdated: '2026-03-26',
};

// ═══════════════════════════════════════════════════════════════════════════════
// TESTOSTERONE REPLACEMENT — MEN
// ═══════════════════════════════════════════════════════════════════════════════

export const TESTOSTERONE_MEN_PROTOCOL: WellnessProtocol = {
  id: 'hormone-testosterone-men',
  name: 'Testosterone Replacement Protocol (Men)',
  category: 'wellness',
  subcategory: 'hrt',
  description: 'Testosterone replacement therapy (TRT) for men with clinically confirmed low testosterone (hypogonadism). Symptoms include fatigue, decreased libido, erectile dysfunction, loss of muscle mass, increased body fat, mood changes, and cognitive decline. Our protocol restores testosterone to optimal physiologic levels with careful monitoring of estradiol, hematocrit, and prostate health.',
  clinicalIndication: 'Two morning total testosterone levels < 300 ng/dL with correlating symptoms; or free testosterone < 9 pg/mL with symptoms',

  medication: 'Testosterone cypionate 200 mg/mL',
  dosingSchedule: [
    { week: 1, dose: '80-100 mg per week (split into 2 doses of 40-50 mg)', frequency: 'Twice weekly (e.g., Monday/Thursday)', route: 'Intramuscular or subcutaneous injection', notes: 'Split dosing provides more stable levels and reduces estradiol conversion vs single weekly injection.' },
    { week: 4, dose: 'Maintain 80-100 mg/week', frequency: 'Twice weekly', route: 'IM or SubQ', notes: 'Check trough labs (morning before injection). Evaluate total T, free T, estradiol, hematocrit.' },
    { week: 6, dose: 'Adjust: 80-150 mg/week based on labs', frequency: 'Twice weekly', route: 'IM or SubQ', notes: 'Target total T: 600-900 ng/dL, free T: 15-25 pg/mL, estradiol: 20-40 pg/mL.' },
    { week: 12, dose: 'Optimized dose (typically 100-150 mg/week)', frequency: 'Twice weekly', route: 'IM or SubQ', notes: 'Comprehensive labs: testosterone, free T, estradiol, CBC, PSA, lipids, CMP.' },
    { week: 24, dose: 'Stable maintenance dose', frequency: 'Twice weekly', route: 'IM or SubQ', notes: 'Biannual comprehensive panel. Annual DRE recommended for men over 40.' },
  ],
  route: 'Intramuscular or subcutaneous injection',
  injectionSites: ['Deltoid (IM)', 'Vastus lateralis (IM)', 'Gluteus medius (IM)', 'Abdomen (SubQ)', 'Upper outer thigh (SubQ)'],
  siteRotationProtocol: 'Rotate between 4-6 sites. With twice-weekly injections, use a systematic rotation to prevent scar tissue buildup.',

  labRequirements: [
    { testName: 'Total testosterone', frequency: 'Baseline (2 AM draws), then quarterly', timing: 'Trough: morning of injection day, fasting', criticalValues: '> 1100 ng/dL' },
    { testName: 'Free testosterone', frequency: 'Baseline, then quarterly', timing: 'With total T' },
    { testName: 'Estradiol (sensitive assay)', frequency: 'Baseline, then quarterly', timing: 'Critical for managing side effects', criticalValues: '> 50 pg/mL or < 15 pg/mL' },
    { testName: 'CBC with hematocrit', frequency: 'Baseline, then quarterly', timing: 'Testosterone increases erythropoiesis', criticalValues: 'Hematocrit > 54%' },
    { testName: 'PSA', frequency: 'Baseline, then every 6 months', timing: 'Prostate monitoring', criticalValues: '> 4.0 ng/mL or rapid rise' },
    { testName: 'Lipid panel', frequency: 'Baseline, then biannually', timing: 'Monitor cardiovascular health' },
    { testName: 'Comprehensive metabolic panel', frequency: 'Baseline, then biannually', timing: 'Liver, kidney, glucose monitoring' },
    { testName: 'SHBG', frequency: 'Baseline, then annually', timing: 'Affects free T calculation' },
    { testName: 'LH/FSH', frequency: 'Baseline', timing: 'Distinguish primary vs secondary hypogonadism' },
    { testName: 'Prolactin', frequency: 'Baseline', timing: 'Rule out prolactinoma if very low T' },
    { testName: 'Thyroid panel', frequency: 'Baseline', timing: 'Thyroid affects SHBG and symptoms' },
    { testName: 'DHEA-S', frequency: 'Baseline', timing: 'Assess adrenal function' },
  ],
  monitoringIntervals: 'Every 4 weeks during titration (first 3 months), quarterly for first year, biannually once stable',
  vitalsRequired: ['Blood pressure', 'Weight', 'Waist circumference', 'Heart rate'],

  contraindications: [
    'Active prostate cancer or breast cancer',
    'PSA > 4.0 ng/mL without urology clearance',
    'Hematocrit > 54%',
    'Untreated obstructive sleep apnea',
    'Uncontrolled heart failure',
    'Active desire for fertility (TRT suppresses sperm production)',
    'History of thrombotic events without anticoagulation',
    'Palpable prostate nodule without biopsy clearance',
  ],
  precautions: [
    'Sleep apnea (may worsen; reassess with treatment)',
    'BPH (benign prostatic hyperplasia; monitor symptoms)',
    'Polycythemia risk (frequent blood donation may be needed if hematocrit rises)',
    'Fertility considerations (discuss sperm banking before starting)',
    'Mood disorders (testosterone can amplify existing mood patterns)',
    'Cardiovascular risk factors (comprehensive assessment required)',
    'Concurrent opioid use (opioids suppress testosterone; address underlying pain management)',
    'Age > 65 (slightly increased cardiovascular risk per some studies; careful evaluation)',
  ],
  potentialSideEffects: [
    'Increased hematocrit/polycythemia (most medically significant; requires monitoring)',
    'Acne (dose-related, especially early in treatment)',
    'Testicular atrophy (expected with exogenous testosterone)',
    'Reduced sperm production (expected; reversible after discontinuation in most cases)',
    'Mood changes (irritability if estradiol is too high or too low)',
    'Gynecomastia (if estradiol is not managed)',
    'Water retention (usually mild)',
    'Hair loss (in genetically predisposed individuals)',
    'Injection site pain or nodules',
    'Increased libido (typically a desired effect)',
    'Sleep apnea worsening (rare)',
  ],
  drugInteractions: [
    'Anticoagulants (warfarin, etc.): enhanced anticoagulant effect',
    'Insulin and diabetes medications: testosterone improves insulin sensitivity; may need dose reduction',
    'Corticosteroids: additive fluid retention',
    'Oral anticoagulants: increased INR monitoring needed',
    'Opioids: bidirectional interaction (opioids lower T; T may reduce opioid requirements)',
    '5-alpha reductase inhibitors (finasteride): may be used concurrently for hair loss',
    'Aromatase inhibitors (anastrozole): may be needed for estradiol management',
    'HCG: may be used concurrently to maintain testicular size and fertility',
  ],
  riskLevel: 'moderate',

  onsetTime: 'Energy and mood improvement: 3-6 weeks. Libido: 3-6 weeks. Body composition: 3-6 months. Full effects: 6-12 months.',
  expectedTimeline: '3-month titration to optimal dose. Lifelong therapy in most cases (endogenous production rarely recovers fully).',
  expectedResults: [
    'Improved energy, motivation, and drive',
    'Restored libido and sexual function',
    'Increased lean muscle mass and strength',
    'Reduced body fat, especially visceral fat',
    'Enhanced mood and cognitive clarity',
    'Better sleep quality',
    'Improved bone density (long-term)',
    'Cardiovascular risk factor improvement (improved lipids, insulin sensitivity)',
    'Enhanced exercise performance and recovery',
    'Improved overall quality of life',
  ],
  maintenanceProtocol: 'Continue at optimized dose with quarterly labs for first year, then biannual. Annual PSA, DRE (men over 40), and comprehensive metabolic panel.',

  aftercare: [
    { timeframe: 'Post-injection', instruction: 'Apply pressure for 10 seconds. Mild soreness or small bruise is normal. Avoid rubbing injection site.', priority: 'important' },
    { timeframe: 'Daily', instruction: 'Prioritize sleep, exercise (especially resistance training), and stress management. These amplify testosterone benefits.', priority: 'important' },
    { timeframe: 'Ongoing', instruction: 'Report breast tenderness, significant mood changes, excessive acne, or breathing difficulties during sleep. These may indicate dose or estrogen management needs.', priority: 'critical' },
    { timeframe: 'Hematocrit management', instruction: 'If hematocrit rises above 52%, therapeutic phlebotomy (blood donation) may be recommended. Stay well hydrated.', priority: 'critical' },
  ],

  consentRequirements: {
    formId: 'consent-hormone-testosterone-men',
    formName: 'Testosterone Replacement Therapy Consent (Men)',
    expiresInDays: 365,
    requiresWitness: true,
    requiresPhotoConsent: false,
  },
  cptCodes: [
    { code: '96372', description: 'Therapeutic injection, intramuscular' },
    { code: '99214', description: 'Office visit, moderate complexity' },
    { code: 'J1071', description: 'Testosterone cypionate injection' },
  ],
  prescriptionRequired: true,
  deaSchedule: 'Schedule III controlled substance',
  documentationRequirements: [
    'Two confirmed low morning testosterone levels',
    'Symptom assessment documentation',
    'Comprehensive baseline labs reviewed',
    'Informed consent with fertility discussion',
    'PSA and prostate assessment documented',
    'Dose, route, frequency, lot number at each visit',
    'Lab review at each follow-up',
    'Side effect assessment',
    'Dose adjustment rationale',
    'Annual comprehensive reassessment',
  ],

  pricing: { min: 200, max: 400, unit: 'per month' },
  sessionDuration: 20,

  tags: ['testosterone', 'trt', 'hormone', 'men', 'hypogonadism', 'injection'],
  relatedProtocols: ['hormone-testosterone-women', 'hormone-dhea', 'hormone-thyroid', 'peptide-sermorelin'],
  lastUpdated: '2026-03-26',
};

// ═══════════════════════════════════════════════════════════════════════════════
// THYROID OPTIMIZATION PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const THYROID_OPTIMIZATION_PROTOCOL: WellnessProtocol = {
  id: 'hormone-thyroid',
  name: 'Thyroid Optimization Protocol',
  category: 'wellness',
  subcategory: 'hrt',
  description: 'Comprehensive thyroid assessment and optimization protocol. The thyroid is the master metabolic regulator, affecting weight, energy, mood, cognitive function, hair health, skin quality, and temperature regulation. Our protocol goes beyond standard TSH-only testing to assess the full thyroid axis and optimize function for peak wellness.',
  clinicalIndication: 'Subclinical or overt hypothyroidism, persistent fatigue, weight gain resistance, hair loss, cold intolerance, brain fog, dry skin, constipation, elevated cholesterol',

  medication: 'Levothyroxine (T4), liothyronine (T3), or compounded T4/T3 combination',
  dosingSchedule: [
    { week: 1, dose: 'T4: 25-50 mcg daily OR Compounded T4/T3: 50/5 mcg daily', frequency: 'Once daily, morning', route: 'Oral (taken on empty stomach, 60 min before food or caffeine)', notes: 'Start low, especially in patients over 50 or with cardiac history. Take first thing in the morning with water only.' },
    { week: 6, dose: 'Reassess: may increase T4 by 12.5-25 mcg', frequency: 'Once daily, morning', route: 'Oral', notes: 'Recheck full thyroid panel. Takes 4-6 weeks for TSH to stabilize at a new dose.' },
    { week: 12, dose: 'Optimized dose (T4: 50-150 mcg typical)', frequency: 'Once daily', route: 'Oral', notes: 'Target: TSH 1.0-2.5, free T4 upper half of range, free T3: 3.0-4.0 pg/mL. Adjust every 6 weeks until stable.' },
    { week: 24, dose: 'Maintenance dose', frequency: 'Once daily', route: 'Oral', notes: 'Once stable, monitor every 3-6 months. Annual comprehensive panel.' },
  ],
  route: 'Oral medication',
  injectionSites: [],
  siteRotationProtocol: 'N/A (oral medication). If B12 or other wellness injections are used concurrently, follow respective rotation protocols.',

  labRequirements: [
    { testName: 'TSH', frequency: 'Baseline, 6 weeks after each dose change, then quarterly', timing: 'Morning draw, before thyroid medication', criticalValues: '< 0.1 or > 10 mIU/L' },
    { testName: 'Free T4', frequency: 'Baseline, 6 weeks after each change, then quarterly', timing: 'With TSH' },
    { testName: 'Free T3', frequency: 'Baseline, 6 weeks after each change, then quarterly', timing: 'With TSH', criticalValues: '< 2.0 or > 5.0 pg/mL' },
    { testName: 'Reverse T3', frequency: 'Baseline, then biannually', timing: 'Assess T4-to-T3 conversion' },
    { testName: 'TPO antibodies', frequency: 'Baseline, then annually', timing: 'Identify autoimmune thyroid disease' },
    { testName: 'Thyroglobulin antibodies', frequency: 'Baseline', timing: 'Additional autoimmune marker' },
    { testName: 'Iron/ferritin', frequency: 'Baseline', timing: 'Iron is required for T4-to-T3 conversion', criticalValues: 'Ferritin < 40 ng/mL (impairs conversion)' },
    { testName: 'Vitamin D', frequency: 'Baseline', timing: 'Low D is associated with autoimmune thyroid disease' },
    { testName: 'Selenium level', frequency: 'Baseline', timing: 'Selenium supports thyroid enzyme function (consider if available)' },
    { testName: 'Comprehensive metabolic panel', frequency: 'Baseline, then biannually', timing: 'Overall metabolic assessment' },
    { testName: 'Lipid panel', frequency: 'Baseline, then biannually', timing: 'Hypothyroidism elevates cholesterol' },
  ],
  monitoringIntervals: 'Every 6 weeks during dose adjustment. Quarterly once stable. Annual comprehensive thyroid panel.',
  vitalsRequired: ['Blood pressure', 'Heart rate (resting)', 'Weight', 'Temperature (basal body temperature tracking optional)'],

  contraindications: [
    'Untreated adrenal insufficiency (must address cortisol before thyroid)',
    'Active thyrotoxicosis/hyperthyroidism',
    'Recent myocardial infarction (start very low dose with cardiology clearance)',
    'Undiagnosed chest pain (evaluate cardiac status first)',
  ],
  precautions: [
    'Cardiac disease (start with lowest dose, increase slowly)',
    'Adrenal insufficiency (must be corrected first; thyroid medication can precipitate adrenal crisis)',
    'Diabetes (thyroid optimization may improve glucose control; adjust diabetes meds)',
    'Osteoporosis risk (avoid suppressed TSH long-term)',
    'Pregnancy (thyroid needs increase 30-50% during pregnancy; frequent monitoring required)',
    'Elderly patients (start very low and titrate slowly)',
    'Concurrent medications affecting absorption (see interactions)',
  ],
  potentialSideEffects: [
    'Heart palpitations (dose too high or increased too quickly)',
    'Anxiety or nervousness (over-replacement)',
    'Insomnia (especially if T3 is taken too late in the day)',
    'Headache (usually temporary during adjustment)',
    'Increased appetite (metabolic rate increasing)',
    'Hair shedding (temporary, often weeks 4-8; hair grows back)',
    'Sweating or heat intolerance (over-replacement)',
    'Diarrhea (over-replacement)',
    'Weight changes (usually modest weight loss as metabolism normalizes)',
    'Bone density concern with long-term TSH suppression',
  ],
  drugInteractions: [
    'Calcium supplements: separate by 4 hours (reduces absorption)',
    'Iron supplements: separate by 4 hours (reduces absorption)',
    'Proton pump inhibitors (PPIs): may reduce thyroid medication absorption',
    'Antacids: separate by 4 hours',
    'Coffee/espresso: wait 60 minutes after thyroid medication',
    'Estrogen therapy: increases TBG, may require higher thyroid dose',
    'Testosterone: may decrease TBG, potentially reducing total T4 need',
    'Biotin supplements: discontinue 72 hours before labs (causes false results)',
    'Cholestyramine: separate by 4-6 hours',
    'Warfarin: thyroid optimization may increase warfarin sensitivity',
  ],
  riskLevel: 'low',

  onsetTime: 'Some symptom improvement within 2-4 weeks. Full effect of a dose change takes 6-8 weeks. Complete optimization may take 3-6 months.',
  expectedTimeline: '3-6 months to achieve and confirm optimal dosing. Lifelong therapy in most cases.',
  expectedResults: [
    'Improved energy and reduced fatigue',
    'Better cognitive function (reduced brain fog)',
    'Hair health improvement (reduced shedding, improved growth)',
    'Normalized body temperature (less cold intolerance)',
    'Improved mood and reduced anxiety/depression',
    'Better weight management (metabolism normalization)',
    'Improved cholesterol levels',
    'Better skin hydration and quality',
    'Improved bowel regularity',
    'Enhanced overall vitality',
  ],
  maintenanceProtocol: 'Once optimal dose is established: quarterly labs for first year, then every 6 months. Annual comprehensive panel. Dose may need adjustment with seasonal changes, stress, or other hormonal changes.',

  aftercare: [
    { timeframe: 'Daily medication timing', instruction: 'Take thyroid medication first thing in the morning on an empty stomach with water only. Wait 60 minutes before food, coffee, or other medications.', priority: 'critical' },
    { timeframe: 'Supplement timing', instruction: 'Take calcium, iron, and antacids at least 4 hours after thyroid medication. Discontinue biotin 72 hours before lab draws.', priority: 'critical' },
    { timeframe: 'Temporary hair shedding', instruction: 'Some patients experience temporary increased hair shedding at weeks 4-8 as the body adjusts. This is normal and resolves. Hair growth improves once levels are optimized.', priority: 'important' },
    { timeframe: 'Ongoing', instruction: 'Do not skip doses. Do not adjust dose without lab confirmation. Report palpitations, chest pain, or persistent anxiety immediately.', priority: 'critical' },
  ],

  consentRequirements: {
    formId: 'consent-hormone-thyroid',
    formName: 'Thyroid Optimization Therapy Consent',
    expiresInDays: 365,
    requiresWitness: false,
    requiresPhotoConsent: false,
  },
  cptCodes: [
    { code: '99214', description: 'Office visit, moderate complexity (hormone management)' },
    { code: '99215', description: 'Office visit, high complexity (initial evaluation)' },
    { code: '80091', description: 'Thyroid panel' },
  ],
  prescriptionRequired: true,
  documentationRequirements: [
    'Comprehensive symptom assessment',
    'Full thyroid panel reviewed (not just TSH)',
    'Medication, dose, and frequency documented',
    'Lab results reviewed at each follow-up with interpretation',
    'Dose adjustment rationale',
    'Side effect assessment',
    'Medication interaction review',
    'Patient education on medication timing documented',
  ],

  pricing: { min: 100, max: 250, unit: 'per month (medication + monitoring)' },
  sessionDuration: 20,

  tags: ['thyroid', 'hypothyroidism', 'hormone', 'metabolism', 'fatigue', 'hair-loss', 'weight-management'],
  relatedProtocols: ['hormone-testosterone-women', 'hormone-testosterone-men', 'hormone-dhea', 'wellness-b12'],
  lastUpdated: '2026-03-26',
};

// ═══════════════════════════════════════════════════════════════════════════════
// DHEA SUPPLEMENTATION PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const DHEA_PROTOCOL: WellnessProtocol = {
  id: 'hormone-dhea',
  name: 'DHEA Supplementation Protocol',
  category: 'wellness',
  subcategory: 'hrt',
  description: 'Dehydroepiandrosterone (DHEA) is the most abundant steroid hormone in the body and a precursor to both testosterone and estrogen. DHEA production peaks in the mid-20s and declines steadily, dropping approximately 2-3% per year. Supplementation can support adrenal function, immune health, bone density, mood, and overall hormone balance.',
  clinicalIndication: 'Low DHEA-S levels (below age-appropriate range), adrenal fatigue, immune support, adjunct to hormone optimization, bone density support, mood support',

  medication: 'DHEA (oral capsule or sublingual)',
  dosingSchedule: [
    { week: 1, dose: 'Women: 5-10 mg daily. Men: 25 mg daily.', frequency: 'Once daily, morning', route: 'Oral or sublingual', notes: 'Start with the lower dose. DHEA is best taken in the morning to mimic the natural cortisol/DHEA rhythm.' },
    { week: 4, dose: 'Recheck DHEA-S. Adjust if needed.', frequency: 'Once daily, morning', route: 'Oral or sublingual', notes: 'Target DHEA-S to the upper third of the age-appropriate range.' },
    { week: 8, dose: 'Women: 5-25 mg. Men: 25-50 mg.', frequency: 'Once daily, morning', route: 'Oral or sublingual', notes: 'Titrate based on labs. Women require much lower doses than men.' },
    { week: 12, dose: 'Optimized dose', frequency: 'Once daily, morning', route: 'Oral or sublingual', notes: 'Quarterly labs: DHEA-S, testosterone, estradiol. Adjust as needed.' },
  ],
  route: 'Oral capsule or sublingual tablet',
  injectionSites: [],
  siteRotationProtocol: 'N/A (oral/sublingual administration)',

  labRequirements: [
    { testName: 'DHEA-S', frequency: 'Baseline, 4 weeks, then quarterly', timing: 'Morning draw', criticalValues: 'Above age-appropriate range' },
    { testName: 'Total testosterone', frequency: 'Baseline, then quarterly', timing: 'DHEA converts to testosterone' },
    { testName: 'Free testosterone', frequency: 'Baseline, then quarterly', timing: 'Monitor downstream conversion' },
    { testName: 'Estradiol', frequency: 'Baseline, then quarterly', timing: 'DHEA converts to estrogen as well' },
    { testName: 'Cortisol (AM)', frequency: 'Baseline', timing: 'Assess adrenal function' },
    { testName: 'Comprehensive metabolic panel', frequency: 'Baseline, then biannually', timing: 'Overall metabolic health' },
    { testName: 'Lipid panel', frequency: 'Baseline, then biannually', timing: 'DHEA may improve lipid profile' },
    { testName: 'PSA (men over 40)', frequency: 'Baseline, then annually', timing: 'DHEA converts to testosterone' },
  ],
  monitoringIntervals: 'Every 4 weeks during titration, then quarterly once stable',
  vitalsRequired: ['Blood pressure', 'Weight'],

  contraindications: [
    'Hormone-sensitive cancers (breast, prostate, ovarian, endometrial)',
    'Pregnancy or breastfeeding',
    'PCOS with already elevated androgens',
    'Severe liver disease',
    'Active acne vulgaris (may worsen)',
  ],
  precautions: [
    'Women are more sensitive to androgenic effects (start very low)',
    'PCOS (DHEA may increase androgens further; use with caution)',
    'Acne-prone skin (may worsen in both sexes)',
    'Hormone-sensitive conditions (fibroids, endometriosis)',
    'Concurrent testosterone therapy (additive androgenic effects)',
    'Elevated baseline DHEA-S (do not supplement if already high)',
    'Men with BPH (monitor prostate symptoms)',
  ],
  potentialSideEffects: [
    'Acne (most common, especially in women at higher doses)',
    'Oily skin',
    'Increased body hair in women',
    'Mood changes (irritability at excessive doses)',
    'Insomnia if taken too late in the day',
    'Headache (uncommon)',
    'Changes in menstrual cycle',
    'Hair loss (rare, in genetically predisposed individuals)',
  ],
  drugInteractions: [
    'Testosterone therapy: additive androgenic effects',
    'Estrogen therapy: DHEA provides additional estrogen precursor',
    'Insulin and diabetes medications: DHEA may improve insulin sensitivity',
    'Anticoagulants: DHEA may affect platelet aggregation',
    'Tamoxifen and aromatase inhibitors: DHEA provides estrogen precursor, may counteract',
    'Corticosteroids: DHEA and cortisol have inverse relationship',
  ],
  riskLevel: 'low',

  onsetTime: 'Lab changes within 2-4 weeks. Symptomatic improvement over 4-8 weeks.',
  expectedTimeline: 'Initial titration over 8-12 weeks. Ongoing supplementation with quarterly monitoring.',
  expectedResults: [
    'Improved energy and stress resilience',
    'Enhanced mood and sense of well-being',
    'Improved immune function',
    'Better bone density (long-term)',
    'Improved libido (through downstream testosterone conversion)',
    'Better cognitive function',
    'Enhanced skin health',
    'Improved body composition (modest effects)',
  ],
  maintenanceProtocol: 'Continue at optimized dose. Quarterly DHEA-S and hormone monitoring. Annual comprehensive panel. Adjust dose with age and changing hormone needs.',

  aftercare: [
    { timeframe: 'Daily', instruction: 'Take DHEA in the morning with breakfast. Do not take in the evening (may cause insomnia).', priority: 'important' },
    { timeframe: 'Ongoing', instruction: 'Report any acne, increased body hair, mood changes, or changes in menstrual cycle promptly.', priority: 'important' },
    { timeframe: 'Lab timing', instruction: 'Draw DHEA-S and hormones in the morning, fasting, before taking daily DHEA dose.', priority: 'critical' },
  ],

  consentRequirements: {
    formId: 'consent-hormone-dhea',
    formName: 'DHEA Supplementation Consent',
    expiresInDays: 365,
    requiresWitness: false,
    requiresPhotoConsent: false,
  },
  cptCodes: [
    { code: '99213', description: 'Office visit, established patient, low complexity' },
    { code: '99214', description: 'Office visit, established patient, moderate complexity' },
  ],
  prescriptionRequired: false,
  documentationRequirements: [
    'Baseline DHEA-S and hormone panel documented',
    'Dose, frequency, and form documented',
    'Lab review at each follow-up',
    'Side effect assessment',
    'Dose adjustment rationale',
  ],

  pricing: { min: 50, max: 100, unit: 'per month' },
  sessionDuration: 15,

  tags: ['dhea', 'hormone', 'adrenal', 'anti-aging', 'immune', 'bone-health'],
  relatedProtocols: ['hormone-testosterone-women', 'hormone-testosterone-men', 'hormone-thyroid', 'peptide-nad'],
  lastUpdated: '2026-03-26',
};

// ─── Export All Hormone Protocols ────────────────────────────────────────────

export const HORMONE_PROTOCOLS: WellnessProtocol[] = [
  TESTOSTERONE_WOMEN_PROTOCOL,
  TESTOSTERONE_MEN_PROTOCOL,
  THYROID_OPTIMIZATION_PROTOCOL,
  DHEA_PROTOCOL,
];
