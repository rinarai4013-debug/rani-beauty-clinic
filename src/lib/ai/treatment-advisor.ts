/**
 * AI Treatment Advisor
 *
 * Takes client profile (age, skin type, concerns, budget, pain tolerance,
 * downtime availability, medical history) and returns a personalized
 * treatment plan with:
 * - Primary recommended treatment with reasoning
 * - Alternative options ranked by fit
 * - Combination protocols
 * - Expected results timeline with milestones
 * - Maintenance schedule
 * - Estimated total cost with payment options
 * - Contraindication checking against medical history
 * - Before/after expectation setting (realistic, not oversold)
 *
 * CRITICAL: Rani does IM INJECTIONS only. Never say "infusion."
 */

import type {
  ClientProfile,
  SkinConcern,
  BudgetTier,
  TreatmentPlan,
  TreatmentRecommendation,
  CombinationProtocol,
  TreatmentTimeline,
  TimelineMilestone,
  MaintenanceSchedule,
  CostEstimate,
  PaymentOption,
  Contraindication,
  ResultExpectations,
  TreatmentCategory,
  CompatibilityEntry,
  SeasonalRecommendation,
  MedicalHistory,
} from '@/types/ai-treatment';
import { getAllProtocols, checkContraindications } from './treatment-protocols';

// ── CONCERN → TREATMENT MAPPING ──

interface TreatmentMapping {
  treatments: Array<{
    id: string;
    name: string;
    category: TreatmentCategory;
    fitScoreBase: number;
    price: number;
    sessions: number;
    sessionInterval: string;
    downtime: string;
    painLevel: 'low' | 'moderate' | 'high';
    resultsTimeline: string;
  }>;
}

const CONCERN_MAP: Record<SkinConcern, TreatmentMapping> = {
  wrinkles: {
    treatments: [
      { id: 'botox-forehead', name: 'Botox — Forehead', category: 'injectable_neurotoxin', fitScoreBase: 92, price: 350, sessions: 1, sessionInterval: 'Every 3-4 months', downtime: 'None', painLevel: 'low', resultsTimeline: '3-5 days onset, peak at 2 weeks' },
      { id: 'botox-glabella', name: 'Botox — Glabella (11s)', category: 'injectable_neurotoxin', fitScoreBase: 90, price: 350, sessions: 1, sessionInterval: 'Every 3-4 months', downtime: 'None', painLevel: 'low', resultsTimeline: '3-5 days onset, peak at 2 weeks' },
      { id: 'botox-crows-feet', name: 'Botox — Crow\'s Feet', category: 'injectable_neurotoxin', fitScoreBase: 88, price: 300, sessions: 1, sessionInterval: 'Every 3-4 months', downtime: 'None', painLevel: 'low', resultsTimeline: '3-5 days onset, peak at 2 weeks' },
      { id: 'rfmn-face', name: 'RF Microneedling — Face', category: 'rf_microneedling', fitScoreBase: 85, price: 595, sessions: 3, sessionInterval: 'Every 4-6 weeks', downtime: '2-3 days redness', painLevel: 'moderate', resultsTimeline: '3-6 months for collagen remodeling' },
      { id: 'sofwave-full-face', name: 'Sofwave — Full Face', category: 'skin_tightening', fitScoreBase: 80, price: 3500, sessions: 1, sessionInterval: 'Annual', downtime: 'None', painLevel: 'moderate', resultsTimeline: '3-6 months progressive improvement' },
    ],
  },
  volume_loss: {
    treatments: [
      { id: 'filler-cheeks', name: 'Dermal Filler — Cheeks', category: 'injectable_filler', fitScoreBase: 94, price: 750, sessions: 1, sessionInterval: 'Every 12-18 months', downtime: '1-2 days swelling', painLevel: 'moderate', resultsTimeline: 'Immediate, settles in 2-4 weeks' },
      { id: 'filler-temples', name: 'Dermal Filler — Temples', category: 'injectable_filler', fitScoreBase: 82, price: 750, sessions: 1, sessionInterval: 'Every 18-24 months', downtime: '1-2 days swelling', painLevel: 'moderate', resultsTimeline: 'Immediate, settles in 2-4 weeks' },
      { id: 'sofwave-full-face', name: 'Sofwave — Full Face', category: 'skin_tightening', fitScoreBase: 70, price: 3500, sessions: 1, sessionInterval: 'Annual', downtime: 'None', painLevel: 'moderate', resultsTimeline: '3-6 months progressive' },
    ],
  },
  acne: {
    treatments: [
      { id: 'hydrafacial-signature', name: 'HydraFacial — Signature', category: 'facial', fitScoreBase: 88, price: 275, sessions: 1, sessionInterval: 'Monthly', downtime: 'None', painLevel: 'low', resultsTimeline: 'Immediate glow, cumulative with series' },
      { id: 'peel-vi', name: 'VI Peel', category: 'chemical_peel', fitScoreBase: 86, price: 395, sessions: 1, sessionInterval: 'Every 4-6 weeks', downtime: '5-7 days peeling', painLevel: 'low', resultsTimeline: '7-10 days, peak at 4-6 weeks' },
      { id: 'peel-biore', name: 'BioRePeel', category: 'chemical_peel', fitScoreBase: 80, price: 250, sessions: 4, sessionInterval: 'Every 2-4 weeks', downtime: 'None', painLevel: 'low', resultsTimeline: 'Immediate glow' },
      { id: 'peel-superficial', name: 'Chemical Peel — Superficial', category: 'chemical_peel', fitScoreBase: 75, price: 150, sessions: 4, sessionInterval: 'Monthly', downtime: 'None', painLevel: 'low', resultsTimeline: '3-5 days per session' },
    ],
  },
  scarring: {
    treatments: [
      { id: 'rfmn-acne-scars', name: 'RF Microneedling — Acne Scars', category: 'rf_microneedling', fitScoreBase: 94, price: 695, sessions: 4, sessionInterval: 'Every 6 weeks', downtime: '5-7 days', painLevel: 'moderate', resultsTimeline: '30-40% improvement per session' },
      { id: 'peel-medium', name: 'Medium Depth Chemical Peel', category: 'chemical_peel', fitScoreBase: 78, price: 350, sessions: 2, sessionInterval: 'Every 6-8 weeks', downtime: '5-7 days peeling', painLevel: 'moderate', resultsTimeline: 'After peeling resolves' },
      { id: 'peel-vi', name: 'VI Peel', category: 'chemical_peel', fitScoreBase: 72, price: 395, sessions: 3, sessionInterval: 'Monthly', downtime: '5-7 days peeling', painLevel: 'low', resultsTimeline: 'Cumulative improvement' },
    ],
  },
  pigmentation: {
    treatments: [
      { id: 'peel-vi', name: 'VI Peel', category: 'chemical_peel', fitScoreBase: 90, price: 395, sessions: 3, sessionInterval: 'Every 4-6 weeks', downtime: '5-7 days', painLevel: 'low', resultsTimeline: '4-6 weeks per session' },
      { id: 'peel-medium', name: 'Medium Depth Chemical Peel (TCA)', category: 'chemical_peel', fitScoreBase: 85, price: 350, sessions: 2, sessionInterval: 'Every 6-8 weeks', downtime: '5-7 days', painLevel: 'moderate', resultsTimeline: 'After peeling, 4-6 weeks' },
      { id: 'hydrafacial-deluxe', name: 'HydraFacial Deluxe + Britenol Booster', category: 'facial', fitScoreBase: 75, price: 350, sessions: 1, sessionInterval: 'Monthly', downtime: 'None', painLevel: 'low', resultsTimeline: 'Cumulative with series' },
    ],
  },
  redness: {
    treatments: [
      { id: 'hydrafacial-signature', name: 'HydraFacial — Signature', category: 'facial', fitScoreBase: 85, price: 275, sessions: 1, sessionInterval: 'Monthly', downtime: 'None', painLevel: 'low', resultsTimeline: 'Immediate calming' },
      { id: 'peel-biore', name: 'BioRePeel', category: 'chemical_peel', fitScoreBase: 78, price: 250, sessions: 4, sessionInterval: 'Every 2-4 weeks', downtime: 'None', painLevel: 'low', resultsTimeline: 'Immediate improvement' },
    ],
  },
  texture: {
    treatments: [
      { id: 'rfmn-face', name: 'RF Microneedling — Face', category: 'rf_microneedling', fitScoreBase: 92, price: 595, sessions: 3, sessionInterval: 'Every 4-6 weeks', downtime: '2-3 days', painLevel: 'moderate', resultsTimeline: '3-6 months' },
      { id: 'peel-vi', name: 'VI Peel', category: 'chemical_peel', fitScoreBase: 82, price: 395, sessions: 3, sessionInterval: 'Every 4-6 weeks', downtime: '5-7 days', painLevel: 'low', resultsTimeline: '4-6 weeks per session' },
      { id: 'hydrafacial-signature', name: 'HydraFacial', category: 'facial', fitScoreBase: 78, price: 275, sessions: 1, sessionInterval: 'Monthly', downtime: 'None', painLevel: 'low', resultsTimeline: 'Immediate' },
    ],
  },
  pores: {
    treatments: [
      { id: 'rfmn-face', name: 'RF Microneedling — Face', category: 'rf_microneedling', fitScoreBase: 90, price: 595, sessions: 3, sessionInterval: 'Every 4-6 weeks', downtime: '2-3 days', painLevel: 'moderate', resultsTimeline: '3-6 months' },
      { id: 'hydrafacial-signature', name: 'HydraFacial', category: 'facial', fitScoreBase: 85, price: 275, sessions: 1, sessionInterval: 'Monthly', downtime: 'None', painLevel: 'low', resultsTimeline: 'Immediate pore cleansing' },
      { id: 'peel-superficial', name: 'Chemical Peel — Superficial', category: 'chemical_peel', fitScoreBase: 75, price: 150, sessions: 4, sessionInterval: 'Monthly', downtime: 'None', painLevel: 'low', resultsTimeline: 'Cumulative' },
    ],
  },
  laxity: {
    treatments: [
      { id: 'sofwave-full-face', name: 'Sofwave — Full Face', category: 'skin_tightening', fitScoreBase: 95, price: 3500, sessions: 1, sessionInterval: 'Annual', downtime: 'None', painLevel: 'moderate', resultsTimeline: '3-6 months progressive lifting' },
      { id: 'sofwave-face-neck-combo', name: 'Sofwave — Face + Neck', category: 'skin_tightening', fitScoreBase: 92, price: 4500, sessions: 1, sessionInterval: 'Annual', downtime: 'None', painLevel: 'moderate', resultsTimeline: '3-6 months' },
      { id: 'rfmn-face', name: 'RF Microneedling — Face', category: 'rf_microneedling', fitScoreBase: 82, price: 595, sessions: 3, sessionInterval: 'Every 4-6 weeks', downtime: '2-3 days', painLevel: 'moderate', resultsTimeline: '3-6 months' },
    ],
  },
  double_chin: {
    treatments: [
      { id: 'glp1-semaglutide', name: 'GLP-1 Semaglutide Program', category: 'glp1', fitScoreBase: 85, price: 399, sessions: 1, sessionInterval: 'Monthly', downtime: 'None', painLevel: 'low', resultsTimeline: '3-6 months progressive' },
      { id: 'sofwave-neck', name: 'Sofwave — Neck', category: 'skin_tightening', fitScoreBase: 80, price: 2000, sessions: 1, sessionInterval: 'Annual', downtime: 'None', painLevel: 'moderate', resultsTimeline: '3-6 months' },
    ],
  },
  body_contouring: {
    treatments: [
      { id: 'glp1-semaglutide', name: 'GLP-1 Semaglutide Program', category: 'glp1', fitScoreBase: 92, price: 399, sessions: 1, sessionInterval: 'Monthly', downtime: 'None', painLevel: 'low', resultsTimeline: '3-6 months' },
      { id: 'glp1-tirzepatide', name: 'GLP-1 Tirzepatide Program', category: 'glp1', fitScoreBase: 90, price: 499, sessions: 1, sessionInterval: 'Monthly', downtime: 'None', painLevel: 'low', resultsTimeline: '3-6 months' },
    ],
  },
  hair_removal: {
    treatments: [
      { id: 'lhr-face', name: 'Laser Hair Removal — Face', category: 'laser_hair_removal', fitScoreBase: 92, price: 200, sessions: 6, sessionInterval: 'Every 4-6 weeks', downtime: 'None', painLevel: 'moderate', resultsTimeline: '80-90% reduction after full series' },
      { id: 'lhr-bikini', name: 'Laser Hair Removal — Bikini', category: 'laser_hair_removal', fitScoreBase: 90, price: 250, sessions: 6, sessionInterval: 'Every 4-6 weeks', downtime: 'None', painLevel: 'moderate', resultsTimeline: '80-90% reduction' },
      { id: 'lhr-underarms', name: 'Laser Hair Removal — Underarms', category: 'laser_hair_removal', fitScoreBase: 88, price: 150, sessions: 6, sessionInterval: 'Every 4-6 weeks', downtime: 'None', painLevel: 'low', resultsTimeline: '80-90% reduction' },
    ],
  },
  dark_circles: {
    treatments: [
      { id: 'filler-tear-trough', name: 'Dermal Filler — Tear Trough', category: 'injectable_filler', fitScoreBase: 90, price: 750, sessions: 1, sessionInterval: 'Every 9-12 months', downtime: '3-5 days swelling', painLevel: 'moderate', resultsTimeline: 'Immediate (wait 4 weeks for swelling)' },
      { id: 'hydrafacial-deluxe', name: 'HydraFacial Deluxe', category: 'facial', fitScoreBase: 65, price: 350, sessions: 1, sessionInterval: 'Monthly', downtime: 'None', painLevel: 'low', resultsTimeline: 'Temporary brightness improvement' },
    ],
  },
  lip_enhancement: {
    treatments: [
      { id: 'filler-lips', name: 'Dermal Filler — Lips', category: 'injectable_filler', fitScoreBase: 95, price: 650, sessions: 1, sessionInterval: 'Every 6-12 months', downtime: '2-3 days swelling', painLevel: 'moderate', resultsTimeline: 'Immediate, settles in 2-4 weeks' },
      { id: 'botox-lip-flip', name: 'Botox — Lip Flip', category: 'injectable_neurotoxin', fitScoreBase: 80, price: 150, sessions: 1, sessionInterval: 'Every 2-3 months', downtime: 'None', painLevel: 'low', resultsTimeline: '3-5 days onset' },
    ],
  },
  neck_chest_aging: {
    treatments: [
      { id: 'sofwave-face-neck-combo', name: 'Sofwave — Face + Neck', category: 'skin_tightening', fitScoreBase: 92, price: 4500, sessions: 1, sessionInterval: 'Annual', downtime: 'None', painLevel: 'moderate', resultsTimeline: '3-6 months' },
      { id: 'rfmn-neck', name: 'RF Microneedling — Neck', category: 'rf_microneedling', fitScoreBase: 85, price: 495, sessions: 3, sessionInterval: 'Every 4-6 weeks', downtime: '2-3 days', painLevel: 'moderate', resultsTimeline: '3-6 months' },
      { id: 'botox-neck-bands', name: 'Botox — Neck Bands', category: 'injectable_neurotoxin', fitScoreBase: 78, price: 450, sessions: 1, sessionInterval: 'Every 3-4 months', downtime: 'None', painLevel: 'low', resultsTimeline: '1-2 weeks' },
    ],
  },
};

// ── COMBINATION PROTOCOLS ──

const COMBINATION_LIBRARY: CombinationProtocol[] = [
  {
    name: 'The Complete Anti-Aging Protocol',
    treatments: ['Botox', 'Dermal Fillers — Cheeks', 'RF Microneedling'],
    synergy: 'Botox relaxes dynamic lines while fillers restore lost volume and RF microneedling builds collagen from within — addressing all three pillars of aging simultaneously.',
    order: 'Botox first → Fillers 2 weeks later → RF Microneedling 2 weeks after fillers',
    spacing: '2 weeks between each treatment',
    combinedBenefit: 'Together, these create a comprehensive rejuvenation that looks 5-10 years younger while maintaining a completely natural appearance.',
    totalPrice: 1695,
    savingsVsSeparate: 200,
  },
  {
    name: 'The Glow Protocol',
    treatments: ['HydraFacial', 'BioRePeel'],
    synergy: 'HydraFacial deeply cleanses and hydrates while BioRePeel stimulates cell renewal — the combination creates an unmatched radiance.',
    order: 'HydraFacial first → BioRePeel can follow immediately or same week',
    spacing: 'Can be performed same session or within the same week',
    combinedBenefit: 'Immediate red-carpet glow that continues to improve over the following days. The ultimate pre-event protocol.',
    totalPrice: 475,
    savingsVsSeparate: 50,
  },
  {
    name: 'The Skin Renewal Protocol',
    treatments: ['RF Microneedling', 'VI Peel'],
    synergy: 'RF Microneedling remodels collagen deep in the skin while VI Peel renews the surface — attacking texture from both directions.',
    order: 'RF Microneedling first → VI Peel 4-6 weeks later (alternate treatments)',
    spacing: '4-6 weeks between treatments',
    combinedBenefit: 'Dramatically improved texture, reduced pore size, faded scarring, and renewed skin quality from the inside out.',
    totalPrice: 940,
    savingsVsSeparate: 50,
  },
  {
    name: 'The Lift Protocol',
    treatments: ['Sofwave', 'Botox', 'Dermal Fillers — Jawline'],
    synergy: 'Sofwave tightens and lifts tissue, Botox relaxes downward-pulling muscles, and jawline filler restores structural definition — three mechanisms working together for maximum lift.',
    order: 'Sofwave first → Botox 2 weeks later → Fillers 2 weeks after Botox',
    spacing: '2 weeks between treatments',
    combinedBenefit: 'Non-surgical facelift effect that addresses laxity, dynamic wrinkles, and structural support. Results that continue improving for months.',
    totalPrice: 5300,
    savingsVsSeparate: 300,
  },
  {
    name: 'The Body Transformation Protocol',
    treatments: ['GLP-1 Semaglutide', 'RF Microneedling — Body'],
    synergy: 'GLP-1 addresses fat loss while RF Microneedling tightens skin that might loosen during weight loss — preventing the common problem of loose skin after significant weight reduction.',
    order: 'Start GLP-1 immediately → Add RF Microneedling body treatments at month 2-3',
    spacing: 'GLP-1 weekly injections + RF Microneedling every 6 weeks',
    combinedBenefit: 'Comprehensive body transformation with fat loss AND skin tightening — the combination most weight loss programs miss.',
    totalPrice: 1149,
    savingsVsSeparate: 100,
  },
  {
    name: 'The Brightness Protocol',
    treatments: ['VI Peel', 'HydraFacial', 'PicoWay Laser'],
    synergy: 'VI Peel renews surface pigmentation, HydraFacial maintains brightness between treatments, PicoWay targets deep pigment that peels cannot reach.',
    order: 'PicoWay first → VI Peel 4 weeks later → HydraFacial for monthly maintenance',
    spacing: '4 weeks between laser and peel, then monthly HydraFacial',
    combinedBenefit: 'Addresses pigmentation at every level — surface, dermal, and deep — for truly even, luminous skin.',
    totalPrice: 1020,
    savingsVsSeparate: 75,
  },
  {
    name: 'The Lip Perfection Protocol',
    treatments: ['Dermal Filler — Lips', 'Botox — Lip Flip'],
    synergy: 'Lip filler adds volume and definition while the Botox lip flip subtly rolls the upper lip outward — together creating the perfect lip enhancement.',
    order: 'Both can be done in the same session',
    spacing: 'Same appointment',
    combinedBenefit: 'Fuller, more defined lips with a beautiful natural pout. The lip flip makes filler results look even better with less product needed.',
    totalPrice: 750,
    savingsVsSeparate: 50,
  },
  {
    name: 'The Wellness Optimization Protocol',
    treatments: ['NAD+ Injection', 'Peptide Therapy — CJC/Ipamorelin'],
    synergy: 'NAD+ boosts cellular energy and repair while CJC/Ipamorelin optimizes growth hormone for recovery, body composition, and sleep — the foundation of feeling AND looking your best.',
    order: 'Start both concurrently — they work through different mechanisms',
    spacing: 'NAD+ weekly injections + CJC/Ipamorelin daily self-injection',
    combinedBenefit: 'Comprehensive biohacking protocol — better sleep, more energy, improved body composition, faster recovery, and enhanced skin quality from within.',
    totalPrice: 650,
    savingsVsSeparate: 50,
  },
];

// ── TREATMENT COMPATIBILITY MATRIX ──

const COMPATIBILITY: CompatibilityEntry[] = [
  { treatment1: 'Botox', treatment2: 'Dermal Fillers', compatible: true, synergy: 'excellent', spacing: 'Same day or 2 weeks apart', notes: 'Botox first is often preferred — relaxes muscles before filling' },
  { treatment1: 'Botox', treatment2: 'HydraFacial', compatible: true, synergy: 'good', spacing: 'Same day (HydraFacial first)', notes: 'HydraFacial before Botox — clean skin enhances absorption' },
  { treatment1: 'Botox', treatment2: 'RF Microneedling', compatible: true, synergy: 'good', spacing: '2 weeks apart', notes: 'Wait 2 weeks after Botox before RF microneedling' },
  { treatment1: 'Botox', treatment2: 'Chemical Peel', compatible: true, synergy: 'good', spacing: '2 weeks apart', notes: 'Peel first, then Botox 2 weeks later' },
  { treatment1: 'Botox', treatment2: 'Sofwave', compatible: true, synergy: 'excellent', spacing: '2 weeks apart', notes: 'Both target different aging mechanisms — excellent combination' },
  { treatment1: 'Dermal Fillers', treatment2: 'RF Microneedling', compatible: true, synergy: 'good', spacing: '4 weeks apart', notes: 'Wait 4 weeks after filler before RF microneedling over the area' },
  { treatment1: 'Dermal Fillers', treatment2: 'Chemical Peel', compatible: true, synergy: 'neutral', spacing: '2 weeks apart', notes: 'Wait 2 weeks after filler before a peel' },
  { treatment1: 'Dermal Fillers', treatment2: 'Sofwave', compatible: true, synergy: 'good', spacing: '2 weeks apart', notes: 'Wait 2 weeks between treatments' },
  { treatment1: 'RF Microneedling', treatment2: 'Chemical Peel', compatible: true, synergy: 'excellent', spacing: '4-6 weeks apart (alternate)', notes: 'Excellent alternating protocol for skin renewal' },
  { treatment1: 'RF Microneedling', treatment2: 'HydraFacial', compatible: true, synergy: 'good', spacing: '2 weeks apart', notes: 'HydraFacial great for recovery between RF sessions' },
  { treatment1: 'RF Microneedling', treatment2: 'Laser Hair Removal', compatible: true, synergy: 'caution', spacing: '4 weeks apart on same area', notes: 'Treat different areas or wait 4 weeks between' },
  { treatment1: 'Chemical Peel', treatment2: 'Laser Hair Removal', compatible: false, synergy: 'contraindicated', spacing: 'Minimum 2 weeks apart on same area', notes: 'Do not perform on same area within 2 weeks' },
  { treatment1: 'Sofwave', treatment2: 'RF Microneedling', compatible: true, synergy: 'excellent', spacing: '4 weeks apart', notes: 'Different mechanisms — Sofwave for deep tightening, RF for surface remodeling' },
  { treatment1: 'GLP-1', treatment2: 'RF Microneedling', compatible: true, synergy: 'excellent', spacing: 'Concurrent — start RF when weight loss begins', notes: 'RF prevents loose skin during weight loss' },
  { treatment1: 'GLP-1', treatment2: 'Sofwave', compatible: true, synergy: 'good', spacing: 'Concurrent', notes: 'Skin tightening during weight loss' },
];

// ── SEASONAL RECOMMENDATIONS ──

const SEASONAL_RECS: SeasonalRecommendation[] = [
  {
    season: 'winter',
    recommended: ['Chemical Peels (Medium/Deep)', 'RF Microneedling Series', 'PicoWay Laser', 'Tretinoin start'],
    avoid: [],
    reasoning: 'Winter is ideal for treatments causing photosensitivity — less UV exposure and easier sun avoidance. This is the best time for aggressive skin renewal.',
    bestTreatments: ['VI Peel', 'TCA Peel', 'RF Microneedling', 'PicoWay', 'Laser Hair Removal'],
  },
  {
    season: 'spring',
    recommended: ['Botox (pre-summer freshening)', 'HydraFacial', 'Laser Hair Removal (start series)', 'Gentle Peels'],
    avoid: ['Deep chemical peels', 'Aggressive laser treatments'],
    reasoning: 'Spring is transition season — great for starting laser hair removal for smooth summer skin, and maintaining results from winter treatments.',
    bestTreatments: ['Botox', 'HydraFacial', 'Laser Hair Removal', 'BioRePeel', 'Lip Filler'],
  },
  {
    season: 'summer',
    recommended: ['Botox maintenance', 'HydraFacial', 'Lip fillers', 'NAD+ injections', 'GLP-1 programs'],
    avoid: ['Medium/deep peels', 'Aggressive laser', 'RF Microneedling (higher risk of PIH)'],
    reasoning: 'Summer means maximum UV exposure — focus on maintenance treatments with zero photosensitivity risk. Injectable treatments shine in summer.',
    bestTreatments: ['Botox', 'Dermal Fillers', 'HydraFacial', 'Lip Enhancement', 'Wellness Injections'],
  },
  {
    season: 'fall',
    recommended: ['Start RF Microneedling series', 'Chemical Peels', 'Laser treatments', 'Pre-holiday Sofwave'],
    avoid: [],
    reasoning: 'Fall is the start of treatment season — UV exposure is decreasing, making it perfect to begin aggressive rejuvenation protocols ahead of the holiday season.',
    bestTreatments: ['RF Microneedling', 'VI Peel', 'Sofwave', 'Comprehensive anti-aging protocols'],
  },
];

// ── BUDGET TIER PRICING ──

const BUDGET_CONFIGS: Record<BudgetTier, { maxInitial: number; maxAnnual: number; label: string }> = {
  essential: { maxInitial: 800, maxAnnual: 3000, label: 'Essential' },
  value: { maxInitial: 2500, maxAnnual: 8000, label: 'Value' },
  luxury: { maxInitial: 10000, maxAnnual: 25000, label: 'Luxury' },
};

// ── MAIN ADVISOR FUNCTION ──

export function generateTreatmentPlan(profile: ClientProfile): TreatmentPlan {
  // 1. Get all candidate treatments for client's concerns
  const candidates = getCandidateTreatments(profile);

  // 2. Score and rank
  const scored = scoreTreatments(candidates, profile);

  // 3. Check contraindications
  const withContraindications = checkAllContraindications(scored, profile.medicalHistory);
  const safe = withContraindications.filter(t => !t.contraindicated);

  // 4. Filter by budget
  const budgetFiltered = filterByBudget(safe, profile.budget);

  // 5. Build plan
  // Fallback to safe treatments even if budget-filtered is empty
  const finalList = budgetFiltered.length > 0 ? budgetFiltered : safe.length > 0 ? safe : scored;
  const primary = finalList[0];
  const alternatives = finalList.slice(1, 4);

  // Handle case where no treatments available (e.g., all contraindicated)
  if (!primary) {
    return {
      primary: {
        id: 'consult-only',
        treatment: 'In-Person Consultation Recommended',
        category: 'facial' as TreatmentCategory,
        reasoning: 'Based on your medical history, a personalized in-person consultation is the best first step. Our provider will create a safe, customized plan for you.',
        fitScore: 100,
        price: 0,
        sessions: 1,
        sessionInterval: 'N/A',
        downtime: 'None',
        painLevel: 'low',
        resultsTimeline: 'Personalized plan created during consultation',
        bestForConcerns: profile.concerns,
      },
      alternatives: [],
      combinations: [],
      timeline: { milestones: [], totalDuration: 'To be determined during consultation', sessionsRequired: 1 },
      maintenanceSchedule: { frequency: 'To be determined', treatments: [], annualCost: 0, tips: ['Schedule an in-person consultation for a personalized plan'] },
      costEstimate: { initialTreatment: 0, fullPlan: 0, annualMaintenance: 0, paymentOptions: [], tier: profile.budget },
      contraindications: gatherContraindications(profile.medicalHistory),
      expectations: { immediateResults: 'Consultation will provide personalized guidance', peakResults: 'After starting recommended treatments', duration: 'Varies by treatment', factorsAffectingResults: [], realisticStatement: 'Your provider will create a safe, personalized plan during your consultation.' },
      seasonalNotes: getSeasonalNotes(),
    };
  }

  // 6. Find matching combinations
  const combinations = findMatchingCombinations(profile.concerns, profile.budget);

  // 7. Build timeline
  const timeline = buildTimeline(primary, alternatives);

  // 8. Maintenance schedule
  const maintenance = buildMaintenanceSchedule(primary, alternatives);

  // 9. Cost estimate
  const costEstimate = buildCostEstimate(primary, alternatives, combinations, profile.budget);

  // 10. Contraindications list
  const contraindications = gatherContraindications(profile.medicalHistory);

  // 11. Result expectations
  const expectations = buildExpectations(primary);

  // 12. Seasonal notes
  const seasonalNotes = getSeasonalNotes();

  return {
    primary,
    alternatives,
    combinations,
    timeline,
    maintenanceSchedule: maintenance,
    costEstimate,
    contraindications,
    expectations,
    seasonalNotes,
  };
}

// ── INTERNAL FUNCTIONS ──

function getCandidateTreatments(profile: ClientProfile): TreatmentRecommendation[] {
  const candidates: TreatmentRecommendation[] = [];
  const seen = new Set<string>();

  for (const concern of profile.concerns) {
    const mapping = CONCERN_MAP[concern];
    if (!mapping) continue;

    for (const t of mapping.treatments) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);

      candidates.push({
        id: t.id,
        treatment: t.name,
        category: t.category,
        reasoning: '', // Will be filled during scoring
        fitScore: t.fitScoreBase,
        price: t.price,
        sessions: t.sessions,
        sessionInterval: t.sessionInterval,
        downtime: t.downtime,
        painLevel: t.painLevel,
        resultsTimeline: t.resultsTimeline,
        bestForConcerns: [concern],
      });
    }
  }

  return candidates;
}

function scoreTreatments(
  candidates: TreatmentRecommendation[],
  profile: ClientProfile,
): TreatmentRecommendation[] {
  return candidates
    .map(t => {
      let score = t.fitScore;

      // Pain tolerance adjustment
      if (profile.painTolerance === 'low' && t.painLevel === 'high') score -= 20;
      else if (profile.painTolerance === 'low' && t.painLevel === 'moderate') score -= 8;
      else if (profile.painTolerance === 'high' && t.painLevel === 'low') score += 3;

      // Downtime adjustment
      if (profile.downtimeAvailability === 'none' && t.downtime !== 'None') score -= 15;
      else if (profile.downtimeAvailability === 'minimal' && t.downtime.includes('5-7')) score -= 10;
      else if (profile.downtimeAvailability === 'flexible') score += 5;

      // Budget adjustment
      const budgetConfig = BUDGET_CONFIGS[profile.budget];
      if (t.price > budgetConfig.maxInitial) score -= 20;
      else if (t.price <= budgetConfig.maxInitial * 0.5) score += 5;

      // Skin type considerations
      if (profile.skinType >= 4 && t.category === 'laser_hair_removal') score -= 5; // Need Nd:YAG
      if (profile.skinType >= 5 && t.category === 'chemical_peel') score -= 8; // Higher PIH risk

      // Age relevance
      if (profile.age < 30 && t.category === 'skin_tightening') score -= 15;
      if (profile.age >= 40 && t.category === 'injectable_filler') score += 5;
      if (profile.age >= 50 && t.category === 'skin_tightening') score += 8;

      // Number of concerns addressed
      const concernsAddressed = profile.concerns.filter(c =>
        CONCERN_MAP[c]?.treatments.some(mapping => mapping.id === t.id)
      );
      score += concernsAddressed.length * 3;

      // Generate reasoning
      const reasoning = generateReasoning(t, profile, concernsAddressed);

      return {
        ...t,
        fitScore: Math.max(0, Math.min(100, score)),
        reasoning,
        bestForConcerns: concernsAddressed,
      };
    })
    .sort((a, b) => b.fitScore - a.fitScore);
}

function generateReasoning(
  treatment: TreatmentRecommendation,
  profile: ClientProfile,
  concernsAddressed: SkinConcern[],
): string {
  const concernNames = concernsAddressed.map(c => c.replace(/_/g, ' ')).join(', ');
  const parts: string[] = [];

  parts.push(`Recommended for your ${concernNames} concerns.`);

  if (treatment.painLevel === 'low' && profile.painTolerance === 'low') {
    parts.push('This is a comfortable treatment with minimal sensation — ideal for your comfort preference.');
  }

  if (treatment.downtime === 'None') {
    parts.push('Zero downtime — you can return to your normal activities immediately.');
  }

  if (treatment.category === 'injectable_neurotoxin') {
    parts.push('Quick treatment (10-15 minutes) with results visible in 3-5 days.');
  }

  if (treatment.category === 'skin_tightening') {
    parts.push('Non-invasive skin tightening that stimulates your own collagen — results continue improving for months.');
  }

  if (profile.age >= 40 && treatment.category === 'injectable_filler') {
    parts.push('Volume restoration is one of the most impactful treatments for natural-looking rejuvenation at your age.');
  }

  return parts.join(' ');
}

interface ScoredWithContra extends TreatmentRecommendation {
  contraindicated: boolean;
}

function checkAllContraindications(
  treatments: TreatmentRecommendation[],
  medicalHistory: MedicalHistory,
): ScoredWithContra[] {
  return treatments.map(t => {
    const result = checkContraindications(t.id, medicalHistory);
    return {
      ...t,
      contraindicated: !result.safe,
    };
  });
}

function filterByBudget(treatments: ScoredWithContra[], budget: BudgetTier): TreatmentRecommendation[] {
  const config = BUDGET_CONFIGS[budget];

  // For essential tier, strongly prefer affordable options
  if (budget === 'essential') {
    return treatments
      .filter(t => t.price <= config.maxInitial)
      .map(t => ({ ...t }));
  }

  // For value and luxury, include everything but score adjust was already done
  return treatments.map(t => ({ ...t }));
}

function findMatchingCombinations(concerns: SkinConcern[], budget: BudgetTier): CombinationProtocol[] {
  const config = BUDGET_CONFIGS[budget];

  return COMBINATION_LIBRARY.filter(combo => {
    // Check if combination is relevant to client's concerns
    const relevantConcerns = concerns.some(c => {
      const mapping = CONCERN_MAP[c];
      if (!mapping) return false;
      return mapping.treatments.some(t =>
        combo.treatments.some(ct => t.name.includes(ct) || ct.includes(t.name.split(' — ')[0]))
      );
    });

    // Budget check
    const withinBudget = combo.totalPrice <= config.maxAnnual;

    return relevantConcerns && withinBudget;
  }).slice(0, 3);
}

function buildTimeline(primary: TreatmentRecommendation, alternatives: TreatmentRecommendation[]): TreatmentTimeline {
  const milestones: TimelineMilestone[] = [];
  let weekNum = 0;

  // Primary treatment
  milestones.push({
    weekNumber: weekNum,
    treatment: primary.treatment,
    description: `Initial ${primary.treatment} session`,
    expectedOutcome: `Begin seeing results — ${primary.resultsTimeline}`,
  });

  // Follow-up sessions for primary
  if (primary.sessions > 1) {
    for (let i = 2; i <= Math.min(primary.sessions, 4); i++) {
      weekNum += primary.sessionInterval.includes('4-6') ? 5 : 4;
      milestones.push({
        weekNumber: weekNum,
        treatment: primary.treatment,
        description: `Session ${i} of ${primary.sessions}`,
        expectedOutcome: `Cumulative improvement — approximately ${Math.round((i / primary.sessions) * 100)}% of final results`,
      });
    }
  }

  // Add first alternative as complementary
  if (alternatives.length > 0) {
    weekNum += 3;
    milestones.push({
      weekNumber: weekNum,
      treatment: alternatives[0].treatment,
      description: `Add ${alternatives[0].treatment} to enhance your results`,
      expectedOutcome: 'Complementary treatment amplifies primary results',
    });
  }

  // Results assessment
  weekNum += 8;
  milestones.push({
    weekNumber: weekNum,
    treatment: 'Results Assessment',
    description: 'Comprehensive results evaluation and next phase planning',
    expectedOutcome: 'Full results visible — plan maintenance and any additional treatments',
  });

  const totalMonths = Math.ceil(weekNum / 4);

  return {
    milestones,
    totalDuration: `${totalMonths} months for initial treatment plan`,
    sessionsRequired: primary.sessions + (alternatives.length > 0 ? alternatives[0].sessions : 0),
  };
}

function buildMaintenanceSchedule(primary: TreatmentRecommendation, alternatives: TreatmentRecommendation[]): MaintenanceSchedule {
  const treatments: string[] = [primary.treatment];
  let annualCost = 0;

  // Calculate annual maintenance cost
  if (primary.category === 'injectable_neurotoxin') {
    annualCost += primary.price * 3; // 3x per year
  } else if (primary.category === 'injectable_filler') {
    annualCost += primary.price * 1; // 1x per year
  } else if (primary.category === 'skin_tightening') {
    annualCost += primary.price * 1; // Annual
  } else if (primary.category === 'rf_microneedling') {
    annualCost += primary.price * 2; // 2 maintenance sessions
  } else if (primary.category === 'facial') {
    annualCost += primary.price * 12; // Monthly
  } else if (primary.category === 'chemical_peel') {
    annualCost += primary.price * 4; // Quarterly
  } else if (primary.category === 'glp1') {
    annualCost += primary.price * 12; // Monthly program
  } else {
    annualCost += primary.price * 2;
  }

  if (alternatives.length > 0) {
    treatments.push(alternatives[0].treatment);
    annualCost += alternatives[0].price * 2; // Estimate 2 annual maintenance
  }

  const frequency = primary.sessionInterval || 'As recommended by your provider';

  return {
    frequency,
    treatments,
    annualCost,
    tips: [
      'Consistent SPF 30+ daily is the most important maintenance step',
      'Professional-grade skincare between treatments maximizes results',
      'Regular hydration and healthy lifestyle extend treatment longevity',
      'Book your next maintenance appointment before leaving each visit',
      'Consider a membership for significant savings on regular treatments',
    ],
  };
}

function buildCostEstimate(
  primary: TreatmentRecommendation,
  alternatives: TreatmentRecommendation[],
  combinations: CombinationProtocol[],
  budget: BudgetTier,
): CostEstimate {
  const initialTreatment = primary.price * primary.sessions;
  const altCost = alternatives.length > 0 ? alternatives[0].price * alternatives[0].sessions : 0;
  const fullPlan = initialTreatment + altCost;

  // Annual maintenance (simplified)
  let annualMaintenance = 0;
  if (primary.category === 'injectable_neurotoxin') annualMaintenance = primary.price * 3;
  else if (primary.category === 'injectable_filler') annualMaintenance = primary.price;
  else if (primary.category === 'facial') annualMaintenance = primary.price * 12;
  else annualMaintenance = primary.price * 2;

  const paymentOptions: PaymentOption[] = [
    {
      type: 'upfront',
      name: 'Pay Per Treatment',
      amount: primary.price,
      details: `$${primary.price} per session. Simple and flexible — pay as you go.`,
    },
  ];

  // Package option if multi-session
  if (primary.sessions >= 3) {
    const packageSavings = Math.round(initialTreatment * 0.1);
    paymentOptions.push({
      type: 'package',
      name: `${primary.sessions}-Session Package`,
      amount: initialTreatment - packageSavings,
      savings: packageSavings,
      details: `Save $${packageSavings} with a ${primary.sessions}-session package commitment.`,
    });
  }

  // Membership option
  paymentOptions.push({
    type: 'membership',
    name: 'Rani Membership',
    amount: 199,
    perMonth: 199,
    savings: Math.round(annualMaintenance * 0.1),
    details: 'Monthly membership includes discounts on all treatments (typically 10% off), priority booking, and exclusive member events.',
  });

  // Financing for higher-cost treatments
  if (fullPlan >= 1000) {
    paymentOptions.push({
      type: 'financing',
      name: 'Cherry Financing',
      amount: fullPlan,
      perMonth: Math.round(fullPlan / 12),
      details: `As low as $${Math.round(fullPlan / 12)}/month with approved credit. Quick application, same-day approval.`,
    });
  }

  return {
    initialTreatment,
    fullPlan,
    annualMaintenance,
    paymentOptions,
    tier: budget,
  };
}

function gatherContraindications(medicalHistory: MedicalHistory): Contraindication[] {
  const flags: Contraindication[] = [];

  if (medicalHistory.pregnant) {
    flags.push({
      treatment: 'Most treatments',
      reason: 'Pregnancy is a contraindication for most aesthetic treatments',
      severity: 'absolute',
      medicalFactor: 'Pregnancy',
      recommendation: 'We recommend waiting until after pregnancy and breastfeeding to begin treatments. We can create your plan now and be ready to start when you are.',
    });
  }

  if (medicalHistory.breastfeeding) {
    flags.push({
      treatment: 'Injectables and energy devices',
      reason: 'Breastfeeding is a contraindication for most aesthetic treatments',
      severity: 'absolute',
      medicalFactor: 'Breastfeeding',
      recommendation: 'HydraFacial and gentle facials may be safe during breastfeeding — consult with our provider.',
    });
  }

  if (medicalHistory.bloodThinners) {
    flags.push({
      treatment: 'Injectables',
      reason: 'Increased bruising risk with blood thinners',
      severity: 'relative',
      medicalFactor: 'Blood thinners',
      recommendation: 'If medically safe, discontinue blood thinners 7 days before injectable treatments. Always consult your prescribing physician first.',
    });
  }

  if (medicalHistory.autoimmune) {
    flags.push({
      treatment: 'Dermal Fillers',
      reason: 'Autoimmune conditions may increase risk of adverse reaction to fillers',
      severity: 'relative',
      medicalFactor: 'Autoimmune condition',
      recommendation: 'Physician clearance recommended. Some autoimmune conditions are compatible with fillers — requires individual assessment.',
    });
  }

  if (medicalHistory.keloidHistory) {
    flags.push({
      treatment: 'RF Microneedling, Chemical Peels',
      reason: 'History of keloid scarring increases risk with treatments that create controlled skin injury',
      severity: 'relative',
      medicalFactor: 'Keloid history',
      recommendation: 'Test patch recommended before proceeding. Conservative approach with all skin-injury treatments.',
    });
  }

  if (medicalHistory.isotretinoin) {
    flags.push({
      treatment: 'RF Microneedling, Chemical Peels, Laser treatments',
      reason: 'Isotretinoin use within 6 months contraindicates resurfacing treatments',
      severity: 'absolute',
      medicalFactor: 'Isotretinoin (Accutane)',
      recommendation: 'Must wait 6 months after completing isotretinoin before these treatments. Injectables and HydraFacial are safe.',
    });
  }

  if (medicalHistory.recentSunExposure) {
    flags.push({
      treatment: 'Laser treatments, Chemical Peels',
      reason: 'Recent sun exposure increases risk of post-inflammatory hyperpigmentation',
      severity: 'relative',
      medicalFactor: 'Recent sun exposure',
      recommendation: 'Wait 2-4 weeks with strict sun avoidance before proceeding with photosensitive treatments.',
    });
  }

  return flags;
}

function buildExpectations(primary: TreatmentRecommendation): ResultExpectations {
  const protocols = getAllProtocols();
  const protocol = protocols.find(p => p.id === primary.id);

  if (protocol) {
    return {
      immediateResults: protocol.expectedResults.immediatePost,
      peakResults: `Peak results at ${protocol.expectedResults.peakTime}`,
      duration: protocol.expectedResults.duration,
      factorsAffectingResults: [
        'Consistent SPF use significantly extends results',
        'Smoking reduces collagen production and shortens results duration',
        'Good hydration and nutrition support skin healing',
        'Following post-care instructions optimizes outcomes',
        'Regular maintenance treatments sustain long-term results',
      ],
      realisticStatement: `Based on your profile, you can realistically expect ${protocol.expectedResults.oneMonth} within the first month. Results are cumulative — each treatment builds on the last. This is an investment in your skin\'s long-term health, not a one-time fix.`,
    };
  }

  return {
    immediateResults: 'Initial improvement visible within days to weeks',
    peakResults: 'Peak results typically at 1-3 months depending on treatment',
    duration: 'Results duration varies by treatment — your provider will discuss specifics',
    factorsAffectingResults: [
      'Consistent SPF use extends results',
      'Healthy lifestyle supports skin health',
      'Following post-care instructions is essential',
      'Regular maintenance maximizes long-term results',
    ],
    realisticStatement: 'Aesthetic treatments deliver real, visible results — but they work with your body\'s natural processes. Patience and consistency yield the most beautiful outcomes.',
  };
}

function getSeasonalNotes(): string[] {
  const month = new Date().getMonth();
  let season: 'winter' | 'spring' | 'summer' | 'fall';

  if (month >= 11 || month <= 1) season = 'winter';
  else if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 7) season = 'summer';
  else season = 'fall';

  const rec = SEASONAL_RECS.find(r => r.season === season);
  if (!rec) return [];

  const notes: string[] = [
    `Current season: ${season.charAt(0).toUpperCase() + season.slice(1)} — ${rec.reasoning}`,
  ];

  if (rec.recommended.length > 0) {
    notes.push(`Best treatments this season: ${rec.bestTreatments.join(', ')}`);
  }

  if (rec.avoid.length > 0) {
    notes.push(`Consider waiting for: ${rec.avoid.join(', ')} (better done in a season with less sun exposure)`);
  }

  return notes;
}

// ── EXPORTS ──

export { CONCERN_MAP, COMBINATION_LIBRARY, COMPATIBILITY, SEASONAL_RECS, BUDGET_CONFIGS };
export type { TreatmentMapping };
