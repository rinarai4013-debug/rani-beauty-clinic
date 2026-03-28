// ─── GLP-1 Weight Loss Treatment Protocols ──────────────────────────────────
// Complete semaglutide and tirzepatide titration protocols for Rani Beauty Clinic
// CRITICAL: "injection" only — never "infusion"

import type { WellnessProtocol, DosingSchedule, LabRequirement, AftercareInstruction } from './types';

// ─── Shared Constants ────────────────────────────────────────────────────────

export const GLP1_INJECTION_SITES = [
  'Abdomen (2 inches from navel, rotating quadrants)',
  'Upper outer thigh (anterior-lateral surface)',
  'Upper outer arm (deltoid region, posterior surface)',
];

export const GLP1_SITE_ROTATION_GUIDE = {
  week1: 'Right abdomen (upper quadrant)',
  week2: 'Left abdomen (upper quadrant)',
  week3: 'Right thigh (anterior-lateral)',
  week4: 'Left thigh (anterior-lateral)',
  week5: 'Right abdomen (lower quadrant)',
  week6: 'Left abdomen (lower quadrant)',
  week7: 'Right arm (posterior deltoid)',
  week8: 'Left arm (posterior deltoid)',
  notes: [
    'Rotate injection sites weekly to prevent lipodystrophy',
    'Maintain at least 1 inch from previous injection site',
    'Avoid areas with bruising, scarring, or stretch marks',
    'Abdomen is the preferred site for optimal absorption',
    'Document injection site at each visit',
  ],
};

export const GLP1_PRE_TREATMENT_REQUIREMENTS = {
  initialLabs: [
    'Comprehensive metabolic panel (CMP)',
    'Lipid panel',
    'Hemoglobin A1c',
    'Fasting glucose',
    'Fasting insulin',
    'Thyroid panel (TSH, free T3, free T4)',
    'Complete blood count (CBC)',
    'Hepatic function panel (ALT, AST, alkaline phosphatase)',
    'Amylase and lipase (baseline pancreatic enzymes)',
    'Renal function (BUN, creatinine, eGFR)',
  ],
  gfeRequirements: [
    'Good faith exam completed by licensed provider within 30 days',
    'BMI assessment and documentation',
    'Medical history review including family history of thyroid cancer',
    'Current medication reconciliation',
    'Blood pressure and vital signs',
    'Physical examination of injection sites',
    'Assessment of eating habits and lifestyle factors',
    'Mental health screening for eating disorders',
    'Review of previous weight loss attempts',
  ],
  contraindications: [
    'Personal or family history of medullary thyroid carcinoma (MTC)',
    'Multiple endocrine neoplasia syndrome type 2 (MEN2)',
    'History of pancreatitis',
    'Severe gastrointestinal disease (gastroparesis, IBD)',
    'Type 1 diabetes',
    'Pregnancy or actively trying to conceive',
    'Breastfeeding',
    'Known hypersensitivity to semaglutide or tirzepatide',
    'Severe renal impairment (eGFR < 15)',
    'Active gallbladder disease',
    'History of suicidal ideation or severe depression (relative)',
    'Current use of other GLP-1 receptor agonists',
    'Active or recent (within 6 months) eating disorder',
  ],
};

export const GLP1_MONTHLY_MONITORING_CHECKLIST = [
  'Weight measurement and BMI calculation',
  'Blood pressure and heart rate',
  'Injection site inspection for reactions or lipodystrophy',
  'GI symptom assessment (nausea, vomiting, diarrhea, constipation)',
  'Appetite and satiety level evaluation',
  'Hydration status assessment',
  'Medication adherence review',
  'Side effect documentation',
  'Mental health check-in (mood, motivation, body image)',
  'Dietary compliance and nutritional adequacy review',
  'Exercise and activity level documentation',
  'Photo documentation (with consent)',
  'Dose adjustment consideration based on tolerance and progress',
];

export const GLP1_QUARTERLY_LAB_RECHECK = {
  labs: [
    'CMP with eGFR',
    'Lipid panel',
    'Hemoglobin A1c',
    'Fasting glucose',
    'Fasting insulin',
    'Hepatic function (ALT, AST)',
    'Amylase and lipase',
    'Thyroid panel (TSH)',
  ],
  additionalAtMonth6: [
    'Vitamin B12 level',
    'Vitamin D level',
    'Iron studies (ferritin, TIBC)',
    'Magnesium level',
  ],
  additionalAtMonth12: [
    'DEXA scan for body composition',
    'Comprehensive hormone panel',
    'Inflammatory markers (hs-CRP)',
  ],
};

// ─── Side Effect Management by Dose Level ────────────────────────────────────

export const GLP1_SIDE_EFFECT_MANAGEMENT = {
  nausea: {
    prevalence: '40-50% of patients, most common in first 4-8 weeks',
    byDoseLevel: {
      D1: 'Mild nausea in 20-30% of patients, usually self-limiting within 3-5 days',
      D2: 'Moderate nausea in 30-40%, may persist 5-7 days after escalation',
      D3: 'Nausea in 35-45%, consider dose hold if unable to maintain hydration',
      D4: 'Nausea in 40-50%, most severe at this level, assess tolerance carefully',
    },
    management: [
      'Eat smaller, more frequent meals (5-6 per day)',
      'Avoid high-fat, greasy, and fried foods',
      'Eat bland foods (crackers, toast, rice, bananas)',
      'Stay well hydrated with small, frequent sips',
      'Ginger tea or ginger supplements (250mg, 4x daily)',
      'Take injection in the evening to sleep through peak nausea',
      'Avoid lying flat after eating (stay upright 30 minutes)',
      'Consider ondansetron 4mg PRN for persistent nausea',
      'If vomiting > 24 hours, contact clinic immediately',
    ],
  },
  constipation: {
    prevalence: '20-30% of patients across all dose levels',
    byDoseLevel: {
      D1: 'Mild, typically responds to dietary fiber increase',
      D2: 'May worsen as GI motility slows further',
      D3: 'Moderate constipation, may need supplemental fiber or stool softener',
      D4: 'Most pronounced, proactive management recommended',
    },
    management: [
      'Increase daily water intake to 80-100 oz minimum',
      'Add fiber supplement (psyllium husk 5-10g daily)',
      'Increase dietary fiber (25-35g daily from whole foods)',
      'Daily probiotic supplement',
      'Regular physical activity (30 min walking minimum)',
      'Docusate sodium 100mg daily as needed',
      'Magnesium citrate 400mg at bedtime if fiber insufficient',
      'Avoid prolonged sitting or sedentary behavior',
      'Contact clinic if no bowel movement for 3+ days',
    ],
  },
  headache: {
    prevalence: '10-15% of patients, more common during titration',
    byDoseLevel: {
      D1: 'Occasional mild headache, typically first 1-2 weeks',
      D2: 'May recur with dose increase, usually transient',
      D3: 'Less common at this stage if well-hydrated',
      D4: 'Rare if patient has adapted; investigate if new onset',
    },
    management: [
      'Ensure adequate hydration (minimum 64 oz water daily)',
      'Monitor blood glucose if history of diabetes or insulin resistance',
      'Acetaminophen 500-1000mg as needed (avoid NSAIDs if GI symptoms)',
      'Maintain regular meal schedule to prevent hypoglycemia',
      'Adequate sleep (7-9 hours nightly)',
      'If severe or persistent (> 72 hours), contact clinic for evaluation',
    ],
  },
  fatigue: {
    prevalence: '15-25% of patients, often related to caloric deficit',
    byDoseLevel: {
      D1: 'Mild fatigue as body adjusts to reduced caloric intake',
      D2: 'May increase temporarily with dose escalation',
      D3: 'Important to ensure adequate protein and nutrient intake',
      D4: 'Assess for nutritional deficiency if fatigue is significant',
    },
    management: [
      'Ensure adequate protein intake (minimum 60-80g daily)',
      'Maintain a minimum caloric floor (women: 1,200 kcal, men: 1,500 kcal)',
      'B-complex vitamin supplementation',
      'Iron and B12 levels should be checked if fatigue is persistent',
      'Moderate exercise (not excessive during caloric deficit)',
      'Adequate sleep hygiene (consistent schedule, dark room, limit screens)',
      'Consider electrolyte supplementation if dietary intake is low',
      'Rule out thyroid dysfunction if fatigue is severe',
    ],
  },
  injectionSiteReactions: {
    prevalence: '5-10% of patients',
    management: [
      'Apply ice pack to site for 5-10 minutes post-injection',
      'Rotate injection sites consistently (see rotation guide)',
      'Ensure medication is at room temperature before injection',
      'Use proper injection technique (45-degree angle for subcutaneous)',
      'Do not massage the injection site',
      'Mild redness and swelling typically resolves in 24-48 hours',
      'Contact clinic if redness spreads, increases in size, or shows signs of infection',
    ],
  },
};

// ─── Dose Adjustment Decision Tree ───────────────────────────────────────────

export const GLP1_DOSE_ADJUSTMENT_TREE = {
  toleratingWell: {
    condition: 'Minimal side effects, tolerating current dose for full 4-week cycle',
    action: 'Advance to next titration level per protocol schedule',
    notes: 'Document tolerance and weight loss progress before escalation',
  },
  mildSideEffects: {
    condition: 'Mild nausea or GI symptoms that are manageable and improving',
    action: 'Continue current dose for an additional 2 weeks before reassessing',
    notes: 'Provide supportive care recommendations, document symptoms',
  },
  moderateSideEffects: {
    condition: 'Persistent nausea, vomiting, or diarrhea affecting daily activities',
    action: 'Hold current dose; consider stepping back to previous dose for 2-4 weeks',
    notes: 'Assess hydration status, electrolytes if needed, re-attempt escalation after symptom resolution',
  },
  severeSideEffects: {
    condition: 'Severe GI symptoms, dehydration, inability to eat or drink, or signs of pancreatitis',
    action: 'Hold medication immediately; clinical evaluation within 24 hours',
    notes: 'Check amylase/lipase if pancreatitis suspected. May need IV hydration. Resume at lower dose only after full resolution.',
  },
  plateauWithGoodTolerance: {
    condition: 'Weight loss stalls (< 1% body weight per month) with good tolerance',
    action: 'Advance to next dose level if not at maximum',
    notes: 'Review dietary adherence, activity level, and sleep before escalating',
  },
  plateauAtMaxDose: {
    condition: 'Weight loss stalls at maximum tolerated dose',
    action: 'Comprehensive reassessment: labs, diet, exercise, metabolic factors',
    notes: 'Consider adding adjunctive therapies, lifestyle coaching, or switching medication class',
  },
  significantWeightLoss: {
    condition: 'Losing > 1.5% body weight per week or > 5% per month',
    action: 'Hold at current dose; do not escalate. Ensure adequate nutrition.',
    notes: 'Rapid weight loss increases risk of muscle loss, gallstones, and nutritional deficiencies',
  },
  goalWeightReached: {
    condition: 'Patient has reached target weight or desired body composition',
    action: 'Begin maintenance protocol: hold current dose or taper per discontinuation protocol',
    notes: 'Transition to maintenance phase with focus on sustainable habits',
  },
};

// ─── Discontinuation Protocol ────────────────────────────────────────────────

export const GLP1_DISCONTINUATION_PROTOCOL = {
  indications: [
    'Patient has reached target weight and maintained for 3+ months',
    'Patient requests discontinuation',
    'Intolerable side effects despite dose adjustment',
    'Medical contraindication develops (pregnancy, pancreatitis)',
    'Non-compliance with monitoring requirements',
    'Financial inability to continue treatment',
  ],
  taperSchedule: {
    fromHighDose: [
      'Week 1-2: Reduce to 50% of current dose',
      'Week 3-4: Reduce to 25% of current dose',
      'Week 5-6: Discontinue and monitor',
    ],
    fromLowDose: [
      'Week 1-2: Continue current low dose',
      'Week 3-4: Discontinue and monitor',
    ],
    notes: 'Abrupt discontinuation is not medically dangerous but increases risk of rebound weight gain and appetite resurgence',
  },
  postDiscontinuationMonitoring: [
    'Weekly weight check for first month',
    'Biweekly weight check for months 2-3',
    'Monthly weight check for months 4-6',
    'Lab recheck at 3 months post-discontinuation',
    'Nutrition counseling referral for long-term dietary planning',
    'Exercise program establishment or continuation',
    'Mental health support for body image and relationship with food',
  ],
  reWeightGainProtocol: {
    threshold: '5% regain from lowest achieved weight',
    action: 'Schedule re-evaluation appointment to discuss resumption',
    timeline: 'Restart at previous tolerated dose (skip initial titration if within 3 months)',
  },
};

// ─── Emergency Protocols (GLP-1 Specific) ────────────────────────────────────

export const GLP1_EMERGENCY_PROTOCOLS = {
  suspectedPancreatitis: {
    symptoms: [
      'Severe, persistent abdominal pain (epigastric, radiating to back)',
      'Nausea and vomiting that does not resolve',
      'Abdominal tenderness or distension',
      'Fever',
    ],
    immediateAction: [
      'Stop GLP-1 medication immediately',
      'NPO (nothing by mouth)',
      'Check vital signs',
      'Stat amylase and lipase (if in-clinic capability)',
      'If amylase/lipase > 3x upper limit of normal: send to ER immediately',
      'Call 911 if patient shows signs of shock or severe dehydration',
    ],
    followUp: [
      'Do not resume GLP-1 medication until pancreatitis is fully resolved',
      'Gastroenterology referral for further evaluation',
      'GLP-1 therapy is permanently contraindicated after confirmed pancreatitis',
      'Document incident thoroughly in patient record',
    ],
  },
  gallbladderAttack: {
    symptoms: [
      'Sudden, intense pain in right upper abdomen',
      'Pain radiating to right shoulder or back',
      'Nausea and vomiting',
      'Pain worsening after meals (especially fatty foods)',
    ],
    immediateAction: [
      'Assess vital signs and pain level',
      'Hold GLP-1 medication',
      'Refer to ER for imaging (ultrasound) if symptoms are severe',
      'Advise low-fat diet in the interim',
    ],
    followUp: [
      'Surgical consultation for cholecystectomy if gallstones confirmed',
      'May resume GLP-1 after surgical recovery if no other contraindications',
      'Increase monitoring frequency after resumption',
    ],
  },
  severeHypoglycemia: {
    symptoms: [
      'Blood glucose < 54 mg/dL with symptoms',
      'Confusion, shakiness, sweating, rapid heartbeat',
      'Loss of consciousness (severe)',
    ],
    immediateAction: [
      'Check blood glucose immediately',
      'If conscious: 15-20g fast-acting carbohydrate (glucose tabs, juice)',
      'Recheck glucose in 15 minutes; repeat if still < 70 mg/dL',
      'If unconscious: call 911, position on side, do not give oral glucose',
      'Document blood glucose readings and time of last meal',
    ],
    followUp: [
      'Review concurrent diabetes medications (sulfonylureas, insulin)',
      'Consider dose reduction or medication adjustment',
      'Educate on signs and self-management of hypoglycemia',
      'Provide glucagon prescription if at continued risk',
    ],
  },
  severeDehydration: {
    symptoms: [
      'Persistent vomiting (> 24 hours)',
      'Inability to keep fluids down',
      'Dizziness, lightheadedness, or fainting',
      'Dark urine or significantly reduced urine output',
      'Dry mouth, cracked lips, sunken eyes',
    ],
    immediateAction: [
      'Assess vital signs (blood pressure, heart rate, orthostatics)',
      'Hold GLP-1 medication',
      'Attempt small, frequent sips of electrolyte solution',
      'If unable to tolerate oral fluids or hemodynamically unstable: send to ER for IV hydration',
    ],
    followUp: [
      'Check renal function and electrolytes',
      'Resume GLP-1 at lower dose after full recovery',
      'Reinforce hydration and anti-nausea strategies',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEMAGLUTIDE PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const SEMAGLUTIDE_DOSING_SCHEDULE: DosingSchedule[] = [
  {
    week: 1,
    dose: '0.25 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Initial titration dose. Focus on establishing injection routine and monitoring initial tolerance.',
  },
  {
    week: 2,
    dose: '0.25 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Continue initial dose. Assess GI tolerance and educate on dietary modifications.',
  },
  {
    week: 3,
    dose: '0.25 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Monitor for nausea, appetite changes. Reinforce hydration.',
  },
  {
    week: 4,
    dose: '0.25 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'End of D1 phase. Evaluate tolerance and weight trend before advancing.',
  },
  {
    week: 5,
    dose: '0.5 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'D2 escalation. Expect possible increase in GI side effects for 3-5 days.',
  },
  {
    week: 6,
    dose: '0.5 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Monitor tolerance. Weight loss typically accelerates at this dose.',
  },
  {
    week: 7,
    dose: '0.5 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Continue monitoring. Assess dietary compliance and activity level.',
  },
  {
    week: 8,
    dose: '0.5 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'End of D2 phase. Evaluate weight loss (target: 3-5% from baseline by now).',
  },
  {
    week: 9,
    dose: '1.0 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'D3 escalation. Therapeutic dose for many patients. GI symptoms may recur briefly.',
  },
  {
    week: 10,
    dose: '1.0 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Assess tolerance. Many patients achieve significant appetite suppression at this dose.',
  },
  {
    week: 11,
    dose: '1.0 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Continue at therapeutic dose. Monitor nutritional adequacy.',
  },
  {
    week: 12,
    dose: '1.0 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'End of D3 phase. Quarterly labs due. Evaluate if further escalation is needed.',
  },
  {
    week: 13,
    dose: '2.4 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'D4 maximum dose. Only escalate if weight loss has plateaued and tolerance is good.',
  },
  {
    week: 14,
    dose: '2.4 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Monitor closely for increased side effects at maximum dose.',
  },
  {
    week: 15,
    dose: '2.4 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Assess weight trajectory and side effect burden.',
  },
  {
    week: 16,
    dose: '2.4 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'End of initial 16-week protocol. Transition to maintenance or continue D4 as appropriate.',
  },
];

export const SEMAGLUTIDE_PROTOCOL: WellnessProtocol = {
  id: 'glp1-semaglutide',
  name: 'Semaglutide (GLP-1) Weight Loss Protocol',
  category: 'wellness',
  subcategory: 'glp1',
  description: 'Medical weight management program using semaglutide, a GLP-1 receptor agonist that reduces appetite and promotes satiety. Administered as a weekly subcutaneous injection with a structured 4-phase titration schedule to optimize tolerance and results. Physician-supervised with comprehensive lab monitoring.',
  clinicalIndication: 'BMI >= 30, or BMI >= 27 with at least one weight-related comorbidity (hypertension, type 2 diabetes, dyslipidemia, obstructive sleep apnea)',

  medication: 'Semaglutide (compounded or brand)',
  dosingSchedule: SEMAGLUTIDE_DOSING_SCHEDULE,
  route: 'Subcutaneous injection',
  injectionSites: GLP1_INJECTION_SITES,
  siteRotationProtocol: 'Rotate injection sites weekly following the 8-week rotation guide. Abdomen is the preferred site for optimal and consistent absorption. Document injection location at each visit.',

  labRequirements: [
    { testName: 'Comprehensive metabolic panel', frequency: 'Quarterly', timing: 'Baseline, week 12, then every 12 weeks', criticalValues: 'eGFR < 30, potassium > 5.5' },
    { testName: 'Lipid panel', frequency: 'Quarterly', timing: 'Baseline, week 12, then every 12 weeks' },
    { testName: 'Hemoglobin A1c', frequency: 'Quarterly', timing: 'Baseline, week 12, then every 12 weeks', criticalValues: 'A1c < 5.0 (risk of hypoglycemia)' },
    { testName: 'Fasting glucose and insulin', frequency: 'Quarterly', timing: 'Baseline, week 12, then every 12 weeks', criticalValues: 'Glucose < 54 mg/dL' },
    { testName: 'Thyroid panel (TSH, free T4)', frequency: 'Biannually', timing: 'Baseline, month 6, then every 6 months' },
    { testName: 'Amylase and lipase', frequency: 'Quarterly', timing: 'Baseline, week 12, then every 12 weeks', criticalValues: '> 3x upper limit of normal' },
    { testName: 'Hepatic function (ALT, AST)', frequency: 'Quarterly', timing: 'Baseline, week 12, then every 12 weeks', criticalValues: '> 3x upper limit of normal' },
    { testName: 'CBC', frequency: 'Biannually', timing: 'Baseline, month 6, then annually' },
    { testName: 'Vitamin B12', frequency: 'Biannually', timing: 'Month 6, then annually', criticalValues: '< 200 pg/mL' },
    { testName: 'Vitamin D, 25-hydroxy', frequency: 'Biannually', timing: 'Month 6, then annually', criticalValues: '< 20 ng/mL' },
  ],
  monitoringIntervals: 'Weekly for first 4 weeks, biweekly during titration (weeks 5-16), monthly during maintenance',
  vitalsRequired: ['Weight', 'BMI', 'Blood pressure', 'Heart rate', 'Waist circumference'],

  contraindications: GLP1_PRE_TREATMENT_REQUIREMENTS.contraindications,
  precautions: [
    'History of depression or suicidal ideation (monitor mood closely)',
    'Concurrent use of insulin or sulfonylureas (hypoglycemia risk)',
    'History of gallbladder disease (increased cholelithiasis risk)',
    'Moderate renal impairment (dose adjustment may be needed)',
    'Diabetic retinopathy (may worsen with rapid glucose improvement)',
    'Patients over 65 years (start with conservative dosing)',
    'History of eating disorders (requires psychological support)',
  ],
  potentialSideEffects: [
    'Nausea (40-50%, most common, usually improves over time)',
    'Diarrhea (20-30%)',
    'Constipation (20-30%)',
    'Vomiting (15-25%)',
    'Abdominal pain (10-20%)',
    'Headache (10-15%)',
    'Fatigue (15-25%)',
    'Injection site reaction (5-10%)',
    'Dizziness (5-10%)',
    'Dyspepsia (5-10%)',
    'Hair thinning (rare, related to rapid weight loss and nutritional deficiency)',
  ],
  blackBoxWarnings: [
    'Thyroid C-cell tumors: In rodent studies, semaglutide caused thyroid C-cell tumors. It is unknown whether semaglutide causes thyroid C-cell tumors in humans. Contraindicated in patients with a personal or family history of medullary thyroid carcinoma (MTC) or in patients with Multiple Endocrine Neoplasia syndrome type 2 (MEN 2).',
  ],
  drugInteractions: [
    'Insulin and sulfonylureas: increased risk of hypoglycemia (reduce doses)',
    'Oral contraceptives: may reduce absorption (use alternative or backup method during first 4 weeks of each dose escalation)',
    'Warfarin: may alter INR (monitor closely)',
    'Thyroid medications: absorption may be delayed (take levothyroxine 1 hour before GLP-1 injection)',
    'Other GLP-1 agonists: do not combine',
    'Orlistat: may worsen GI side effects',
  ],
  riskLevel: 'moderate',

  onsetTime: 'Appetite reduction typically within 1-2 weeks; measurable weight loss by week 4-6',
  expectedTimeline: '16-week titration protocol, then ongoing maintenance. Most patients lose 10-15% of body weight over 12-18 months.',
  expectedResults: [
    '5-7% body weight loss by month 3',
    '10-15% body weight loss by month 6-12',
    '15-20% body weight loss by month 12-18 (at maximum dose)',
    'Improved A1c and fasting glucose',
    'Improved lipid profile (lower triglycerides, improved HDL)',
    'Reduced blood pressure',
    'Improved waist circumference',
    'Enhanced satiety and reduced food cravings',
    'Improved energy levels and mobility',
  ],
  maintenanceProtocol: 'After reaching target weight, maintain current dose for 3 months. Then consider gradual taper per discontinuation protocol or long-term maintenance at lowest effective dose. Lifestyle modifications (diet, exercise, behavioral) must be established before any dose reduction.',

  aftercare: [
    { timeframe: 'Immediately post-injection', instruction: 'Apply gentle pressure to injection site for 10 seconds. Do not rub or massage the area.', priority: 'important' },
    { timeframe: 'First 24 hours', instruction: 'Eat light, small meals. Stay well hydrated (minimum 64 oz water). Avoid high-fat and heavy meals.', priority: 'critical' },
    { timeframe: 'First 48 hours', instruction: 'Nausea may peak 24-48 hours after injection. Use ginger tea or prescribed anti-nausea medication if needed.', priority: 'important' },
    { timeframe: 'Ongoing weekly', instruction: 'Maintain consistent injection day and time each week. Store medication per pharmacy instructions (refrigerated until first use, then room temperature up to 28 days for pens).', priority: 'critical' },
    { timeframe: 'Ongoing daily', instruction: 'Minimum 60-80g protein daily, 64+ oz water, 25-35g fiber. Take recommended supplements (multivitamin, B12, vitamin D).', priority: 'important' },
    { timeframe: 'Monthly', instruction: 'Attend monthly check-in appointment for vitals, weight, and progress assessment.', priority: 'critical' },
    { timeframe: 'Quarterly', instruction: 'Complete quarterly lab work at least 3 days before scheduled appointment.', priority: 'critical' },
  ],
  dietaryGuidelines: [
    'Protein-first eating: start each meal with lean protein (chicken, fish, eggs, tofu)',
    'Minimum 60-80g protein daily to preserve lean muscle mass',
    'Eat slowly and stop at first sign of fullness (typically 20 minutes)',
    'Avoid carbonated beverages (can worsen bloating)',
    'Limit alcohol (increased nausea risk, empty calories, impaired judgment around food)',
    'Minimize processed foods, refined sugars, and simple carbohydrates',
    'Prioritize vegetables, whole grains, and healthy fats',
    'Meal prep and plan ahead to avoid poor food choices when appetite is suppressed',
    'Do not skip meals, even if appetite is low (risk of muscle loss and nutrient deficiency)',
    'Consider working with a registered dietitian for personalized guidance',
  ],
  lifestyleRecommendations: [
    'Aim for 150 minutes of moderate aerobic activity per week (walking, cycling, swimming)',
    'Include resistance training 2-3x per week to preserve muscle mass during weight loss',
    'Prioritize sleep: 7-9 hours nightly (poor sleep impairs weight loss and increases cravings)',
    'Stress management: meditation, deep breathing, or yoga (cortisol promotes visceral fat storage)',
    'Daily step goal: 8,000-10,000 steps',
    'Stay connected: join weight loss support community or accountability partner',
    'Track food intake with an app during active weight loss phase',
    'Limit screen time and sedentary behavior outside of work hours',
  ],

  consentRequirements: {
    formId: 'consent-glp1-semaglutide',
    formName: 'Semaglutide (GLP-1) Treatment Consent',
    expiresInDays: 365,
    requiresWitness: true,
    requiresPhotoConsent: true,
  },
  cptCodes: [
    { code: '96372', description: 'Therapeutic injection, subcutaneous or intramuscular' },
    { code: '99213', description: 'Office visit, established patient, low complexity' },
    { code: '99214', description: 'Office visit, established patient, moderate complexity (dose adjustment visits)' },
    { code: 'J3490', description: 'Unclassified drugs (compounded semaglutide)' },
  ],
  prescriptionRequired: true,
  deaSchedule: 'Not a controlled substance',
  documentationRequirements: [
    'GFE completion with provider signature',
    'Informed consent signed and witnessed',
    'Baseline labs reviewed and documented',
    'BMI calculation and weight at each visit',
    'Injection site documentation (location, volume, lot number)',
    'Side effect assessment at each visit',
    'Dose adjustment rationale documented',
    'Patient education provided and acknowledged',
    'Photo consent and progress photos (if consented)',
    'Monthly monitoring checklist completed',
  ],

  pricing: { min: 399, max: 599, unit: 'per month' },
  sessionDuration: 30,

  tags: ['glp-1', 'semaglutide', 'weight-loss', 'injection', 'medical-weight-management', 'titration'],
  relatedProtocols: ['glp1-tirzepatide', 'vip-transform-package', 'wellness-b12', 'wellness-lipomino'],
  lastUpdated: '2026-03-26',
};

// ═══════════════════════════════════════════════════════════════════════════════
// TIRZEPATIDE PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const TIRZEPATIDE_DOSING_SCHEDULE: DosingSchedule[] = [
  {
    week: 1,
    dose: '2.5 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Initial titration dose. Tirzepatide (dual GIP/GLP-1 agonist) may cause more GI effects than semaglutide initially.',
  },
  {
    week: 2,
    dose: '2.5 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Monitor GI tolerance closely. Dual mechanism may produce earlier appetite suppression.',
  },
  {
    week: 3,
    dose: '2.5 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Continue at initial dose. Reinforce dietary and hydration guidelines.',
  },
  {
    week: 4,
    dose: '2.5 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'End of D1 phase. Evaluate tolerance and initial weight response before escalating.',
  },
  {
    week: 5,
    dose: '5 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'D2 escalation. This is often the first therapeutic dose. Expect increased appetite suppression.',
  },
  {
    week: 6,
    dose: '5 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Many patients experience significant appetite reduction at this dose level.',
  },
  {
    week: 7,
    dose: '5 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Assess weight trend. Some patients achieve adequate results at 5 mg.',
  },
  {
    week: 8,
    dose: '5 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'End of D2 phase. Evaluate: if losing > 1% body weight per week, may hold at 5 mg.',
  },
  {
    week: 9,
    dose: '7.5 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'D3 escalation. Only advance if weight loss has slowed and tolerance is good.',
  },
  {
    week: 10,
    dose: '7.5 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Monitor for increased GI effects with dose escalation.',
  },
  {
    week: 11,
    dose: '7.5 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Assess nutritional adequacy. Ensure protein intake is meeting targets.',
  },
  {
    week: 12,
    dose: '7.5 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'End of D3 phase. Quarterly labs due. Comprehensive progress assessment.',
  },
  {
    week: 13,
    dose: '10 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'D4 initial dose. Advance to 10 mg first; 15 mg only if plateau persists after 4+ weeks at 10 mg.',
  },
  {
    week: 14,
    dose: '10 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'Most patients reach optimal results between 10-15 mg.',
  },
  {
    week: 15,
    dose: '10 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'If tolerating well and weight loss continues, may maintain at 10 mg.',
  },
  {
    week: 16,
    dose: '10-15 mg',
    frequency: 'Once weekly',
    route: 'Subcutaneous injection',
    notes: 'End of initial protocol. Advance to 15 mg only if clinically indicated. Transition to maintenance.',
  },
];

export const TIRZEPATIDE_PROTOCOL: WellnessProtocol = {
  id: 'glp1-tirzepatide',
  name: 'Tirzepatide (GIP/GLP-1) Weight Loss Protocol',
  category: 'wellness',
  subcategory: 'glp1',
  description: 'Medical weight management program using tirzepatide, a dual glucose-dependent insulinotropic polypeptide (GIP) and GLP-1 receptor agonist. The dual mechanism targets two incretin pathways for enhanced appetite control and metabolic improvement. Administered as a weekly subcutaneous injection with physician supervision and comprehensive monitoring.',
  clinicalIndication: 'BMI >= 30, or BMI >= 27 with at least one weight-related comorbidity. Tirzepatide may be preferred for patients with significant insulin resistance or those who have plateaued on semaglutide.',

  medication: 'Tirzepatide (compounded or brand)',
  dosingSchedule: TIRZEPATIDE_DOSING_SCHEDULE,
  route: 'Subcutaneous injection',
  injectionSites: GLP1_INJECTION_SITES,
  siteRotationProtocol: 'Follow the same 8-week rotation guide as semaglutide. Abdomen remains the preferred site. Tirzepatide injection volume may be slightly larger at higher doses, so rotation is especially important.',

  labRequirements: [
    { testName: 'Comprehensive metabolic panel', frequency: 'Quarterly', timing: 'Baseline, week 12, then every 12 weeks', criticalValues: 'eGFR < 30, potassium > 5.5' },
    { testName: 'Lipid panel', frequency: 'Quarterly', timing: 'Baseline, week 12, then every 12 weeks' },
    { testName: 'Hemoglobin A1c', frequency: 'Quarterly', timing: 'Baseline, week 12, then every 12 weeks', criticalValues: 'A1c < 5.0' },
    { testName: 'Fasting glucose and insulin', frequency: 'Quarterly', timing: 'Baseline, week 12, then every 12 weeks', criticalValues: 'Glucose < 54 mg/dL' },
    { testName: 'Thyroid panel (TSH, free T4)', frequency: 'Biannually', timing: 'Baseline, month 6, then every 6 months' },
    { testName: 'Amylase and lipase', frequency: 'Quarterly', timing: 'Baseline, week 12, then every 12 weeks', criticalValues: '> 3x upper limit of normal' },
    { testName: 'Hepatic function (ALT, AST)', frequency: 'Quarterly', timing: 'Baseline, week 12, then every 12 weeks', criticalValues: '> 3x upper limit of normal' },
    { testName: 'CBC', frequency: 'Biannually', timing: 'Baseline, month 6, then annually' },
    { testName: 'Vitamin B12', frequency: 'Biannually', timing: 'Month 6, then annually', criticalValues: '< 200 pg/mL' },
    { testName: 'Vitamin D, 25-hydroxy', frequency: 'Biannually', timing: 'Month 6, then annually', criticalValues: '< 20 ng/mL' },
  ],
  monitoringIntervals: 'Weekly for first 4 weeks, biweekly during titration (weeks 5-16), monthly during maintenance',
  vitalsRequired: ['Weight', 'BMI', 'Blood pressure', 'Heart rate', 'Waist circumference'],

  contraindications: [
    ...GLP1_PRE_TREATMENT_REQUIREMENTS.contraindications,
    'Known hypersensitivity to tirzepatide or any excipients',
  ],
  precautions: [
    'History of depression or suicidal ideation (monitor closely)',
    'Concurrent use of insulin or sulfonylureas (higher hypoglycemia risk with dual mechanism)',
    'History of gallbladder disease',
    'Moderate renal impairment',
    'Diabetic retinopathy',
    'Patients over 65 years',
    'Switching from semaglutide (do not overlap; allow washout period of 1 week)',
    'History of eating disorders',
  ],
  potentialSideEffects: [
    'Nausea (45-55%, slightly higher than semaglutide due to dual mechanism)',
    'Diarrhea (25-35%)',
    'Constipation (15-25%)',
    'Decreased appetite (this is a desired effect at appropriate levels)',
    'Vomiting (15-25%)',
    'Abdominal pain (10-20%)',
    'Dyspepsia (10-15%)',
    'Injection site reactions (5-10%)',
    'Fatigue (15-20%)',
    'Hypersensitivity reactions (rare)',
    'Hair thinning (rare, related to rapid weight loss)',
    'GERD / acid reflux (10-15%)',
  ],
  blackBoxWarnings: [
    'Thyroid C-cell tumors: Tirzepatide causes thyroid C-cell tumors in rats at clinically relevant exposures. It is unknown whether tirzepatide causes thyroid C-cell tumors in humans. Contraindicated in patients with personal or family history of MTC or MEN 2.',
  ],
  drugInteractions: [
    'Insulin and sulfonylureas: significantly increased hypoglycemia risk with dual GIP/GLP-1 mechanism',
    'Oral contraceptives: may reduce absorption (recommend backup contraception during titration)',
    'Oral medications with narrow therapeutic index: delayed gastric emptying may alter absorption',
    'Warfarin: monitor INR more frequently',
    'Thyroid medications: take levothyroxine at least 1 hour before tirzepatide',
    'Other GLP-1 or GIP agonists: do not combine',
  ],
  riskLevel: 'moderate',

  onsetTime: 'Appetite reduction typically within 1-2 weeks; measurable weight loss by week 3-5 (may be faster than semaglutide)',
  expectedTimeline: '16-week titration protocol, then ongoing maintenance. Clinical trials show 15-22% body weight loss over 72 weeks.',
  expectedResults: [
    '5-10% body weight loss by month 3 (often faster than semaglutide)',
    '12-18% body weight loss by month 6-9',
    '15-22% body weight loss by month 12-18 (at optimal dose)',
    'Superior A1c reduction compared to single-mechanism GLP-1 agents',
    'Significant improvement in insulin sensitivity',
    'Improved lipid profile (triglycerides, HDL, LDL)',
    'Reduced blood pressure',
    'Improved waist-to-hip ratio',
    'Enhanced satiety and reduced food noise',
    'Improved energy and mobility',
  ],
  maintenanceProtocol: 'After reaching target weight, maintain at current dose for minimum 3 months. Long-term maintenance at lowest effective dose is recommended. Tirzepatide shows potentially better weight maintenance due to dual mechanism. Follow the same discontinuation protocol as semaglutide.',

  aftercare: [
    { timeframe: 'Immediately post-injection', instruction: 'Apply gentle pressure for 10 seconds. Do not rub. Slight burning at injection site is normal and resolves within minutes.', priority: 'important' },
    { timeframe: 'First 24 hours', instruction: 'Eat light meals, prioritize protein, stay hydrated. GI effects may be more pronounced with tirzepatide due to dual mechanism.', priority: 'critical' },
    { timeframe: 'First 48 hours', instruction: 'Monitor for nausea and early satiety. Eat smaller portions and chew thoroughly.', priority: 'important' },
    { timeframe: 'Ongoing weekly', instruction: 'Inject on the same day each week at a consistent time. Store per pharmacy instructions.', priority: 'critical' },
    { timeframe: 'Ongoing daily', instruction: 'Protein-first eating (60-80g minimum), 64+ oz water, daily multivitamin with B12 and D.', priority: 'important' },
    { timeframe: 'Monthly', instruction: 'Attend monthly monitoring appointment. Bring food diary and activity log.', priority: 'critical' },
    { timeframe: 'Quarterly', instruction: 'Complete quarterly labs 3-5 days before appointment.', priority: 'critical' },
  ],
  dietaryGuidelines: [
    'Protein-first approach at every meal (lean meats, fish, eggs, Greek yogurt)',
    'Minimum 60-80g protein daily (may need 80-100g at higher doses to preserve muscle)',
    'Eat slowly over 20-30 minutes and stop at first sign of fullness',
    'Avoid carbonated beverages and high-sodium foods (bloating risk)',
    'Limit alcohol (compounded GI effects, impaired judgment, empty calories)',
    'Focus on nutrient-dense, whole foods',
    'Small, frequent meals (5-6 per day) may be better tolerated than 3 large meals',
    'Avoid lying down for 30 minutes after eating',
    'Stay ahead of hydration (dehydration is a common and preventable issue)',
    'Consider electrolyte supplementation if fluid intake is high',
  ],
  lifestyleRecommendations: [
    '150+ minutes moderate aerobic activity weekly',
    'Resistance training 2-3x weekly (critical for muscle preservation)',
    '7-9 hours quality sleep nightly',
    'Stress management practices (cortisol promotes fat storage)',
    'Daily step goal: 8,000-10,000',
    'Body composition tracking (not just scale weight)',
    'Support system or accountability partner',
    'Food and activity journaling',
  ],

  consentRequirements: {
    formId: 'consent-glp1-tirzepatide',
    formName: 'Tirzepatide (GIP/GLP-1) Treatment Consent',
    expiresInDays: 365,
    requiresWitness: true,
    requiresPhotoConsent: true,
  },
  cptCodes: [
    { code: '96372', description: 'Therapeutic injection, subcutaneous or intramuscular' },
    { code: '99213', description: 'Office visit, established patient, low complexity' },
    { code: '99214', description: 'Office visit, established patient, moderate complexity' },
    { code: 'J3490', description: 'Unclassified drugs (compounded tirzepatide)' },
  ],
  prescriptionRequired: true,
  deaSchedule: 'Not a controlled substance',
  documentationRequirements: [
    'GFE completion with provider signature',
    'Informed consent signed and witnessed',
    'Baseline labs reviewed and documented',
    'BMI and weight at every visit',
    'Injection site, volume, and lot number documented',
    'Side effect assessment documented',
    'Dose adjustment rationale documented',
    'Patient education acknowledgment',
    'Progress photos (with consent)',
    'Monthly monitoring checklist completed',
    'Quarterly lab review documented',
  ],

  pricing: { min: 499, max: 699, unit: 'per month' },
  sessionDuration: 30,

  tags: ['glp-1', 'gip', 'tirzepatide', 'weight-loss', 'injection', 'dual-agonist', 'medical-weight-management'],
  relatedProtocols: ['glp1-semaglutide', 'vip-transform-package', 'wellness-b12', 'wellness-lipomino'],
  lastUpdated: '2026-03-26',
};

// ═══════════════════════════════════════════════════════════════════════════════
// VIP TRANSFORM PACKAGE PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const VIP_TRANSFORM_PACKAGE: WellnessProtocol = {
  id: 'vip-transform-package',
  name: 'VIP Transform Package (GLP-1 + Wellness)',
  category: 'wellness',
  subcategory: 'glp1',
  description: 'Our premier medical weight management experience combining GLP-1 therapy with comprehensive wellness support. This all-inclusive 6-month program includes weekly GLP-1 injections, monthly wellness injections (B12 + Lipo-Mino), quarterly body composition analysis, priority scheduling, and direct provider messaging. Designed for patients who want the highest level of support and the best possible results.',
  clinicalIndication: 'BMI >= 27 with desire for comprehensive, concierge-level weight management. Ideal for motivated patients seeking accelerated results with full clinical support.',

  medication: 'Semaglutide or Tirzepatide (provider-selected based on patient profile) + B12 + Lipo-Mino',
  dosingSchedule: [
    { week: 1, dose: 'GLP-1 per selected protocol + B12 1000mcg + Lipo-Mino', frequency: 'GLP-1 weekly; wellness injections monthly', route: 'Subcutaneous (GLP-1) + Intramuscular (wellness)', notes: 'Initial consultation includes full labs, body composition scan, dietary assessment, and goal setting.' },
    { week: 4, dose: 'GLP-1 dose escalation per protocol + monthly wellness injection', frequency: 'Weekly GLP-1, monthly wellness', route: 'Subcutaneous + Intramuscular', notes: 'First monthly check-in with body composition comparison.' },
    { week: 8, dose: 'GLP-1 dose escalation per protocol + monthly wellness injection', frequency: 'Weekly GLP-1, monthly wellness', route: 'Subcutaneous + Intramuscular', notes: 'Mid-program assessment. Dietary and exercise plan adjustment.' },
    { week: 12, dose: 'GLP-1 therapeutic dose + monthly wellness injection + quarterly labs', frequency: 'Weekly GLP-1, monthly wellness', route: 'Subcutaneous + Intramuscular', notes: 'Quarterly labs and comprehensive progress review. Body composition scan #2.' },
    { week: 16, dose: 'GLP-1 maintenance or continued titration + monthly wellness injection', frequency: 'Weekly GLP-1, monthly wellness', route: 'Subcutaneous + Intramuscular', notes: 'Assess for dose optimization or maintenance transition.' },
    { week: 24, dose: 'GLP-1 maintenance + final wellness injection + labs', frequency: 'Weekly GLP-1, monthly wellness', route: 'Subcutaneous + Intramuscular', notes: 'Program completion. Final body composition scan. Maintenance plan established.' },
  ],
  route: 'Subcutaneous (GLP-1) + Intramuscular (wellness injections)',
  injectionSites: [...GLP1_INJECTION_SITES, 'Deltoid muscle (wellness injections)', 'Gluteus medius (Lipo-Mino)'],
  siteRotationProtocol: 'GLP-1 follows standard rotation guide. Wellness injections alternate between deltoid and gluteus.',

  labRequirements: [
    { testName: 'Comprehensive metabolic panel', frequency: 'Quarterly', timing: 'Baseline, month 3, month 6' },
    { testName: 'Lipid panel', frequency: 'Quarterly', timing: 'Baseline, month 3, month 6' },
    { testName: 'Hemoglobin A1c', frequency: 'Quarterly', timing: 'Baseline, month 3, month 6' },
    { testName: 'Full thyroid panel', frequency: 'Biannually', timing: 'Baseline, month 6' },
    { testName: 'Amylase and lipase', frequency: 'Quarterly', timing: 'Baseline, month 3, month 6' },
    { testName: 'CBC with differential', frequency: 'Biannually', timing: 'Baseline, month 6' },
    { testName: 'Vitamin B12, folate, D, iron studies', frequency: 'Biannually', timing: 'Baseline, month 6' },
    { testName: 'Body composition analysis (DEXA or InBody)', frequency: 'Quarterly', timing: 'Baseline, month 3, month 6' },
    { testName: 'Hormone panel (testosterone, DHEA-S, cortisol)', frequency: 'Once', timing: 'Baseline' },
    { testName: 'Inflammatory markers (hs-CRP, ESR)', frequency: 'Biannually', timing: 'Baseline, month 6' },
  ],
  monitoringIntervals: 'Weekly for first 4 weeks, biweekly weeks 5-12, monthly weeks 13-24. Priority messaging access throughout.',
  vitalsRequired: ['Weight', 'BMI', 'Blood pressure', 'Heart rate', 'Waist circumference', 'Hip circumference', 'Body fat percentage'],

  contraindications: GLP1_PRE_TREATMENT_REQUIREMENTS.contraindications,
  precautions: [
    'All semaglutide/tirzepatide precautions apply',
    'B12 allergy (rare; assess prior to first wellness injection)',
    'Cobalt allergy (relevant to B12)',
    'Liver disease (affects Lipo-Mino metabolism)',
  ],
  potentialSideEffects: [
    'All GLP-1 side effects per selected medication protocol',
    'Mild soreness at IM injection site (wellness injections)',
    'Temporary flushing after B12 injection (rare)',
    'Increased energy after B12/Lipo-Mino (desired effect, may affect sleep if given late in day)',
  ],
  blackBoxWarnings: [
    'Thyroid C-cell tumor risk per GLP-1 class labeling (see semaglutide or tirzepatide protocol)',
  ],
  drugInteractions: [
    'All drug interactions per selected GLP-1 medication',
    'Chloramphenicol may reduce B12 response',
    'Methotrexate, aminosalicylic acid may reduce B12 absorption',
  ],
  riskLevel: 'moderate',

  onsetTime: 'Appetite reduction within 1-2 weeks. Energy boost from B12/Lipo-Mino within 24-48 hours of first wellness injection.',
  expectedTimeline: '6-month comprehensive program with measurable results at each monthly milestone.',
  expectedResults: [
    '3-5% body weight loss by month 1',
    '8-12% body weight loss by month 3',
    '15-22% body weight loss by month 6',
    'Improved body composition (reduced fat mass, preserved lean mass)',
    'Enhanced energy levels from B12 and Lipo-Mino support',
    'Improved metabolic markers across the board',
    'Sustainable dietary and exercise habits established',
    'Confidence and quality-of-life improvement',
  ],
  maintenanceProtocol: 'Upon program completion, transition to monthly maintenance plan: GLP-1 at lowest effective dose + quarterly wellness injection + biannual labs. VIP patients receive ongoing priority scheduling and provider messaging.',

  aftercare: [
    { timeframe: 'Program enrollment', instruction: 'Complete all baseline labs, body composition scan, and dietary assessment before first injection.', priority: 'critical' },
    { timeframe: 'Weekly', instruction: 'Administer GLP-1 injection on scheduled day. Submit weekly check-in via patient portal.', priority: 'critical' },
    { timeframe: 'Monthly', instruction: 'Attend in-person appointment for wellness injection, vitals, and progress review.', priority: 'critical' },
    { timeframe: 'Quarterly', instruction: 'Complete lab work and body composition scan. Provider reviews results and adjusts plan.', priority: 'critical' },
    { timeframe: 'Ongoing', instruction: 'Use priority messaging for questions or concerns. Attend any recommended nutritional counseling sessions.', priority: 'important' },
    { timeframe: 'Program completion', instruction: 'Final assessment at month 6. Transition to maintenance plan with continued monitoring.', priority: 'critical' },
  ],
  dietaryGuidelines: [
    'Customized meal plan provided by clinic nutritional advisor',
    'Protein targets: 0.8-1.0g per pound of ideal body weight',
    'Meal prep guidance and grocery list templates provided',
    'Monthly dietary check-in and plan adjustment',
    'All standard GLP-1 dietary guidelines apply',
  ],
  lifestyleRecommendations: [
    'Personalized exercise prescription based on fitness level and goals',
    'Access to Rani clinic workout templates and video guides',
    'Monthly activity goal progression',
    'Sleep optimization protocol',
    'Stress management tools and check-ins',
    'Community support through VIP group',
  ],

  consentRequirements: {
    formId: 'consent-vip-transform',
    formName: 'VIP Transform Package Treatment Consent',
    expiresInDays: 365,
    requiresWitness: true,
    requiresPhotoConsent: true,
  },
  cptCodes: [
    { code: '96372', description: 'Therapeutic injection, subcutaneous or intramuscular' },
    { code: '99214', description: 'Office visit, established patient, moderate complexity' },
    { code: '99215', description: 'Office visit, established patient, high complexity (initial consult)' },
    { code: 'J3490', description: 'Unclassified drugs (compounded GLP-1)' },
    { code: 'J3420', description: 'Vitamin B12 injection' },
  ],
  prescriptionRequired: true,
  deaSchedule: 'Not a controlled substance',
  documentationRequirements: [
    'Comprehensive initial consultation note',
    'All GLP-1 documentation requirements per selected protocol',
    'Body composition scan results at baseline, month 3, month 6',
    'Monthly progress note with measurements and photos',
    'Dietary and exercise plan documentation',
    'Wellness injection documentation (product, lot, site, volume)',
    'Program milestone documentation',
    'Final outcome summary at program completion',
  ],

  pricing: { min: 2499, max: 3499, unit: 'per 6-month program' },
  sessionDuration: 45,

  tags: ['vip', 'glp-1', 'transform', 'weight-loss', 'comprehensive', 'package', 'b12', 'lipo-mino', 'injection'],
  relatedProtocols: ['glp1-semaglutide', 'glp1-tirzepatide', 'wellness-b12', 'wellness-lipomino', 'peptide-nad'],
  lastUpdated: '2026-03-26',
};

// ─── Export All GLP-1 Protocols ──────────────────────────────────────────────

export const GLP1_PROTOCOLS: WellnessProtocol[] = [
  SEMAGLUTIDE_PROTOCOL,
  TIRZEPATIDE_PROTOCOL,
  VIP_TRANSFORM_PACKAGE,
];
