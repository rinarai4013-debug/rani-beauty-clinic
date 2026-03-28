// ─── Treatment Protocol Type System ─────────────────────────────────────────
// Comprehensive type definitions for all treatment protocols at Rani Beauty Clinic

export type ProtocolCategory =
  | 'injectable'
  | 'laser'
  | 'skin-treatment'
  | 'wellness'
  | 'combination';

export type RiskLevel = 'low' | 'moderate' | 'high';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type FitzpatrickType = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

export interface PricingRange {
  min: number;
  max: number;
  unit: string; // e.g., "per session", "per syringe", "per area"
}

export interface ConsentRequirement {
  formId: string;
  formName: string;
  expiresInDays: number;
  requiresWitness: boolean;
  requiresPhotoConsent: boolean;
}

export interface AftercareInstruction {
  timeframe: string;
  instruction: string;
  priority: 'critical' | 'important' | 'recommended';
}

export interface CPTCode {
  code: string;
  description: string;
  modifier?: string;
}

// ─── Injectable Protocol ────────────────────────────────────────────────────

export interface InjectableProtocol {
  id: string;
  name: string;
  category: 'injectable';
  subcategory: 'neurotoxin' | 'dermal-filler';
  treatmentArea: string;
  description: string;
  clinicalIndication: string;

  // Dosing
  product: string;
  unitsOrSyringes: string;
  dilution?: string;
  needleGauge: string;

  // Technique
  anatomyLandmarks: string[];
  injectionTechnique: string;
  injectionDepth: string;
  injectionPoints: number;
  aspirationRequired: boolean;

  // Safety
  contraindications: string[];
  precautions: string[];
  potentialComplications: string[];
  emergencyKit: string[];
  riskLevel: RiskLevel;
  difficultyLevel: DifficultyLevel;

  // Results
  onsetTime: string;
  peakResults: string;
  duration: string;
  expectedResults: string[];
  touchUpTimeline: string;
  retreatmentInterval: string;

  // Aftercare
  aftercare: AftercareInstruction[];

  // Compliance
  consentRequirements: ConsentRequirement;
  cptCodes: CPTCode[];
  documentationRequirements: string[];

  // Pricing
  pricing: PricingRange;
  sessionDuration: number; // minutes

  // Metadata
  tags: string[];
  relatedProtocols: string[];
  lastUpdated: string;
}

// ─── Laser/Device Protocol ──────────────────────────────────────────────────

export interface DeviceSettings {
  wavelength?: string;
  energy: string;
  pulseWidth?: string;
  pulseRate?: string;
  spotSize: string;
  fluence?: string;
  frequency?: string;
  depth?: string;
  passes: number;
  cooling: string;
}

export interface FitzpatrickSettings {
  skinType: FitzpatrickType;
  settings: Partial<DeviceSettings>;
  notes: string;
}

export interface LaserProtocol {
  id: string;
  name: string;
  category: 'laser';
  subcategory: 'hair-removal' | 'pigment' | 'skin-revitalization' | 'skin-tightening' | 'rf-microneedling';
  treatmentArea: string;
  description: string;
  clinicalIndication: string;

  // Device
  device: string;
  handpiece?: string;
  defaultSettings: DeviceSettings;
  fitzpatrickSettings?: FitzpatrickSettings[];

  // Treatment
  passCount: number;
  overlapPercentage?: number;
  endpointIndicators: string[];
  treatmentPattern: string;
  numSessions: string;
  sessionInterval: string;

  // Safety
  contraindications: string[];
  precautions: string[];
  potentialComplications: string[];
  riskLevel: RiskLevel;
  difficultyLevel: DifficultyLevel;
  eyeProtection: string;

  // Pre/Post Care
  preCare: string[];
  aftercare: AftercareInstruction[];
  downtime: string;

  // Compliance
  consentRequirements: ConsentRequirement;
  cptCodes: CPTCode[];
  documentationRequirements: string[];

  // Pricing
  pricing: PricingRange;
  sessionDuration: number;

  // Metadata
  tags: string[];
  relatedProtocols: string[];
  lastUpdated: string;
}

// ─── Skin Treatment Protocol ────────────────────────────────────────────────

export interface TreatmentStep {
  stepNumber: number;
  name: string;
  duration: number; // minutes
  description: string;
  products?: string[];
  deviceSettings?: string;
  notes?: string;
}

export interface SkinTreatmentProtocol {
  id: string;
  name: string;
  category: 'skin-treatment';
  subcategory: 'hydrafacial' | 'chemical-peel' | 'mechanical' | 'light-therapy' | 'oxygen';
  treatmentArea: string;
  description: string;
  clinicalIndication: string;

  // Procedure
  steps: TreatmentStep[];
  totalDuration: number;
  productsUsed: string[];

  // Schedule
  frequencyRecommendation: string;
  seriesProtocol?: string;
  resultsTimeline: string;
  maintenanceSchedule: string;

  // Safety
  contraindications: string[];
  precautions: string[];
  potentialComplications: string[];
  riskLevel: RiskLevel;

  // Pre/Post Care
  preCare: string[];
  aftercare: AftercareInstruction[];
  downtime: string;

  // Compliance
  consentRequirements: ConsentRequirement;
  cptCodes: CPTCode[];

  // Pricing
  pricing: PricingRange;
  sessionDuration: number;

  // Metadata
  tags: string[];
  relatedProtocols: string[];
  lastUpdated: string;
}

// ─── Wellness Protocol ──────────────────────────────────────────────────────

export interface DosingSchedule {
  week: number;
  dose: string;
  frequency: string;
  route: string;
  notes?: string;
}

export interface LabRequirement {
  testName: string;
  frequency: string;
  timing: string;
  criticalValues?: string;
}

export interface WellnessProtocol {
  id: string;
  name: string;
  category: 'wellness';
  subcategory: 'glp1' | 'peptide' | 'hrt' | 'injection-therapy' | 'vitamin-injection';
  description: string;
  clinicalIndication: string;

  // Dosing
  medication: string;
  dosingSchedule: DosingSchedule[];
  route: string;
  injectionSites: string[];
  siteRotationProtocol: string;

  // Monitoring
  labRequirements: LabRequirement[];
  monitoringIntervals: string;
  vitalsRequired: string[];

  // Safety
  contraindications: string[];
  precautions: string[];
  potentialSideEffects: string[];
  blackBoxWarnings?: string[];
  drugInteractions: string[];
  riskLevel: RiskLevel;

  // Expected Results
  onsetTime: string;
  expectedTimeline: string;
  expectedResults: string[];
  maintenanceProtocol: string;

  // Aftercare
  aftercare: AftercareInstruction[];
  dietaryGuidelines?: string[];
  lifestyleRecommendations?: string[];

  // Compliance
  consentRequirements: ConsentRequirement;
  cptCodes: CPTCode[];
  prescriptionRequired: boolean;
  deaSchedule?: string;
  documentationRequirements: string[];

  // Pricing
  pricing: PricingRange;
  sessionDuration: number;

  // Metadata
  tags: string[];
  relatedProtocols: string[];
  lastUpdated: string;
}

// ─── Combination Protocol ───────────────────────────────────────────────────

export interface CombinationPhase {
  phase: number;
  name: string;
  weekRange: string;
  treatments: {
    protocolId: string;
    protocolName: string;
    sessions: number;
    frequency: string;
    notes?: string;
  }[];
  expectedOutcomes: string[];
  estimatedCost: PricingRange;
}

export interface CombinationProtocol {
  id: string;
  name: string;
  category: 'combination';
  subcategory: string;
  description: string;
  idealCandidate: string;
  duration: string; // total program length

  // Program Structure
  phases: CombinationPhase[];
  totalSessions: number;

  // Products & Homecare
  homecareRegimen?: string[];
  supplements?: string[];

  // Expected Results
  expectedOutcomes: string[];
  beforeAfterTimeline: string;
  satisfactionRate?: string;

  // Safety
  contraindications: string[];
  medicalClearanceRequired: boolean;
  labsRequired?: string[];

  // Financial
  totalEstimatedCost: PricingRange;
  financingAvailable: boolean;
  membershipDiscount?: string;
  paymentSchedule?: string;

  // Compliance
  consentRequirements: ConsentRequirement;

  // Metadata
  tags: string[];
  relatedProtocols: string[];
  lastUpdated: string;
}

// ─── Union Type ─────────────────────────────────────────────────────────────

export type Protocol =
  | InjectableProtocol
  | LaserProtocol
  | SkinTreatmentProtocol
  | WellnessProtocol
  | CombinationProtocol;

// ─── Search & Filter ────────────────────────────────────────────────────────

export interface ProtocolSearchFilters {
  query?: string;
  category?: ProtocolCategory;
  subcategory?: string;
  riskLevel?: RiskLevel;
  tags?: string[];
  priceMin?: number;
  priceMax?: number;
}

export interface ProtocolSearchResult {
  protocol: Protocol;
  relevanceScore: number;
  matchedFields: string[];
}
