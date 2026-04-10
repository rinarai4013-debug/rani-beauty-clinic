/**
 * Device Compliance Engine — Production Test Suite
 *
 * Covers FDA 510(k) device tracking, maintenance schedules, calibration logs,
 * and adverse event reporting (MDR). Every test verifies a specific,
 * boundary-sensitive behavior against real Rani devices (Sofwave, PicoWay,
 * HydraFacial, RF Microneedling) using realistic K-numbers and MDR scenarios.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  MedicalDevice,
  MaintenanceRecord,
  CalibrationLog,
  AdverseEventReport,
} from '@/types/compliance';

// ── Mock audit-trail BEFORE importing the SUT ────────────────────────
const createAuditEntryMock = vi.fn();
vi.mock('@/lib/compliance/audit-trail', () => ({
  createAuditEntry: (...args: unknown[]) => createAuditEntryMock(...args),
}));

import {
  addDevice,
  updateDevice,
  getDevices,
  getDeviceAlerts,
  addMaintenanceRecord,
  getMaintenanceHistory,
  getUpcomingMaintenance,
  addCalibrationLog,
  getCalibrationHistory,
  reportAdverseEvent,
  updateAdverseEvent,
  getAdverseEvents,
  assessMDRRequirements,
  calculateDeviceScore,
  seedDeviceData,
  clearDeviceData,
} from '@/lib/compliance/device-compliance';

// ── Fixtures ─────────────────────────────────────────────────────────

const FROZEN_NOW = new Date('2026-04-09T12:00:00Z');

/** Sofwave — real Rani device, FDA K193607 (Sofwave Medical Ltd.) */
function makeSofwave(overrides: Partial<MedicalDevice> = {}): MedicalDevice {
  return {
    id: 'dev_sofwave_1',
    name: 'Sofwave SUPERB',
    manufacturer: 'Sofwave Medical Ltd.',
    model: 'SUPERB',
    serialNumber: 'SW-2024-00231',
    fda510kNumber: 'K193607',
    fdaClearanceDate: '2019-09-27',
    deviceClass: 'II',
    category: 'ultrasound',
    purchaseDate: '2024-01-15',
    warrantyExpiration: '2027-01-15',
    location: 'Treatment Room 2',
    status: 'operational',
    lastMaintenanceDate: '2026-01-09',
    nextMaintenanceDate: '2026-07-09', // 3 months out from frozen now
    lastCalibrationDate: '2026-01-09',
    nextCalibrationDate: '2026-07-09',
    maintenanceProvider: 'Sofwave Medical Services',
    maintenanceContract: true,
    ...overrides,
  };
}

/** PicoWay — Syneron Candela, K160607 */
function makePicoWay(overrides: Partial<MedicalDevice> = {}): MedicalDevice {
  return {
    id: 'dev_picoway_1',
    name: 'PicoWay Resolve',
    manufacturer: 'Syneron Candela',
    model: 'PicoWay Resolve 532/1064',
    serialNumber: 'PW-2023-01187',
    fda510kNumber: 'K160607',
    fdaClearanceDate: '2016-06-15',
    deviceClass: 'II',
    category: 'laser',
    purchaseDate: '2023-06-01',
    warrantyExpiration: '2026-06-01',
    location: 'Treatment Room 1',
    status: 'operational',
    lastMaintenanceDate: '2026-03-01',
    nextMaintenanceDate: '2026-09-01',
    lastCalibrationDate: '2026-03-01',
    nextCalibrationDate: '2026-09-01',
    maintenanceProvider: 'Candela Service',
    maintenanceContract: true,
    ...overrides,
  };
}

/** HydraFacial — The HydraFacial Company, K182007 */
function makeHydraFacial(overrides: Partial<MedicalDevice> = {}): MedicalDevice {
  return {
    id: 'dev_hydra_1',
    name: 'HydraFacial MD Elite',
    manufacturer: 'The HydraFacial Company',
    model: 'MD Elite',
    serialNumber: 'HF-2024-00042',
    fda510kNumber: 'K182007',
    fdaClearanceDate: '2018-12-10',
    deviceClass: 'II',
    category: 'diagnostic',
    purchaseDate: '2024-03-01',
    warrantyExpiration: '2027-03-01',
    location: 'Treatment Room 3',
    status: 'operational',
    lastMaintenanceDate: '2026-02-01',
    nextMaintenanceDate: '2026-08-01',
    lastCalibrationDate: '2026-02-01',
    nextCalibrationDate: '2026-08-01',
    maintenanceProvider: 'HydraFacial Support',
    maintenanceContract: true,
    ...overrides,
  };
}

/** RF Microneedling — Inmode Morpheus8, K182567 */
function makeMorpheus(overrides: Partial<MedicalDevice> = {}): MedicalDevice {
  return {
    id: 'dev_morpheus_1',
    name: 'Morpheus8 RF Microneedling',
    manufacturer: 'InMode',
    model: 'Morpheus8',
    serialNumber: 'M8-2025-00099',
    fda510kNumber: 'K182567',
    fdaClearanceDate: '2018-10-04',
    deviceClass: 'II',
    category: 'rf',
    purchaseDate: '2025-02-01',
    warrantyExpiration: '2028-02-01',
    location: 'Treatment Room 1',
    status: 'operational',
    lastMaintenanceDate: '2026-02-15',
    nextMaintenanceDate: '2026-08-15',
    lastCalibrationDate: '2026-02-15',
    nextCalibrationDate: '2026-08-15',
    maintenanceProvider: 'InMode Service',
    maintenanceContract: true,
    ...overrides,
  };
}

function makeMaintenance(overrides: Partial<MaintenanceRecord> = {}): MaintenanceRecord {
  return {
    id: 'maint_seed_1',
    deviceId: 'dev_sofwave_1',
    deviceName: 'Sofwave SUPERB',
    type: 'preventive',
    date: '2026-04-01',
    performedBy: 'tech_jane',
    company: 'Sofwave Medical Services',
    description: 'Quarterly PM: transducer check, cooling system flush, firmware update',
    partsReplaced: [],
    cost: 1250,
    nextScheduledDate: '2026-07-01',
    status: 'completed',
    ...overrides,
  };
}

function makeCalibration(overrides: Partial<CalibrationLog> = {}): CalibrationLog {
  return {
    id: 'cal_seed_1',
    deviceId: 'dev_picoway_1',
    deviceName: 'PicoWay Resolve',
    calibrationDate: '2026-04-01',
    calibratedBy: 'metrology_vendor_1',
    standardUsed: 'NIST-traceable energy meter, Ophir PE50-C',
    parametersTested: [
      { parameter: 'energy_output_532nm', expected: '400 mJ', measured: '398 mJ', pass: true },
      { parameter: 'energy_output_1064nm', expected: '600 mJ', measured: '597 mJ', pass: true },
      { parameter: 'pulse_width', expected: '450 ps', measured: '451 ps', pass: true },
    ],
    overallPass: true,
    nextCalibrationDate: '2026-10-01',
    ...overrides,
  };
}

function makeAdverseEvent(
  overrides: Partial<AdverseEventReport> = {}
): AdverseEventReport {
  return {
    id: 'ae_seed_1',
    deviceId: 'dev_picoway_1',
    deviceName: 'PicoWay Resolve',
    eventDate: '2026-04-05',
    reportDate: '2026-04-05',
    patientId: 'pat_anon_1',
    eventDescription:
      'Unexpected epidermal blistering during 1064nm tattoo removal treatment at settings within manufacturer range',
    injuryDescription: 'Grade 1 superficial blister, ~3cm diameter on forearm',
    severity: 'moderate',
    fdaReported: false,
    manufacturerNotified: false,
    correctiveAction: 'Device taken offline, engineering case opened with Candela',
    status: 'investigating',
    reportedBy: 'provider_rina',
    ...overrides,
  };
}

// ── Shared Setup ─────────────────────────────────────────────────────

beforeEach(() => {
  clearDeviceData();
  createAuditEntryMock.mockReset();
  vi.useFakeTimers();
  vi.setSystemTime(FROZEN_NOW);
});

afterEach(() => {
  vi.useRealTimers();
  clearDeviceData();
});

// ─────────────────────────────────────────────────────────────────────
// addDevice
// ─────────────────────────────────────────────────────────────────────

describe('addDevice', () => {
  it('assigns a dev_-prefixed unique id and preserves all caller fields', () => {
    const { id, ...params } = makeSofwave();
    void id;
    const device = addDevice(params);

    expect(device.id).toMatch(/^dev_\d+_[a-z0-9]+$/);
    expect(device).toMatchObject(params);
  });

  it('generates distinct ids for two sequential device registrations', () => {
    const { id: _a, ...p } = makeSofwave();
    void _a;
    const a = addDevice(p);
    const b = addDevice(p);
    expect(a.id).not.toBe(b.id);
  });

  it('persists the device so it is retrievable via getDevices', () => {
    const { id: _x, ...p } = makePicoWay();
    void _x;
    const device = addDevice(p);
    const all = getDevices();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(device.id);
  });

  it('records a realistic FDA 510(k) clearance number (K######)', () => {
    const { id: _y, ...p } = makeSofwave({ fda510kNumber: 'K193607' });
    void _y;
    const device = addDevice(p);
    expect(device.fda510kNumber).toMatch(/^K\d{6}$/);
    expect(device.fda510kNumber).toBe('K193607');
  });

  it('does NOT call createAuditEntry on device registration (audit happens on ops, not registration)', () => {
    const { id: _z, ...p } = makeHydraFacial();
    void _z;
    addDevice(p);
    expect(createAuditEntryMock).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────
// updateDevice
// ─────────────────────────────────────────────────────────────────────

describe('updateDevice', () => {
  it('applies partial updates to an existing device and returns the merged record', () => {
    seedDeviceData({ devices: [makeSofwave()] });
    const updated = updateDevice('dev_sofwave_1', {
      status: 'under_repair',
      location: 'Offsite Service',
    });
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('under_repair');
    expect(updated!.location).toBe('Offsite Service');
    // Unchanged fields preserved
    expect(updated!.name).toBe('Sofwave SUPERB');
    expect(updated!.fda510kNumber).toBe('K193607');
  });

  it('returns null when the device id is unknown', () => {
    seedDeviceData({ devices: [makeSofwave()] });
    expect(updateDevice('dev_does_not_exist', { status: 'recalled' })).toBeNull();
  });

  it('returns null on an empty store', () => {
    expect(updateDevice('dev_anything', { status: 'operational' })).toBeNull();
  });

  it('does not mutate other devices when updating one by id', () => {
    seedDeviceData({
      devices: [makeSofwave(), makePicoWay({ id: 'dev_picoway_1' })],
    });
    updateDevice('dev_sofwave_1', { status: 'decommissioned' });
    const all = getDevices();
    const pico = all.find((d) => d.id === 'dev_picoway_1')!;
    expect(pico.status).toBe('operational');
  });

  it('supports transitioning status through every enum value', () => {
    seedDeviceData({ devices: [makeSofwave()] });
    const transitions: MedicalDevice['status'][] = [
      'maintenance_due',
      'under_repair',
      'operational',
      'recalled',
      'decommissioned',
    ];
    for (const status of transitions) {
      const result = updateDevice('dev_sofwave_1', { status });
      expect(result!.status).toBe(status);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
// getDevices — filtering, sort
// ─────────────────────────────────────────────────────────────────────

describe('getDevices', () => {
  beforeEach(() => {
    seedDeviceData({
      devices: [
        makeSofwave(), // ultrasound, operational
        makePicoWay({ id: 'dev_picoway_1' }), // laser, operational
        makeHydraFacial({ id: 'dev_hydra_1', status: 'maintenance_due' }),
        makeMorpheus({ id: 'dev_morpheus_1', status: 'under_repair' }),
      ],
    });
  });

  it('returns all devices when no filters are supplied, sorted alphabetically by name', () => {
    const result = getDevices();
    expect(result.map((d) => d.name)).toEqual([
      'HydraFacial MD Elite',
      'Morpheus8 RF Microneedling',
      'PicoWay Resolve',
      'Sofwave SUPERB',
    ]);
  });

  it('filters by category', () => {
    const lasers = getDevices({ category: 'laser' });
    expect(lasers).toHaveLength(1);
    expect(lasers[0].name).toBe('PicoWay Resolve');
  });

  it('filters by status', () => {
    const repair = getDevices({ status: 'under_repair' });
    expect(repair).toHaveLength(1);
    expect(repair[0].name).toBe('Morpheus8 RF Microneedling');
  });

  it('AND-chains category + status filters', () => {
    const result = getDevices({ category: 'laser', status: 'operational' });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('PicoWay Resolve');
  });

  it('returns empty when AND-chained filters share no match', () => {
    const result = getDevices({ category: 'laser', status: 'decommissioned' });
    expect(result).toEqual([]);
  });

  it('returns empty when there are no devices at all', () => {
    clearDeviceData();
    expect(getDevices()).toEqual([]);
    expect(getDevices({ category: 'rf' })).toEqual([]);
  });

  it.each<[MedicalDevice['category']]>([
    ['laser'],
    ['rf'],
    ['ultrasound'],
    ['light_based'],
    ['injection_device'],
    ['diagnostic'],
    ['surgical'],
  ])('accepts every category enum value as a filter (%s)', (category) => {
    const result = getDevices({ category });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────
// getDeviceAlerts
// ─────────────────────────────────────────────────────────────────────

describe('getDeviceAlerts', () => {
  it('returns empty buckets when no devices exist', () => {
    const alerts = getDeviceAlerts();
    expect(alerts.maintenanceDue).toEqual([]);
    expect(alerts.calibrationDue).toEqual([]);
    expect(alerts.warrantyExpiring).toEqual([]);
    expect(alerts.recalled).toEqual([]);
  });

  describe('maintenanceDue', () => {
    it('flags a device whose nextMaintenanceDate is in the past', () => {
      seedDeviceData({
        devices: [makeSofwave({ nextMaintenanceDate: '2026-04-01' })], // 8 days ago
      });
      expect(getDeviceAlerts().maintenanceDue).toHaveLength(1);
    });

    it('flags a device whose nextMaintenanceDate equals NOW exactly (boundary: <=)', () => {
      seedDeviceData({
        devices: [makeSofwave({ nextMaintenanceDate: FROZEN_NOW.toISOString() })],
      });
      expect(getDeviceAlerts().maintenanceDue).toHaveLength(1);
    });

    it('does NOT flag a device with nextMaintenanceDate one day in the future', () => {
      seedDeviceData({
        devices: [makeSofwave({ nextMaintenanceDate: '2026-04-10' })],
      });
      expect(getDeviceAlerts().maintenanceDue).toEqual([]);
    });

    it('ALSO flags a device with status=maintenance_due regardless of date', () => {
      seedDeviceData({
        devices: [
          makeSofwave({
            status: 'maintenance_due',
            nextMaintenanceDate: '2027-01-01', // future
          }),
        ],
      });
      expect(getDeviceAlerts().maintenanceDue).toHaveLength(1);
    });

    it('excludes decommissioned devices from maintenance alerts even if overdue', () => {
      seedDeviceData({
        devices: [
          makeSofwave({
            status: 'decommissioned',
            nextMaintenanceDate: '2025-01-01',
          }),
        ],
      });
      expect(getDeviceAlerts().maintenanceDue).toEqual([]);
    });
  });

  describe('calibrationDue', () => {
    it('flags a device whose nextCalibrationDate is in the past', () => {
      seedDeviceData({
        devices: [makePicoWay({ nextCalibrationDate: '2026-03-01' })],
      });
      expect(getDeviceAlerts().calibrationDue).toHaveLength(1);
    });

    it('flags a device whose nextCalibrationDate equals NOW exactly (boundary)', () => {
      seedDeviceData({
        devices: [makePicoWay({ nextCalibrationDate: FROZEN_NOW.toISOString() })],
      });
      expect(getDeviceAlerts().calibrationDue).toHaveLength(1);
    });

    it('does NOT flag a device with nextCalibrationDate one day in the future', () => {
      seedDeviceData({
        devices: [makePicoWay({ nextCalibrationDate: '2026-04-10' })],
      });
      expect(getDeviceAlerts().calibrationDue).toEqual([]);
    });

    it('excludes decommissioned devices from calibration alerts even if expired', () => {
      seedDeviceData({
        devices: [
          makePicoWay({
            status: 'decommissioned',
            nextCalibrationDate: '2024-01-01',
          }),
        ],
      });
      expect(getDeviceAlerts().calibrationDue).toEqual([]);
    });
  });

  describe('warrantyExpiring (within 30 days)', () => {
    it('flags a device whose warranty expires in exactly 30 days (upper boundary inclusive)', () => {
      // 2026-05-09 is exactly 30 days from 2026-04-09
      seedDeviceData({
        devices: [makeSofwave({ warrantyExpiration: '2026-05-09T12:00:00Z' })],
      });
      expect(getDeviceAlerts().warrantyExpiring).toHaveLength(1);
    });

    it('does NOT flag a device whose warranty expires in 31 days', () => {
      seedDeviceData({
        devices: [makeSofwave({ warrantyExpiration: '2026-05-11' })],
      });
      expect(getDeviceAlerts().warrantyExpiring).toEqual([]);
    });

    it('does NOT flag a warranty that has already expired (lower boundary strictly >)', () => {
      seedDeviceData({
        devices: [makeSofwave({ warrantyExpiration: '2026-04-01' })], // past
      });
      expect(getDeviceAlerts().warrantyExpiring).toEqual([]);
    });

    it('does NOT flag a warranty expiring exactly at NOW (strictly greater-than lower bound)', () => {
      seedDeviceData({
        devices: [
          makeSofwave({ warrantyExpiration: FROZEN_NOW.toISOString() }),
        ],
      });
      expect(getDeviceAlerts().warrantyExpiring).toEqual([]);
    });

    it('flags a warranty expiring tomorrow (inside window)', () => {
      seedDeviceData({
        devices: [makeSofwave({ warrantyExpiration: '2026-04-10' })],
      });
      expect(getDeviceAlerts().warrantyExpiring).toHaveLength(1);
    });

    it('excludes decommissioned devices from warranty alerts', () => {
      seedDeviceData({
        devices: [
          makeSofwave({
            status: 'decommissioned',
            warrantyExpiration: '2026-04-20',
          }),
        ],
      });
      expect(getDeviceAlerts().warrantyExpiring).toEqual([]);
    });
  });

  describe('recalled', () => {
    it('flags devices with status=recalled', () => {
      seedDeviceData({
        devices: [
          makeSofwave({ status: 'recalled' }),
          makePicoWay({ status: 'operational' }),
        ],
      });
      const alerts = getDeviceAlerts();
      expect(alerts.recalled).toHaveLength(1);
      expect(alerts.recalled[0].name).toBe('Sofwave SUPERB');
    });

    it('returns empty when no devices are recalled', () => {
      seedDeviceData({ devices: [makeSofwave(), makePicoWay()] });
      expect(getDeviceAlerts().recalled).toEqual([]);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────
// addMaintenanceRecord
// ─────────────────────────────────────────────────────────────────────

describe('addMaintenanceRecord', () => {
  beforeEach(() => {
    seedDeviceData({ devices: [makeSofwave()] });
  });

  it('assigns a maint_-prefixed unique id and preserves all caller fields', () => {
    const { id: _i, ...p } = makeMaintenance();
    void _i;
    const record = addMaintenanceRecord(p);
    expect(record.id).toMatch(/^maint_\d+_[a-z0-9]+$/);
    expect(record).toMatchObject(p);
  });

  it('persists the record so it is retrievable via getMaintenanceHistory', () => {
    const { id: _i, ...p } = makeMaintenance();
    void _i;
    const record = addMaintenanceRecord(p);
    const history = getMaintenanceHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe(record.id);
  });

  it('updates the device lastMaintenanceDate/nextMaintenanceDate and status=operational on completed records', () => {
    const { id: _i, ...p } = makeMaintenance({
      date: '2026-04-05',
      nextScheduledDate: '2026-10-05',
      status: 'completed',
    });
    void _i;
    addMaintenanceRecord(p);
    const device = getDevices().find((d) => d.id === 'dev_sofwave_1')!;
    expect(device.lastMaintenanceDate).toBe('2026-04-05');
    expect(device.nextMaintenanceDate).toBe('2026-10-05');
    expect(device.status).toBe('operational');
  });

  it('does NOT update device maintenance dates when record status is pending', () => {
    const { id: _i, ...p } = makeMaintenance({
      date: '2026-04-05',
      nextScheduledDate: '2026-10-05',
      status: 'pending',
    });
    void _i;
    addMaintenanceRecord(p);
    const device = getDevices().find((d) => d.id === 'dev_sofwave_1')!;
    // unchanged from seed
    expect(device.lastMaintenanceDate).toBe('2026-01-09');
    expect(device.nextMaintenanceDate).toBe('2026-07-09');
  });

  it.each<[MaintenanceRecord['status']]>([
    ['pending'],
    ['in_progress'],
    ['cancelled'],
  ])('does NOT update device dates for non-completed status (%s)', (status) => {
    const { id: _i, ...p } = makeMaintenance({ status });
    void _i;
    addMaintenanceRecord(p);
    const device = getDevices().find((d) => d.id === 'dev_sofwave_1')!;
    expect(device.lastMaintenanceDate).toBe('2026-01-09');
  });

  it('tolerates an unknown deviceId — record is still created, no device side-effects', () => {
    const { id: _i, ...p } = makeMaintenance({ deviceId: 'dev_unknown' });
    void _i;
    const record = addMaintenanceRecord(p);
    expect(record.id).toMatch(/^maint_/);
    // Devices unchanged
    const device = getDevices()[0];
    expect(device.lastMaintenanceDate).toBe('2026-01-09');
  });

  it('forwards a device_maintenance audit entry with technician, device, and description in details', () => {
    const { id: _i, ...p } = makeMaintenance();
    void _i;
    addMaintenanceRecord(p);
    expect(createAuditEntryMock).toHaveBeenCalledTimes(1);
    const call = createAuditEntryMock.mock.calls[0][0];
    expect(call).toMatchObject({
      userId: 'tech_jane',
      userRole: 'operations',
      action: 'device_maintenance',
      resourceType: 'medical_device',
      resourceId: 'dev_sofwave_1',
    });
    expect(call.details).toContain('preventive');
    expect(call.details).toContain('Sofwave SUPERB');
    expect(call.details).toContain('transducer');
  });

  it('emits an audit entry even when the maintenance record is not completed', () => {
    const { id: _i, ...p } = makeMaintenance({ status: 'pending' });
    void _i;
    addMaintenanceRecord(p);
    expect(createAuditEntryMock).toHaveBeenCalledTimes(1);
  });

  it('a completed maintenance record on a recalled device does NOT clear the recall', () => {
    // Fix: recalled devices require an explicit recall-clearance workflow.
    // Routine PM cannot silently restore a recalled device to operational —
    // addMaintenanceRecord now preserves 'recalled' on completion.
    updateDevice('dev_sofwave_1', { status: 'recalled' });
    const { id: _i, ...p } = makeMaintenance({
      date: '2026-04-05',
      nextScheduledDate: '2026-10-05',
      status: 'completed',
    });
    void _i;
    addMaintenanceRecord(p);
    const device = getDevices().find((d) => d.id === 'dev_sofwave_1')!;
    // Status must remain 'recalled' — PM cannot clear a recall.
    expect(device.status).toBe('recalled');
    // But the maintenance dates themselves should still be recorded.
    expect(device.lastMaintenanceDate).toBe('2026-04-05');
    expect(device.nextMaintenanceDate).toBe('2026-10-05');
  });

  // ── Regression: audit entry notes that maintenance cannot clear a recall ──
  it('audit entry on a recalled device notes that maintenance does NOT clear the recall', () => {
    updateDevice('dev_sofwave_1', { status: 'recalled' });
    const { id: _i, ...p } = makeMaintenance({ status: 'completed' });
    void _i;
    addMaintenanceRecord(p);
    const call = createAuditEntryMock.mock.calls[0][0];
    expect(call.action).toBe('device_maintenance');
    expect(call.details).toMatch(/recall/i);
  });

  // ── Regression: operational device still gets restored to operational ──
  it('a completed maintenance record on a non-recalled device still sets status=operational', () => {
    updateDevice('dev_sofwave_1', { status: 'maintenance_due' });
    const { id: _i, ...p } = makeMaintenance({ status: 'completed' });
    void _i;
    addMaintenanceRecord(p);
    const device = getDevices().find((d) => d.id === 'dev_sofwave_1')!;
    expect(device.status).toBe('operational');
  });
});

// ─────────────────────────────────────────────────────────────────────
// getMaintenanceHistory
// ─────────────────────────────────────────────────────────────────────

describe('getMaintenanceHistory', () => {
  beforeEach(() => {
    seedDeviceData({
      devices: [makeSofwave(), makePicoWay({ id: 'dev_picoway_1' })],
      maintenanceRecords: [
        makeMaintenance({ id: 'm1', deviceId: 'dev_sofwave_1', date: '2026-01-15' }),
        makeMaintenance({ id: 'm2', deviceId: 'dev_sofwave_1', date: '2026-03-20' }),
        makeMaintenance({
          id: 'm3',
          deviceId: 'dev_picoway_1',
          deviceName: 'PicoWay Resolve',
          date: '2026-02-10',
        }),
        makeMaintenance({ id: 'm4', deviceId: 'dev_sofwave_1', date: '2025-12-01' }),
      ],
    });
  });

  it('returns all records newest-first when no deviceId is provided', () => {
    const result = getMaintenanceHistory();
    expect(result.map((r) => r.id)).toEqual(['m2', 'm3', 'm1', 'm4']);
  });

  it('filters by deviceId and preserves newest-first ordering', () => {
    const result = getMaintenanceHistory('dev_sofwave_1');
    expect(result.map((r) => r.id)).toEqual(['m2', 'm1', 'm4']);
  });

  it('returns empty array for a device with no maintenance history', () => {
    expect(getMaintenanceHistory('dev_hydra_unknown')).toEqual([]);
  });

  it('returns empty array when the store is empty', () => {
    clearDeviceData();
    expect(getMaintenanceHistory()).toEqual([]);
    expect(getMaintenanceHistory('dev_sofwave_1')).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────
// getUpcomingMaintenance
// ─────────────────────────────────────────────────────────────────────

describe('getUpcomingMaintenance', () => {
  it('returns only pending records whose nextScheduledDate falls within the window', () => {
    seedDeviceData({
      maintenanceRecords: [
        makeMaintenance({
          id: 'within',
          status: 'pending',
          nextScheduledDate: '2026-04-20', // 11 days out
        }),
        makeMaintenance({
          id: 'outside',
          status: 'pending',
          nextScheduledDate: '2026-06-15', // > 30 days
        }),
        makeMaintenance({
          id: 'past',
          status: 'pending',
          nextScheduledDate: '2026-04-01', // in past
        }),
      ],
    });
    const result = getUpcomingMaintenance(30);
    expect(result.map((r) => r.id)).toEqual(['within']);
  });

  it('defaults the window to 30 days when no argument is provided', () => {
    seedDeviceData({
      maintenanceRecords: [
        makeMaintenance({
          id: 'day_29',
          status: 'pending',
          nextScheduledDate: '2026-05-08', // 29 days out
        }),
        makeMaintenance({
          id: 'day_31',
          status: 'pending',
          nextScheduledDate: '2026-05-10', // 31 days out
        }),
      ],
    });
    const result = getUpcomingMaintenance();
    expect(result.map((r) => r.id)).toEqual(['day_29']);
  });

  it('includes a record whose nextScheduledDate equals NOW exactly (lower boundary inclusive)', () => {
    seedDeviceData({
      maintenanceRecords: [
        makeMaintenance({
          id: 'exact',
          status: 'pending',
          nextScheduledDate: FROZEN_NOW.toISOString(),
        }),
      ],
    });
    const result = getUpcomingMaintenance(30);
    expect(result.map((r) => r.id)).toEqual(['exact']);
  });

  it('excludes completed / in_progress / cancelled records', () => {
    seedDeviceData({
      maintenanceRecords: [
        makeMaintenance({
          id: 'done',
          status: 'completed',
          nextScheduledDate: '2026-04-15',
        }),
        makeMaintenance({
          id: 'in_progress',
          status: 'in_progress',
          nextScheduledDate: '2026-04-15',
        }),
        makeMaintenance({
          id: 'cancelled',
          status: 'cancelled',
          nextScheduledDate: '2026-04-15',
        }),
      ],
    });
    expect(getUpcomingMaintenance(30)).toEqual([]);
  });

  it('sorts results ascending by nextScheduledDate (soonest first)', () => {
    seedDeviceData({
      maintenanceRecords: [
        makeMaintenance({ id: 'b', status: 'pending', nextScheduledDate: '2026-04-25' }),
        makeMaintenance({ id: 'a', status: 'pending', nextScheduledDate: '2026-04-12' }),
        makeMaintenance({ id: 'c', status: 'pending', nextScheduledDate: '2026-05-01' }),
      ],
    });
    const result = getUpcomingMaintenance(30);
    expect(result.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('accepts a custom window (90 days)', () => {
    seedDeviceData({
      maintenanceRecords: [
        makeMaintenance({
          id: 'in_window',
          status: 'pending',
          nextScheduledDate: '2026-06-01',
        }),
      ],
    });
    expect(getUpcomingMaintenance(30)).toEqual([]);
    expect(getUpcomingMaintenance(90).map((r) => r.id)).toEqual(['in_window']);
  });
});

// ─────────────────────────────────────────────────────────────────────
// addCalibrationLog
// ─────────────────────────────────────────────────────────────────────

describe('addCalibrationLog', () => {
  beforeEach(() => {
    seedDeviceData({ devices: [makePicoWay()] });
  });

  it('assigns a cal_-prefixed unique id and preserves all caller fields', () => {
    const { id: _i, ...p } = makeCalibration();
    void _i;
    const log = addCalibrationLog(p);
    expect(log.id).toMatch(/^cal_\d+_[a-z0-9]+$/);
    expect(log).toMatchObject(p);
  });

  it('updates the device lastCalibrationDate and nextCalibrationDate on a PASS', () => {
    const { id: _i, ...p } = makeCalibration({
      calibrationDate: '2026-04-05',
      nextCalibrationDate: '2026-10-05',
      overallPass: true,
    });
    void _i;
    addCalibrationLog(p);
    const device = getDevices()[0];
    expect(device.lastCalibrationDate).toBe('2026-04-05');
    expect(device.nextCalibrationDate).toBe('2026-10-05');
    expect(device.status).toBe('operational'); // unchanged on pass
  });

  it('forces device status to under_repair on a FAIL (drift detection)', () => {
    const { id: _i, ...p } = makeCalibration({
      overallPass: false,
      parametersTested: [
        {
          parameter: 'energy_output_1064nm',
          expected: '600 mJ',
          measured: '480 mJ',
          pass: false,
        },
      ],
    });
    void _i;
    addCalibrationLog(p);
    const device = getDevices()[0];
    expect(device.status).toBe('under_repair');
  });

  it('still updates calibration dates on a FAIL (the log is the source of truth)', () => {
    const { id: _i, ...p } = makeCalibration({
      calibrationDate: '2026-04-05',
      nextCalibrationDate: '2026-10-05',
      overallPass: false,
    });
    void _i;
    addCalibrationLog(p);
    const device = getDevices()[0];
    expect(device.lastCalibrationDate).toBe('2026-04-05');
    expect(device.nextCalibrationDate).toBe('2026-10-05');
  });

  it('tolerates an unknown deviceId — log still created, no device side-effects', () => {
    const { id: _i, ...p } = makeCalibration({ deviceId: 'dev_unknown' });
    void _i;
    const log = addCalibrationLog(p);
    expect(log.id).toMatch(/^cal_/);
    const device = getDevices()[0];
    expect(device.lastCalibrationDate).toBe('2026-03-01'); // unchanged from seed
  });

  it('forwards a device_calibration audit entry with PASS/FAIL and parameter count', () => {
    const { id: _i, ...p } = makeCalibration({
      parametersTested: [
        { parameter: 'p1', expected: '1', measured: '1', pass: true },
        { parameter: 'p2', expected: '2', measured: '2', pass: true },
      ],
    });
    void _i;
    addCalibrationLog(p);
    const call = createAuditEntryMock.mock.calls[0][0];
    expect(call).toMatchObject({
      action: 'device_calibration',
      resourceType: 'medical_device',
      resourceId: 'dev_picoway_1',
      userRole: 'operations',
    });
    expect(call.details).toContain('PASS');
    expect(call.details).toContain('2 parameters');
  });

  it('audit entry details contain FAIL when overallPass is false', () => {
    const { id: _i, ...p } = makeCalibration({ overallPass: false });
    void _i;
    addCalibrationLog(p);
    const call = createAuditEntryMock.mock.calls[0][0];
    expect(call.details).toContain('FAIL');
  });

  it('a PASS calibration clears a prior under_repair status back to operational', () => {
    // Fix: a successful re-calibration now restores a device from
    // 'under_repair' to 'operational'. Previously the PASS branch preserved
    // the current status, leaving devices stuck under_repair forever.
    updateDevice('dev_picoway_1', { status: 'under_repair' });
    const { id: _i, ...p } = makeCalibration({ overallPass: true });
    void _i;
    addCalibrationLog(p);
    const device = getDevices()[0];
    expect(device.status).toBe('operational');
  });

  // ── Regression: PASS calibration on a recalled device leaves recall intact ──
  it('a PASS calibration on a recalled device leaves status unchanged (recalled)', () => {
    updateDevice('dev_picoway_1', { status: 'recalled' });
    const { id: _i, ...p } = makeCalibration({ overallPass: true });
    void _i;
    addCalibrationLog(p);
    const device = getDevices()[0];
    // Calibration alone must not clear a recall.
    expect(device.status).toBe('recalled');
  });

  // ── Regression: PASS calibration on an operational device stays operational ──
  it('a PASS calibration on an operational device stays operational', () => {
    // dev_picoway_1 is seeded as 'operational'
    const { id: _i, ...p } = makeCalibration({ overallPass: true });
    void _i;
    addCalibrationLog(p);
    const device = getDevices()[0];
    expect(device.status).toBe('operational');
  });
});

// ─────────────────────────────────────────────────────────────────────
// getCalibrationHistory
// ─────────────────────────────────────────────────────────────────────

describe('getCalibrationHistory', () => {
  beforeEach(() => {
    seedDeviceData({
      calibrationLogs: [
        makeCalibration({ id: 'c1', deviceId: 'dev_picoway_1', calibrationDate: '2026-01-15' }),
        makeCalibration({ id: 'c2', deviceId: 'dev_picoway_1', calibrationDate: '2026-04-01' }),
        makeCalibration({
          id: 'c3',
          deviceId: 'dev_sofwave_1',
          deviceName: 'Sofwave SUPERB',
          calibrationDate: '2026-02-20',
        }),
      ],
    });
  });

  it('returns all logs newest-first when no deviceId is provided', () => {
    const result = getCalibrationHistory();
    expect(result.map((l) => l.id)).toEqual(['c2', 'c3', 'c1']);
  });

  it('filters by deviceId and preserves newest-first ordering', () => {
    const result = getCalibrationHistory('dev_picoway_1');
    expect(result.map((l) => l.id)).toEqual(['c2', 'c1']);
  });

  it('returns empty array for a device with no calibration history', () => {
    expect(getCalibrationHistory('dev_hydra_1')).toEqual([]);
  });

  it('returns empty array when the store is empty', () => {
    clearDeviceData();
    expect(getCalibrationHistory()).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────
// reportAdverseEvent
// ─────────────────────────────────────────────────────────────────────

describe('reportAdverseEvent', () => {
  it('assigns an ae_-prefixed unique id and preserves all caller fields', () => {
    const { id: _i, ...p } = makeAdverseEvent();
    void _i;
    const report = reportAdverseEvent(p);
    expect(report.id).toMatch(/^ae_\d+_[a-z0-9]+$/);
    expect(report).toMatchObject(p);
  });

  it('generates distinct ids for two sequential adverse events', () => {
    const { id: _i, ...p } = makeAdverseEvent();
    void _i;
    const a = reportAdverseEvent(p);
    const b = reportAdverseEvent(p);
    expect(a.id).not.toBe(b.id);
  });

  it('persists the report so it is retrievable via getAdverseEvents', () => {
    const { id: _i, ...p } = makeAdverseEvent();
    void _i;
    const report = reportAdverseEvent(p);
    expect(getAdverseEvents()).toHaveLength(1);
    expect(getAdverseEvents()[0].id).toBe(report.id);
  });

  it('forwards a device_adverse_event audit entry with severity and description', () => {
    const { id: _i, ...p } = makeAdverseEvent({
      severity: 'serious',
      eventDescription: 'Second-degree burn on cheek from Sofwave over-treatment',
    });
    void _i;
    reportAdverseEvent(p);
    expect(createAuditEntryMock).toHaveBeenCalledTimes(1);
    const call = createAuditEntryMock.mock.calls[0][0];
    expect(call).toMatchObject({
      userId: 'provider_rina',
      userRole: 'provider',
      action: 'device_adverse_event',
      resourceType: 'medical_device',
      resourceId: 'dev_picoway_1',
    });
    expect(call.details).toContain('Second-degree burn');
    expect(call.details).toContain('serious');
  });

  it.each<[AdverseEventReport['severity']]>([
    ['minor'],
    ['moderate'],
    ['serious'],
    ['death'],
  ])('accepts every severity enum value (%s)', (severity) => {
    const { id: _i, ...p } = makeAdverseEvent({ severity });
    void _i;
    const report = reportAdverseEvent(p);
    expect(report.severity).toBe(severity);
  });
});

// ─────────────────────────────────────────────────────────────────────
// updateAdverseEvent
// ─────────────────────────────────────────────────────────────────────

describe('updateAdverseEvent', () => {
  it('applies partial updates to an existing event and returns the merged record', () => {
    seedDeviceData({ adverseEvents: [makeAdverseEvent()] });
    const updated = updateAdverseEvent('ae_seed_1', {
      status: 'resolved',
      fdaReported: true,
      fdaReportNumber: 'MW5024000',
      manufacturerNotified: true,
    });
    expect(updated).not.toBeNull();
    expect(updated!.status).toBe('resolved');
    expect(updated!.fdaReported).toBe(true);
    expect(updated!.fdaReportNumber).toBe('MW5024000');
    expect(updated!.manufacturerNotified).toBe(true);
    // Unchanged fields preserved
    expect(updated!.deviceName).toBe('PicoWay Resolve');
    expect(updated!.severity).toBe('moderate');
  });

  it('returns null when the event id is unknown', () => {
    seedDeviceData({ adverseEvents: [makeAdverseEvent()] });
    expect(updateAdverseEvent('ae_nope', { status: 'closed' })).toBeNull();
  });

  it('returns null on an empty store', () => {
    expect(updateAdverseEvent('ae_anything', { status: 'closed' })).toBeNull();
  });

  it('does not mutate other events when updating one by id', () => {
    seedDeviceData({
      adverseEvents: [
        makeAdverseEvent({ id: 'ae_a' }),
        makeAdverseEvent({ id: 'ae_b', severity: 'serious' }),
      ],
    });
    updateAdverseEvent('ae_a', { status: 'closed' });
    const b = getAdverseEvents().find((a) => a.id === 'ae_b')!;
    expect(b.severity).toBe('serious');
    expect(b.status).toBe('investigating');
  });
});

// ─────────────────────────────────────────────────────────────────────
// getAdverseEvents
// ─────────────────────────────────────────────────────────────────────

describe('getAdverseEvents', () => {
  beforeEach(() => {
    seedDeviceData({
      adverseEvents: [
        makeAdverseEvent({ id: 'a1', deviceId: 'dev_picoway_1', eventDate: '2026-01-15' }),
        makeAdverseEvent({ id: 'a2', deviceId: 'dev_picoway_1', eventDate: '2026-04-01' }),
        makeAdverseEvent({
          id: 'a3',
          deviceId: 'dev_sofwave_1',
          deviceName: 'Sofwave SUPERB',
          eventDate: '2026-03-20',
        }),
      ],
    });
  });

  it('returns all events newest-first when no deviceId is provided', () => {
    const result = getAdverseEvents();
    expect(result.map((a) => a.id)).toEqual(['a2', 'a3', 'a1']);
  });

  it('filters by deviceId and preserves newest-first ordering', () => {
    const result = getAdverseEvents('dev_picoway_1');
    expect(result.map((a) => a.id)).toEqual(['a2', 'a1']);
  });

  it('returns empty array for a device with no events', () => {
    expect(getAdverseEvents('dev_hydra_1')).toEqual([]);
  });

  it('returns empty array when the store is empty', () => {
    clearDeviceData();
    expect(getAdverseEvents()).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────
// assessMDRRequirements (FDA MDR — 21 CFR 803)
// ─────────────────────────────────────────────────────────────────────

describe('assessMDRRequirements', () => {
  it.each<[AdverseEventReport['severity'], boolean]>([
    ['minor', false],
    ['moderate', false],
    ['serious', true],
    ['death', true],
  ])(
    'severity=%s → requiresFDAReport=%s',
    (severity, expected) => {
      const event = makeAdverseEvent({ severity });
      expect(assessMDRRequirements(event).requiresFDAReport).toBe(expected);
    }
  );

  it('ALWAYS requires manufacturer notification regardless of severity', () => {
    for (const severity of ['minor', 'moderate', 'serious', 'death'] as const) {
      const event = makeAdverseEvent({ severity });
      expect(assessMDRRequirements(event).requiresManufacturerReport).toBe(true);
    }
  });

  it('computes fdaDeadline as eventDate + 30 days (YYYY-MM-DD format)', () => {
    const event = makeAdverseEvent({ eventDate: '2026-04-05' });
    // 2026-04-05 + 30 days = 2026-05-05
    expect(assessMDRRequirements(event).fdaDeadline).toBe('2026-05-05');
  });

  it('computes manufacturerDeadline as eventDate + 10 days (YYYY-MM-DD format)', () => {
    const event = makeAdverseEvent({ eventDate: '2026-04-05' });
    // 2026-04-05 + 10 days = 2026-04-15
    expect(assessMDRRequirements(event).manufacturerDeadline).toBe('2026-04-15');
  });

  it('handles month-boundary arithmetic for fdaDeadline', () => {
    // 2026-03-20 + 30 days = 2026-04-19
    const event = makeAdverseEvent({ eventDate: '2026-03-20' });
    expect(assessMDRRequirements(event).fdaDeadline).toBe('2026-04-19');
  });

  it('handles year-boundary arithmetic for fdaDeadline', () => {
    // 2026-12-15 + 30 days = 2027-01-14
    const event = makeAdverseEvent({ eventDate: '2026-12-15' });
    expect(assessMDRRequirements(event).fdaDeadline).toBe('2027-01-14');
  });

  it.each<[AdverseEventReport['severity'], string]>([
    ['minor', 'Voluntary Report (Malfunction)'],
    ['moderate', 'Voluntary Report (Malfunction)'],
    ['serious', '30-Day Report (Serious Injury)'],
    ['death', '5-Day Report (Death)'],
  ])('severity=%s → reportType=%s', (severity, expected) => {
    const event = makeAdverseEvent({ severity });
    expect(assessMDRRequirements(event).reportType).toBe(expected);
  });

  it('returns deadlines in YYYY-MM-DD date-only format (no time component)', () => {
    const event = makeAdverseEvent({ eventDate: '2026-04-05' });
    const result = assessMDRRequirements(event);
    expect(result.fdaDeadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.manufacturerDeadline).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('death events return a 5-day FDA deadline per 21 CFR 803.10(c)(1)', () => {
    // Fix: death events now compute fdaDeadline as eventDate + 5 days,
    // matching the '5-Day Report (Death)' label and FDA MDR regulation.
    const event = makeAdverseEvent({ eventDate: '2026-04-05', severity: 'death' });
    const result = assessMDRRequirements(event);
    expect(result.reportType).toBe('5-Day Report (Death)');
    expect(result.fdaDeadline).toBe('2026-04-10'); // 2026-04-05 + 5 days
  });

  // ── Regression: serious injury keeps the 30-day FDA deadline ──
  it('serious injury events still return a 30-day FDA deadline per 21 CFR 803.10(c)(2)', () => {
    const event = makeAdverseEvent({ eventDate: '2026-04-05', severity: 'serious' });
    const result = assessMDRRequirements(event);
    expect(result.reportType).toBe('30-Day Report (Serious Injury)');
    expect(result.fdaDeadline).toBe('2026-05-05'); // 2026-04-05 + 30 days
  });

  // ── Regression: death-event month-boundary 5-day arithmetic ──
  it('death events handle month-boundary arithmetic on the 5-day FDA deadline', () => {
    // 2026-03-30 + 5 days = 2026-04-04
    const event = makeAdverseEvent({ eventDate: '2026-03-30', severity: 'death' });
    const result = assessMDRRequirements(event);
    expect(result.fdaDeadline).toBe('2026-04-04');
  });

  it('accepts a future-dated event (e.g., scheduled follow-up) and still returns valid deadlines', () => {
    const event = makeAdverseEvent({ eventDate: '2027-01-01' });
    const result = assessMDRRequirements(event);
    expect(result.fdaDeadline).toBe('2027-01-31');
    expect(result.manufacturerDeadline).toBe('2027-01-11');
  });
});

// ─────────────────────────────────────────────────────────────────────
// calculateDeviceScore
// ─────────────────────────────────────────────────────────────────────

describe('calculateDeviceScore', () => {
  it('returns a perfect 100 with zero issues when the system has no data at all', () => {
    const result = calculateDeviceScore();
    expect(result.score).toBe(100);
    expect(result.issues).toBe(0);
    expect(result.details).toHaveLength(4);
    expect(result.details.map((d) => d.area)).toEqual([
      'Maintenance',
      'Calibration',
      'Adverse Events',
      'FDA Registration',
    ]);
  });

  it('uses maxScore caps 30/30/25/15 for Maintenance/Calibration/AE/FDA (sum = 100)', () => {
    const result = calculateDeviceScore();
    const byArea = Object.fromEntries(result.details.map((d) => [d.area, d.maxScore]));
    expect(byArea['Maintenance']).toBe(30);
    expect(byArea['Calibration']).toBe(30);
    expect(byArea['Adverse Events']).toBe(25);
    expect(byArea['FDA Registration']).toBe(15);
    const totalMax = result.details.reduce((s, a) => s + a.maxScore, 0);
    expect(totalMax).toBe(100);
  });

  describe('Maintenance area', () => {
    it('deducts 10 points per overdue device', () => {
      seedDeviceData({
        devices: [
          makeSofwave({ nextMaintenanceDate: '2026-04-01' }), // overdue
          makePicoWay({ id: 'dev_picoway_1', nextMaintenanceDate: '2026-04-01' }),
        ],
      });
      const result = calculateDeviceScore();
      const maint = result.details.find((d) => d.area === 'Maintenance')!;
      // 30 - (2 * 10) = 10
      expect(maint.score).toBe(10);
      expect(maint.issues).toHaveLength(1);
      expect(maint.issues[0]).toContain('2 device');
    });

    it('floors the Maintenance score at 0 (cannot go negative)', () => {
      const devices = Array.from({ length: 5 }, (_, i) =>
        makeSofwave({
          id: `dev_bulk_${i}`,
          serialNumber: `SW-${i}`,
          nextMaintenanceDate: '2026-04-01',
        })
      );
      seedDeviceData({ devices });
      const result = calculateDeviceScore();
      const maint = result.details.find((d) => d.area === 'Maintenance')!;
      expect(maint.score).toBe(0);
    });
  });

  describe('Calibration area', () => {
    it('deducts 10 points per device with expired calibration', () => {
      seedDeviceData({
        devices: [makePicoWay({ nextCalibrationDate: '2026-03-01' })],
      });
      const result = calculateDeviceScore();
      const cal = result.details.find((d) => d.area === 'Calibration')!;
      expect(cal.score).toBe(20);
      expect(cal.issues).toHaveLength(1);
    });

    it('floors the Calibration score at 0 (cannot go negative)', () => {
      const devices = Array.from({ length: 5 }, (_, i) =>
        makePicoWay({
          id: `dev_bulk_${i}`,
          serialNumber: `PW-${i}`,
          nextCalibrationDate: '2026-01-01',
        })
      );
      seedDeviceData({ devices });
      const result = calculateDeviceScore();
      const cal = result.details.find((d) => d.area === 'Calibration')!;
      expect(cal.score).toBe(0);
    });
  });

  describe('Adverse Events area', () => {
    it('deducts 15 points when a serious event requires FDA report but fdaReported is false', () => {
      seedDeviceData({
        devices: [makePicoWay()],
        adverseEvents: [
          makeAdverseEvent({
            severity: 'serious',
            fdaReported: false,
            manufacturerNotified: true,
            status: 'investigating',
          }),
        ],
      });
      const result = calculateDeviceScore();
      const ae = result.details.find((d) => d.area === 'Adverse Events')!;
      // 25 - 15 = 10
      expect(ae.score).toBe(10);
    });

    it('deducts 5 points when manufacturer is not notified for an open event', () => {
      seedDeviceData({
        adverseEvents: [
          makeAdverseEvent({
            severity: 'minor',
            fdaReported: false, // minor does not require FDA
            manufacturerNotified: false,
            status: 'investigating',
          }),
        ],
      });
      const result = calculateDeviceScore();
      const ae = result.details.find((d) => d.area === 'Adverse Events')!;
      // 25 - 5 = 20
      expect(ae.score).toBe(20);
    });

    it('deducts 15 + 5 = 20 when both FDA and manufacturer are un-reported for a serious event', () => {
      seedDeviceData({
        adverseEvents: [
          makeAdverseEvent({
            severity: 'serious',
            fdaReported: false,
            manufacturerNotified: false,
            status: 'investigating',
          }),
        ],
      });
      const result = calculateDeviceScore();
      const ae = result.details.find((d) => d.area === 'Adverse Events')!;
      expect(ae.score).toBe(5);
      expect(ae.issues).toHaveLength(2);
    });

    it('does NOT penalize events with status=resolved', () => {
      seedDeviceData({
        adverseEvents: [
          makeAdverseEvent({
            severity: 'death',
            fdaReported: false,
            manufacturerNotified: false,
            status: 'resolved',
          }),
        ],
      });
      const result = calculateDeviceScore();
      const ae = result.details.find((d) => d.area === 'Adverse Events')!;
      expect(ae.score).toBe(25);
    });

    it('does NOT penalize events with status=closed', () => {
      seedDeviceData({
        adverseEvents: [
          makeAdverseEvent({
            severity: 'serious',
            fdaReported: false,
            manufacturerNotified: false,
            status: 'closed',
          }),
        ],
      });
      const result = calculateDeviceScore();
      const ae = result.details.find((d) => d.area === 'Adverse Events')!;
      expect(ae.score).toBe(25);
    });

    it('floors the Adverse Events score at 0 with catastrophic un-reported events', () => {
      seedDeviceData({
        adverseEvents: Array.from({ length: 5 }, (_, i) =>
          makeAdverseEvent({
            id: `ae_${i}`,
            severity: 'serious',
            fdaReported: false,
            manufacturerNotified: false,
            status: 'investigating',
          })
        ),
      });
      const result = calculateDeviceScore();
      const ae = result.details.find((d) => d.area === 'Adverse Events')!;
      expect(ae.score).toBe(0);
    });

    it('does NOT penalize when a serious event is FDA-reported and manufacturer-notified', () => {
      seedDeviceData({
        adverseEvents: [
          makeAdverseEvent({
            severity: 'serious',
            fdaReported: true,
            manufacturerNotified: true,
            status: 'investigating',
          }),
        ],
      });
      const result = calculateDeviceScore();
      const ae = result.details.find((d) => d.area === 'Adverse Events')!;
      expect(ae.score).toBe(25);
    });
  });

  describe('FDA Registration area', () => {
    it('does NOT penalize Class I devices for missing 510(k)', () => {
      seedDeviceData({
        devices: [
          makeHydraFacial({
            deviceClass: 'I',
            fda510kNumber: undefined,
          }),
        ],
      });
      const result = calculateDeviceScore();
      const fda = result.details.find((d) => d.area === 'FDA Registration')!;
      expect(fda.score).toBe(15);
    });

    it('deducts 5 points per Class II device missing 510(k)', () => {
      seedDeviceData({
        devices: [
          makeSofwave({ deviceClass: 'II', fda510kNumber: undefined }),
        ],
      });
      const result = calculateDeviceScore();
      const fda = result.details.find((d) => d.area === 'FDA Registration')!;
      expect(fda.score).toBe(10);
      expect(fda.issues).toHaveLength(1);
    });

    it('deducts 5 points per Class III device missing 510(k)', () => {
      seedDeviceData({
        devices: [
          makeSofwave({ deviceClass: 'III', fda510kNumber: undefined }),
        ],
      });
      const result = calculateDeviceScore();
      const fda = result.details.find((d) => d.area === 'FDA Registration')!;
      expect(fda.score).toBe(10);
    });

    it('does NOT penalize Class II devices WITH a 510(k) number', () => {
      seedDeviceData({
        devices: [makeSofwave({ deviceClass: 'II', fda510kNumber: 'K193607' })],
      });
      const result = calculateDeviceScore();
      const fda = result.details.find((d) => d.area === 'FDA Registration')!;
      expect(fda.score).toBe(15);
    });

    it('floors the FDA Registration score at 0 with many missing 510(k)s', () => {
      const devices = Array.from({ length: 10 }, (_, i) =>
        makeSofwave({
          id: `dev_bulk_${i}`,
          serialNumber: `SW-${i}`,
          deviceClass: 'II',
          fda510kNumber: undefined,
        })
      );
      seedDeviceData({ devices });
      const result = calculateDeviceScore();
      const fda = result.details.find((d) => d.area === 'FDA Registration')!;
      expect(fda.score).toBe(0);
    });
  });

  it('sums the four area scores into the total (within 0-100)', () => {
    seedDeviceData({
      devices: [makeSofwave({ nextMaintenanceDate: '2026-04-01' })],
      adverseEvents: [
        makeAdverseEvent({
          severity: 'serious',
          fdaReported: false,
          manufacturerNotified: true,
          status: 'investigating',
        }),
      ],
    });
    const result = calculateDeviceScore();
    const sum = result.details.reduce((s, a) => s + a.score, 0);
    expect(result.score).toBe(sum);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('reports totalIssues as the sum across all four areas', () => {
    seedDeviceData({
      devices: [
        makeSofwave({ nextMaintenanceDate: '2026-04-01' }), // +1 maint issue
        makePicoWay({
          id: 'dev_pw2',
          serialNumber: 'PW-2',
          nextCalibrationDate: '2026-03-01',
        }), // +1 cal issue
      ],
    });
    const result = calculateDeviceScore();
    const sum = result.details.reduce((s, a) => s + a.issues.length, 0);
    expect(result.issues).toBe(sum);
    expect(result.issues).toBeGreaterThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────
// seedDeviceData / clearDeviceData
// ─────────────────────────────────────────────────────────────────────

describe('seedDeviceData / clearDeviceData', () => {
  it('seeds devices, maintenance records, calibration logs, and adverse events in one call', () => {
    seedDeviceData({
      devices: [makeSofwave()],
      maintenanceRecords: [makeMaintenance()],
      calibrationLogs: [makeCalibration()],
      adverseEvents: [makeAdverseEvent()],
    });
    expect(getDevices()).toHaveLength(1);
    expect(getMaintenanceHistory()).toHaveLength(1);
    expect(getCalibrationHistory()).toHaveLength(1);
    expect(getAdverseEvents()).toHaveLength(1);
  });

  it('APPENDS to existing data rather than replacing (documented behavior)', () => {
    seedDeviceData({ devices: [makeSofwave()] });
    seedDeviceData({ devices: [makePicoWay({ id: 'dev_picoway_1' })] });
    expect(getDevices()).toHaveLength(2);
  });

  it('clearDeviceData empties all four stores', () => {
    seedDeviceData({
      devices: [makeSofwave()],
      maintenanceRecords: [makeMaintenance()],
      calibrationLogs: [makeCalibration()],
      adverseEvents: [makeAdverseEvent()],
    });
    clearDeviceData();
    expect(getDevices()).toEqual([]);
    expect(getMaintenanceHistory()).toEqual([]);
    expect(getCalibrationHistory()).toEqual([]);
    expect(getAdverseEvents()).toEqual([]);
  });

  it('seedDeviceData with an empty object does not throw and does not add anything', () => {
    expect(() => seedDeviceData({})).not.toThrow();
    expect(getDevices()).toEqual([]);
  });

  it('store isolation: clearing does not affect subsequent adds', () => {
    clearDeviceData();
    const { id: _i, ...p } = makeSofwave();
    void _i;
    addDevice(p);
    expect(getDevices()).toHaveLength(1);
  });
});
