import type { ClinicStatus, ActivityLogEntry, ProviderReviewState } from './mastermind';

// ── Unified record shape ──

export interface UnifiedConsultation {
  id: string;
  source: 'mastermind' | 'intake_form';
  patientName: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  concerns: string[];
  goals: string;
  timeline: string;
  budget: string;
  clinicStatus: ClinicStatus;
  hasPlan: boolean;
  hasShareLink: boolean;
  shareToken: string | null;
  auraScore: number | null;
  auraGrade: string | null;
  selectedPackage: string | null;
  pipelinePhase: string | null;
  intakeSummary: string | null;
  aiPlan: string | null;
  aiNextStep: string | null;
  treatmentValue: string | null;
  activityLog: ActivityLogEntry[];
  // Provider review data
  providerReview: ProviderReviewState | null;
  needsReview: boolean;
  medicalFlags: string[];
  contraindications: string[];
  // Communication signals
  commStatus: 'unsent' | 'sent' | 'viewed' | 'clicked' | 'booked';
  lastSentAt: string | null;
  sendCount: number;
  // Revenue model
  estimatedValue: number; // Best estimated dollar value
  weightedValue: number;  // Value × stage probability
  revenueSource: 'package' | 'treatments' | 'ai_estimate' | 'none';
  daysSinceCreated: number;
  daysSinceLastActivity: number;
  isStuck: boolean; // High value, no progress, >3 days
  // For mastermind sessions, keep session ID for detail actions
  sessionId: string | null;
  // For intake records, keep Airtable record ID
  airtableRecordId: string | null;
  // Metabolic funnel metadata (optional for non-metabolic consults)
  metabolicTrack?: 'glp1' | 'hormones' | 'peptides' | 'hybrid' | 'unknown';
  metabolicRecommendationStatus?: 'eligible' | 'provider-review-required' | 'ineligible' | 'unknown';
}

// ── Pipeline Analytics Summary ──

export interface PipelineAnalytics {
  totalPipelineValue: number;
  weightedPipelineValue: number;
  stageBreakdown: {
    stage: string;
    count: number;
    totalValue: number;
    weightedValue: number;
    avgDaysInStage: number;
  }[];
  conversionRates: {
    submittedToPlan: number;
    planToApproved: number;
    approvedToContacted: number;
    contactedToBooked: number;
    overallCloseRate: number;
  };
  stuckConsultations: {
    id: string;
    patientName: string;
    estimatedValue: number;
    stage: string;
    daysSinceLastActivity: number;
    reason: string;
  }[];
  sourcePerformance: {
    source: string;
    count: number;
    totalValue: number;
    closeRate: number;
  }[];
  dailyPriorities: {
    id: string;
    patientName: string;
    estimatedValue: number;
    action: string;
    urgency: 'high' | 'medium' | 'low';
  }[];
}
