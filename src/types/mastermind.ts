/**
 * Mastermind Consultation Engine — Type Definitions
 *
 * Master session context that flows through all 6 phases:
 * Intake → Aura Scan → Plan Generation → Provider Review → Simulation → Presentation
 */

import type {
  ClientProfile,
  MedicalHistory,
  SkinAnalysis,
  SkinHealthScore,
  SkinDimensions,
  FitzpatrickType,
  GlogauScale,
  SkinConcern,
  TreatmentRecommendation,
  TreatmentPlan,
  Contraindication,
  MedicalFlag,
  OutcomePrediction,
  PaymentOption,
  LifestyleFactors,
  AgingPattern,
  TreatmentPriority,
} from '@/types/ai-treatment';
import type { ConsultationSubmitData, ConsultationFormData } from '@/lib/consultation/schema';
import type { GeneratedPackage, PlanPhase, SelectedService } from '@/lib/plan-builder/types';

// ── AURA SCORE ──

export type AuraGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface AuraScore {
  overall: number; // 0-100 composite
  grade: AuraGrade;
  label: string; // "Excellent", "Good", "Fair", "Needs Attention", "Critical"
  breakdown: SkinDimensions; // 8 dimensions from existing type
  skinAge: number;
  chronologicalAge: number;
  skinAgeDelta: number; // negative = younger-looking
  percentile: number; // vs same age/Fitzpatrick (0-100)
}

// ── ZONE ANALYSIS ──

export type FacialZone =
  | 'forehead'
  | 'glabella'
  | 'periorbital_left'
  | 'periorbital_right'
  | 'temples_left'
  | 'temples_right'
  | 'cheeks_left'
  | 'cheeks_right'
  | 'nasolabial_left'
  | 'nasolabial_right'
  | 'lips'
  | 'marionette_left'
  | 'marionette_right'
  | 'jawline'
  | 'chin'
  | 'neck'
  | 'decolletage';

export interface ZoneAnalysis {
  zone: FacialZone;
  zoneName: string; // Display name
  overallScore: number; // 0-100
  skinAge: number;
  concerns: {
    type: string;
    severity: number; // 0-100
    treatmentPriority: number; // 1-5
  }[];
  recommendations: string[];
}

// ── CONCERN DETECTION ──

export type ConcernSeverity = 'mild' | 'moderate' | 'severe';
export type ConcernUrgency = 'low' | 'medium' | 'high';

export interface AuraConcern {
  id: string;
  concern: SkinConcern;
  severity: ConcernSeverity;
  score: number; // 0-100
  zones: FacialZone[];
  trending: 'improving' | 'stable' | 'worsening';
  urgency: ConcernUrgency;
  description: string; // Patient-friendly
  clinicalNote: string; // Provider-facing
}

// ── PREDICTIVE METRICS ──

export interface PredictedState {
  auraScore: number;
  skinAge: number;
  topConcerns: string[];
  newConcernsEmerging: string[];
}

export interface PredictiveMetrics {
  withoutIntervention: {
    sixMonths: PredictedState;
    oneYear: PredictedState;
    threeYears: PredictedState;
    fiveYears: PredictedState;
  };
  withTreatment: {
    threeMonths: PredictedState;
    sixMonths: PredictedState;
    oneYear: PredictedState;
  };
  riskFactors: {
    factor: string;
    impact: 'low' | 'medium' | 'high';
    description: string;
  }[];
}

// ── TREATMENT READINESS ──

export interface TreatmentReadiness {
  readyForTreatment: boolean;
  requiredPrep: string[];
  seasonalConsiderations: string[];
  skinBarrierStatus: 'compromised' | 'adequate' | 'strong';
}

// ── AURA SCAN RESULT ──

export interface AuraScanResult {
  scanId: string;
  timestamp: string; // ISO date
  auraScore: AuraScore;
  auraDeviceAnalysis: AuraDeviceAnalysis; // 5-category analysis matching AUCA scanner format
  zoneAnalysis: ZoneAnalysis[];
  detectedConcerns: AuraConcern[];
  predictiveMetrics: PredictiveMetrics;
  treatmentReadiness: TreatmentReadiness;
  skinAnalysis: SkinAnalysis;
  medicalFlags: MedicalFlag[];
}

// ── MASTERMIND PLAN ──

export interface MastermindTreatment {
  id: string;
  treatmentName: string;
  category: string;
  targetConcerns: string[];
  targetZones: FacialZone[];
  sessionsRequired: number;
  intervalBetweenSessions: string;
  expectedImprovement: string;
  timeToResults: string;
  longevity: string;
  perSession: number;
  totalEstimate: number;
  priority: 'essential' | 'recommended' | 'optional';
  urgency: 'immediate' | 'within-3-months' | 'when-ready';
  downtime: string;
  riskLevel: 'minimal' | 'low' | 'moderate';
  contraindications: string[];
  synergiesWith: string[];
  aiConfidence: number; // 0-100
  aiReasoning: string; // Patient-facing
  clinicalRationale: string; // Provider-facing
}

export interface TreatmentSequenceItem {
  phase: number;
  phaseName: string;
  duration: string;
  treatments: {
    treatmentId: string;
    week: number;
    sessionNumber: number;
  }[];
  expectedMilestone: string;
}

export interface MastermindMedicalProductRecommendation {
  id: string;
  label: string;
  category: string;
  score: number;
  suggestedRetail: number;
  suggestedGrossProfit: number;
  suggestedMarginPercent: number;
  rationale: string[];
}

export interface MastermindPeptideCandidate {
  compound: string;
  targetIntent: string;
  startDose: string;
  escalationWindow: string;
  route: 'subcutaneous' | 'intramuscular' | 'topical';
  cadence: string;
  cycleLength: string;
  confidence: 'moderate' | 'high';
  rationale: string[];
}

export interface MastermindMedicalOptimization {
  generatedAt: string;
  requestedTrack: 'glp1' | 'hormones' | 'peptides' | 'hybrid';
  status: 'eligible' | 'provider-review-required' | 'ineligible';
  recommendedTrack: 'glp1' | 'hormones' | 'peptides' | 'hybrid';
  secondaryTracks: Array<'glp1' | 'hormones' | 'peptides' | 'hybrid'>;
  blockedTracks: Array<'glp1' | 'hormones' | 'peptides' | 'hybrid'>;
  providerSignoffRequired: true;
  normalizedSymptoms: string[];
  riskFlags: string[];
  requiredNextSteps: string[];
  fulfillment: {
    allowed: string[];
    recommended: string;
    reason: string;
  };
  tierRecommendation: {
    tier: string;
    intensityScore: number;
    rationale: string[];
    constrainedByStatus: boolean;
  };
  dosageFramework: {
    track: string;
    tier: string;
    startRange: string;
    cadence: string;
    escalationCriteria: string[];
    holdRules: string[];
    monitoringCadence: string[];
    providerAuthorizationNote: string;
    constrainedByStatus: boolean;
    personalizedPeptidePlan: {
      strategy: string;
      dataCompleteness: string;
      computedFrom: string[];
      warnings: string[];
      candidates: MastermindPeptideCandidate[];
    } | null;
  };
  recommendedProducts: MastermindMedicalProductRecommendation[];
  projectedMonthlyRetail: number;
  projectedMonthlyCOGS: number;
  projectedMonthlyGrossProfit: number;
  averageMarginPercent: number;
  providerSummary: string;
}

export interface MastermindPlan {
  planId: string;
  generatedAt: string; // ISO date
  recommendations: {
    primary: MastermindTreatment[];
    complementary: MastermindTreatment[];
    maintenance: MastermindTreatment[];
  };
  sequencing: TreatmentSequenceItem[];
  packages: GeneratedPackage[];
  aftercarePreview: {
    treatmentId: string;
    immediateAftercare: string[];
    weekOneGuidance: string[];
    productsRecommended: { product: string; reason: string }[];
  }[];
  aiSummary: {
    patientFacing: string;
    providerFacing: string;
    keyHighlights: string[];
    addressedConcerns: {
      concern: string;
      solution: string;
      timeline: string;
    }[];
  };
  contraindications: Contraindication[];
  medicalOptimization?: MastermindMedicalOptimization | null;
}

// ── PROVIDER REVIEW ──

export interface PlanModification {
  id: string;
  timestamp: string;
  type: 'add' | 'remove' | 'adjust_dosage' | 'reorder' | 'swap' | 'note';
  treatmentId?: string;
  details: string;
  providerId: string;
}

export interface ProviderReviewState {
  providerId: string;
  providerName: string;
  modifications: PlanModification[];
  clinicalNotes: string[];
  approvalStatus: 'pending' | 'approved' | 'modified' | 'rejected';
  approvedAt?: string;
}

// ── SIMULATION ──

export interface SimulationFrame {
  imageDataUrl: string; // base64 data URL from canvas
  kind: 'photo-simulation' | 'data-projection';
  timepoint: string; // "1M", "3M", "6M", "1Y", "3Y", "5Y"
  monthNumber: number;
  description: string;
  auraScoreProjection: number;
  skinAgeProjection: number;
}

export interface SimulationPath {
  frames: SimulationFrame[];
  narrative: string;
}

export interface SimulationComparison {
  withTreatment: SimulationPath;
  withoutTreatment: SimulationPath;
  comparison: {
    auraScoreDelta: number;
    skinAgeDelta: number;
    keyDifferentiators: string[];
  };
  costOfDelay: {
    currentPlanCost: number;
    costIfDelayed1Year: number;
    costIfDelayed3Years: number;
    reasoning: string;
  };
}

// ── AUCA-STYLE ANALYSIS CATEGORIES ──

export type SkinAnalysisCategory = 'wrinkles' | 'texture' | 'brownSpots' | 'redAreas' | 'pores';
export type ScoringMode = 'absolute' | 'peerComparative';

export interface CategoryScore {
  category: SkinAnalysisCategory;
  label: string; // Display label: "Wrinkles", "Texture", etc.
  absoluteScore: number; // 1-5 scale (AUCA raw, mild→severe)
  peerScore: number; // -3 to +3 scale (better→worse vs peers)
  severity: ConcernSeverity;
  description: string;
}

export interface AuraDeviceAnalysis {
  categories: CategoryScore[];
  compositeSkinScore: number; // Weighted average (AUCA's "Skin Score")
  scoringMode: ScoringMode;
}

// ── CLINIC FOLLOW-UP STATUS ──
// Separate from the AI pipeline phase — this tracks the human follow-up workflow
export type ClinicStatus = 'new' | 'reviewed' | 'contacted' | 'booked' | 'no_response' | 'closed';

// ── ACTIVITY LOG ──
// Auditable timeline of actions taken on a consultation
export interface ActivityLogEntry {
  timestamp: string;
  action: string;     // e.g. 'status_changed', 'note_added', 'share_link_generated', 'plan_generated'
  detail: string;     // human-readable description
  actor?: string;     // staff name if available
}


// ── PROTOCOL PACKET ──

export interface ProtocolPacketMeta {
  packetUrl: string;
  generatedAt: string;
  generatorActor: string;
  packetVersion: number;
}

// ── MASTERMIND SESSION ──

export type MastermindPhase =
  | 'intake'
  | 'scanning'
  | 'scan_complete'
  | 'generating_plan'
  | 'plan_ready'
  | 'provider_review'
  | 'approved'
  | 'simulating'
  | 'simulation_ready'
  | 'presenting'
  | 'completed';

export interface MastermindSession {
  id: string;
  createdAt: string;
  updatedAt: string;
  phase: MastermindPhase;

  // Phase 1: Intake
  intakeData: Partial<ConsultationSubmitData> | null;
  patientName: string;
  patientEmail: string;

  // Phase 1b: Source Photo (for simulation)
  sourcePhotoUrl: string | null; // base64 data URL or persistent URL

  // Phase 2: Aura Scan
  auraScanResult: AuraScanResult | null;
  auraScanError?: { at: string; message: string; source: string } | null;

  // Phase 3: Plan
  mastermindPlan: MastermindPlan | null;

  // Phase 4: Provider Review
  providerReview: ProviderReviewState | null;

  // Phase 5: Simulation
  simulationComparison: SimulationComparison | null;

  // Phase 6: Presentation
  selectedPackageTier: 'Start' | 'Transform' | 'Elite' | 'Essential' | null;
  pdfUrl: string | null;
  bookedAppointmentId: string | null;

  // Staff follow-up workflow
  clinicStatus?: ClinicStatus;
  clinicNotes?: string;
  shareToken?: string;
  activityLog?: ActivityLogEntry[];

  // Protocol Packet (provider-internal, generated on demand)
  protocolPacket?: ProtocolPacketMeta;
}

// ── SESSION ACTIONS ──

export type MastermindSessionAction =
  | { type: 'SET_INTAKE'; data: Partial<ConsultationFormData> }
  | { type: 'SET_SOURCE_PHOTO'; url: string }
  | { type: 'SET_PHASE'; phase: MastermindPhase }
  | { type: 'SET_SCAN_RESULT'; result: AuraScanResult }
  | { type: 'SET_SCAN_ERROR'; error: { at: string; message: string; source: string } | null }
  | { type: 'SET_PLAN'; plan: MastermindPlan }
  | { type: 'SET_PROVIDER_REVIEW'; review: ProviderReviewState }
  | { type: 'ADD_MODIFICATION'; modification: PlanModification }
  | { type: 'SET_APPROVAL_STATUS'; status: ProviderReviewState['approvalStatus']; actor?: string }
  | { type: 'SET_SIMULATION'; comparison: SimulationComparison }
  | { type: 'SELECT_PACKAGE'; tier: 'Start' | 'Transform' | 'Elite' | 'Essential' }
  | { type: 'SET_PDF_URL'; url: string }
  | { type: 'SET_BOOKED'; appointmentId: string }
  | { type: 'COMPLETE' }
  | { type: 'SET_CLINIC_STATUS'; status: ClinicStatus; actor?: string }
  | { type: 'SET_CLINIC_NOTES'; notes: string; actor?: string }
  | { type: 'SET_SHARE_TOKEN'; token: string; actor?: string }
  | { type: 'SET_PROTOCOL_PACKET'; packetUrl: string; generatedAt: string; generatorActor: string; packetVersion: number };
