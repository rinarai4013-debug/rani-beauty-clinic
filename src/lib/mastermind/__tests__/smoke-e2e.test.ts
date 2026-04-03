/**
 * Smoke Test — Full Mastermind Pipeline
 *
 * Exercises the complete consultation flow from intake to completion
 * using real module calls (not HTTP). Tests state continuity across
 * all 10 phase transitions.
 */

import { describe, it, expect } from 'vitest';
import {
  createSession,
  saveSession,
  getSessionById,
  sessionReducer,
} from '../session';
import {
  isReadyForPresentation,
  isReadyForPdf,
  isReadyForCompletion,
  getSelectedPackage,
  getAvailableSlides,
  calculateFinancingOptions,
  getScoreProjection,
  getCostOfDelay,
} from '../index';
import { generateConsultationPdf } from '../pdf-generator';
import { buildCompletionResult, buildN8nWebhookPayload } from '../post-consultation';
import { mockAuraScanResult, mockMastermindPlan, mockSimulationComparison } from '../mock-data';
import type { MastermindSession, ConsultationFormData } from '@/types/mastermind';

// Realistic intake data matching ConsultationFormData shape
const INTAKE: Partial<ConsultationFormData> = {
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.j@example.com',
  phone: '(425) 555-0123',
  dob: '1984-03-15',
  skinConcerns: ['aging-skin', 'hyperpigmentation', 'skin-laxity'],
  targetAreas: ['forehead', 'cheeks', 'jawline'],
  treatmentInterests: ['injectables', 'skin-tightening', 'facial'],
  skinType: 'combination',
  treatmentHistory: 'Had a HydraFacial 6 months ago',
  goals: 'Look refreshed for my daughter\'s wedding',
  timeline: 'event',
  budget: 'premium',
} as unknown as Partial<ConsultationFormData>;

describe('Full Mastermind Pipeline Smoke Test', () => {
  let session: MastermindSession;

  // ── Phase 1: Intake ──

  it('Step 1: creates session with intake data', () => {
    session = createSession({
      intakeData: INTAKE,
      patientName: 'Sarah Johnson',
      patientEmail: 'sarah.j@example.com',
      sourcePhotoUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==', // mock photo
    });
    saveSession(session);

    expect(session.phase).toBe('intake');
    expect(session.patientName).toBe('Sarah Johnson');
    expect(session.sourcePhotoUrl).toBeTruthy();
    expect(session.intakeData).toBeTruthy();
  });

  // ── Phase 2: Aura Scan ──

  it('Step 2: runs aura scan and stores result', () => {
    const scanResult = mockAuraScanResult();
    session = sessionReducer(session, { type: 'SET_SCAN_RESULT', result: scanResult });
    saveSession(session);

    expect(session.phase).toBe('scan_complete');
    expect(session.auraScanResult).toBeTruthy();
    expect(session.auraScanResult!.auraScore.overall).toBe(68);
    expect(session.auraScanResult!.detectedConcerns.length).toBeGreaterThan(0);
  });

  // ── Phase 3: Plan Generation ──

  it('Step 3: generates treatment plan', () => {
    const plan = mockMastermindPlan();
    session = sessionReducer(session, { type: 'SET_PLAN', plan });
    saveSession(session);

    expect(session.phase).toBe('plan_ready');
    expect(session.mastermindPlan).toBeTruthy();
    expect(session.mastermindPlan!.recommendations.primary.length).toBeGreaterThan(0);
    expect(session.mastermindPlan!.packages).toHaveLength(3);
  });

  // ── Phase 4: Provider Review ──

  it('Step 4: provider reviews and approves plan', () => {
    // Set up review
    session = sessionReducer(session, {
      type: 'SET_PROVIDER_REVIEW',
      review: {
        providerId: 'rina@ranibeautyclinic.com',
        providerName: 'Rina',
        modifications: [],
        clinicalNotes: ['Patient is an excellent candidate for all proposed treatments'],
        approvalStatus: 'pending',
      },
    });
    expect(session.phase).toBe('provider_review');

    // Add a modification
    session = sessionReducer(session, {
      type: 'ADD_MODIFICATION',
      modification: {
        id: 'mod_1',
        timestamp: new Date().toISOString(),
        type: 'note',
        details: 'Adjusted Botox units from 25 to 20 for forehead',
        providerId: 'rina@ranibeautyclinic.com',
      },
    });
    expect(session.providerReview!.modifications).toHaveLength(1);

    // Approve
    session = sessionReducer(session, { type: 'SET_APPROVAL_STATUS', status: 'approved' });
    saveSession(session);

    expect(session.phase).toBe('approved');
    expect(session.providerReview!.approvalStatus).toBe('approved');
    expect(session.providerReview!.approvedAt).toBeTruthy();
  });

  // ── Phase 5: Simulation ──

  it('Step 5: generates simulation comparison', () => {
    const comparison = mockSimulationComparison();
    session = sessionReducer(session, { type: 'SET_SIMULATION', comparison });
    saveSession(session);

    expect(session.phase).toBe('simulation_ready');
    expect(session.simulationComparison).toBeTruthy();
    expect(session.simulationComparison!.withTreatment.frames).toHaveLength(4);
    expect(session.simulationComparison!.withoutTreatment.frames).toHaveLength(4);
  });

  // ── Phase 6: Presentation Readiness ──

  it('Step 6: verifies presentation readiness', () => {
    expect(isReadyForPresentation(session)).toBe(true);

    const slides = getAvailableSlides(session);
    expect(slides).toHaveLength(5);
    expect(slides.map(s => s.id)).toEqual([
      'aura-score',
      'concern-breakdown',
      'treatment-plan',
      'simulation',
      'package-selection',
    ]);
  });

  it('Step 6b: score projection is available', () => {
    const proj = getScoreProjection(session);
    expect(proj).toBeTruthy();
    expect(proj!.current).toBe(68);
    expect(proj!.sixMonth).toBeGreaterThan(proj!.current);
  });

  it('Step 6c: cost of delay is available', () => {
    const cost = getCostOfDelay(session);
    expect(cost).toBeTruthy();
    expect(cost!.costIfDelayed1Year).toBeGreaterThan(cost!.currentPlanCost);
  });

  // ── Phase 7: Package Selection ──

  it('Step 7: selects Transform package', () => {
    session = sessionReducer(session, { type: 'SELECT_PACKAGE', tier: 'Transform' });
    saveSession(session);

    expect(session.selectedPackageTier).toBe('Transform');

    const pkg = getSelectedPackage(session);
    expect(pkg).toBeTruthy();
    expect(pkg!.tier).toBe('Transform');
    expect(pkg!.name).toBe('Complete Transformation');
    expect(pkg!.highlighted).toBe(true);
  });

  it('Step 7b: financing options are correct for selected package', () => {
    const pkg = getSelectedPackage(session)!;
    const options = calculateFinancingOptions(pkg.price);
    expect(options).toHaveLength(4);
    expect(options[0].apr).toBe(0); // 6-month 0% interest
    expect(options[0].monthlyPayment).toBe(Math.round(pkg.price / 6));
  });

  // ── Phase 8: PDF Generation ──

  it('Step 8: generates branded PDF', () => {
    expect(isReadyForPdf(session)).toBe(true);

    const pdf = generateConsultationPdf(session);
    expect(pdf.html).toContain('Sarah Johnson');
    expect(pdf.html).toContain('Rani');
    expect(pdf.html).toContain('68'); // Aura Score
    expect(pdf.html).toContain('Transform');
    expect(pdf.html).toContain('Complete Transformation');
    expect(pdf.html).toContain('Botox');
    expect(pdf.filename).toContain('sarah-johnson');
    expect(pdf.html).toContain('Individual results may vary'); // Disclaimer

    // Store URL in session
    session = sessionReducer(session, {
      type: 'SET_PDF_URL',
      url: '/api/mastermind/pdf/serve?file=' + pdf.filename,
    });
    saveSession(session);

    expect(session.pdfUrl).toBeTruthy();
  });

  // ── Phase 9: Completion ──

  it('Step 9: enters presenting phase', () => {
    session = sessionReducer(session, { type: 'SET_PHASE', phase: 'presenting' });
    saveSession(session);

    expect(session.phase).toBe('presenting');
    expect(isReadyForCompletion(session)).toBe(true);
  });

  it('Step 10: completes consultation with automation payload', () => {
    const result = buildCompletionResult(session);

    expect(result.status).toBe('completed');
    expect(result.sessionId).toBe(session.id);
    expect(result.pdf.html).toContain('Sarah Johnson');

    // Automation payload
    const payload = result.automationPayload;
    expect(payload.patientName).toBe('Sarah Johnson');
    expect(payload.auraScore).toBe(68);
    expect(payload.selectedPackageTier).toBe('Transform');
    expect(payload.treatmentList.length).toBeGreaterThan(0);
    expect(payload.financingAvailable).toBe(true);
    expect(payload.triggers.sendPatientPdf).toBe(true);
    expect(payload.triggers.addToCrm).toBe(true);

    // n8n webhook payload
    const webhook = buildN8nWebhookPayload(result);
    expect(webhook.event).toBe('mastermind.consultation.completed');
    expect(webhook.patient.name).toBe('Sarah Johnson');
    expect(webhook.plan.package_tier).toBe('Transform');
    expect(webhook.pdf.filename).toContain('sarah-johnson');
  });

  it('Step 10b: session completes and persists', () => {
    session = sessionReducer(session, { type: 'COMPLETE' });
    saveSession(session);

    expect(session.phase).toBe('completed');

    // Verify full session integrity at end
    expect(session.intakeData).toBeTruthy();
    expect(session.sourcePhotoUrl).toBeTruthy();
    expect(session.auraScanResult).toBeTruthy();
    expect(session.mastermindPlan).toBeTruthy();
    expect(session.providerReview).toBeTruthy();
    expect(session.providerReview!.approvalStatus).toBe('approved');
    expect(session.simulationComparison).toBeTruthy();
    expect(session.selectedPackageTier).toBe('Transform');
    expect(session.pdfUrl).toBeTruthy();
  });

  // ── Partial Data Fallbacks ──

  it('handles session with scan only (no plan)', () => {
    const partial = createSession({
      auraScanResult: mockAuraScanResult(),
    });
    expect(isReadyForPresentation(partial)).toBe(false);

    const slides = getAvailableSlides(partial);
    expect(slides).toHaveLength(2); // aura-score + concern-breakdown
  });

  it('handles empty session gracefully', () => {
    const empty = createSession();
    expect(isReadyForPresentation(empty)).toBe(false);
    expect(isReadyForPdf(empty)).toBe(false);
    expect(isReadyForCompletion(empty)).toBe(false);
    expect(getSelectedPackage(empty)).toBeNull();
    expect(getScoreProjection(empty)).toBeNull();
    expect(getCostOfDelay(empty)).toBeNull();
    expect(getAvailableSlides(empty)).toHaveLength(0);
  });

  it('handles session without source photo', () => {
    const noPhoto = createSession({
      auraScanResult: mockAuraScanResult(),
      mastermindPlan: mockMastermindPlan(),
      sourcePhotoUrl: null,
    });
    // Presentation still works — simulation slide shows but needs photo for rendering
    const slides = getAvailableSlides(noPhoto);
    expect(slides.length).toBeGreaterThan(0);
  });
});
