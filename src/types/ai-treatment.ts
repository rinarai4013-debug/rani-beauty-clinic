/**
 * AI Treatment Recommendation System — Type Definitions
 *
 * Comprehensive types for the treatment advisor, skin analysis,
 * consultation copilot, clinical protocols, and outcome prediction.
 */

// ── CLIENT PROFILE ──

export interface ClientProfile {
  id?: string;
  name: string;
  age: number;
  gender: 'female' | 'male' | 'other';
  skinType: FitzpatrickType;
  concerns: SkinConcern[];
  budget: BudgetTier;
  painTolerance: PainTolerance;
  downtimeAvailability: DowntimeAvailability;
  medicalHistory: MedicalHistory;
  treatmentHistory?: PastTreatment[];
  skinGoals?: string[];
  lifestyleFactors?: LifestyleFactors;
}

export type FitzpatrickType = 1 | 2 | 3 | 4 | 5 | 6;

export type SkinConcern =
  | 'wrinkles'
  | 'volume_loss'
  | 'acne'
  | 'scarring'
  | 'pigmentation'
  | 'redness'
  | 'texture'
  | 'pores'
  | 'laxity'
  | 'double_chin'
  | 'body_contouring'
  | 'hair_removal'
  | 'dark_circles'
  | 'lip_enhancement'
  | 'neck_chest_aging';

export type BudgetTier = 'essential' | 'value' | 'luxury';

export type PainTolerance = 'low' | 'moderate' | 'high';

export type DowntimeAvailability = 'none' | 'minimal' | 'moderate' | 'flexible';

export interface MedicalHistory {
  pregnant: boolean;
  breastfeeding: boolean;
  bloodThinners: boolean;
  autoimmune: boolean;
  keloidHistory: boolean;
  activeSkinInfection: boolean;
  recentSunExposure: boolean;
  isotretinoin: boolean;
  allergies: string[];
  medications: string[];
  conditions: string[];
}

export interface PastTreatment {
  treatment: string;
  date: string;
  satisfaction: number; // 1-10
  provider?: string;
  notes?: string;
}

export interface LifestyleFactors {
  sunExposure: 'minimal' | 'moderate' | 'heavy';
  smoking: boolean;
  skincare: 'none' | 'basic' | 'moderate' | 'advanced';
  waterIntake: 'low' | 'adequate' | 'high';
  sleepQuality: 'poor' | 'fair' | 'good';
  stressLevel: 'low' | 'moderate' | 'high';
  exerciseFrequency: 'none' | 'occasional' | 'regular' | 'daily';
}

// ── TREATMENT ADVISOR TYPES ──

export interface TreatmentPlan {
  primary: TreatmentRecommendation;
  alternatives: TreatmentRecommendation[];
  combinations: CombinationProtocol[];
  timeline: TreatmentTimeline;
  maintenanceSchedule: MaintenanceSchedule;
  costEstimate: CostEstimate;
  contraindications: Contraindication[];
  expectations: ResultExpectations;
  seasonalNotes: string[];
}

export interface TreatmentRecommendation {
  id: string;
  treatment: string;
  category: TreatmentCategory;
  reasoning: string;
  fitScore: number; // 0-100
  price: number;
  priceRange?: { min: number; max: number };
  sessions: number;
  sessionInterval: string;
  downtime: string;
  painLevel: PainTolerance;
  resultsTimeline: string;
  bestForConcerns: SkinConcern[];
}

export type TreatmentCategory =
  | 'injectable_neurotoxin'
  | 'injectable_filler'
  | 'rf_microneedling'
  | 'skin_tightening'
  | 'laser_hair_removal'
  | 'chemical_peel'
  | 'facial'
  | 'glp1'
  | 'peptide_therapy'
  | 'nad_injection'
  | 'hrt'
  | 'laser_pigment';

export interface CombinationProtocol {
  name: string;
  treatments: string[];
  synergy: string;
  order: string;
  spacing: string;
  combinedBenefit: string;
  totalPrice: number;
  savingsVsSeparate: number;
}

export interface TreatmentTimeline {
  milestones: TimelineMilestone[];
  totalDuration: string;
  sessionsRequired: number;
}

export interface TimelineMilestone {
  weekNumber: number;
  treatment: string;
  description: string;
  expectedOutcome: string;
}

export interface MaintenanceSchedule {
  frequency: string;
  treatments: string[];
  annualCost: number;
  tips: string[];
}

export interface CostEstimate {
  initialTreatment: number;
  fullPlan: number;
  annualMaintenance: number;
  paymentOptions: PaymentOption[];
  tier: BudgetTier;
}

export interface PaymentOption {
  type: 'upfront' | 'package' | 'membership' | 'financing';
  name: string;
  amount: number;
  perMonth?: number;
  savings?: number;
  details: string;
}

export interface Contraindication {
  treatment: string;
  condition?: string;
  reason: string;
  severity: 'absolute' | 'relative' | 'caution';
  medicalFactor: string;
  recommendation: string;
}

export interface ResultExpectations {
  immediateResults: string;
  peakResults: string;
  duration: string;
  factorsAffectingResults: string[];
  realisticStatement: string;
}

// ── SKIN ANALYSIS TYPES ──

export type GlogauScale = 1 | 2 | 3 | 4;

export interface SkinAnalysis {
  fitzpatrickType: FitzpatrickType;
  fitzpatrickDescription: string;
  glogauScale: GlogauScale;
  glogauDescription: string;
  skinHealthScore: SkinHealthScore;
  agingPatterns: AgingPattern[];
  treatmentPriority: TreatmentPriority[];
  skincareRoutine: SkincareRoutine;
  benchmarkComparison: BenchmarkComparison;
}

export interface SkinHealthScore {
  overall: number; // 0-100
  dimensions: SkinDimensions;
  trend?: 'improving' | 'stable' | 'declining';
  lastAssessmentDate?: string;
}

export interface SkinDimensions {
  hydration: number;
  elasticity: number;
  texture: number;
  tone: number;
  clarity: number;
  firmness: number;
  radiance: number;
  protection: number;
}

export type AgingPatternType = 'expression_lines' | 'gravity' | 'volume_loss' | 'sun_damage';

export interface AgingPattern {
  type: AgingPatternType;
  severity: 'mild' | 'moderate' | 'advanced';
  areas: string[];
  recommendedTreatments: string[];
}

export interface TreatmentPriority {
  rank: number;
  concern: SkinConcern;
  urgency: 'high' | 'medium' | 'low';
  recommendedTreatment: string;
  rationale: string;
}

export interface SkincareRoutine {
  morning: SkincareStep[];
  evening: SkincareStep[];
  weekly: SkincareStep[];
}

export interface SkincareStep {
  order: number;
  product: string;
  type: string;
  instruction: string;
  keyIngredient?: string;
}

export interface BenchmarkComparison {
  ageGroup: string;
  percentile: number; // 0-100 — where client falls vs peers
  areasBetterThanPeers: string[];
  areasForImprovement: string[];
}

export interface SkinProgressRecord {
  date: string;
  score: SkinHealthScore;
  treatmentsSinceLastAssessment: string[];
  notes?: string;
}

// ── CONSULTATION COPILOT TYPES ──

export interface ConsultationContext {
  client: ClientProfile;
  consultType: 'new_client' | 'existing_client' | 'follow_up' | 'upsell';
  interestedServices?: string[];
  currentTreatment?: string;
  engagementSignals?: EngagementSignal[];
}

export interface ConsultationCopilotResult {
  suggestions: RealTimeSuggestion[];
  objectionHandlers: CopilotObjectionHandler[];
  upsellPrompts: UpsellPrompt[];
  medicalFlags: MedicalFlag[];
  financingTalkingPoints: FinancingPoint[];
  competitorResponses: CompetitorResponse[];
  closingTechniques: ClosingTechnique[];
  followUpTemplates: FollowUpTemplate[];
  conversionScore: ConversionScore;
}

export interface RealTimeSuggestion {
  id: string;
  type: 'treatment' | 'addon' | 'upgrade' | 'skincare' | 'membership';
  title: string;
  suggestion: string;
  reasoning: string;
  relevanceScore: number; // 0-100
  timing: 'now' | 'later_in_consult' | 'follow_up';
}

export interface CopilotObjectionHandler {
  objection: string;
  category: 'price' | 'pain' | 'downtime' | 'think_about_it' | 'competitor' | 'skepticism' | 'timing';
  response: string;
  technique: string;
  followUp: string;
}

export interface UpsellPrompt {
  currentService: string;
  suggestedAddOn: string;
  pitch: string;
  addedValue: string;
  additionalCost: number;
  conversionLikelihood: number;
}

export interface MedicalFlag {
  flag: string;
  severity: 'info' | 'warning' | 'critical';
  action: string;
  recommendation?: string;
  relatedTreatments: string[];
}

export interface FinancingPoint {
  option: string;
  monthlyPayment: number;
  term: string;
  talkingPoint: string;
}

export interface CompetitorResponse {
  competitor: string;
  commonClaim: string;
  ourAdvantage: string;
  response: string;
}

export interface ClosingTechnique {
  name: string;
  approach: 'assumptive' | 'choice' | 'urgency' | 'value' | 'trial' | 'summary';
  script: string;
  bestFor: string;
}

export interface FollowUpTemplate {
  timing: 'same_day' | 'next_day' | 'three_days' | 'one_week';
  channel: 'email' | 'sms' | 'phone';
  subject?: string;
  body: string;
}

export interface ConversionScore {
  score: number; // 0-100
  factors: ConversionFactor[];
  recommendation: string;
}

export interface ConversionFactor {
  factor: string;
  impact: 'positive' | 'neutral' | 'negative';
  weight: number;
  detail: string;
}

export interface EngagementSignal {
  type: 'asked_price' | 'asked_results' | 'asked_downtime' | 'mentioned_event' | 'compared_competitor' | 'asked_financing' | 'nodding' | 'took_notes' | 'brought_partner';
  timestamp?: string;
}

// ── CLINICAL PROTOCOL TYPES ──

export interface TreatmentProtocol {
  id: string;
  name: string;
  category: TreatmentCategory;
  subcategory: string;
  version: string;
  lastUpdated: string;

  indication: string[];
  contraindications: string[];
  relativeContraindications: string[];

  preCare: string[];
  technique: TechniqueNotes;
  postCare: string[];

  productsUsed: ProductUsage[];
  expectedResults: ExpectedResult;
  followUpSchedule: FollowUpScheduleItem[];

  pricing: ProtocolPricing;
  icd10Codes: string[];
  providerNotes?: string;
  clinicalPearls?: string[];
}

export interface TechniqueNotes {
  steps: string[];
  duration: number; // minutes
  anesthesia: string;
  equipmentNeeded: string[];
  keyTechniques: string[];
}

export interface ProductUsage {
  product: string;
  amount: string;
  units?: string;
  brand?: string;
}

export interface ExpectedResult {
  immediatePost: string;
  oneWeek: string;
  oneMonth: string;
  threeMonths: string;
  sixMonths: string;
  onsetTime: string;
  peakTime: string;
  duration: string;
}

export interface FollowUpScheduleItem {
  timing: string;
  purpose: string;
  assessmentCriteria: string;
}

export interface ProtocolPricing {
  basePrice: number;
  priceRange?: { min: number; max: number };
  perUnit?: number;
  typicalUnits?: string;
  packagePrice?: number;
  memberPrice?: number;
}

// ── OUTCOME PREDICTION TYPES ──

export interface OutcomePrediction {
  treatmentId: string;
  treatmentName: string;
  satisfactionLikelihood: number; // 1-10
  resultsDuration: ResultsDuration;
  sideEffects: SideEffectPrediction[];
  sessionsNeeded: SessionPrediction;
  totalCostProjection: number;
  expectationCalibration: ExpectationCalibration;
  outcomeFactors: OutcomeFactor[];
  photoTimeline: PhotoTimelinePoint[];
}

export interface ResultsDuration {
  minimum: string;
  typical: string;
  maximum: string;
  factorsExtending: string[];
  factorsReducing: string[];
}

export interface SideEffectPrediction {
  effect: string;
  probability: number; // 0-100
  severity: 'mild' | 'moderate' | 'severe';
  duration: string;
  management: string;
}

export interface SessionPrediction {
  minimum: number;
  recommended: number;
  maximum: number;
  intervalBetween: string;
  totalTimespan: string;
}

export interface ExpectationCalibration {
  realisticOutcome: string;
  bestCase: string;
  worstCase: string;
  commonMisconceptions: string[];
  importantDisclosures: string[];
}

export interface OutcomeFactor {
  factor: string;
  impact: 'improves' | 'reduces' | 'neutral';
  magnitude: 'significant' | 'moderate' | 'minor';
  recommendation: string;
}

export interface PhotoTimelinePoint {
  timing: string;
  expectedAppearance: string;
  normalVariations: string[];
}

export interface HistoricalOutcome {
  clientId: string;
  treatmentId: string;
  treatmentDate: string;
  protocol: string;
  demographics: {
    age: number;
    skinType: FitzpatrickType;
    concerns: SkinConcern[];
  };
  outcome: {
    satisfaction: number;
    resultsDuration: string;
    sideEffects: string[];
    sessionsCompleted: number;
    wouldRepeat: boolean;
  };
}

// ── QUIZ TYPES ──

export interface QuizQuestion {
  id: string;
  step: number;
  question: string;
  subtitle?: string;
  type: 'single' | 'multiple' | 'range' | 'text';
  options?: QuizOption[];
  minSelect?: number;
  maxSelect?: number;
  required: boolean;
}

export interface QuizOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

export interface QuizAnswers {
  ageRange: string;
  skinType: string;
  topConcerns: SkinConcern[];
  budgetRange: BudgetTier;
  painTolerance: PainTolerance;
  downtimeAvailability: DowntimeAvailability;
  treatmentHistory: string;
  skinGoals: string[];
  sunExposure: string;
  skincareRoutine: string;
  previousTreatments: string[];
  seasonalPreference: string;
}

export interface QuizResults {
  skinAnalysis: SkinAnalysis;
  treatmentPlan: TreatmentPlan;
  outcomePrediction: OutcomePrediction;
  shareableCard: ShareableCard;
}

export interface ShareableCard {
  headline: string;
  skinScore: number;
  topRecommendation: string;
  secondRecommendation: string;
  estimatedInvestment: string;
  callToAction: string;
}

// ── TREATMENT COMPATIBILITY ──

export interface CompatibilityMatrix {
  treatments: string[];
  compatibility: CompatibilityEntry[];
}

export interface CompatibilityEntry {
  treatment1: string;
  treatment2: string;
  compatible: boolean;
  synergy: 'excellent' | 'good' | 'neutral' | 'caution' | 'contraindicated';
  spacing: string;
  notes: string;
}

// ── SEASONAL RECOMMENDATION ──

export interface SeasonalRecommendation {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  recommended: string[];
  avoid: string[];
  reasoning: string;
  bestTreatments: string[];
}
