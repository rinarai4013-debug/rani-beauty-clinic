/**
 * Patient-facing plan types — shared between API routes and client components.
 * These are SANITIZED types that strip provider-only data.
 */

export interface PatientAuraScore {
  overall: number;
  grade: string;
  label: string;
  skinAge: number;
  chronologicalAge: number;
  skinAgeDelta: number;
  percentile: number;
}

export interface PatientConcern {
  concern: string;
  severity: string;
  description: string;
  trending: string;
  zones: string[];
}

export interface PatientZone {
  zoneName: string;
  overallScore: number;
  concerns: { type: string; severity: number }[];
}

export interface PatientTreatment {
  treatmentName: string;
  category: string;
  targetConcerns: string[];
  targetZones?: string[];
  sessionsRequired: number;
  intervalBetweenSessions: string;
  expectedImprovement: string;
  timeToResults: string;
  longevity: string;
  perSession: number;
  totalEstimate: number;
  priority: string;
  downtime: string;
  riskLevel: string;
  aiReasoning: string;
  synergiesWith: string[];
}

export interface PatientSequenceItem {
  phase: number;
  phaseName: string;
  duration: string;
  treatments: { treatmentName: string; week: number; sessionNumber: number; scheduledDate?: string; scheduledDay?: number; targetAreas?: string[] }[];
  expectedMilestone: string;
}

export interface PatientCustomTreatmentItem {
  id: string;
  treatmentName: string;
  category: string;
  selected: boolean;
  sessions: number;
  perSession: number;
  totalEstimate: number;
  scheduledDate: string;
  scheduledDay: number;
  targetAreas: string[];
  notes?: string;
  priority: string;
  source: 'ai' | 'staff';
}

export interface PatientTreatmentPlanCustomization {
  updatedAt: string;
  submissionDate: string;
  items: PatientCustomTreatmentItem[];
  selectedTotal: number;
  selectedSessionCount: number;
  planNotes?: string;
}

export interface PatientPackage {
  tier: string;
  name: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  discount: number;
  sessions: number;
  lineItems: { service: string; qty: number; unitPrice: number; total: number }[];
  monthlyPayment12: number;
  monthlyPayment24: number;
  highlighted: boolean;
  extras: string[];
  bestFor: string;
  resultIntensity: string;
  concernsAddressed: string[];
  whyBest?: string;
  savingsVsStandalone: number;
}

export interface PatientAftercare {
  treatmentName: string;
  immediateAftercare: string[];
  weekOneGuidance: string[];
  productsRecommended: { product: string; reason: string }[];
}

export interface PatientSimulation {
  withTreatment: {
    frames: {
      timepoint: string;
      monthNumber: number;
      description: string;
      auraScoreProjection: number;
      skinAgeProjection: number;
      imageDataUrl: string;
      kind?: 'photo-simulation' | 'data-projection';
    }[];
    narrative: string;
  };
  withoutTreatment: {
    frames: {
      timepoint: string;
      monthNumber: number;
      description: string;
      auraScoreProjection: number;
      skinAgeProjection: number;
      imageDataUrl: string;
      kind?: 'photo-simulation' | 'data-projection';
    }[];
    narrative: string;
  };
  comparison: {
    auraScoreDelta: number;
    skinAgeDelta: number;
    keyDifferentiators: string[];
  };
}

export interface PatientDeviceAnalysis {
  categories: {
    label: string;
    absoluteScore: number;
    peerScore: number;
    severity: string;
    description: string;
  }[];
  compositeSkinScore: number;
}

export interface PatientPredictiveMetrics {
  withoutIntervention: {
    oneYear: { skinAge: number; auraScore: number; topConcerns: string[] };
    threeYears: { skinAge: number; auraScore: number; topConcerns: string[] };
    fiveYears: { skinAge: number; auraScore: number; topConcerns: string[] };
  };
  withTreatment: {
    threeMonths: { skinAge: number; auraScore: number };
    sixMonths: { skinAge: number; auraScore: number };
    oneYear: { skinAge: number; auraScore: number };
  };
}

export interface PatientPlanData {
  patientName: string;
  consultationDate: string;
  selectedPackageTier?: 'Start' | 'Transform' | 'Elite' | 'Essential' | null;
  auraScore: PatientAuraScore;
  deviceAnalysis: PatientDeviceAnalysis | null;
  concerns: PatientConcern[];
  zones: PatientZone[];
  predictiveMetrics: PatientPredictiveMetrics | null;
  treatments: {
    primary: PatientTreatment[];
    complementary: PatientTreatment[];
    maintenance: PatientTreatment[];
  };
  sequencing: PatientSequenceItem[];
  customPlan: PatientTreatmentPlanCustomization | null;
  packages: PatientPackage[];
  aftercare: PatientAftercare[];
  simulation: PatientSimulation | null;
  summary: {
    patientFacing: string;
    keyHighlights: string[];
    addressedConcerns: { concern: string; solution: string; timeline: string }[];
  };
}
