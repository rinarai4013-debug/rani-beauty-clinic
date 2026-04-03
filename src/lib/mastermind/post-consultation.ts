/**
 * Post-Consultation Automation
 *
 * Orchestrates everything that happens after a patient
 * completes the Mastermind consultation flow:
 *
 * 1. Generate branded PDF (if not already generated)
 * 2. Prepare n8n webhook payload for downstream automation
 * 3. Build completion response with PDF URL + automation payload
 *
 * This module is the ONLY place that assembles the completion
 * payload. The API route calls this and returns the result.
 * Actual n8n webhook firing happens in the route layer (thin).
 */

import type { MastermindSession } from '@/types/mastermind';
import { generateConsultationPdf, type PdfResult } from './pdf-generator';
import { getSelectedPackage, calculateFinancingOptions, getPlanTotalCost, getAllTreatments } from './index';

// ── Completion Result ──

export interface ConsultationCompletionResult {
  sessionId: string;
  status: 'completed';
  pdf: PdfResult;
  automationPayload: AutomationPayload;
  completedAt: string;
}

// ── Automation Payload (sent to n8n) ──

export interface AutomationPayload {
  /** Patient Info */
  patientName: string;
  patientEmail: string;

  /** Session context */
  sessionId: string;
  completedAt: string;

  /** Aura Scan Summary */
  auraScore: number;
  auraGrade: string;
  skinAge: number;
  chronologicalAge: number;
  topConcerns: string[];

  /** Selected Package */
  selectedPackageTier: string;
  selectedPackageName: string;
  packagePrice: number;
  packageSessions: number;
  treatmentList: string[];

  /** Financial */
  totalPlanCost: number;
  financingAvailable: boolean;
  lowestMonthlyPayment: number;

  /** Provider */
  providerName: string;
  providerNotes: string[];
  approvedAt: string;

  /** Downstream Triggers */
  triggers: {
    sendPatientPdf: boolean;
    createBookingLink: boolean;
    addToCrm: boolean;
    startFollowUpSequence: boolean;
    notifyFrontDesk: boolean;
  };
}

// ── Main Completion Orchestrator ──

export function buildCompletionResult(
  session: MastermindSession
): ConsultationCompletionResult {
  // Validate session is ready
  if (!session.auraScanResult) throw new Error('Session missing scan result');
  if (!session.mastermindPlan) throw new Error('Session missing treatment plan');
  if (!session.providerReview) throw new Error('Session missing provider review');
  if (!session.selectedPackageTier) throw new Error('No package selected');

  // 1. Generate PDF
  const pdf = generateConsultationPdf(session);

  // 2. Build automation payload
  const automationPayload = buildAutomationPayload(session);

  return {
    sessionId: session.id,
    status: 'completed',
    pdf,
    automationPayload,
    completedAt: new Date().toISOString(),
  };
}

// ── Payload Builder ──

function buildAutomationPayload(session: MastermindSession): AutomationPayload {
  // Safe access — buildCompletionResult already validated these exist,
  // but we use safe defaults throughout to prevent runtime crashes
  const scan = session.auraScanResult;
  const plan = session.mastermindPlan;
  const review = session.providerReview;
  const selectedPkg = getSelectedPackage(session);
  const allTreatments = plan ? getAllTreatments(plan) : [];
  const planCost = plan ? getPlanTotalCost(plan) : 0;

  const financingOptions = selectedPkg
    ? calculateFinancingOptions(selectedPkg.price)
    : [];

  const lowestMonthly = financingOptions.length > 0
    ? Math.min(...financingOptions.map((f) => f.monthlyPayment))
    : 0;

  return {
    // Patient
    patientName: session.patientName || '',
    patientEmail: session.patientEmail || '',

    // Session
    sessionId: session.id,
    completedAt: new Date().toISOString(),

    // Scan — safe defaults if scan is somehow null
    auraScore: scan?.auraScore?.overall ?? 0,
    auraGrade: scan?.auraScore?.grade ?? 'F',
    skinAge: scan?.auraScore?.skinAge ?? 0,
    chronologicalAge: scan?.auraScore?.chronologicalAge ?? 0,
    topConcerns: (scan?.detectedConcerns || []).slice(0, 5).map((c) => c.concern),

    // Package
    selectedPackageTier: session.selectedPackageTier || '',
    selectedPackageName: selectedPkg?.name || session.selectedPackageTier || '',
    packagePrice: selectedPkg?.price || 0,
    packageSessions: selectedPkg?.sessions || 0,
    treatmentList: allTreatments.map((t) => t.treatmentName),

    // Financial
    totalPlanCost: planCost,
    financingAvailable: financingOptions.length > 0,
    lowestMonthlyPayment: lowestMonthly,

    // Provider
    providerName: review?.providerName || '',
    providerNotes: review?.clinicalNotes || [],
    approvedAt: review?.approvedAt || '',

    // Triggers — all enabled by default for n8n to pick up
    triggers: {
      sendPatientPdf: true,
      createBookingLink: true,
      addToCrm: true,
      startFollowUpSequence: true,
      notifyFrontDesk: true,
    },
  };
}

// ── n8n Webhook Payload Builder ──

export function buildN8nWebhookPayload(result: ConsultationCompletionResult) {
  return {
    event: 'mastermind.consultation.completed',
    timestamp: result.completedAt,
    session_id: result.sessionId,
    patient: {
      name: result.automationPayload.patientName,
      email: result.automationPayload.patientEmail,
    },
    scan: {
      aura_score: result.automationPayload.auraScore,
      grade: result.automationPayload.auraGrade,
      skin_age: result.automationPayload.skinAge,
    },
    plan: {
      package_tier: result.automationPayload.selectedPackageTier,
      package_name: result.automationPayload.selectedPackageName,
      package_price: result.automationPayload.packagePrice,
      treatments: result.automationPayload.treatmentList,
      total_cost: result.automationPayload.totalPlanCost,
    },
    financing: {
      available: result.automationPayload.financingAvailable,
      lowest_monthly: result.automationPayload.lowestMonthlyPayment,
    },
    provider: {
      name: result.automationPayload.providerName,
      approved_at: result.automationPayload.approvedAt,
    },
    triggers: result.automationPayload.triggers,
    pdf: {
      filename: result.pdf.filename,
      generated_at: result.pdf.generatedAt,
    },
  };
}
