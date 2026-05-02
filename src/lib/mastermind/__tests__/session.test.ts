import { describe, it, expect } from 'vitest';
import {
  sessionReducer,
  createSession,
} from '../session';
import type { MastermindSession, MastermindSessionAction } from '@/types/mastermind';
import { mockAuraScanResult, mockMastermindPlan, mockSimulationComparison } from '../mock-data';

function makeSession(overrides?: Partial<MastermindSession>): MastermindSession {
  return createSession(overrides);
}

describe('createSession', () => {
  it('creates a session with default values', () => {
    const session = createSession();
    expect(session.id).toMatch(/^ms_/);
    expect(session.phase).toBe('intake');
    expect(session.intakeData).toBeNull();
    expect(session.patientName).toBe('');
    expect(session.auraScanResult).toBeNull();
    expect(session.mastermindPlan).toBeNull();
    expect(session.providerReview).toBeNull();
    expect(session.simulationComparison).toBeNull();
    expect(session.selectedPackageTier).toBeNull();
    expect(session.pdfUrl).toBeNull();
    expect(session.bookedAppointmentId).toBeNull();
  });

  it('accepts overrides', () => {
    const session = createSession({ patientName: 'Jane Doe', patientEmail: 'jane@test.com' });
    expect(session.patientName).toBe('Jane Doe');
    expect(session.patientEmail).toBe('jane@test.com');
    expect(session.phase).toBe('intake'); // default preserved
  });

  it('generates unique IDs', () => {
    const s1 = createSession();
    const s2 = createSession();
    expect(s1.id).not.toBe(s2.id);
  });

  it('includes sourcePhotoUrl field', () => {
    const session = createSession();
    expect(session.sourcePhotoUrl).toBeNull();
  });
});

describe('sessionReducer', () => {
  it('SET_INTAKE stores data and extracts name/email', () => {
    const session = makeSession();
    const result = sessionReducer(session, {
      type: 'SET_INTAKE',
      data: { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@test.com' },
    });
    expect(result.patientName).toBe('Sarah Johnson');
    expect(result.patientEmail).toBe('sarah@test.com');
    expect(result.intakeData).toBeTruthy();
  });

  it('SET_SOURCE_PHOTO stores photo URL', () => {
    const session = makeSession();
    const result = sessionReducer(session, {
      type: 'SET_SOURCE_PHOTO',
      url: 'data:image/jpeg;base64,/9j/test',
    });
    expect(result.sourcePhotoUrl).toBe('data:image/jpeg;base64,/9j/test');
  });

  it('SET_PHASE updates phase', () => {
    const session = makeSession();
    const result = sessionReducer(session, { type: 'SET_PHASE', phase: 'scanning' });
    expect(result.phase).toBe('scanning');
  });

  it('SET_SCAN_RESULT stores scan and transitions to scan_complete', () => {
    const session = makeSession();
    const scan = mockAuraScanResult();
    const result = sessionReducer(session, { type: 'SET_SCAN_RESULT', result: scan });
    expect(result.auraScanResult).toBe(scan);
    expect(result.phase).toBe('scan_complete');
  });

  it('SET_SCAN_RESULT invalidates stale downstream plan data, even after approval', () => {
    const plan = mockMastermindPlan();
    const sim = mockSimulationComparison();
    const session = makeSession({
      phase: 'approved',
      mastermindPlan: plan,
      treatmentPlanCustomization: {
        updatedAt: new Date().toISOString(),
        submissionDate: new Date().toISOString(),
        items: [],
        selectedTotal: 0,
        selectedSessionCount: 0,
      },
      providerReview: {
        providerId: 'p1',
        providerName: 'Dr. Smith',
        modifications: [],
        clinicalNotes: [],
        approvalStatus: 'approved',
      },
      simulationComparison: sim,
    });
    const scan = mockAuraScanResult();
    const result = sessionReducer(session, { type: 'SET_SCAN_RESULT', result: scan });
    expect(result.auraScanResult).toBe(scan);
    expect(result.phase).toBe('scan_complete');
    expect(result.mastermindPlan).toBeNull();
    expect(result.treatmentPlanCustomization).toBeUndefined();
    expect(result.providerReview).toBeNull();
    expect(result.simulationComparison).toBeNull();
  });

  it('SET_PLAN stores plan and transitions to plan_ready', () => {
    const session = makeSession();
    const plan = mockMastermindPlan();
    const result = sessionReducer(session, { type: 'SET_PLAN', plan });
    expect(result.mastermindPlan).toBe(plan);
    expect(result.phase).toBe('plan_ready');
  });

  it('SET_PLAN clears stale customization and review state', () => {
    const plan = mockMastermindPlan();
    const session = makeSession({
      treatmentPlanCustomization: {
        updatedAt: new Date().toISOString(),
        submissionDate: new Date().toISOString(),
        items: [],
        selectedTotal: 0,
        selectedSessionCount: 0,
      },
      providerReview: {
        providerId: 'p1',
        providerName: 'Dr. Smith',
        modifications: [],
        clinicalNotes: [],
        approvalStatus: 'pending',
      },
    });
    const result = sessionReducer(session, { type: 'SET_PLAN', plan });
    expect(result.mastermindPlan).toBe(plan);
    expect(result.treatmentPlanCustomization).toBeUndefined();
    expect(result.providerReview).toBeNull();
  });

  it('SET_PROVIDER_REVIEW stores review and transitions to provider_review', () => {
    const session = makeSession();
    const review = {
      providerId: 'p1',
      providerName: 'Dr. Smith',
      modifications: [],
      clinicalNotes: [],
      approvalStatus: 'pending' as const,
    };
    const result = sessionReducer(session, { type: 'SET_PROVIDER_REVIEW', review });
    expect(result.providerReview?.providerName).toBe('Dr. Smith');
    expect(result.phase).toBe('provider_review');
  });

  it('SET_APPROVAL_STATUS approved transitions to approved phase', () => {
    const session = makeSession({
      providerReview: {
        providerId: 'p1',
        providerName: 'Dr. Smith',
        modifications: [],
        clinicalNotes: [],
        approvalStatus: 'pending',
      },
    });
    const result = sessionReducer(session, { type: 'SET_APPROVAL_STATUS', status: 'approved' });
    expect(result.phase).toBe('approved');
    expect(result.providerReview?.approvalStatus).toBe('approved');
    expect(result.providerReview?.approvedAt).toBeTruthy();
  });

  it('SET_APPROVAL_STATUS rejected does not change phase', () => {
    const session = makeSession({ phase: 'provider_review' });
    const result = sessionReducer(session, { type: 'SET_APPROVAL_STATUS', status: 'rejected' });
    expect(result.phase).toBe('provider_review');
  });

  it('SET_SIMULATION stores comparison and transitions to simulation_ready', () => {
    const session = makeSession();
    const sim = mockSimulationComparison();
    const result = sessionReducer(session, { type: 'SET_SIMULATION', comparison: sim });
    expect(result.simulationComparison).toBe(sim);
    expect(result.phase).toBe('simulation_ready');
  });

  it('SELECT_PACKAGE stores tier', () => {
    const session = makeSession();
    const result = sessionReducer(session, { type: 'SELECT_PACKAGE', tier: 'Transform' });
    expect(result.selectedPackageTier).toBe('Transform');
  });

  it('SET_PDF_URL stores URL', () => {
    const session = makeSession();
    const result = sessionReducer(session, { type: 'SET_PDF_URL', url: 'https://example.com/plan.pdf' });
    expect(result.pdfUrl).toBe('https://example.com/plan.pdf');
  });

  it('SET_BOOKED stores appointment ID', () => {
    const session = makeSession();
    const result = sessionReducer(session, { type: 'SET_BOOKED', appointmentId: 'apt_123' });
    expect(result.bookedAppointmentId).toBe('apt_123');
  });

  it('COMPLETE transitions to completed', () => {
    const session = makeSession({ phase: 'presenting' });
    const result = sessionReducer(session, { type: 'COMPLETE' });
    expect(result.phase).toBe('completed');
  });

  it('ADD_MODIFICATION appends to existing review', () => {
    const session = makeSession({
      providerReview: {
        providerId: 'p1',
        providerName: 'Dr. Smith',
        modifications: [],
        clinicalNotes: [],
        approvalStatus: 'pending',
      },
    });
    const result = sessionReducer(session, {
      type: 'ADD_MODIFICATION',
      modification: {
        id: 'mod_1',
        timestamp: new Date().toISOString(),
        type: 'note',
        details: 'Added clinical note',
        providerId: 'p1',
      },
    });
    expect(result.providerReview?.modifications).toHaveLength(1);
  });

  it('ADD_MODIFICATION does nothing if no review exists', () => {
    const session = makeSession();
    const result = sessionReducer(session, {
      type: 'ADD_MODIFICATION',
      modification: {
        id: 'mod_1',
        timestamp: new Date().toISOString(),
        type: 'note',
        details: 'test',
        providerId: 'p1',
      },
    });
    expect(result.providerReview).toBeNull();
  });

  it('always updates updatedAt on state change', () => {
    const session = makeSession();
    const result = sessionReducer(session, { type: 'SET_PHASE', phase: 'scanning' });
    // updatedAt should be a valid ISO timestamp
    expect(new Date(result.updatedAt).getTime()).not.toBeNaN();
    // The returned object should be a new reference (immutable update)
    expect(result).not.toBe(session);
  });

  it('handles unknown action type gracefully', () => {
    const session = makeSession();
    const result = sessionReducer(session, { type: 'UNKNOWN_TYPE' } as unknown as MastermindSessionAction);
    expect(result).toBe(session); // returns unchanged state
  });
});
