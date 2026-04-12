/**
 * Controlled Substances Engine — Production Test Suite
 *
 * DEA-regulated tracking: Schedule II–V inventory, reconciliations,
 * waste witnessing, chain of custody, and the 100-pt DEA compliance score.
 *
 * Every boundary in this file exists because a real medspa can lose its
 * DEA registration if any of these rules drift. Tests are exhaustive by
 * design — do not trim without a compliance sign-off.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  ControlledSubstance,
  SubstanceReconciliation,
  WasteLog,
  ChainOfCustody,
  DEASchedule,
} from '@/types/compliance';

// ── Mock audit-trail BEFORE importing the SUT ────────────────────────
const createAuditEntryMock = vi.fn();
vi.mock('@/lib/compliance/audit-trail', () => ({
  createAuditEntry: (...args: unknown[]) => createAuditEntryMock(...args),
}));

import {
  addSubstance,
  updateSubstance,
  getSubstances,
  getSubstanceAlerts,
  performReconciliation,
  resolveDiscrepancy,
  getReconciliations,
  getUnresolvedDiscrepancies,
  logWaste,
  getWasteLogs,
  recordCustodyEvent,
  getCustodyChain,
  getFullCustodyChain,
  calculateDEAScore,
  seedDEAData,
  clearDEAData,
} from '@/lib/compliance/controlled-substances';

// ── Fixtures ─────────────────────────────────────────────────────────

const FROZEN_NOW = new Date('2026-04-09T12:00:00Z');

/** Helper: ISO date N days from FROZEN_NOW (positive = future, negative = past). */
function daysFromNow(n: number): string {
  const d = new Date(FROZEN_NOW);
  d.setDate(d.getDate() + n);
  return d.toISOString();
}

function makeSubstance(
  overrides: Partial<ControlledSubstance> = {}
): ControlledSubstance {
  return {
    id: 'sub_seed_1',
    name: 'Ketamine HCl',
    genericName: 'ketamine hydrochloride',
    schedule: 'III',
    ndc: '42023-0113-10',
    manufacturer: 'Hospira',
    strength: '100 mg/mL',
    form: 'vial',
    currentQuantity: 20,
    unit: 'vial',
    location: 'Controlled Cabinet A',
    lotNumber: 'LOT-KET-2026-04',
    expirationDate: daysFromNow(365),
    lastReconciliationDate: daysFromNow(-1),
    lastReconciliationBy: 'DR-RAI-BX1234567',
    status: 'in_stock',
    ...overrides,
  };
}

function makeReconciliation(
  overrides: Partial<SubstanceReconciliation> = {}
): SubstanceReconciliation {
  return {
    id: 'recon_seed_1',
    substanceId: 'sub_seed_1',
    substanceName: 'Ketamine HCl',
    date: '2026-04-08',
    performedBy: 'DR-RAI-BX1234567',
    witnessedBy: 'RN-SMITH-01',
    expectedCount: 20,
    actualCount: 20,
    discrepancy: 0,
    status: 'matched',
    ...overrides,
  };
}

function makeWasteLog(overrides: Partial<WasteLog> = {}): WasteLog {
  return {
    id: 'waste_seed_1',
    substanceId: 'sub_seed_1',
    substanceName: 'Ketamine HCl',
    schedule: 'III',
    quantityWasted: 1,
    unit: 'mL',
    reason: 'partial_dose',
    wastedBy: 'DR-RAI-BX1234567',
    witnessedBy: 'RN-SMITH-01',
    date: '2026-04-09',
    time: '10:30',
    lotNumber: 'LOT-KET-2026-04',
    method: 'pharmaceutical_waste',
    ...overrides,
  };
}

function makeCustody(overrides: Partial<ChainOfCustody> = {}): ChainOfCustody {
  return {
    id: 'coc_seed_1',
    substanceId: 'sub_seed_1',
    substanceName: 'Ketamine HCl',
    action: 'dispensed',
    quantity: 1,
    unit: 'vial',
    fromPerson: 'PHARMACIST-01',
    toPerson: 'DR-RAI-BX1234567',
    date: '2026-04-09',
    time: '09:00',
    lotNumber: 'LOT-KET-2026-04',
    ...overrides,
  };
}

// ── Shared Setup ─────────────────────────────────────────────────────

beforeEach(() => {
  clearDEAData();
  createAuditEntryMock.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(FROZEN_NOW);
});

afterEach(() => {
  vi.useRealTimers();
  clearDEAData();
});

// ─────────────────────────────────────────────────────────────────────
// addSubstance / updateSubstance / getSubstances
// ─────────────────────────────────────────────────────────────────────

describe('addSubstance', () => {
  const baseParams = {
    name: 'Lidocaine HCl',
    genericName: 'lidocaine hydrochloride',
    schedule: 'V' as DEASchedule,
    ndc: '00409-4276-02',
    manufacturer: 'Hospira',
    strength: '1%',
    form: 'vial' as const,
    currentQuantity: 50,
    unit: 'vial',
    location: 'Procedure Room 1',
    lotNumber: 'LOT-LIDO-2026-03',
    expirationDate: daysFromNow(365),
    lastReconciliationDate: daysFromNow(-1),
    lastReconciliationBy: 'DR-RAI-BX1234567',
    status: 'in_stock' as const,
  };

  it('creates a substance with a sub_-prefixed unique id', () => {
    const sub = addSubstance(baseParams);
    expect(sub.id).toMatch(/^sub_\d+_[a-z0-9]+$/);
  });

  it('persists every caller-provided field verbatim', () => {
    const sub = addSubstance(baseParams);
    expect(sub).toMatchObject(baseParams);
  });

  it('generates distinct ids for sequential calls', () => {
    const a = addSubstance(baseParams);
    const b = addSubstance(baseParams);
    expect(a.id).not.toBe(b.id);
  });

  it('makes the new substance retrievable via getSubstances', () => {
    const sub = addSubstance(baseParams);
    const all = getSubstances();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(sub.id);
  });

  it.each<DEASchedule>(['II', 'III', 'IV', 'V'])(
    'accepts DEA Schedule %s without transformation',
    (schedule) => {
      const sub = addSubstance({ ...baseParams, schedule });
      expect(sub.schedule).toBe(schedule);
    }
  );
});

describe('updateSubstance', () => {
  it('applies partial updates and returns the merged record', () => {
    const sub = addSubstance({
      name: 'Ketamine HCl',
      genericName: 'ketamine hydrochloride',
      schedule: 'III',
      ndc: '42023-0113-10',
      manufacturer: 'Hospira',
      strength: '100 mg/mL',
      form: 'vial',
      currentQuantity: 20,
      unit: 'vial',
      location: 'Cabinet A',
      lotNumber: 'LOT-KET-2026-04',
      expirationDate: daysFromNow(365),
      lastReconciliationDate: daysFromNow(-1),
      lastReconciliationBy: 'DR-RAI',
      status: 'in_stock',
    });

    const updated = updateSubstance(sub.id, {
      currentQuantity: 10,
      status: 'low',
    });

    expect(updated).not.toBeNull();
    expect(updated!.id).toBe(sub.id);
    expect(updated!.currentQuantity).toBe(10);
    expect(updated!.status).toBe('low');
    // Untouched fields preserved
    expect(updated!.name).toBe('Ketamine HCl');
    expect(updated!.schedule).toBe('III');
  });

  it('returns null when the substance id is unknown', () => {
    const result = updateSubstance('sub_does_not_exist', { currentQuantity: 0 });
    expect(result).toBeNull();
  });

  it('returns null on an empty store even with a plausible id format', () => {
    const result = updateSubstance('sub_1700000000_abc1234', { status: 'low' });
    expect(result).toBeNull();
  });

  it('does not affect other substances when updating one by id', () => {
    seedDEAData({
      substances: [
        makeSubstance({ id: 'sub_a', name: 'Alpha', currentQuantity: 20 }),
        makeSubstance({ id: 'sub_b', name: 'Bravo', currentQuantity: 20 }),
      ],
    });
    updateSubstance('sub_a', { currentQuantity: 999 });
    const reloadedB = getSubstances().find((s) => s.id === 'sub_b')!;
    expect(reloadedB.currentQuantity).toBe(20);
  });
});

describe('getSubstances', () => {
  beforeEach(() => {
    seedDEAData({
      substances: [
        makeSubstance({
          id: 'sub_ket',
          name: 'Ketamine HCl',
          schedule: 'III',
          status: 'in_stock',
        }),
        makeSubstance({
          id: 'sub_diaz',
          name: 'Diazepam',
          schedule: 'IV',
          status: 'low',
        }),
        makeSubstance({
          id: 'sub_morph',
          name: 'Morphine Sulfate',
          schedule: 'II',
          status: 'in_stock',
        }),
        makeSubstance({
          id: 'sub_pseudo',
          name: 'Pseudoephedrine',
          schedule: 'V',
          status: 'expired',
        }),
      ],
    });
  });

  it('returns all substances sorted alphabetically by name when no filters', () => {
    const result = getSubstances();
    expect(result.map((s) => s.name)).toEqual([
      'Diazepam',
      'Ketamine HCl',
      'Morphine Sulfate',
      'Pseudoephedrine',
    ]);
  });

  it.each<DEASchedule>(['II', 'III', 'IV', 'V'])(
    'filters by DEA schedule %s',
    (schedule) => {
      const result = getSubstances({ schedule });
      expect(result).toHaveLength(1);
      expect(result[0].schedule).toBe(schedule);
    }
  );

  it('filters by status', () => {
    const result = getSubstances({ status: 'in_stock' });
    expect(result.map((s) => s.id).sort()).toEqual(['sub_ket', 'sub_morph']);
  });

  it('AND-chains schedule + status filters', () => {
    const result = getSubstances({ schedule: 'III', status: 'in_stock' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('sub_ket');
  });

  it('returns empty array when filter combination matches nothing', () => {
    const result = getSubstances({ schedule: 'II', status: 'low' });
    expect(result).toEqual([]);
  });

  it('does not mutate the internal store when sorting (returns a copy)', () => {
    const first = getSubstances();
    first.reverse();
    const second = getSubstances();
    expect(second.map((s) => s.name)).toEqual([
      'Diazepam',
      'Ketamine HCl',
      'Morphine Sulfate',
      'Pseudoephedrine',
    ]);
  });
});

// ─────────────────────────────────────────────────────────────────────
// getSubstanceAlerts — boundary tests on every threshold
// ─────────────────────────────────────────────────────────────────────

describe('getSubstanceAlerts', () => {
  describe('lowStock', () => {
    it.each([
      [0, true],
      [1, true],
      [5, true],
      [6, false],
      [10, false],
    ])('qty=%i → lowStock includes=%s', (qty, shouldInclude) => {
      seedDEAData({
        substances: [makeSubstance({ id: 'sub_1', currentQuantity: qty, status: 'in_stock' })],
      });
      const alerts = getSubstanceAlerts();
      expect(alerts.lowStock.some((s) => s.id === 'sub_1')).toBe(shouldInclude);
    });

    it('also includes substances explicitly marked status=low regardless of qty', () => {
      seedDEAData({
        substances: [
          makeSubstance({ id: 'sub_low_status', currentQuantity: 100, status: 'low' }),
        ],
      });
      const alerts = getSubstanceAlerts();
      expect(alerts.lowStock.map((s) => s.id)).toContain('sub_low_status');
    });
  });

  describe('expiringSoon', () => {
    it('includes substances expiring within 30 days (not yet expired)', () => {
      seedDEAData({
        substances: [
          makeSubstance({ id: 'sub_15d', expirationDate: daysFromNow(15) }),
          makeSubstance({ id: 'sub_30d', expirationDate: daysFromNow(30) }),
        ],
      });
      const alerts = getSubstanceAlerts();
      expect(alerts.expiringSoon.map((s) => s.id).sort()).toEqual([
        'sub_15d',
        'sub_30d',
      ]);
    });

    it('excludes substances expiring in 31 days (outside the window)', () => {
      seedDEAData({
        substances: [
          makeSubstance({ id: 'sub_31d', expirationDate: daysFromNow(31) }),
        ],
      });
      expect(getSubstanceAlerts().expiringSoon).toEqual([]);
    });

    it('excludes already-expired substances from expiringSoon', () => {
      seedDEAData({
        substances: [
          makeSubstance({
            id: 'sub_gone',
            expirationDate: daysFromNow(-1),
            status: 'expired',
          }),
        ],
      });
      expect(getSubstanceAlerts().expiringSoon).toEqual([]);
    });

    it('excludes substances with status=expired even if date is in the soon window', () => {
      seedDEAData({
        substances: [
          makeSubstance({
            id: 'sub_status_expired',
            expirationDate: daysFromNow(10),
            status: 'expired',
          }),
        ],
      });
      expect(getSubstanceAlerts().expiringSoon).toEqual([]);
    });
  });

  describe('expired', () => {
    it('includes substances past their expiration date', () => {
      seedDEAData({
        substances: [
          makeSubstance({ id: 'sub_past', expirationDate: daysFromNow(-1) }),
        ],
      });
      expect(getSubstanceAlerts().expired.map((s) => s.id)).toEqual(['sub_past']);
    });

    it('does NOT include substances expiring tomorrow', () => {
      seedDEAData({
        substances: [
          makeSubstance({ id: 'sub_fut', expirationDate: daysFromNow(1) }),
        ],
      });
      expect(getSubstanceAlerts().expired).toEqual([]);
    });
  });

  describe('reconciliationDue', () => {
    it('flags substances whose last reconciliation was >7 days ago', () => {
      seedDEAData({
        substances: [
          makeSubstance({
            id: 'sub_overdue',
            lastReconciliationDate: daysFromNow(-8),
          }),
        ],
      });
      expect(
        getSubstanceAlerts().reconciliationDue.map((s) => s.id)
      ).toEqual(['sub_overdue']);
    });

    it('does NOT flag substances reconciled 1 day ago', () => {
      seedDEAData({
        substances: [
          makeSubstance({
            id: 'sub_fresh',
            lastReconciliationDate: daysFromNow(-1),
          }),
        ],
      });
      expect(getSubstanceAlerts().reconciliationDue).toEqual([]);
    });

    it('flags at exactly 7 days ago (boundary is inclusive: <=)', () => {
      seedDEAData({
        substances: [
          makeSubstance({
            id: 'sub_seven',
            lastReconciliationDate: daysFromNow(-7),
          }),
        ],
      });
      expect(
        getSubstanceAlerts().reconciliationDue.map((s) => s.id)
      ).toEqual(['sub_seven']);
    });

    it('excludes expired substances even when reconciliation is overdue', () => {
      seedDEAData({
        substances: [
          makeSubstance({
            id: 'sub_exp',
            status: 'expired',
            lastReconciliationDate: daysFromNow(-30),
          }),
        ],
      });
      expect(getSubstanceAlerts().reconciliationDue).toEqual([]);
    });

    it('excludes destroyed substances even when reconciliation is overdue', () => {
      seedDEAData({
        substances: [
          makeSubstance({
            id: 'sub_destroyed',
            status: 'destroyed',
            lastReconciliationDate: daysFromNow(-30),
          }),
        ],
      });
      expect(getSubstanceAlerts().reconciliationDue).toEqual([]);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────
// performReconciliation
// ─────────────────────────────────────────────────────────────────────

describe('performReconciliation', () => {
  const baseParams = {
    substanceId: 'sub_ket',
    substanceName: 'Ketamine HCl',
    date: '2026-04-09',
    performedBy: 'DR-RAI-BX1234567',
    witnessedBy: 'RN-SMITH-01',
    expectedCount: 20,
    actualCount: 20,
  };

  beforeEach(() => {
    seedDEAData({
      substances: [makeSubstance({ id: 'sub_ket', currentQuantity: 20 })],
    });
  });

  it('generates a recon_-prefixed unique id', () => {
    const recon = performReconciliation(baseParams);
    expect(recon.id).toMatch(/^recon_\d+_[a-z0-9]+$/);
  });

  it('computes discrepancy = actualCount - expectedCount (matched case = 0)', () => {
    const recon = performReconciliation(baseParams);
    expect(recon.discrepancy).toBe(0);
    expect(recon.status).toBe('matched');
  });

  it.each([
    // [expected, actual, expectedDiscrepancy]
    [20, 18, -2], // under-count (likely diversion — CRITICAL)
    [20, 22, 2], // over-count
    [20, 19, -1], // single-unit diversion
    [20, 21, 1], // single-unit over
    [0, 0, 0], // empty inventory
    [100, 50, -50], // catastrophic under-count
  ])(
    'expected=%i actual=%i → discrepancy=%i',
    (expectedCount, actualCount, expectedDiscrepancy) => {
      const recon = performReconciliation({
        ...baseParams,
        expectedCount,
        actualCount,
      });
      expect(recon.discrepancy).toBe(expectedDiscrepancy);
    }
  );

  it('marks status=discrepancy whenever discrepancy !== 0', () => {
    const under = performReconciliation({ ...baseParams, actualCount: 19 });
    const over = performReconciliation({ ...baseParams, actualCount: 21 });
    expect(under.status).toBe('discrepancy');
    expect(over.status).toBe('discrepancy');
  });

  it('updates the substance lastReconciliationDate, performer, and currentQuantity', () => {
    performReconciliation({ ...baseParams, actualCount: 18 });
    const sub = getSubstances().find((s) => s.id === 'sub_ket')!;
    expect(sub.lastReconciliationDate).toBe('2026-04-09');
    expect(sub.lastReconciliationBy).toBe('DR-RAI-BX1234567');
    expect(sub.currentQuantity).toBe(18);
  });

  it('does not throw when reconciling an unknown substanceId', () => {
    expect(() =>
      performReconciliation({ ...baseParams, substanceId: 'sub_missing' })
    ).not.toThrow();
  });

  it('persists the reconciliation so it is retrievable via getReconciliations', () => {
    const recon = performReconciliation(baseParams);
    const list = getReconciliations('sub_ket');
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(recon.id);
  });

  it('forwards a substance_reconcile audit entry with expected/actual counts', () => {
    performReconciliation({ ...baseParams, actualCount: 18 });
    expect(createAuditEntryMock).toHaveBeenCalledTimes(1);
    const call = createAuditEntryMock.mock.calls[0][0];
    expect(call).toMatchObject({
      userId: 'DR-RAI-BX1234567',
      userRole: 'provider',
      action: 'substance_reconcile',
      resourceType: 'controlled_substance',
      resourceId: 'sub_ket',
    });
    expect(call.details).toContain('expected 20');
    expect(call.details).toContain('actual 18');
    expect(call.details).toContain('DISCREPANCY: -2');
  });

  it('formats positive discrepancies with a leading + sign in audit details', () => {
    performReconciliation({ ...baseParams, actualCount: 22 });
    const call = createAuditEntryMock.mock.calls[0][0];
    expect(call.details).toContain('DISCREPANCY: +2');
  });

  it('omits the DISCREPANCY tag from audit details when counts match', () => {
    performReconciliation(baseParams);
    const call = createAuditEntryMock.mock.calls[0][0];
    expect(call.details).not.toContain('DISCREPANCY');
  });

  // Bug 1 fixed: performReconciliation now recomputes substance.status from
  // the new actualCount. A substance flagged 'low' that reconciles back to a
  // full count is correctly re-labeled 'in_stock', and a reconciliation that
  // drops qty into the low band re-labels 'low'.
  it('recomputes status to in_stock when reconciliation restores full count', () => {
    seedDEAData({
      substances: [
        makeSubstance({
          id: 'sub_stuck',
          currentQuantity: 3,
          status: 'low',
        }),
      ],
    });
    performReconciliation({
      substanceId: 'sub_stuck',
      substanceName: 'Ketamine HCl',
      date: '2026-04-09',
      performedBy: 'DR-RAI-BX1234567',
      witnessedBy: 'RN-SMITH-01',
      expectedCount: 3,
      actualCount: 100,
    });
    const sub = getSubstances().find((s) => s.id === 'sub_stuck')!;
    expect(sub.currentQuantity).toBe(100);
    expect(sub.status).toBe('in_stock');
  });

  // Bug 1 regression: reconciling a previously 'in_stock' substance down to
  // <=5 must re-flag it 'low'.
  it('recomputes status to low when reconciliation drops count into low band', () => {
    seedDEAData({
      substances: [
        makeSubstance({
          id: 'sub_drop',
          currentQuantity: 50,
          status: 'in_stock',
        }),
      ],
    });
    performReconciliation({
      substanceId: 'sub_drop',
      substanceName: 'Ketamine HCl',
      date: '2026-04-09',
      performedBy: 'DR-RAI-BX1234567',
      witnessedBy: 'RN-SMITH-01',
      expectedCount: 50,
      actualCount: 2,
    });
    const sub = getSubstances().find((s) => s.id === 'sub_drop')!;
    expect(sub.currentQuantity).toBe(2);
    expect(sub.status).toBe('low');
  });

  // Bug 1 regression: reconciliation must not overwrite terminal lifecycle
  // states like 'expired' / 'destroyed' / 'recalled'. Those are independent
  // of quantity and should survive a recount.
  it('preserves terminal lifecycle status (expired) across reconciliation', () => {
    seedDEAData({
      substances: [
        makeSubstance({
          id: 'sub_expired',
          currentQuantity: 0,
          status: 'expired',
          expirationDate: daysFromNow(-30),
        }),
      ],
    });
    performReconciliation({
      substanceId: 'sub_expired',
      substanceName: 'Ketamine HCl',
      date: '2026-04-09',
      performedBy: 'DR-RAI-BX1234567',
      witnessedBy: 'RN-SMITH-01',
      expectedCount: 0,
      actualCount: 0,
    });
    const sub = getSubstances().find((s) => s.id === 'sub_expired')!;
    expect(sub.status).toBe('expired');
  });
});

describe('resolveDiscrepancy', () => {
  it('marks the reconciliation status=resolved and stores the notes', () => {
    seedDEAData({
      reconciliations: [
        makeReconciliation({
          id: 'recon_1',
          status: 'discrepancy',
          discrepancy: -2,
        }),
      ],
    });
    const result = resolveDiscrepancy('recon_1', 'Count error — recount confirmed');
    expect(result).not.toBeNull();
    expect(result!.status).toBe('resolved');
    expect(result!.resolutionNotes).toBe('Count error — recount confirmed');
  });

  it('returns null for an unknown reconciliation id', () => {
    const result = resolveDiscrepancy('recon_nope', 'whatever');
    expect(result).toBeNull();
  });

  it('removes the reconciliation from getUnresolvedDiscrepancies after resolution', () => {
    seedDEAData({
      reconciliations: [
        makeReconciliation({ id: 'recon_1', status: 'discrepancy' }),
        makeReconciliation({ id: 'recon_2', status: 'discrepancy' }),
      ],
    });
    expect(getUnresolvedDiscrepancies()).toHaveLength(2);
    resolveDiscrepancy('recon_1', 'recount');
    expect(getUnresolvedDiscrepancies().map((r) => r.id)).toEqual(['recon_2']);
  });
});

describe('getReconciliations', () => {
  beforeEach(() => {
    seedDEAData({
      reconciliations: [
        makeReconciliation({ id: 'r1', substanceId: 'sub_a', date: '2026-04-01' }),
        makeReconciliation({ id: 'r2', substanceId: 'sub_b', date: '2026-04-05' }),
        makeReconciliation({ id: 'r3', substanceId: 'sub_a', date: '2026-04-08' }),
      ],
    });
  });

  it('returns all reconciliations sorted newest-first when no substanceId given', () => {
    const result = getReconciliations();
    expect(result.map((r) => r.id)).toEqual(['r3', 'r2', 'r1']);
  });

  it('filters by substanceId and preserves newest-first order', () => {
    const result = getReconciliations('sub_a');
    expect(result.map((r) => r.id)).toEqual(['r3', 'r1']);
  });

  it('returns empty array for an unknown substanceId', () => {
    expect(getReconciliations('sub_missing')).toEqual([]);
  });
});

describe('getUnresolvedDiscrepancies', () => {
  it('returns only reconciliations with status=discrepancy', () => {
    seedDEAData({
      reconciliations: [
        makeReconciliation({ id: 'r1', status: 'matched' }),
        makeReconciliation({ id: 'r2', status: 'discrepancy' }),
        makeReconciliation({ id: 'r3', status: 'resolved' }),
        makeReconciliation({ id: 'r4', status: 'reported' }),
        makeReconciliation({ id: 'r5', status: 'discrepancy' }),
      ],
    });
    const result = getUnresolvedDiscrepancies();
    expect(result.map((r) => r.id).sort()).toEqual(['r2', 'r5']);
  });

  it('returns empty when there are no reconciliations at all', () => {
    expect(getUnresolvedDiscrepancies()).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────
// logWaste — witness requirements & quantity math
// ─────────────────────────────────────────────────────────────────────

describe('logWaste', () => {
  beforeEach(() => {
    seedDEAData({
      substances: [
        makeSubstance({ id: 'sub_ket', currentQuantity: 20, status: 'in_stock' }),
      ],
    });
  });

  const baseWaste: Omit<WasteLog, 'id'> = {
    substanceId: 'sub_ket',
    substanceName: 'Ketamine HCl',
    schedule: 'III',
    quantityWasted: 1,
    unit: 'mL',
    reason: 'partial_dose',
    wastedBy: 'DR-RAI-BX1234567',
    witnessedBy: 'RN-SMITH-01',
    date: '2026-04-09',
    time: '10:30',
    lotNumber: 'LOT-KET-2026-04',
    method: 'pharmaceutical_waste',
  };

  it('creates a waste log with a waste_-prefixed unique id', () => {
    const log = logWaste(baseWaste);
    expect(log.id).toMatch(/^waste_\d+_[a-z0-9]+$/);
  });

  it('THROWS when no witness is provided (DEA witness requirement)', () => {
    expect(() =>
      logWaste({ ...baseWaste, witnessedBy: '' as unknown as string })
    ).toThrow(/witness/i);
  });

  it('THROWS when witness is the same person who wasted the substance', () => {
    expect(() =>
      logWaste({ ...baseWaste, witnessedBy: baseWaste.wastedBy })
    ).toThrow(/different person/i);
  });

  it('accepts the log when witness and waster are distinct', () => {
    expect(() => logWaste(baseWaste)).not.toThrow();
  });

  it('subtracts quantityWasted from substance.currentQuantity', () => {
    logWaste({ ...baseWaste, quantityWasted: 5 });
    const sub = getSubstances().find((s) => s.id === 'sub_ket')!;
    expect(sub.currentQuantity).toBe(15);
  });

  it('floors currentQuantity at 0 when waste exceeds on-hand stock', () => {
    logWaste({ ...baseWaste, quantityWasted: 999 });
    const sub = getSubstances().find((s) => s.id === 'sub_ket')!;
    expect(sub.currentQuantity).toBe(0);
  });

  it.each([
    // [startQty, wasteQty, expectedStatus]
    [20, 1, 'in_stock'], // 19 remaining → in_stock
    [10, 4, 'in_stock'], // 6 remaining → in_stock (> 5)
    [10, 5, 'low'], // 5 remaining → low (boundary)
    [10, 9, 'low'], // 1 remaining → low
    [10, 10, 'depleted'], // 0 remaining → depleted (Bug 2 fixed: was 'expired')
  ])(
    'start=%i waste=%i → status=%s',
    (startQty, wasteQty, expectedStatus) => {
      clearDEAData();
      seedDEAData({
        substances: [
          makeSubstance({ id: 'sub_x', currentQuantity: startQty, status: 'in_stock' }),
        ],
      });
      logWaste({ ...baseWaste, substanceId: 'sub_x', quantityWasted: wasteQty });
      const sub = getSubstances().find((s) => s.id === 'sub_x')!;
      expect(sub.status).toBe(expectedStatus);
    }
  );

  // Bug 2 fixed: waste that drains stock to 0 now sets status='depleted'.
  // Depletion and expiration are semantically distinct — conflating them
  // polluted alerts.expired counts.
  it('sets status=depleted (not expired) when waste drains stock to 0', () => {
    seedDEAData({
      substances: [
        makeSubstance({
          id: 'sub_drain',
          currentQuantity: 5,
          status: 'in_stock',
          expirationDate: daysFromNow(365), // NOT actually expired
        }),
      ],
    });
    logWaste({ ...baseWaste, substanceId: 'sub_drain', quantityWasted: 5 });
    const sub = getSubstances().find((s) => s.id === 'sub_drain')!;
    expect(sub.status).toBe('depleted');
  });

  // Bug 2 regression: a depleted substance with a future expirationDate
  // must NOT show up in getSubstanceAlerts().expired — that alert is purely
  // date-based. Depletion is a separate signal.
  it('depleted substance with future expiration date is NOT in alerts.expired', () => {
    seedDEAData({
      substances: [
        makeSubstance({
          id: 'sub_drain_2',
          currentQuantity: 5,
          status: 'in_stock',
          expirationDate: daysFromNow(365),
        }),
      ],
    });
    logWaste({ ...baseWaste, substanceId: 'sub_drain_2', quantityWasted: 5 });
    const alerts = getSubstanceAlerts();
    expect(alerts.expired.some((s) => s.id === 'sub_drain_2')).toBe(false);
  });

  // Bug 2 regression: recordCustodyEvent dispense that drains to 0 also
  // must label the substance 'depleted', not 'expired'.
  it('custody dispense that drains to 0 sets status=depleted', () => {
    seedDEAData({
      substances: [
        makeSubstance({
          id: 'sub_disp_drain',
          currentQuantity: 3,
          status: 'in_stock',
          expirationDate: daysFromNow(365),
        }),
      ],
    });
    recordCustodyEvent(
      makeCustody({ substanceId: 'sub_disp_drain', action: 'dispensed', quantity: 3 })
    );
    const sub = getSubstances().find((s) => s.id === 'sub_disp_drain')!;
    expect(sub.status).toBe('depleted');
  });

  it('leaves substance untouched when substanceId is unknown', () => {
    logWaste({ ...baseWaste, substanceId: 'sub_missing', quantityWasted: 5 });
    const sub = getSubstances().find((s) => s.id === 'sub_ket')!;
    expect(sub.currentQuantity).toBe(20);
  });

  it('persists the log so it is retrievable via getWasteLogs', () => {
    const log = logWaste(baseWaste);
    const logs = getWasteLogs('sub_ket');
    expect(logs).toHaveLength(1);
    expect(logs[0].id).toBe(log.id);
  });

  it('forwards a substance_waste audit entry with schedule, witness, and method', () => {
    logWaste({ ...baseWaste, quantityWasted: 2, reason: 'contaminated' });
    const call = createAuditEntryMock.mock.calls[0][0];
    expect(call).toMatchObject({
      userId: 'DR-RAI-BX1234567',
      userRole: 'provider',
      action: 'substance_waste',
      resourceType: 'controlled_substance',
      resourceId: 'sub_ket',
    });
    expect(call.details).toContain('Wasted 2 mL of Ketamine HCl');
    expect(call.details).toContain('Schedule III');
    expect(call.details).toContain('contaminated');
    expect(call.details).toContain('Witnessed by: RN-SMITH-01');
    expect(call.details).toContain('pharmaceutical_waste');
  });
});

describe('getWasteLogs', () => {
  beforeEach(() => {
    seedDEAData({
      wasteLogs: [
        makeWasteLog({ id: 'w1', substanceId: 'sub_a', date: '2026-04-01' }),
        makeWasteLog({ id: 'w2', substanceId: 'sub_b', date: '2026-04-05' }),
        makeWasteLog({ id: 'w3', substanceId: 'sub_a', date: '2026-04-08' }),
      ],
    });
  });

  it('returns all waste logs sorted newest-first when no substanceId given', () => {
    expect(getWasteLogs().map((w) => w.id)).toEqual(['w3', 'w2', 'w1']);
  });

  it('filters by substanceId and preserves newest-first order', () => {
    expect(getWasteLogs('sub_a').map((w) => w.id)).toEqual(['w3', 'w1']);
  });

  it('returns empty array for an unknown substanceId', () => {
    expect(getWasteLogs('sub_zzz')).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────
// recordCustodyEvent / getCustodyChain
// ─────────────────────────────────────────────────────────────────────

describe('recordCustodyEvent', () => {
  beforeEach(() => {
    seedDEAData({
      substances: [
        makeSubstance({ id: 'sub_ket', currentQuantity: 20, status: 'in_stock' }),
      ],
    });
  });

  it('creates a custody event with a coc_-prefixed unique id', () => {
    const { id: _id, ...custody } = makeCustody({ substanceId: 'sub_ket' });
    const ev = recordCustodyEvent(custody);
    expect(ev.id).toMatch(/^coc_\d+_[a-z0-9]+$/);
  });

  it.each(['dispensed', 'administered'] as const)(
    'decrements currentQuantity on action=%s',
    (action) => {
      const { id: _id, ...custody } = makeCustody({ substanceId: 'sub_ket', action, quantity: 3 });
      recordCustodyEvent(custody);
      const sub = getSubstances().find((s) => s.id === 'sub_ket')!;
      expect(sub.currentQuantity).toBe(17);
    }
  );

  it.each(['received', 'transferred', 'wasted', 'returned', 'destroyed'] as const)(
    'does NOT decrement currentQuantity on action=%s',
    (action) => {
      recordCustodyEvent(makeCustody({ action, quantity: 3, witnessedBy: 'RN-WITNESS' }));
      const sub = getSubstances().find((s) => s.id === 'sub_ket')!;
      expect(sub.currentQuantity).toBe(20);
    }
  );

  it('floors currentQuantity at 0 when a dispense would go negative', () => {
    const { id: _id, ...custody } = makeCustody({ substanceId: 'sub_ket', action: 'dispensed', quantity: 999 });
    recordCustodyEvent(custody);
    const sub = getSubstances().find((s) => s.id === 'sub_ket')!;
    expect(sub.currentQuantity).toBe(0);
  });

  it('forwards a substance_dispense audit entry on dispense/administer with patient context', () => {
    const { id: _id, ...custody } = makeCustody({ substanceId: 'sub_ket', action: 'administered', quantity: 1, patientId: 'pat_777' });
    recordCustodyEvent(custody);
    expect(createAuditEntryMock).toHaveBeenCalledTimes(1);
    const call = createAuditEntryMock.mock.calls[0][0];
    expect(call).toMatchObject({
      action: 'substance_dispense',
      resourceType: 'controlled_substance',
      resourceId: 'sub_ket',
    });
    expect(call.details).toContain('administered 1 vial of Ketamine HCl');
    expect(call.details).toContain('PHARMACIST-01');
    expect(call.details).toContain('DR-RAI-BX1234567');
    expect(call.details).toContain('pat_777');
  });

  it('does NOT call createAuditEntry for non-dispensing custody actions (e.g., received)', () => {
    recordCustodyEvent(makeCustody({ action: 'received' }));
    expect(createAuditEntryMock).not.toHaveBeenCalled();
  });

  it('persists the event so it is retrievable via getCustodyChain', () => {
    const { id: _id, ...custody } = makeCustody({ substanceId: 'sub_ket' });
    const ev = recordCustodyEvent(custody);
    const chain = getCustodyChain('sub_ket');
    expect(chain).toHaveLength(1);
    expect(chain[0].id).toBe(ev.id);
  });
});

describe('getCustodyChain', () => {
  it('sorts events for a substance by date ASC then time ASC (chronological)', () => {
    seedDEAData({
      custodyChain: [
        makeCustody({ id: 'c3', substanceId: 'sub_a', date: '2026-04-09', time: '09:00' }),
        makeCustody({ id: 'c1', substanceId: 'sub_a', date: '2026-04-08', time: '08:00' }),
        makeCustody({ id: 'c2', substanceId: 'sub_a', date: '2026-04-09', time: '07:00' }),
      ],
    });
    const chain = getCustodyChain('sub_a');
    expect(chain.map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
  });

  it('returns only events for the requested substance', () => {
    seedDEAData({
      custodyChain: [
        makeCustody({ id: 'c1', substanceId: 'sub_a' }),
        makeCustody({ id: 'c2', substanceId: 'sub_b' }),
      ],
    });
    expect(getCustodyChain('sub_a').map((c) => c.id)).toEqual(['c1']);
  });

  it('returns empty array for an unknown substance', () => {
    expect(getCustodyChain('sub_unknown')).toEqual([]);
  });
});

describe('getFullCustodyChain', () => {
  // Bug 3 fixed: standardized on ASC (oldest first) to match getCustodyChain.
  // Legal chain-of-custody reads chronologically.
  it('returns ALL events sorted oldest-first (date ASC)', () => {
    seedDEAData({
      custodyChain: [
        makeCustody({ id: 'c1', date: '2026-04-01' }),
        makeCustody({ id: 'c2', date: '2026-04-05' }),
        makeCustody({ id: 'c3', date: '2026-04-08' }),
      ],
    });
    expect(getFullCustodyChain().map((c) => c.id)).toEqual(['c1', 'c2', 'c3']);
  });

  // Bug 3 fixed: sort order is now symmetric with getCustodyChain.
  it('sort order matches getCustodyChain (both ASC)', () => {
    seedDEAData({
      custodyChain: [
        makeCustody({ id: 'c1', substanceId: 'sub_a', date: '2026-04-01', time: '08:00' }),
        makeCustody({ id: 'c2', substanceId: 'sub_a', date: '2026-04-09', time: '08:00' }),
      ],
    });
    const scoped = getCustodyChain('sub_a').map((c) => c.id);
    const full = getFullCustodyChain().map((c) => c.id);
    expect(scoped).toEqual(['c1', 'c2']);
    expect(full).toEqual(['c1', 'c2']);
  });

  // Bug 3 regression: ties on date are broken by time ASC in both functions.
  it('breaks same-day ties by time ASC', () => {
    seedDEAData({
      custodyChain: [
        makeCustody({ id: 'c_late', date: '2026-04-09', time: '15:00' }),
        makeCustody({ id: 'c_early', date: '2026-04-09', time: '07:30' }),
        makeCustody({ id: 'c_mid', date: '2026-04-09', time: '10:00' }),
      ],
    });
    expect(getFullCustodyChain().map((c) => c.id)).toEqual([
      'c_early',
      'c_mid',
      'c_late',
    ]);
  });

  // Bug 3 regression: multi-day + multi-event sort must be stable across
  // both the scoped and full queries.
  it('cross-substance ordering is globally chronological', () => {
    seedDEAData({
      custodyChain: [
        makeCustody({ id: 'a1', substanceId: 'sub_a', date: '2026-04-03', time: '09:00' }),
        makeCustody({ id: 'b1', substanceId: 'sub_b', date: '2026-04-01', time: '08:00' }),
        makeCustody({ id: 'a2', substanceId: 'sub_a', date: '2026-04-05', time: '09:00' }),
      ],
    });
    expect(getFullCustodyChain().map((c) => c.id)).toEqual(['b1', 'a1', 'a2']);
  });
});

// ─────────────────────────────────────────────────────────────────────
// calculateDEAScore — 100-point rubric
// ─────────────────────────────────────────────────────────────────────

describe('calculateDEAScore', () => {
  it('returns a perfect 100 with zero issues when the system has no data', () => {
    const result = calculateDEAScore();
    expect(result.score).toBe(100);
    expect(result.issues).toBe(0);
    expect(result.details).toHaveLength(4);
    expect(result.details.map((d) => d.area)).toEqual([
      'Reconciliation',
      'Inventory',
      'Waste Documentation',
      'Chain of Custody',
    ]);
  });

  it('assigns the documented maxScore per area (30/25/25/20 = 100)', () => {
    const result = calculateDEAScore();
    const byArea = Object.fromEntries(
      result.details.map((d) => [d.area, d.maxScore])
    );
    expect(byArea).toEqual({
      Reconciliation: 30,
      Inventory: 25,
      'Waste Documentation': 25,
      'Chain of Custody': 20,
    });
  });

  describe('Reconciliation area (30 pts)', () => {
    it('deducts 10 per overdue reconciliation', () => {
      seedDEAData({
        substances: [
          makeSubstance({
            id: 'sub_1',
            lastReconciliationDate: daysFromNow(-10),
          }),
          makeSubstance({
            id: 'sub_2',
            lastReconciliationDate: daysFromNow(-10),
          }),
        ],
      });
      const result = calculateDEAScore();
      const recon = result.details.find((d) => d.area === 'Reconciliation')!;
      expect(recon.score).toBe(10); // 30 - (2 * 10)
      expect(recon.issues.some((i) => i.includes('overdue'))).toBe(true);
    });

    it('deducts 15 per unresolved discrepancy (CRITICAL)', () => {
      seedDEAData({
        reconciliations: [
          makeReconciliation({ id: 'r1', status: 'discrepancy' }),
        ],
      });
      const recon = calculateDEAScore().details.find(
        (d) => d.area === 'Reconciliation'
      )!;
      expect(recon.score).toBe(15); // 30 - 15
    });

    it('floors Reconciliation score at 0 with catastrophic penalties', () => {
      seedDEAData({
        substances: Array.from({ length: 5 }, (_, i) =>
          makeSubstance({
            id: `sub_${i}`,
            lastReconciliationDate: daysFromNow(-30),
          })
        ),
        reconciliations: Array.from({ length: 5 }, (_, i) =>
          makeReconciliation({ id: `r${i}`, status: 'discrepancy' })
        ),
      });
      const recon = calculateDEAScore().details.find(
        (d) => d.area === 'Reconciliation'
      )!;
      expect(recon.score).toBe(0);
    });

    it('full credit (30) when no overdue reconciliations and no discrepancies', () => {
      seedDEAData({
        substances: [
          makeSubstance({ lastReconciliationDate: daysFromNow(-1) }),
        ],
        reconciliations: [makeReconciliation({ status: 'matched' })],
      });
      const recon = calculateDEAScore().details.find(
        (d) => d.area === 'Reconciliation'
      )!;
      expect(recon.score).toBe(30);
      expect(recon.issues).toEqual([]);
    });
  });

  describe('Inventory area (25 pts)', () => {
    it('deducts 10 per expired substance', () => {
      seedDEAData({
        substances: [
          makeSubstance({
            id: 'sub_exp',
            expirationDate: daysFromNow(-1),
          }),
        ],
      });
      const inv = calculateDEAScore().details.find((d) => d.area === 'Inventory')!;
      expect(inv.score).toBe(15); // 25 - 10
    });

    it('deducts 3 per expiring-soon substance', () => {
      seedDEAData({
        substances: [
          makeSubstance({ id: 'sub_soon', expirationDate: daysFromNow(15) }),
        ],
      });
      const inv = calculateDEAScore().details.find((d) => d.area === 'Inventory')!;
      expect(inv.score).toBe(22); // 25 - 3
    });

    it('stacks expired + expiring-soon penalties', () => {
      seedDEAData({
        substances: [
          makeSubstance({ id: 'sub_exp', expirationDate: daysFromNow(-1) }),
          makeSubstance({ id: 'sub_soon', expirationDate: daysFromNow(10) }),
        ],
      });
      const inv = calculateDEAScore().details.find((d) => d.area === 'Inventory')!;
      expect(inv.score).toBe(12); // 25 - 10 - 3
      expect(inv.issues).toHaveLength(2);
    });

    it('floors Inventory score at 0', () => {
      seedDEAData({
        substances: Array.from({ length: 10 }, (_, i) =>
          makeSubstance({ id: `sub_${i}`, expirationDate: daysFromNow(-1) })
        ),
      });
      const inv = calculateDEAScore().details.find((d) => d.area === 'Inventory')!;
      expect(inv.score).toBe(0);
    });
  });

  describe('Waste Documentation area (25 pts)', () => {
    it('returns full 25 when all waste logs have a witness', () => {
      seedDEAData({
        wasteLogs: [makeWasteLog({ id: 'w1', witnessedBy: 'RN-SMITH-01' })],
      });
      const waste = calculateDEAScore().details.find(
        (d) => d.area === 'Waste Documentation'
      )!;
      expect(waste.score).toBe(25);
      expect(waste.issues).toEqual([]);
    });

    it('drops Waste Documentation to 0 if ANY waste log is unwitnessed (CRITICAL)', () => {
      seedDEAData({
        wasteLogs: [
          makeWasteLog({ id: 'w1', witnessedBy: 'RN-SMITH-01' }),
          makeWasteLog({ id: 'w2', witnessedBy: '' as unknown as string }),
        ],
      });
      const waste = calculateDEAScore().details.find(
        (d) => d.area === 'Waste Documentation'
      )!;
      expect(waste.score).toBe(0);
      expect(waste.issues[0]).toContain('CRITICAL');
    });
  });

  describe('Chain of Custody area (20 pts)', () => {
    it('returns full 20 when all dispensing events have a lot number', () => {
      seedDEAData({
        custodyChain: [
          makeCustody({ id: 'c1', action: 'dispensed', lotNumber: 'LOT-X' }),
          makeCustody({ id: 'c2', action: 'administered', lotNumber: 'LOT-Y' }),
        ],
      });
      const coc = calculateDEAScore().details.find(
        (d) => d.area === 'Chain of Custody'
      )!;
      expect(coc.score).toBe(20);
    });

    it('deducts 5 per dispensing event missing a lot number', () => {
      seedDEAData({
        custodyChain: [
          makeCustody({
            id: 'c1',
            action: 'dispensed',
            lotNumber: '' as unknown as string,
          }),
        ],
      });
      const coc = calculateDEAScore().details.find(
        (d) => d.area === 'Chain of Custody'
      )!;
      expect(coc.score).toBe(15);
    });

    it('ignores non-dispensing events (received/transferred) in the lot check', () => {
      seedDEAData({
        custodyChain: [
          makeCustody({
            id: 'c1',
            action: 'received',
            lotNumber: '' as unknown as string,
          }),
        ],
      });
      const coc = calculateDEAScore().details.find(
        (d) => d.area === 'Chain of Custody'
      )!;
      expect(coc.score).toBe(20);
    });

    it('floors Chain of Custody score at 0', () => {
      seedDEAData({
        custodyChain: Array.from({ length: 10 }, (_, i) =>
          makeCustody({
            id: `c${i}`,
            action: 'dispensed',
            lotNumber: '' as unknown as string,
          })
        ),
      });
      const coc = calculateDEAScore().details.find(
        (d) => d.area === 'Chain of Custody'
      )!;
      expect(coc.score).toBe(0);
    });
  });

  it('sums the four area scores into the total score', () => {
    seedDEAData({
      substances: [
        makeSubstance({ id: 'sub_soon', expirationDate: daysFromNow(10) }),
      ],
      reconciliations: [
        makeReconciliation({ id: 'r1', status: 'discrepancy' }),
      ],
    });
    const result = calculateDEAScore();
    const sum = result.details.reduce((s, a) => s + a.score, 0);
    expect(result.score).toBe(sum);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('reports totalIssues as the sum of issues across all four areas', () => {
    seedDEAData({
      substances: [
        makeSubstance({ id: 'sub_exp', expirationDate: daysFromNow(-1) }),
      ],
      reconciliations: [
        makeReconciliation({ id: 'r1', status: 'discrepancy' }),
      ],
      wasteLogs: [
        makeWasteLog({ id: 'w1', witnessedBy: '' as unknown as string }),
      ],
    });
    const result = calculateDEAScore();
    const sum = result.details.reduce((s, a) => s + a.issues.length, 0);
    expect(result.issues).toBe(sum);
    expect(result.issues).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
// Reconciliation math — received - dispensed - wasted = on-hand
// (end-to-end integration of addSubstance + recordCustodyEvent + logWaste)
// ─────────────────────────────────────────────────────────────────────

describe('reconciliation math (end-to-end)', () => {
  it('100 received - 20 dispensed - 5 wasted = 75 on-hand', () => {
    const sub = addSubstance({
      name: 'Ketamine HCl',
      genericName: 'ketamine hydrochloride',
      schedule: 'III',
      ndc: '42023-0113-10',
      manufacturer: 'Hospira',
      strength: '100 mg/mL',
      form: 'vial',
      currentQuantity: 100,
      unit: 'vial',
      location: 'Cabinet A',
      lotNumber: 'LOT-KET-2026-04',
      expirationDate: daysFromNow(365),
      lastReconciliationDate: daysFromNow(-1),
      lastReconciliationBy: 'DR-RAI',
      status: 'in_stock',
    });

    recordCustodyEvent(
      makeCustody({
        substanceId: sub.id,
        action: 'dispensed',
        quantity: 20,
      })
    );

    logWaste({
      substanceId: sub.id,
      substanceName: 'Ketamine HCl',
      schedule: 'III',
      quantityWasted: 5,
      unit: 'mL',
      reason: 'partial_dose',
      wastedBy: 'DR-RAI-BX1234567',
      witnessedBy: 'RN-SMITH-01',
      date: '2026-04-09',
      time: '10:30',
      lotNumber: 'LOT-KET-2026-04',
      method: 'pharmaceutical_waste',
    });

    const reloaded = getSubstances().find((s) => s.id === sub.id)!;
    expect(reloaded.currentQuantity).toBe(75);
  });

  it('a matched reconciliation after dispense+waste leaves the calculated on-hand unchanged', () => {
    const sub = addSubstance({
      name: 'Diazepam',
      genericName: 'diazepam',
      schedule: 'IV',
      ndc: '00140-0004-01',
      manufacturer: 'Roche',
      strength: '5 mg',
      form: 'tablet',
      currentQuantity: 50,
      unit: 'tablet',
      location: 'Cabinet A',
      lotNumber: 'LOT-DIAZ-2026-02',
      expirationDate: daysFromNow(365),
      lastReconciliationDate: daysFromNow(-1),
      lastReconciliationBy: 'DR-RAI',
      status: 'in_stock',
    });

    recordCustodyEvent(
      makeCustody({
        substanceId: sub.id,
        action: 'administered',
        quantity: 10,
      })
    );
    // Expected on-hand = 40
    const recon = performReconciliation({
      substanceId: sub.id,
      substanceName: 'Diazepam',
      date: '2026-04-09',
      performedBy: 'DR-RAI-BX1234567',
      witnessedBy: 'RN-SMITH-01',
      expectedCount: 40,
      actualCount: 40,
    });

    expect(recon.status).toBe('matched');
    expect(recon.discrepancy).toBe(0);

    const reloaded = getSubstances().find((s) => s.id === sub.id)!;
    expect(reloaded.currentQuantity).toBe(40);
  });

  it('detects a -1 discrepancy after dispense+waste (diversion scenario)', () => {
    const sub = addSubstance({
      name: 'Morphine Sulfate',
      genericName: 'morphine sulfate',
      schedule: 'II',
      ndc: '00409-1710-30',
      manufacturer: 'Hospira',
      strength: '10 mg/mL',
      form: 'vial',
      currentQuantity: 25,
      unit: 'vial',
      location: 'Cabinet A',
      lotNumber: 'LOT-MORPH-2026-01',
      expirationDate: daysFromNow(365),
      lastReconciliationDate: daysFromNow(-1),
      lastReconciliationBy: 'DR-RAI',
      status: 'in_stock',
    });

    recordCustodyEvent(
      makeCustody({ substanceId: sub.id, action: 'dispensed', quantity: 5 })
    );
    // System says 20 should be on hand. Physical count: 19 → -1 diversion.
    const recon = performReconciliation({
      substanceId: sub.id,
      substanceName: 'Morphine Sulfate',
      date: '2026-04-09',
      performedBy: 'DR-RAI-BX1234567',
      witnessedBy: 'RN-SMITH-01',
      expectedCount: 20,
      actualCount: 19,
    });

    expect(recon.status).toBe('discrepancy');
    expect(recon.discrepancy).toBe(-1);
    expect(getUnresolvedDiscrepancies().map((r) => r.id)).toContain(recon.id);
  });
});

// ─────────────────────────────────────────────────────────────────────
// seedDEAData / clearDEAData — in-memory store lifecycle
// ─────────────────────────────────────────────────────────────────────

describe('seedDEAData / clearDEAData', () => {
  it('seedDEAData appends records to the in-memory stores', () => {
    seedDEAData({
      substances: [makeSubstance({ id: 'sub_1' })],
    });
    seedDEAData({
      substances: [makeSubstance({ id: 'sub_2' })],
    });
    expect(getSubstances().map((s) => s.id).sort()).toEqual(['sub_1', 'sub_2']);
  });

  it('clearDEAData wipes substances, reconciliations, waste logs, and custody chain', () => {
    seedDEAData({
      substances: [makeSubstance({ id: 'sub_1' })],
      reconciliations: [makeReconciliation({ id: 'r1' })],
      wasteLogs: [makeWasteLog({ id: 'w1' })],
      custodyChain: [makeCustody({ id: 'c1' })],
    });
    clearDEAData();
    expect(getSubstances()).toEqual([]);
    expect(getReconciliations()).toEqual([]);
    expect(getWasteLogs()).toEqual([]);
    expect(getFullCustodyChain()).toEqual([]);
  });

  it('seedDEAData accepts a subset (only the keys provided are seeded)', () => {
    seedDEAData({
      wasteLogs: [makeWasteLog({ id: 'w1' })],
    });
    expect(getSubstances()).toEqual([]);
    expect(getWasteLogs()).toHaveLength(1);
  });
});
