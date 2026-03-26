/**
 * Device Compliance Engine
 * FDA 510(k) device tracking, maintenance schedules,
 * calibration logs, adverse event reporting (MDR).
 */

import type {
  MedicalDevice,
  MaintenanceRecord,
  CalibrationLog,
  AdverseEventReport,
} from '@/types/compliance';
import { createAuditEntry } from './audit-trail';

// ── In-memory stores ─────────────────────────────────────────────────

let devices: MedicalDevice[] = [];
let maintenanceRecords: MaintenanceRecord[] = [];
let calibrationLogs: CalibrationLog[] = [];
let adverseEvents: AdverseEventReport[] = [];

// ── Device Management ────────────────────────────────────────────────

export function addDevice(params: Omit<MedicalDevice, 'id'>): MedicalDevice {
  const device: MedicalDevice = {
    id: `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...params,
  };
  devices = [...devices, device];
  return device;
}

export function updateDevice(id: string, updates: Partial<MedicalDevice>): MedicalDevice | null {
  const index = devices.findIndex((d) => d.id === id);
  if (index === -1) return null;
  devices[index] = { ...devices[index], ...updates };
  return devices[index];
}

export function getDevices(filters?: {
  category?: MedicalDevice['category'];
  status?: MedicalDevice['status'];
}): MedicalDevice[] {
  let result = [...devices];
  if (filters?.category) result = result.filter((d) => d.category === filters.category);
  if (filters?.status) result = result.filter((d) => d.status === filters.status);
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export function getDeviceAlerts(): {
  maintenanceDue: MedicalDevice[];
  calibrationDue: MedicalDevice[];
  warrantyExpiring: MedicalDevice[];
  recalled: MedicalDevice[];
} {
  const now = new Date();
  const thirtyDaysOut = new Date();
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

  return {
    maintenanceDue: devices.filter(
      (d) => d.status !== 'decommissioned' &&
             (new Date(d.nextMaintenanceDate) <= now || d.status === 'maintenance_due')
    ),
    calibrationDue: devices.filter(
      (d) => d.status !== 'decommissioned' && new Date(d.nextCalibrationDate) <= now
    ),
    warrantyExpiring: devices.filter(
      (d) => d.status !== 'decommissioned' &&
             new Date(d.warrantyExpiration) > now &&
             new Date(d.warrantyExpiration) <= thirtyDaysOut
    ),
    recalled: devices.filter((d) => d.status === 'recalled'),
  };
}

// ── Maintenance Records ──────────────────────────────────────────────

export function addMaintenanceRecord(params: Omit<MaintenanceRecord, 'id'>): MaintenanceRecord {
  const record: MaintenanceRecord = {
    id: `maint_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...params,
  };
  maintenanceRecords = [...maintenanceRecords, record];

  // Update device maintenance dates
  const deviceIndex = devices.findIndex((d) => d.id === params.deviceId);
  if (deviceIndex !== -1 && params.status === 'completed') {
    devices[deviceIndex] = {
      ...devices[deviceIndex],
      lastMaintenanceDate: params.date,
      nextMaintenanceDate: params.nextScheduledDate,
      status: 'operational',
    };
  }

  createAuditEntry({
    userId: params.performedBy,
    userName: params.performedBy,
    userRole: 'operations',
    action: 'device_maintenance',
    resourceType: 'medical_device',
    resourceId: params.deviceId,
    details: `${params.type} maintenance on ${params.deviceName}: ${params.description}`,
    ipAddress: '0.0.0.0',
  });

  return record;
}

export function getMaintenanceHistory(deviceId?: string): MaintenanceRecord[] {
  const result = deviceId
    ? maintenanceRecords.filter((m) => m.deviceId === deviceId)
    : [...maintenanceRecords];
  return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getUpcomingMaintenance(days: number = 30): MaintenanceRecord[] {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  return maintenanceRecords
    .filter(
      (m) => m.status === 'pending' &&
             new Date(m.nextScheduledDate) >= now &&
             new Date(m.nextScheduledDate) <= futureDate
    )
    .sort((a, b) => new Date(a.nextScheduledDate).getTime() - new Date(b.nextScheduledDate).getTime());
}

// ── Calibration Logs ─────────────────────────────────────────────────

export function addCalibrationLog(params: Omit<CalibrationLog, 'id'>): CalibrationLog {
  const log: CalibrationLog = {
    id: `cal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...params,
  };
  calibrationLogs = [...calibrationLogs, log];

  // Update device calibration dates
  const deviceIndex = devices.findIndex((d) => d.id === params.deviceId);
  if (deviceIndex !== -1) {
    devices[deviceIndex] = {
      ...devices[deviceIndex],
      lastCalibrationDate: params.calibrationDate,
      nextCalibrationDate: params.nextCalibrationDate,
      status: params.overallPass ? devices[deviceIndex].status : 'under_repair',
    };
  }

  createAuditEntry({
    userId: params.calibratedBy,
    userName: params.calibratedBy,
    userRole: 'operations',
    action: 'device_calibration',
    resourceType: 'medical_device',
    resourceId: params.deviceId,
    details: `Calibration of ${params.deviceName}: ${params.overallPass ? 'PASS' : 'FAIL'}. ${params.parametersTested.length} parameters tested.`,
    ipAddress: '0.0.0.0',
  });

  return log;
}

export function getCalibrationHistory(deviceId?: string): CalibrationLog[] {
  const result = deviceId
    ? calibrationLogs.filter((c) => c.deviceId === deviceId)
    : [...calibrationLogs];
  return result.sort(
    (a, b) => new Date(b.calibrationDate).getTime() - new Date(a.calibrationDate).getTime()
  );
}

// ── Adverse Event Reporting (MDR) ────────────────────────────────────

export function reportAdverseEvent(params: Omit<AdverseEventReport, 'id'>): AdverseEventReport {
  const report: AdverseEventReport = {
    id: `ae_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...params,
  };
  adverseEvents = [...adverseEvents, report];

  createAuditEntry({
    userId: params.reportedBy,
    userName: params.reportedBy,
    userRole: 'provider',
    action: 'device_adverse_event',
    resourceType: 'medical_device',
    resourceId: params.deviceId,
    details: `Adverse event reported for ${params.deviceName}: ${params.eventDescription}. Severity: ${params.severity}`,
    ipAddress: '0.0.0.0',
  });

  return report;
}

export function updateAdverseEvent(
  id: string,
  updates: Partial<AdverseEventReport>
): AdverseEventReport | null {
  const index = adverseEvents.findIndex((a) => a.id === id);
  if (index === -1) return null;
  adverseEvents[index] = { ...adverseEvents[index], ...updates };
  return adverseEvents[index];
}

export function getAdverseEvents(deviceId?: string): AdverseEventReport[] {
  const result = deviceId
    ? adverseEvents.filter((a) => a.deviceId === deviceId)
    : [...adverseEvents];
  return result.sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
  );
}

/**
 * FDA MDR (Medical Device Report) requirements:
 * - Serious injury or death: report within 30 days to FDA
 * - Malfunction that could cause injury: report within 30 days
 * - Must also report to device manufacturer within 10 days
 */
export function assessMDRRequirements(event: AdverseEventReport): {
  requiresFDAReport: boolean;
  requiresManufacturerReport: boolean;
  fdaDeadline: string;
  manufacturerDeadline: string;
  reportType: string;
} {
  const eventDate = new Date(event.eventDate);
  const thirtyDaysOut = new Date(eventDate);
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);
  const tenDaysOut = new Date(eventDate);
  tenDaysOut.setDate(tenDaysOut.getDate() + 10);

  const requiresFDA = event.severity === 'serious' || event.severity === 'death';

  return {
    requiresFDAReport: requiresFDA,
    requiresManufacturerReport: true, // Always notify manufacturer
    fdaDeadline: thirtyDaysOut.toISOString().split('T')[0],
    manufacturerDeadline: tenDaysOut.toISOString().split('T')[0],
    reportType: event.severity === 'death'
      ? '5-Day Report (Death)'
      : event.severity === 'serious'
        ? '30-Day Report (Serious Injury)'
        : 'Voluntary Report (Malfunction)',
  };
}

// ── Device Compliance Score ──────────────────────────────────────────

export function calculateDeviceScore(): {
  score: number;
  issues: number;
  details: { area: string; score: number; maxScore: number; issues: string[] }[];
} {
  const areas: { area: string; score: number; maxScore: number; issues: string[] }[] = [];
  const alerts = getDeviceAlerts();

  // Maintenance compliance (30 points)
  let maintScore = 30;
  const maintIssues: string[] = [];
  if (alerts.maintenanceDue.length > 0) {
    maintScore -= alerts.maintenanceDue.length * 10;
    maintIssues.push(`${alerts.maintenanceDue.length} device(s) overdue for maintenance`);
  }
  areas.push({ area: 'Maintenance', score: Math.max(0, maintScore), maxScore: 30, issues: maintIssues });

  // Calibration compliance (30 points)
  let calScore = 30;
  const calIssues: string[] = [];
  if (alerts.calibrationDue.length > 0) {
    calScore -= alerts.calibrationDue.length * 10;
    calIssues.push(`${alerts.calibrationDue.length} device(s) overdue for calibration`);
  }
  areas.push({ area: 'Calibration', score: Math.max(0, calScore), maxScore: 30, issues: calIssues });

  // Adverse event management (25 points)
  let aeScore = 25;
  const aeIssues: string[] = [];
  const openEvents = adverseEvents.filter(
    (ae) => ae.status !== 'resolved' && ae.status !== 'closed'
  );
  for (const event of openEvents) {
    const reqs = assessMDRRequirements(event);
    if (reqs.requiresFDAReport && !event.fdaReported) {
      aeScore -= 15;
      aeIssues.push(`Adverse event for ${event.deviceName} requires FDA report`);
    }
    if (reqs.requiresManufacturerReport && !event.manufacturerNotified) {
      aeScore -= 5;
      aeIssues.push(`Adverse event for ${event.deviceName}: manufacturer not notified`);
    }
  }
  areas.push({ area: 'Adverse Events', score: Math.max(0, aeScore), maxScore: 25, issues: aeIssues });

  // FDA registration (15 points)
  let fdaScore = 15;
  const fdaIssues: string[] = [];
  const class2_3 = devices.filter((d) => d.deviceClass === 'II' || d.deviceClass === 'III');
  const noFda = class2_3.filter((d) => !d.fda510kNumber);
  if (noFda.length > 0) {
    fdaScore -= noFda.length * 5;
    fdaIssues.push(`${noFda.length} Class II/III device(s) missing 510(k) documentation`);
  }
  areas.push({ area: 'FDA Registration', score: Math.max(0, fdaScore), maxScore: 15, issues: fdaIssues });

  const totalScore = areas.reduce((sum, a) => sum + a.score, 0);
  const totalIssues = areas.reduce((sum, a) => sum + a.issues.length, 0);

  return { score: totalScore, issues: totalIssues, details: areas };
}

// ── Seed / Reset ─────────────────────────────────────────────────────

export function seedDeviceData(data: {
  devices?: MedicalDevice[];
  maintenanceRecords?: MaintenanceRecord[];
  calibrationLogs?: CalibrationLog[];
  adverseEvents?: AdverseEventReport[];
}): void {
  if (data.devices) devices = [...devices, ...data.devices];
  if (data.maintenanceRecords) maintenanceRecords = [...maintenanceRecords, ...data.maintenanceRecords];
  if (data.calibrationLogs) calibrationLogs = [...calibrationLogs, ...data.calibrationLogs];
  if (data.adverseEvents) adverseEvents = [...adverseEvents, ...data.adverseEvents];
}

export function clearDeviceData(): void {
  devices = [];
  maintenanceRecords = [];
  calibrationLogs = [];
  adverseEvents = [];
}
