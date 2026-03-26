/**
 * Compliance Engine - Central Hub
 * Aggregates scores from all compliance modules and calculates
 * the overall clinic compliance score.
 */

import type { ComplianceScore, ComplianceDeadline } from '@/types/compliance';
import { calculateHIPAAScore } from './hipaa-audit';
import { calculateOSHAScore } from './osha-tracker';
import { calculateLicensingScore, getLicenseAlerts, getProviderLicenses } from './state-regulations';
import { calculateDEAScore, getSubstanceAlerts } from './controlled-substances';
import { calculateDeviceScore, getDeviceAlerts } from './device-compliance';
import { calculateConsentScore, getExpiringConsents, getExpiredConsents } from './consent-manager';

// ── Overall Compliance Score ─────────────────────────────────────────

export function calculateComplianceScore(): ComplianceScore {
  const hipaa = calculateHIPAAScore();
  const osha = calculateOSHAScore();
  const licensing = calculateLicensingScore();
  const dea = calculateDEAScore();
  const deviceScore = calculateDeviceScore();
  const consent = calculateConsentScore();

  // Policy and training scores use HIPAA training component
  const policyScore = { score: 85, issues: 0 }; // Base score
  const trainingScore = { score: hipaa.details.find((d) => d.area === 'Training')?.score || 0, issues: 0 };

  // Weighted overall: HIPAA and licensing are heaviest
  const weights = {
    hipaa: 0.20,
    osha: 0.12,
    licensing: 0.18,
    dea: 0.15,
    devices: 0.12,
    consents: 0.10,
    policies: 0.05,
    training: 0.08,
  };

  const overall = Math.round(
    hipaa.score * weights.hipaa +
    osha.score * weights.osha +
    licensing.score * weights.licensing +
    dea.score * weights.dea +
    deviceScore.score * weights.devices +
    consent.score * weights.consents +
    policyScore.score * weights.policies +
    (trainingScore.score / 25 * 100) * weights.training
  );

  const status: ComplianceScore['status'] =
    overall >= 90 ? 'exemplary' :
    overall >= 75 ? 'compliant' :
    overall >= 50 ? 'at_risk' :
    'critical';

  const upcomingDeadlines = collectUpcomingDeadlines();
  const overdueItems = collectOverdueItems();

  return {
    overall,
    categories: {
      hipaa: { score: hipaa.score, issues: hipaa.issues, label: 'HIPAA' },
      osha: { score: osha.score, issues: osha.issues, label: 'OSHA' },
      licensing: { score: licensing.score, issues: licensing.issues, label: 'Licensing' },
      dea: { score: dea.score, issues: dea.issues, label: 'DEA/Controlled Substances' },
      devices: { score: deviceScore.score, issues: deviceScore.issues, label: 'Device Compliance' },
      consents: { score: consent.score, issues: consent.issues, label: 'Consent Management' },
      policies: { score: policyScore.score, issues: policyScore.issues, label: 'Policies' },
      training: { score: Math.round(trainingScore.score / 25 * 100), issues: trainingScore.issues, label: 'Training' },
    },
    status,
    upcomingDeadlines,
    overdueItems,
  };
}

// ── Deadline Collection ──────────────────────────────────────────────

function collectUpcomingDeadlines(): ComplianceDeadline[] {
  const now = new Date();
  const ninetyDaysOut = new Date();
  ninetyDaysOut.setDate(ninetyDaysOut.getDate() + 90);
  const deadlines: ComplianceDeadline[] = [];

  // License renewals
  const licenseAlerts = getLicenseAlerts();
  for (const license of licenseAlerts.expiringSoon) {
    const daysUntil = Math.ceil(
      (new Date(license.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    deadlines.push({
      id: license.id,
      type: 'license_renewal',
      title: `${license.providerName} - ${license.licenseType} renewal`,
      dueDate: license.expirationDate,
      daysUntilDue: daysUntil,
      assignee: license.providerName,
      severity: daysUntil <= 30 ? 'critical' : daysUntil <= 60 ? 'warning' : 'info',
      category: 'Licensing',
    });
  }

  // Device maintenance
  const deviceAlerts = getDeviceAlerts();
  for (const device of deviceAlerts.maintenanceDue) {
    const daysUntil = Math.ceil(
      (new Date(device.nextMaintenanceDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    deadlines.push({
      id: device.id,
      type: 'device_maintenance',
      title: `${device.name} maintenance due`,
      dueDate: device.nextMaintenanceDate,
      daysUntilDue: daysUntil,
      severity: daysUntil <= 0 ? 'critical' : 'warning',
      category: 'Devices',
    });
  }

  // Device calibration
  for (const device of deviceAlerts.calibrationDue) {
    const daysUntil = Math.ceil(
      (new Date(device.nextCalibrationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    deadlines.push({
      id: `cal_${device.id}`,
      type: 'device_calibration',
      title: `${device.name} calibration due`,
      dueDate: device.nextCalibrationDate,
      daysUntilDue: daysUntil,
      severity: daysUntil <= 0 ? 'critical' : 'warning',
      category: 'Devices',
    });
  }

  // DEA reconciliation
  const substanceAlerts = getSubstanceAlerts();
  for (const substance of substanceAlerts.reconciliationDue) {
    deadlines.push({
      id: substance.id,
      type: 'dea_reconciliation',
      title: `${substance.name} (Schedule ${substance.schedule}) reconciliation overdue`,
      dueDate: substance.lastReconciliationDate,
      daysUntilDue: -1,
      severity: 'critical',
      category: 'DEA',
    });
  }

  // Consent expirations
  const expiringConsents = getExpiringConsents(30);
  for (const consent of expiringConsents) {
    const daysUntil = Math.ceil(
      (new Date(consent.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    deadlines.push({
      id: consent.id,
      type: 'consent_expiry',
      title: `${consent.patientName} - ${consent.treatmentName} consent expiring`,
      dueDate: consent.expirationDate,
      daysUntilDue: daysUntil,
      assignee: consent.providerName,
      severity: daysUntil <= 7 ? 'critical' : 'warning',
      category: 'Consents',
    });
  }

  return deadlines.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

function collectOverdueItems(): ComplianceDeadline[] {
  const now = new Date();
  const overdue: ComplianceDeadline[] = [];

  // Expired licenses
  const licenseAlerts = getLicenseAlerts();
  for (const license of licenseAlerts.expired) {
    const daysOverdue = Math.ceil(
      (now.getTime() - new Date(license.expirationDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    overdue.push({
      id: license.id,
      type: 'license_renewal',
      title: `${license.providerName} - ${license.licenseType} EXPIRED`,
      dueDate: license.expirationDate,
      daysUntilDue: -daysOverdue,
      assignee: license.providerName,
      severity: 'critical',
      category: 'Licensing',
    });
  }

  // Expired consents
  const expired = getExpiredConsents();
  for (const consent of expired) {
    const daysOverdue = Math.ceil(
      (now.getTime() - new Date(consent.expirationDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    overdue.push({
      id: consent.id,
      type: 'consent_expiry',
      title: `${consent.patientName} - ${consent.treatmentName} consent EXPIRED`,
      dueDate: consent.expirationDate,
      daysUntilDue: -daysOverdue,
      assignee: consent.providerName,
      severity: 'critical',
      category: 'Consents',
    });
  }

  return overdue.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
}

// Re-export all module functions
export * from './hipaa-audit';
export * from './osha-tracker';
export * from './state-regulations';
export * from './controlled-substances';
export * from './device-compliance';
export * from './consent-manager';
export * from './audit-trail';
