/**
 * HIPAA Audit Engine — Production Test Suite
 *
 * Covers PHI access logging, breach notification requirements (HHS/media
 * thresholds + 60-day deadlines), training compliance, HIPAA scoring, and
 * breach lifecycle. This is compliance code — every test verifies a specific,
 * boundary-sensitive behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  PHIAccessLog,
  BreachNotification,
  TrainingCompletion,
  BusinessAssociateAgreement,
} from '@/types/compliance';

// ── Mock audit-trail BEFORE importing the SUT ────────────────────────
const createAuditEntryMock = vi.fn();
vi.mock('@/lib/compliance/audit-trail', () => ({
  createAuditEntry: (...args: unknown[]) => createAuditEntryMock(...args),
}));

import {
  logPHIAccess,
  getAccessLogs,
  assessBreachNotificationRequirements,
  getTrainingComplianceStatus,
  calculateHIPAAScore,
  reportBreach,
  updateBreach,
  seedHIPAAData,
  clearHIPAAData,
} from '@/lib/compliance/hipaa-audit';

// ── Fixtures ─────────────────────────────────────────────────────────

const FROZEN_NOW = new Date('2026-04-09T12:00:00Z');

function makeAccessLog(overrides: Partial<PHIAccessLog> = {}): PHIAccessLog {
  return {
    id: 'phi_seed_1',
    userId: 'user_1',
    userName: 'Alice Provider',
    userRole: 'provider',
    patientId: 'pat_1',
    patientName: 'Jane Doe',
    action: 'view',
    dataCategory: 'medical_history',
    ipAddress: '10.0.0.1',
    timestamp: FROZEN_NOW.toISOString(),
    ...overrides,
  };
}

function makeBreach(overrides: Partial<BreachNotification> = {}): BreachNotification {
  return {
    id: 'breach_seed_1',
    discoveryDate: '2026-04-09',
    breachDate: '2026-04-01',
    description: 'Unauthorized access to patient records via phishing',
    dataInvolved: ['demographics', 'medical_history'],
    individualsAffected: 10,
    severity: 'medium',
    status: 'investigating',
    correctiveActions: [],
    hhs_reported: false,
    individuals_notified: false,
    media_notified: false,
    investigator: 'compliance_officer',
    ...overrides,
  };
}

function makeTraining(overrides: Partial<TrainingCompletion> = {}): TrainingCompletion {
  return {
    id: 'train_seed_1',
    staffId: 'staff_1',
    staffName: 'Alice Provider',
    staffRole: 'provider',
    trainingType: 'hipaa_privacy',
    completedDate: '2025-10-09',
    expirationDate: '2027-04-09', // 2 years out — safely current
    score: 98,
    passingScore: 80,
    passed: true,
    renewalRequired: true,
    ...overrides,
  };
}

function makeBAA(
  overrides: Partial<BusinessAssociateAgreement> = {}
): BusinessAssociateAgreement {
  return {
    id: 'baa_seed_1',
    vendorName: 'Airtable',
    vendorContact: 'Support',
    vendorEmail: 'baa@airtable.com',
    serviceDescription: 'Database',
    effectiveDate: '2025-01-01',
    expirationDate: '2027-01-01',
    renewalDate: '2026-12-01',
    status: 'active',
    signedBy: 'CEO',
    lastReviewDate: '2026-01-01',
    nextReviewDate: '2026-07-01',
    ...overrides,
  };
}

// ── Shared Setup ─────────────────────────────────────────────────────

beforeEach(() => {
  clearHIPAAData();
  createAuditEntryMock.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(FROZEN_NOW);
});

afterEach(() => {
  vi.useRealTimers();
  clearHIPAAData();
});

// ─────────────────────────────────────────────────────────────────────
// logPHIAccess
// ─────────────────────────────────────────────────────────────────────

describe('logPHIAccess', () => {
  const baseParams = {
    userId: 'u_42',
    userName: 'Dr. Smith',
    userRole: 'provider',
    patientId: 'pat_777',
    patientName: 'John Q. Patient',
    action: 'view' as const,
    dataCategory: 'treatment_records' as const,
    ipAddress: '192.168.1.10',
  };

  it('creates an entry with a phi_-prefixed unique id and ISO timestamp at now', () => {
    const entry = logPHIAccess(baseParams);

    expect(entry.id).toMatch(/^phi_\d+_[a-z0-9]+$/);
    expect(entry.timestamp).toBe(FROZEN_NOW.toISOString());
  });

  it('generates distinct ids for two sequential calls', () => {
    const a = logPHIAccess(baseParams);
    const b = logPHIAccess(baseParams);
    expect(a.id).not.toBe(b.id);
  });

  it('records every caller-provided parameter verbatim on the entry', () => {
    const entry = logPHIAccess({ ...baseParams, details: 'Chart review for follow-up' });

    expect(entry).toMatchObject({
      userId: 'u_42',
      userName: 'Dr. Smith',
      userRole: 'provider',
      patientId: 'pat_777',
      patientName: 'John Q. Patient',
      action: 'view',
      dataCategory: 'treatment_records',
      ipAddress: '192.168.1.10',
      details: 'Chart review for follow-up',
    });
  });

  it('persists the entry so it is retrievable via getAccessLogs', () => {
    const entry = logPHIAccess(baseParams);
    const logs = getAccessLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].id).toBe(entry.id);
  });

  it('forwards a phi_<action>-prefixed audit entry to createAuditEntry with patient context', () => {
    logPHIAccess({ ...baseParams, action: 'export', details: 'For external consult' });

    expect(createAuditEntryMock).toHaveBeenCalledTimes(1);
    const call = createAuditEntryMock.mock.calls[0][0];
    expect(call).toMatchObject({
      userId: 'u_42',
      userName: 'Dr. Smith',
      userRole: 'provider',
      action: 'phi_export',
      resourceType: 'patient_record',
      resourceId: 'pat_777',
      ipAddress: '192.168.1.10',
    });
    expect(call.details).toContain('export');
    expect(call.details).toContain('treatment_records');
    expect(call.details).toContain('John Q. Patient');
    expect(call.details).toContain('For external consult');
  });

  it('omits the trailing details segment when no details are supplied', () => {
    logPHIAccess(baseParams);
    const call = createAuditEntryMock.mock.calls[0][0];
    // Should NOT contain a colon-separated details tail
    expect(call.details).not.toMatch(/:\s/);
  });
});

// ─────────────────────────────────────────────────────────────────────
// getAccessLogs — filtering, boundaries, sort
// ─────────────────────────────────────────────────────────────────────

describe('getAccessLogs', () => {
  const logs: PHIAccessLog[] = [
    makeAccessLog({
      id: 'a',
      userId: 'alice',
      patientId: 'pat_1',
      action: 'view',
      timestamp: '2026-04-01T00:00:00Z',
    }),
    makeAccessLog({
      id: 'b',
      userId: 'bob',
      patientId: 'pat_2',
      action: 'export',
      timestamp: '2026-04-05T00:00:00Z',
    }),
    makeAccessLog({
      id: 'c',
      userId: 'alice',
      patientId: 'pat_2',
      action: 'delete',
      timestamp: '2026-04-09T00:00:00Z',
    }),
    makeAccessLog({
      id: 'd',
      userId: 'carol',
      patientId: 'pat_1',
      action: 'view',
      timestamp: '2026-03-15T00:00:00Z',
    }),
  ];

  beforeEach(() => {
    seedHIPAAData({ accessLogs: logs });
  });

  it('returns all logs sorted newest-first when no filters are supplied', () => {
    const result = getAccessLogs();
    expect(result.map((l) => l.id)).toEqual(['c', 'b', 'a', 'd']);
  });

  it('filters by userId', () => {
    const result = getAccessLogs({ userId: 'alice' });
    expect(result.map((l) => l.id).sort()).toEqual(['a', 'c']);
  });

  it('filters by patientId', () => {
    const result = getAccessLogs({ patientId: 'pat_1' });
    expect(result.map((l) => l.id).sort()).toEqual(['a', 'd']);
  });

  it('filters by action', () => {
    const result = getAccessLogs({ action: 'delete' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c');
  });

  it('AND-chains multiple filters (userId + patientId + action)', () => {
    const result = getAccessLogs({
      userId: 'alice',
      patientId: 'pat_2',
      action: 'delete',
    });
    expect(result.map((l) => l.id)).toEqual(['c']);
  });

  it('returns empty when AND-chained filters share no match', () => {
    const result = getAccessLogs({ userId: 'alice', action: 'export' });
    expect(result).toEqual([]);
  });

  it('startDate is inclusive at the exact boundary timestamp', () => {
    const result = getAccessLogs({ startDate: '2026-04-05T00:00:00Z' });
    // Should include b (exactly 2026-04-05) and c (after), exclude a and d
    expect(result.map((l) => l.id).sort()).toEqual(['b', 'c']);
  });

  it('endDate is inclusive at the exact boundary timestamp', () => {
    const result = getAccessLogs({ endDate: '2026-04-05T00:00:00Z' });
    // Should include a, b, d — exclude c (which is after)
    expect(result.map((l) => l.id).sort()).toEqual(['a', 'b', 'd']);
  });

  it('startDate + endDate together define an inclusive window', () => {
    const result = getAccessLogs({
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-05T00:00:00Z',
    });
    expect(result.map((l) => l.id).sort()).toEqual(['a', 'b']);
  });

  it('sorts descending by timestamp (newest first) even after filtering', () => {
    const result = getAccessLogs({ patientId: 'pat_1' });
    // a = 2026-04-01, d = 2026-03-15 → a should come first
    expect(result.map((l) => l.id)).toEqual(['a', 'd']);
  });

  it('returns empty when there are no logs at all', () => {
    clearHIPAAData();
    expect(getAccessLogs()).toEqual([]);
    expect(getAccessLogs({ userId: 'alice' })).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────
// assessBreachNotificationRequirements
// ─────────────────────────────────────────────────────────────────────

describe('assessBreachNotificationRequirements', () => {
  it('does NOT require HHS or media notification at 499 individuals affected', () => {
    const breach = makeBreach({ individualsAffected: 499 });
    const result = assessBreachNotificationRequirements(breach);
    expect(result.requiresHHS).toBe(false);
    expect(result.requiresMediaNotice).toBe(false);
  });

  it('DOES require HHS and media notification at exactly 500 individuals affected (boundary)', () => {
    const breach = makeBreach({ individualsAffected: 500 });
    const result = assessBreachNotificationRequirements(breach);
    expect(result.requiresHHS).toBe(true);
    expect(result.requiresMediaNotice).toBe(true);
  });

  it('requires HHS and media notification above 500 (e.g., 10,000 individuals)', () => {
    const breach = makeBreach({ individualsAffected: 10_000 });
    const result = assessBreachNotificationRequirements(breach);
    expect(result.requiresHHS).toBe(true);
    expect(result.requiresMediaNotice).toBe(true);
  });

  it('always requires individual notice, even for a single-person breach', () => {
    const single = assessBreachNotificationRequirements(
      makeBreach({ individualsAffected: 1 })
    );
    const large = assessBreachNotificationRequirements(
      makeBreach({ individualsAffected: 10_000 })
    );
    expect(single.requiresIndividualNotice).toBe(true);
    expect(large.requiresIndividualNotice).toBe(true);
  });

  it('calculates the 60-day deadline from discoveryDate for all three notice types', () => {
    // Discovery 2026-01-01 → +60 days = 2026-03-02
    const breach = makeBreach({
      discoveryDate: '2026-01-01',
      individualsAffected: 600,
    });
    const result = assessBreachNotificationRequirements(breach);
    expect(result.deadlineHHS).toBe('2026-03-02');
    expect(result.deadlineIndividuals).toBe('2026-03-02');
    expect(result.deadlineMedia).toBe('2026-03-02');
  });

  it('handles month-boundary arithmetic when the deadline rolls past a month end', () => {
    // Discovery 2026-02-10 → +60 days = 2026-04-11
    const breach = makeBreach({
      discoveryDate: '2026-02-10',
      individualsAffected: 100,
    });
    const result = assessBreachNotificationRequirements(breach);
    expect(result.deadlineIndividuals).toBe('2026-04-11');
  });

  it('returns deadlines in YYYY-MM-DD format (date-only, no time component)', () => {
    const result = assessBreachNotificationRequirements(
      makeBreach({ discoveryDate: '2026-04-09' })
    );
    expect(result.deadlineHHS).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.deadlineIndividuals).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.deadlineMedia).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('treats zero individuals as not requiring HHS/media (defensive boundary)', () => {
    const result = assessBreachNotificationRequirements(
      makeBreach({ individualsAffected: 0 })
    );
    expect(result.requiresHHS).toBe(false);
    expect(result.requiresMediaNotice).toBe(false);
    expect(result.requiresIndividualNotice).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────
// getTrainingComplianceStatus
// ─────────────────────────────────────────────────────────────────────

describe('getTrainingComplianceStatus', () => {
  it('returns zero staff counts when no training records exist', () => {
    const status = getTrainingComplianceStatus();
    expect(status.totalStaff).toBe(0);
    expect(status.compliant).toBe(0);
    expect(status.nonCompliant).toBe(0);
    expect(status.upcomingExpirations).toEqual([]);
    expect(status.overdueTraining).toEqual([]);
  });

  it('counts a staff member as compliant only when ALL their training is passed and non-expired', () => {
    seedHIPAAData({
      trainingRecords: [
        makeTraining({
          staffId: 'staff_good',
          trainingType: 'hipaa_privacy',
          passed: true,
          expirationDate: '2027-01-01',
        }),
        makeTraining({
          id: 'train_2',
          staffId: 'staff_good',
          trainingType: 'hipaa_security',
          passed: true,
          expirationDate: '2027-01-01',
        }),
      ],
    });

    const status = getTrainingComplianceStatus();
    expect(status.totalStaff).toBe(1);
    expect(status.compliant).toBe(1);
    expect(status.nonCompliant).toBe(0);
  });

  it('marks a staff member as non-compliant if ANY training failed', () => {
    seedHIPAAData({
      trainingRecords: [
        makeTraining({
          staffId: 'staff_mixed',
          trainingType: 'hipaa_privacy',
          passed: true,
          expirationDate: '2027-01-01',
        }),
        makeTraining({
          id: 'train_2',
          staffId: 'staff_mixed',
          trainingType: 'hipaa_security',
          passed: false,
          expirationDate: '2027-01-01',
        }),
      ],
    });

    const status = getTrainingComplianceStatus();
    expect(status.totalStaff).toBe(1);
    expect(status.compliant).toBe(0);
    expect(status.nonCompliant).toBe(1);
  });

  it('marks a staff member as non-compliant if ANY training is expired', () => {
    seedHIPAAData({
      trainingRecords: [
        makeTraining({
          staffId: 'staff_expired',
          trainingType: 'hipaa_privacy',
          passed: true,
          expirationDate: '2027-01-01',
        }),
        makeTraining({
          id: 'train_2',
          staffId: 'staff_expired',
          trainingType: 'osha_bbp',
          passed: true,
          expirationDate: '2026-03-01', // expired before frozen now
        }),
      ],
    });

    const status = getTrainingComplianceStatus();
    expect(status.nonCompliant).toBe(1);
    expect(status.compliant).toBe(0);
  });

  it('flags training expiring within the next 30 days as upcomingExpirations', () => {
    seedHIPAAData({
      trainingRecords: [
        makeTraining({
          id: 'train_within',
          staffId: 'staff_soon',
          expirationDate: '2026-04-20', // 11 days out
        }),
        makeTraining({
          id: 'train_outside',
          staffId: 'staff_later',
          expirationDate: '2026-06-01', // >30 days
        }),
      ],
    });

    const status = getTrainingComplianceStatus();
    expect(status.upcomingExpirations.map((t) => t.id)).toEqual(['train_within']);
  });

  it('does NOT include already-expired training in upcomingExpirations', () => {
    seedHIPAAData({
      trainingRecords: [
        makeTraining({
          id: 'train_expired',
          staffId: 'staff_e',
          expirationDate: '2026-04-01', // already expired at 2026-04-09
          renewalRequired: true,
        }),
      ],
    });

    const status = getTrainingComplianceStatus();
    expect(status.upcomingExpirations).toEqual([]);
    expect(status.overdueTraining.map((t) => t.id)).toEqual(['train_expired']);
  });

  it('overdueTraining requires renewalRequired=true — does not flag expired one-shot training', () => {
    seedHIPAAData({
      trainingRecords: [
        makeTraining({
          id: 'train_noRenew',
          staffId: 'staff_x',
          expirationDate: '2026-04-01',
          renewalRequired: false,
        }),
      ],
    });

    const status = getTrainingComplianceStatus();
    expect(status.overdueTraining).toEqual([]);
  });

  it('dedupes staff by staffId in totalStaff count across multiple records', () => {
    seedHIPAAData({
      trainingRecords: [
        makeTraining({ id: 't1', staffId: 'staff_A' }),
        makeTraining({ id: 't2', staffId: 'staff_A' }),
        makeTraining({ id: 't3', staffId: 'staff_B' }),
      ],
    });

    const status = getTrainingComplianceStatus();
    expect(status.totalStaff).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────
// calculateHIPAAScore
// ─────────────────────────────────────────────────────────────────────

describe('calculateHIPAAScore', () => {
  it('returns a perfect 100 with zero issues when the system has no data at all', () => {
    const result = calculateHIPAAScore();
    expect(result.score).toBe(100);
    expect(result.issues).toBe(0);
    expect(result.details).toHaveLength(4);
    expect(result.details.map((d) => d.area)).toEqual([
      'Training',
      'BAAs',
      'Breach Response',
      'Access Controls',
    ]);
    for (const area of result.details) {
      expect(area.score).toBe(25);
      expect(area.maxScore).toBe(25);
      expect(area.issues).toEqual([]);
    }
  });

  it('awards each area a maximum of 25 points (total cap = 100)', () => {
    const result = calculateHIPAAScore();
    expect(result.score).toBeLessThanOrEqual(100);
    for (const area of result.details) {
      expect(area.maxScore).toBe(25);
      expect(area.score).toBeLessThanOrEqual(25);
    }
  });

  it('scales training score by compliant/total ratio (50% compliant → 13/25 rounded)', () => {
    seedHIPAAData({
      trainingRecords: [
        // Staff A: fully compliant
        makeTraining({ id: 'a1', staffId: 'A', passed: true, expirationDate: '2027-01-01' }),
        // Staff B: failed → non-compliant
        makeTraining({ id: 'b1', staffId: 'B', passed: false, expirationDate: '2027-01-01' }),
      ],
    });

    const result = calculateHIPAAScore();
    const training = result.details.find((d) => d.area === 'Training')!;
    // 1 of 2 compliant → round(0.5 * 25) = 13
    expect(training.score).toBe(13);
  });

  it('deducts 10 points per expired BAA and 3 per expiring-soon BAA from the BAA area', () => {
    seedHIPAAData({
      baas: [
        makeBAA({ id: 'b1', status: 'expired', expirationDate: '2025-01-01' }),
        makeBAA({
          id: 'b2',
          status: 'active',
          expirationDate: '2026-05-01', // within 90 days of 2026-04-09
        }),
      ],
    });

    const result = calculateHIPAAScore();
    const baa = result.details.find((d) => d.area === 'BAAs')!;
    // 25 - 10 (1 expired) - 3 (1 expiring) = 12
    expect(baa.score).toBe(12);
    expect(baa.issues).toHaveLength(2);
  });

  it('floors the BAA score at 0 and never goes negative, even with catastrophic BAA failure', () => {
    const manyExpired: BusinessAssociateAgreement[] = Array.from({ length: 10 }, (_, i) =>
      makeBAA({ id: `b${i}`, status: 'expired', expirationDate: '2024-01-01' })
    );
    seedHIPAAData({ baas: manyExpired });

    const result = calculateHIPAAScore();
    const baa = result.details.find((d) => d.area === 'BAAs')!;
    expect(baa.score).toBe(0);
  });

  it('deducts 10 points per unresolved breach from the Breach Response area', () => {
    seedHIPAAData({
      breaches: [
        makeBreach({ id: 'br1', status: 'investigating', description: 'Phishing incident' }),
      ],
    });

    const result = calculateHIPAAScore();
    const breach = result.details.find((d) => d.area === 'Breach Response')!;
    expect(breach.score).toBe(15); // 25 - 10
    expect(breach.issues).toHaveLength(1);
  });

  it('does NOT penalize the Breach Response area for breaches with status=resolved', () => {
    seedHIPAAData({
      breaches: [
        makeBreach({ id: 'br_resolved', status: 'resolved', description: 'Closed' }),
      ],
    });

    const result = calculateHIPAAScore();
    const breach = result.details.find((d) => d.area === 'Breach Response')!;
    expect(breach.score).toBe(25);
    expect(breach.issues).toEqual([]);
  });

  it('floors the Breach Response score at 0 with many active breaches', () => {
    seedHIPAAData({
      breaches: Array.from({ length: 10 }, (_, i) =>
        makeBreach({ id: `br${i}`, status: 'investigating', description: `Breach ${i}` })
      ),
    });

    const result = calculateHIPAAScore();
    const breach = result.details.find((d) => d.area === 'Breach Response')!;
    expect(breach.score).toBe(0);
  });

  it('deducts 5 points from Access Controls when recent deletions exceed the threshold (>5)', () => {
    const recent = Array.from({ length: 6 }, (_, i) =>
      makeAccessLog({
        id: `del_${i}`,
        action: 'delete',
        timestamp: FROZEN_NOW.toISOString(),
      })
    );
    seedHIPAAData({ accessLogs: recent });

    const result = calculateHIPAAScore();
    const access = result.details.find((d) => d.area === 'Access Controls')!;
    expect(access.score).toBe(20);
    expect(access.issues.some((i) => i.includes('deletions'))).toBe(true);
  });

  it('does NOT deduct from Access Controls at exactly 5 deletions (boundary: strictly greater than)', () => {
    const recent = Array.from({ length: 5 }, (_, i) =>
      makeAccessLog({
        id: `del_${i}`,
        action: 'delete',
        timestamp: FROZEN_NOW.toISOString(),
      })
    );
    seedHIPAAData({ accessLogs: recent });

    const result = calculateHIPAAScore();
    const access = result.details.find((d) => d.area === 'Access Controls')!;
    expect(access.score).toBe(25);
  });

  it('deducts 5 more points for exports exceeding 20 (cumulative with deletions)', () => {
    const exportsLogs = Array.from({ length: 21 }, (_, i) =>
      makeAccessLog({
        id: `exp_${i}`,
        action: 'export',
        timestamp: FROZEN_NOW.toISOString(),
      })
    );
    const deletionsLogs = Array.from({ length: 6 }, (_, i) =>
      makeAccessLog({
        id: `del_${i}`,
        action: 'delete',
        timestamp: FROZEN_NOW.toISOString(),
      })
    );
    seedHIPAAData({ accessLogs: [...exportsLogs, ...deletionsLogs] });

    const result = calculateHIPAAScore();
    const access = result.details.find((d) => d.area === 'Access Controls')!;
    // 25 - 5 (deletions) - 5 (exports) = 15
    expect(access.score).toBe(15);
    expect(access.issues).toHaveLength(2);
  });

  it('ignores access logs older than 30 days when evaluating Access Controls', () => {
    const oldTimestamp = new Date('2026-02-01T00:00:00Z').toISOString();
    const oldLogs = Array.from({ length: 50 }, (_, i) =>
      makeAccessLog({ id: `old_${i}`, action: 'delete', timestamp: oldTimestamp })
    );
    seedHIPAAData({ accessLogs: oldLogs });

    const result = calculateHIPAAScore();
    const access = result.details.find((d) => d.area === 'Access Controls')!;
    expect(access.score).toBe(25); // old activity doesn't count
  });

  it('sums the four area scores into the total score (within 0-100)', () => {
    seedHIPAAData({
      breaches: [makeBreach({ id: 'br1', status: 'investigating' })],
      baas: [makeBAA({ id: 'b1', status: 'expired', expirationDate: '2025-01-01' })],
    });

    const result = calculateHIPAAScore();
    const sum = result.details.reduce((s, a) => s + a.score, 0);
    expect(result.score).toBe(sum);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('reports totalIssues as the sum of issues across all four areas', () => {
    seedHIPAAData({
      breaches: [
        makeBreach({ id: 'br1', status: 'investigating', description: 'One' }),
        makeBreach({ id: 'br2', status: 'contained', description: 'Two' }),
      ],
      baas: [makeBAA({ id: 'b1', status: 'expired', expirationDate: '2025-01-01' })],
    });

    const result = calculateHIPAAScore();
    const sum = result.details.reduce((s, a) => s + a.issues.length, 0);
    expect(result.issues).toBe(sum);
    expect(result.issues).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// reportBreach / updateBreach
// ─────────────────────────────────────────────────────────────────────

describe('reportBreach', () => {
  const baseParams = {
    discoveryDate: '2026-04-09',
    breachDate: '2026-04-01',
    description: 'Unauthorized laptop access',
    dataInvolved: ['demographics'],
    individualsAffected: 42,
    severity: 'high' as const,
    status: 'investigating' as const,
    correctiveActions: ['Revoked credentials'],
    hhs_reported: false,
    individuals_notified: false,
    media_notified: false,
    investigator: 'compliance_officer',
  };

  it('creates a breach with a breach_-prefixed unique id and preserves all caller fields', () => {
    const breach = reportBreach(baseParams);

    expect(breach.id).toMatch(/^breach_\d+_[a-z0-9]+$/);
    expect(breach).toMatchObject(baseParams);
  });

  it('generates distinct ids for two sequential breach reports', () => {
    const a = reportBreach(baseParams);
    const b = reportBreach(baseParams);
    expect(a.id).not.toBe(b.id);
  });

  it('forwards a breach_report audit entry with investigator + individual count in details', () => {
    const breach = reportBreach(baseParams);

    expect(createAuditEntryMock).toHaveBeenCalledTimes(1);
    const call = createAuditEntryMock.mock.calls[0][0];
    expect(call).toMatchObject({
      userId: 'compliance_officer',
      userRole: 'compliance',
      action: 'breach_report',
      resourceType: 'breach',
      resourceId: breach.id,
    });
    expect(call.details).toContain('Unauthorized laptop access');
    expect(call.details).toContain('42 individuals affected');
  });
});

describe('updateBreach', () => {
  it('applies partial updates to an existing breach and returns the merged record', () => {
    const original = reportBreach({
      discoveryDate: '2026-04-09',
      breachDate: '2026-04-01',
      description: 'Stolen device',
      dataInvolved: ['demographics'],
      individualsAffected: 5,
      severity: 'medium',
      status: 'discovered',
      correctiveActions: [],
      hhs_reported: false,
      individuals_notified: false,
      media_notified: false,
      investigator: 'compliance_officer',
    });

    const updated = updateBreach(original.id, {
      status: 'resolved',
      resolutionDate: '2026-04-15',
      hhs_reported: true,
    });

    expect(updated).not.toBeNull();
    expect(updated!.id).toBe(original.id);
    expect(updated!.status).toBe('resolved');
    expect(updated!.resolutionDate).toBe('2026-04-15');
    expect(updated!.hhs_reported).toBe(true);
    // Unchanged fields preserved
    expect(updated!.description).toBe('Stolen device');
    expect(updated!.individualsAffected).toBe(5);
  });

  it('returns null when the breach id is unknown', () => {
    const result = updateBreach('breach_does_not_exist', { status: 'resolved' });
    expect(result).toBeNull();
  });

  it('returns null on an empty store even with a plausible id format', () => {
    const result = updateBreach('breach_1700000000_abc1234', { status: 'resolved' });
    expect(result).toBeNull();
  });

  it('does not mutate other breaches when updating one by id', () => {
    const a = reportBreach({
      discoveryDate: '2026-04-01',
      breachDate: '2026-03-28',
      description: 'Breach A',
      dataInvolved: ['demographics'],
      individualsAffected: 3,
      severity: 'low',
      status: 'discovered',
      correctiveActions: [],
      hhs_reported: false,
      individuals_notified: false,
      media_notified: false,
      investigator: 'compliance_officer',
    });
    const b = reportBreach({
      discoveryDate: '2026-04-05',
      breachDate: '2026-04-01',
      description: 'Breach B',
      dataInvolved: ['billing'],
      individualsAffected: 9,
      severity: 'high',
      status: 'investigating',
      correctiveActions: [],
      hhs_reported: false,
      individuals_notified: false,
      media_notified: false,
      investigator: 'compliance_officer',
    });

    updateBreach(a.id, { status: 'resolved', description: 'Breach A (closed)' });

    // Re-fetch via score engine's underlying store is not exposed; use calculateHIPAAScore
    // sanity check: b still counted as active, a no longer active
    const score = calculateHIPAAScore();
    const breachArea = score.details.find((d) => d.area === 'Breach Response')!;
    // 25 - 10 (only b still active) = 15
    expect(breachArea.score).toBe(15);
    expect(breachArea.issues).toHaveLength(1);
    expect(breachArea.issues[0]).toContain('Breach B');
  });
});
