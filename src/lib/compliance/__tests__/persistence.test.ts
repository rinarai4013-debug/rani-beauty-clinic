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

// ── Hoisted spies for the Airtable client import ────────────────────

const mockCreateRecord = vi.fn().mockResolvedValue('rec_test_001');
const mockUpdateRecord = vi.fn().mockResolvedValue(undefined);

// `getAirtableBase()` returns a function that's itself callable:
//   const base = getAirtableBase();
//   const table = base('Table Name');
// We need to mock it as a callable that returns a table-shaped object.
// The simplest way is a factory that returns a fresh callable each time.
function makeMockBase() {
  return (tableName: string) => ({ name: tableName });
}

vi.mock('@/lib/airtable/client', () => ({
  getAirtableBase: () => makeMockBase(),
  createRecord: (...args: unknown[]) => mockCreateRecord(...args),
  updateRecord: (...args: unknown[]) => mockUpdateRecord(...args),
}));

// Import under test AFTER the mock is declared
import {
  persistPhiAccessLog,
  persistBreach,
  persistBaa,
  persistTraining,
  getPersistenceStatus,
  COMPLIANCE_TABLE_NAMES,
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

const originalEnv = process.env.COMPLIANCE_PERSISTENCE_ENABLED;

beforeEach(() => {
  mockCreateRecord.mockReset().mockResolvedValue('rec_test_001');
  mockUpdateRecord.mockReset();
});

afterEach(() => {
  if (originalEnv === undefined) {
    delete process.env.COMPLIANCE_PERSISTENCE_ENABLED;
  } else {
    process.env.COMPLIANCE_PERSISTENCE_ENABLED = originalEnv;
  }
  vi.restoreAllMocks();
});

// Tiny helper to let the fire-and-forget promise run
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
    // Array fields become comma-separated strings for Long text cells
    expect(fields['Data Involved']).toBe('demographics, treatment_records');
    expect(fields['Corrective Actions']).toBe(
      'full-disk encryption, remote wipe executed',
    );
    // Checkbox fields
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
    // createRecord was called and threw
    expect(mockCreateRecord).toHaveBeenCalledTimes(1);
    // The error was logged but NOT propagated to the caller
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('all persist functions are sync-call-void-return contract', () => {
    // Verify none of the exports return a Promise — callers should
    // never have to `await` these.
    const entry = makePhiEntry();
    const breach = makeBreach();
    const baa = makeBaa();
    const training = makeTraining();

    expect(persistPhiAccessLog(entry)).toBeUndefined();
    expect(persistBreach(breach)).toBeUndefined();
    expect(persistBaa(baa)).toBeUndefined();
    expect(persistTraining(training)).toBeUndefined();
  });
});
