import { describe, it, expect } from 'vitest';
import { buildCompletionResult, buildN8nWebhookPayload } from '../post-consultation';
import { createSession } from '../session';
import { mockAuraScanResult, mockMastermindPlan, mockSimulationComparison } from '../mock-data';
import type { MastermindSession } from '@/types/mastermind';

function makeCompletableSession(): MastermindSession {
  return createSession({
    phase: 'presenting',
    patientName: 'Sarah Johnson',
    patientEmail: 'sarah@test.com',
    auraScanResult: mockAuraScanResult(),
    mastermindPlan: mockMastermindPlan(),
    providerReview: {
      providerId: 'p1',
      providerName: 'Dr. Smith',
      modifications: [],
      clinicalNotes: ['Patient is a good candidate'],
      approvalStatus: 'approved',
      approvedAt: new Date().toISOString(),
    },
    simulationComparison: mockSimulationComparison(),
    selectedPackageTier: 'Transform',
  });
}

describe('buildCompletionResult', () => {
  it('builds complete result from valid session', () => {
    const session = makeCompletableSession();
    const result = buildCompletionResult(session);

    expect(result.sessionId).toBe(session.id);
    expect(result.status).toBe('completed');
    expect(result.completedAt).toBeTruthy();
    expect(result.pdf).toBeTruthy();
    expect(result.pdf.html).toContain('Sarah Johnson');
    expect(result.pdf.filename).toContain('sarah-johnson');
    expect(result.automationPayload).toBeTruthy();
  });

  it('automation payload has correct patient info', () => {
    const result = buildCompletionResult(makeCompletableSession());
    expect(result.automationPayload.patientName).toBe('Sarah Johnson');
    expect(result.automationPayload.patientEmail).toBe('sarah@test.com');
  });

  it('automation payload has scan data', () => {
    const result = buildCompletionResult(makeCompletableSession());
    expect(result.automationPayload.auraScore).toBe(68);
    expect(result.automationPayload.auraGrade).toBe('C');
    expect(result.automationPayload.topConcerns.length).toBeGreaterThan(0);
  });

  it('automation payload has package data', () => {
    const result = buildCompletionResult(makeCompletableSession());
    expect(result.automationPayload.selectedPackageTier).toBe('Transform');
    expect(result.automationPayload.packagePrice).toBeGreaterThan(0);
    expect(result.automationPayload.treatmentList.length).toBeGreaterThan(0);
  });

  it('automation payload has financing data', () => {
    const result = buildCompletionResult(makeCompletableSession());
    expect(result.automationPayload.financingAvailable).toBe(true);
    expect(result.automationPayload.lowestMonthlyPayment).toBeGreaterThan(0);
  });

  it('automation payload has all triggers enabled', () => {
    const result = buildCompletionResult(makeCompletableSession());
    const triggers = result.automationPayload.triggers;
    expect(triggers.sendPatientPdf).toBe(true);
    expect(triggers.createBookingLink).toBe(true);
    expect(triggers.addToCrm).toBe(true);
    expect(triggers.startFollowUpSequence).toBe(true);
    expect(triggers.notifyFrontDesk).toBe(true);
  });

  it('throws when scan missing', () => {
    const session = makeCompletableSession();
    session.auraScanResult = null;
    expect(() => buildCompletionResult(session)).toThrow('scan result');
  });

  it('throws when plan missing', () => {
    const session = makeCompletableSession();
    session.mastermindPlan = null;
    expect(() => buildCompletionResult(session)).toThrow('treatment plan');
  });

  it('throws when review missing', () => {
    const session = makeCompletableSession();
    session.providerReview = null;
    expect(() => buildCompletionResult(session)).toThrow('provider review');
  });

  it('throws when package not selected', () => {
    const session = makeCompletableSession();
    session.selectedPackageTier = null;
    expect(() => buildCompletionResult(session)).toThrow('package');
  });
});

describe('buildN8nWebhookPayload', () => {
  it('transforms completion result into webhook shape', () => {
    const session = makeCompletableSession();
    const completion = buildCompletionResult(session);
    const payload = buildN8nWebhookPayload(completion);

    expect(payload.event).toBe('mastermind.consultation.completed');
    expect(payload.timestamp).toBeTruthy();
    expect(payload.session_id).toBe(session.id);
    expect(payload.patient.name).toBe('Sarah Johnson');
    expect(payload.scan.aura_score).toBe(68);
    expect(payload.plan.package_tier).toBe('Transform');
    expect(payload.triggers.sendPatientPdf).toBe(true);
    expect(payload.pdf.filename).toContain('sarah-johnson');
  });

  it('uses snake_case for all webhook fields', () => {
    const completion = buildCompletionResult(makeCompletableSession());
    const payload = buildN8nWebhookPayload(completion);

    // Verify key naming convention
    expect(payload).toHaveProperty('session_id');
    expect(payload.scan).toHaveProperty('aura_score');
    expect(payload.scan).toHaveProperty('skin_age');
    expect(payload.plan).toHaveProperty('package_tier');
    expect(payload.plan).toHaveProperty('total_cost');
    expect(payload.financing).toHaveProperty('lowest_monthly');
    expect(payload.provider).toHaveProperty('approved_at');
    expect(payload.pdf).toHaveProperty('generated_at');
  });
});
