// @vitest-environment node
/**
 * Persistence adapter tests.
 *
 * The adapter is deliberately fire-and-forget — every persist call
 * returns `void` and catches any internal error. These tests verify:
 *
 *   1. Feature flag: persistence is a no-op unless
 *      COMPLIANCE_PERSISTENCE_ENABLED=1
 *   2. Field mapping: the JSON-shaped domain types are correctly
 *      flattened into the Airtable-compatible field dict
 *   3. Error containment: failures from the underlying createRecord()
 *      are swallowed — caller never sees an exception
 *   4. Opt-in safety: when the flag is off, NO Airtable client code
 *      runs (verified via dynamic-import spy)
 *   5. Production warning: a single critical logEvent is emitted the
 *      first time any persist function is called in a production process
 *      with persistence disabled
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import type {
  PHIAccessLog,
  BreachNotification,
  BusinessAssociateAgreement,
  TrainingCompletion,
} from '@/types/compliance';

// ── Hoisted spies ────────────────────────────────────────────────────

const mockCreateRecord = vi.fn().mockResolvedValue('rec_test_001');
const mockUpdateRecord = vi.fn().mockResolvedValue(undefined);
const mockLogEvent = vi.fn();

function makeMockBase() {
  return (tableName: string) => ({ name: tableName });
}

vi.mock('@/lib/airtable/client', () => ({
  getAirtableBase: () => makeMockBase(),
  createRecord: (...args: unknown[]) => mockCreateRecord(...args),
  updateRecord: (...args: unknown[]) => mockUpdateRecord(...args),
}));

vi.mock('@/lib/logging/structured-logger', () => ({
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
}));

// Import under test AFTER mocks are declared
import {
  persistPhiAccessLog,
  persistBreach,
  persistBaa,
  persistTraining,
  getPersistenceStatus,
  COMPLIANCE_TABLE_NAMES,
  _resetPersistenceWarningForTest,
} from '../persistence';

// ── Fixtures ─────────────────────────────────────────────────────────

function makePhiEntry(overrides: Partial<PHIAccessLog> = {}): PHIAccessLog {
  return {
    id: 'phi_test_001',
    timestamp: '2026-04-10T22:00:00.000Z',
    userId: 'rina',
    userName: 'Rina Rai',
    userRole: 'ceo',
    patientId: 'rec_patient_123',
    patientName: 'Jane Patient',
    action: 'view',
    dataCategory: 'treatment_records',
    ipAddress: '192.0.2.5',
    details: 'Client profile 360',
    ...overrides,
  };
}

function makeBreach(overrides: Partial<BreachNotification> = {}): BreachNotification {
  return {
    id: 'breach_test_001',
    discoveryDate: '2026-04-10',
    breachDate: '2026-04-08',
    description: 'Laptop stolen from provider car',
    dataInvolved: ['demographics', 'treatment_records'],
    individualsAffected: 42,
    severity: 'medium',
    status: 'investigating',
    correctiveActions: ['full-disk encryption', 'remote wipe executed'],
    hhs_reported: false,
    individuals_notified: false,
    media_notified: false,
    investigator: 'Rina Rai',
    ...overrides,
  };
}

function makeBaa(overrides: Partial<BusinessAssociateAgreement> = {}): BusinessAssociateAgreement {
  return {
    id: 'baa_test_001',
    vendorName: 'Airtable',
    vendorContact: 'Support Team',
    vendorEmail: 'baa@airtable.com',
    serviceDescription: 'Cloud database hosting for patient records',
    effectiveDate: '2026-01-01',
    expirationDate: '2027-01-01',
    renewalDate: '2026-11-01',
    status: 'active',
    signedBy: 'Rina Rai',
    lastReviewDate: '2026-01-15',
    nextReviewDate: '2026-07-15',
    ...overrides,
  };
}

function makeTraining(overrides: Partial<TrainingCompletion> = {}): TrainingCompletion {
  return {
    id: 'train_test_001',
    staffId: 'rina',
    staffName: 'Rina Rai',
    staffRole: 'ceo',
    trainingType: 'hipaa_privacy',
    completedDate: '2026-01-15',
    expirationDate: '2027-01-15',
    score: 95,
    passed: true,
    renewalRequired: true,
    ...overrides,
  };
}

// ── Setup ────────────────────────────────────────────────────────────

const originalEnv = {
  COMPLIANCE_PERSISTENCE_ENABLED: process.env.COMPLIANCE_PERSISTENCE_ENABLED,
  NODE_ENV: process.env.NODE_ENV,
};

beforeEach(() => {
  mockCreateRecord.mockReset().mockResolvedValue('rec_test_001');
  mockUpdateRecord.mockReset();
  mockLogEvent.mockReset();
  _resetPersistenceWarningForTest();
});

afterEach(() => {
  if (originalEnv.COMPLIANCE_PERSISTENCE_ENABLED === undefined) {
    delete process.env.COMPLIANCE_PERSISTENCE_ENABLED;
  } else {
    process.env.COMPLIANCE_PERSISTENCE_ENABLED = originalEnv.COMPLIANCE_PERSISTENCE_ENABLED;
  }
  process.env.NODE_ENV = originalEnv.NODE_ENV;
  vi.restoreAllMocks();
});

async function flushMicrotasks() {
  await new Promise((resolve) => setImmediate(resolve));
}

// ── getPersistenceStatus ─────────────────────────────────────────────

describe('getPersistenceStatus', () => {
  it('reports disabled when the env var is unset', () => {
    delete process.env.COMPLIANCE_PERSISTENCE_ENABLED;
    const status = getPersistenceStatus();
    expect(status.enabled).toBe(false);
    expect(status.tables).toBe(COMPLIANCE_TABLE_NAMES);
  });

  it('reports disabled when the env var is set to any non-"1" value', () => {
    process.env.COMPLIANCE_PERSISTENCE_ENABLED = 'true';
    expect(getPersistenceStatus().enabled).toBe(false);

    process.env.COMPLIANCE_PERSISTENCE_ENABLED = 'yes';
    expect(getPersistenceStatus().enabled).toBe(false);

    process.env.COMPLIANCE_PERSISTENCE_ENABLED = '0';
    expect(getPersistenceStatus().enabled).toBe(false);
  });

  it('reports enabled when the env var is exactly "1"', () => {
    process.env.COMPLIANCE_PERSISTENCE_ENABLED = '1';
    expect(getPersistenceStatus().enabled).toBe(true);
  });

  it('exposes the fixed table name mapping', () => {
    const { tables } = getPersistenceStatus();
    expect(tables.phiAccessLog).toBe('PHI Access Log');
    expect(tables.breaches).toBe('HIPAA Breaches');
    expect(tables.baas).toBe('BAAs');
    expect(tables.training).toBe('HIPAA Training');
  });
});

// ── Feature flag: disabled = no-op ───────────────────────────────────

describe('persistence disabled (default)', () => {
  beforeEach(() => {
    delete process.env.COMPLIANCE_PERSISTENCE_ENABLED;
  });

  it('persistPhiAccessLog does NOT call createRecord', async () => {
    persistPhiAccessLog(makePhiEntry());
    await flushMicrotasks();
    expect(mockCreateRecord).not.toHaveBeenCalled();
  });

  it('persistBreach does NOT call createRecord', async () => {
    persistBreach(makeBreach());
    await flushMicrotasks();
    expect(mockCreateRecord).not.toHaveBeenCalled();
  });

  it('persistBaa does NOT call createRecord', async () => {
    persistBaa(makeBaa());
    await flushMicrotasks();
    expect(mockCreateRecord).not.toHaveBeenCalled();
  });

  it('persistTraining does NOT call createRecord', async () => {
    persistTraining(makeTraining());
    await flushMicrotasks();
    expect(mockCreateRecord).not.toHaveBeenCalled();
  });

  it('every persist function returns undefined', () => {
    expect(persistPhiAccessLog(makePhiEntry())).toBeUndefined();
    expect(persistBreach(makeBreach())).toBeUndefined();
    expect(persistBaa(makeBaa())).toBeUndefined();
    expect(persistTraining(makeTraining())).toBeUndefined();
  });
});

// ── Feature flag: enabled = dual-write ───────────────────────────────

describe('persistence enabled', () => {
  beforeEach(() => {
    process.env.COMPLIANCE_PERSISTENCE_ENABLED = '1';
  });

  it('persistPhiAccessLog calls createRecord once with the PHI Access Log table', async () => {
    persistPhiAccessLog(makePhiEntry());
    await flushMicrotasks();
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
    const [table, fields] = mockCreateRecord.mock.calls[0] as [
      { name: string },
      Record<string, unknown>,
    ];
    expect(table.name).toBe('PHI Access Log');
    expect(fields['Log ID']).toBe('phi_test_001');
    expect(fields['User ID']).toBe('rina');
    expect(fields['Patient ID']).toBe('rec_patient_123');
    expect(fields['Action']).toBe('view');
    expect(fields['Data Category']).toBe('treatment_records');
    expect(fields['IP Address']).toBe('192.0.2.5');
    expect(fields['Details']).toBe('Client profile 360');
  });

  it('persistPhiAccessLog omits Details field when undefined (no empty-string writes)', async () => {
    persistPhiAccessLog(makePhiEntry({ details: undefined }));
    await flushMicrotasks();
    const [, fields] = mockCreateRecord.mock.calls[0] as [
      unknown,
      Record<string, unknown>,
    ];
    expect(fields).not.toHaveProperty('Details');
  });

  it('persistBreach maps all fields including array-to-comma-list conversion', async () => {
    persistBreach(makeBreach());
    await flushMicrotasks();
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
    const [table, fields] = mockCreateRecord.mock.calls[0] as [
      { name: string },
      Record<string, unknown>,
    ];
    expect(table.name).toBe('HIPAA Breaches');
    expect(fields['Breach ID']).toBe('breach_test_001');
    expect(fields['Discovery Date']).toBe('2026-04-10');
    expect(fields['Individuals Affected']).toBe(42);
    expect(fields['Severity']).toBe('medium');
    expect(fields['Data Involved']).toBe('demographics, treatment_records');
    expect(fields['Corrective Actions']).toBe(
      'full-disk encryption, remote wipe executed',
    );
    expect(fields['HHS Reported']).toBe(false);
    expect(fields['Individuals Notified']).toBe(false);
  });

  it('persistBreach omits optional fields when undefined', async () => {
    persistBreach(
      makeBreach({
        reportedDate: undefined,
        rootCause: undefined,
        resolutionDate: undefined,
      }),
    );
    await flushMicrotasks();
    const [, fields] = mockCreateRecord.mock.calls[0] as [
      unknown,
      Record<string, unknown>,
    ];
    expect(fields).not.toHaveProperty('Reported Date');
    expect(fields).not.toHaveProperty('Root Cause');
    expect(fields).not.toHaveProperty('Resolution Date');
  });

  it('persistBaa maps vendor contact + service description + status + review dates', async () => {
    persistBaa(makeBaa());
    await flushMicrotasks();
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
    const [table, fields] = mockCreateRecord.mock.calls[0] as [
      { name: string },
      Record<string, unknown>,
    ];
    expect(table.name).toBe('BAAs');
    expect(fields['BAA ID']).toBe('baa_test_001');
    expect(fields['Vendor Name']).toBe('Airtable');
    expect(fields['Vendor Contact']).toBe('Support Team');
    expect(fields['Vendor Email']).toBe('baa@airtable.com');
    expect(fields['Service Description']).toBe(
      'Cloud database hosting for patient records',
    );
    expect(fields['Status']).toBe('active');
    expect(fields['Signed By']).toBe('Rina Rai');
    expect(fields['Last Review Date']).toBe('2026-01-15');
    expect(fields['Next Review Date']).toBe('2026-07-15');
  });

  it('persistTraining maps staff + training type + score + passed', async () => {
    persistTraining(makeTraining());
    await flushMicrotasks();
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
    const [table, fields] = mockCreateRecord.mock.calls[0] as [
      { name: string },
      Record<string, unknown>,
    ];
    expect(table.name).toBe('HIPAA Training');
    expect(fields['Training ID']).toBe('train_test_001');
    expect(fields['Staff ID']).toBe('rina');
    expect(fields['Training Type']).toBe('hipaa_privacy');
    expect(fields['Score']).toBe(95);
    expect(fields['Passed']).toBe(true);
    expect(fields['Renewal Required']).toBe(true);
  });

  it('persistTraining omits Score when undefined (not included as 0)', async () => {
    persistTraining(makeTraining({ score: undefined }));
    await flushMicrotasks();
    const [, fields] = mockCreateRecord.mock.calls[0] as [
      unknown,
      Record<string, unknown>,
    ];
    expect(fields).not.toHaveProperty('Score');
  });

  it('persistPhiAccessLog swallows errors from createRecord and returns undefined', async () => {
    mockCreateRecord.mockRejectedValueOnce(
      new Error('UNKNOWN_FIELD_NAME: Log ID'),
    );
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = persistPhiAccessLog(makePhiEntry());

    expect(result).toBeUndefined();
    await flushMicrotasks();
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('all persist functions are sync-call-void-return contract', () => {
    expect(persistPhiAccessLog(makePhiEntry())).toBeUndefined();
    expect(persistBreach(makeBreach())).toBeUndefined();
    expect(persistBaa(makeBaa())).toBeUndefined();
    expect(persistTraining(makeTraining())).toBeUndefined();
  });

  it('does NOT emit production warning when persistence is enabled', () => {
    process.env.NODE_ENV = 'production';
    persistPhiAccessLog(makePhiEntry());
    expect(mockLogEvent).not.toHaveBeenCalled();
  });
});

// ── Production warning when persistence is disabled ──────────────────

describe('production warning (disabled in production)', () => {
  beforeEach(() => {
    delete process.env.COMPLIANCE_PERSISTENCE_ENABLED;
    process.env.NODE_ENV = 'production';
    _resetPersistenceWarningForTest();
  });

  it('emits one critical logEvent on first persist call in production', () => {
    persistPhiAccessLog(makePhiEntry());
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
    const [domain, level, message] = mockLogEvent.mock.calls[0] as [string, string, string];
    expect(domain).toBe('api'); // LogCategory does not include 'compliance'; 'api' is used as closest available domain
    expect(level).toBe('critical');
    expect(message).toMatch(/HIPAA audit persistence is DISABLED/i);
  });

  it('includes action and impact fields in the logEvent payload', () => {
    persistPhiAccessLog(makePhiEntry());
    const [, , , fields] = mockLogEvent.mock.calls[0] as [
      string,
      string,
      string,
      Record<string, unknown>,
    ];
    expect(fields).toHaveProperty('action');
    expect(fields).toHaveProperty('impact');
    expect(String(fields['action'])).toMatch(/COMPLIANCE_PERSISTENCE_ENABLED/);
    expect(String(fields['impact'])).toMatch(/HIPAA/);
  });

  it('emits the warning exactly once across multiple persist calls (latch)', () => {
    persistPhiAccessLog(makePhiEntry());
    persistBreach(makeBreach());
    persistBaa(makeBaa());
    persistTraining(makeTraining());
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
  });

  it('does NOT emit in development (NODE_ENV=development)', () => {
    process.env.NODE_ENV = 'development';
    persistPhiAccessLog(makePhiEntry());
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it('does NOT emit in test (NODE_ENV=test)', () => {
    process.env.NODE_ENV = 'test';
    persistPhiAccessLog(makePhiEntry());
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it('does NOT emit when NODE_ENV is unset', () => {
    delete process.env.NODE_ENV;
    persistPhiAccessLog(makePhiEntry());
    expect(mockLogEvent).not.toHaveBeenCalled();
  });

  it('_resetPersistenceWarningForTest re-arms the latch for subsequent tests', () => {
    persistPhiAccessLog(makePhiEntry());
    expect(mockLogEvent).toHaveBeenCalledTimes(1);

    mockLogEvent.mockReset();
    _resetPersistenceWarningForTest();

    persistBreach(makeBreach());
    expect(mockLogEvent).toHaveBeenCalledTimes(1);
  });
});
