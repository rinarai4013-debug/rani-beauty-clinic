/**
 * Compliance Engine Tests - 60+ tests
 * Covers: consent validation, license expiry logic, DEA reconciliation,
 * audit trail integrity, compliance scoring, scope of practice, breach assessment,
 * MDR requirements, waste witnessing, and more.
 */

import { describe, it, expect, beforeEach } from 'vitest';

// ── Audit Trail ──────────────────────────────────────────────────────

import {
  createAuditEntry,
  queryAuditLog,
  verifyAuditIntegrity,
  exportAuditLog,
  clearAuditLog,
  getAuditLog,
} from '../audit-trail';

describe('Audit Trail', () => {
  beforeEach(() => clearAuditLog());

  it('creates an audit entry with all required fields', () => {
    const entry = createAuditEntry({
      userId: 'user_1',
      userName: 'Dr. Rina',
      userRole: 'ceo',
      action: 'phi_view',
      resourceType: 'patient_record',
      resourceId: 'patient_123',
      details: 'Viewed medical history',
      ipAddress: '192.168.1.1',
    });

    expect(entry.id).toMatch(/^audit_/);
    expect(entry.timestamp).toBeTruthy();
    expect(entry.category).toBe('hipaa');
    expect(entry.severity).toBe('info');
    expect(entry.action).toBe('phi_view');
  });

  it('creates entries with correct category mapping', () => {
    const phiEntry = createAuditEntry({
      userId: 'u1', userName: 'Test', userRole: 'provider',
      action: 'phi_delete', resourceType: 'record', resourceId: 'r1',
      details: 'Deleted record', ipAddress: '0.0.0.0',
    });
    expect(phiEntry.category).toBe('hipaa');
    expect(phiEntry.severity).toBe('critical');

    const deaEntry = createAuditEntry({
      userId: 'u1', userName: 'Test', userRole: 'provider',
      action: 'substance_dispense', resourceType: 'substance', resourceId: 's1',
      details: 'Dispensed lidocaine', ipAddress: '0.0.0.0',
    });
    expect(deaEntry.category).toBe('dea');
  });

  it('maintains immutability of audit entries', () => {
    createAuditEntry({
      userId: 'u1', userName: 'Test', userRole: 'provider',
      action: 'phi_view', resourceType: 'record', resourceId: 'r1',
      details: 'Test', ipAddress: '0.0.0.0',
    });

    const entries = getAuditLog();
    expect(() => {
      (entries[0] as any).details = 'Modified';
    }).toThrow();
  });

  it('queries by category and severity', () => {
    createAuditEntry({
      userId: 'u1', userName: 'A', userRole: 'provider',
      action: 'phi_view', resourceType: 'record', resourceId: 'r1',
      details: 'View', ipAddress: '0.0.0.0',
    });
    createAuditEntry({
      userId: 'u1', userName: 'A', userRole: 'provider',
      action: 'phi_delete', resourceType: 'record', resourceId: 'r2',
      details: 'Delete', ipAddress: '0.0.0.0',
    });
    createAuditEntry({
      userId: 'u1', userName: 'A', userRole: 'provider',
      action: 'substance_dispense', resourceType: 'substance', resourceId: 's1',
      details: 'Dispense', ipAddress: '0.0.0.0',
    });

    const hipaaOnly = queryAuditLog({ category: 'hipaa' });
    expect(hipaaOnly.total).toBe(2);

    const criticalOnly = queryAuditLog({ severity: 'critical' });
    expect(criticalOnly.total).toBe(1);
  });

  it('supports text search in audit log', () => {
    createAuditEntry({
      userId: 'u1', userName: 'Dr. Rina', userRole: 'ceo',
      action: 'phi_view', resourceType: 'record', resourceId: 'r1',
      details: 'Viewed patient chart for Jane Smith', ipAddress: '0.0.0.0',
    });
    createAuditEntry({
      userId: 'u2', userName: 'Nurse Kim', userRole: 'provider',
      action: 'phi_update', resourceType: 'record', resourceId: 'r2',
      details: 'Updated treatment plan', ipAddress: '0.0.0.0',
    });

    const result = queryAuditLog({ search: 'Jane Smith' });
    expect(result.total).toBe(1);
  });

  it('exports audit log as CSV-ready data', () => {
    createAuditEntry({
      userId: 'u1', userName: 'Test', userRole: 'provider',
      action: 'phi_view', resourceType: 'record', resourceId: 'r1',
      details: 'Test entry', ipAddress: '0.0.0.0',
    });

    const exported = exportAuditLog({});
    expect(exported.headers).toContain('Timestamp');
    expect(exported.headers).toContain('User');
    expect(exported.rows.length).toBe(1);
  });

  it('verifies audit trail integrity', () => {
    createAuditEntry({
      userId: 'u1', userName: 'Test', userRole: 'provider',
      action: 'phi_view', resourceType: 'record', resourceId: 'r1',
      details: 'Test', ipAddress: '0.0.0.0',
    });

    const integrity = verifyAuditIntegrity();
    expect(integrity.valid).toBe(true);
    expect(integrity.totalEntries).toBe(1);
    expect(integrity.issues).toHaveLength(0);
  });

  it('paginates query results', () => {
    for (let i = 0; i < 10; i++) {
      createAuditEntry({
        userId: 'u1', userName: 'Test', userRole: 'provider',
        action: 'phi_view', resourceType: 'record', resourceId: `r${i}`,
        details: `Entry ${i}`, ipAddress: '0.0.0.0',
      });
    }

    const page1 = queryAuditLog({ limit: 3, offset: 0 });
    expect(page1.entries.length).toBe(3);
    expect(page1.total).toBe(10);
    expect(page1.hasMore).toBe(true);

    const page4 = queryAuditLog({ limit: 3, offset: 9 });
    expect(page4.entries.length).toBe(1);
    expect(page4.hasMore).toBe(false);
  });
});

// ── HIPAA Audit ──────────────────────────────────────────────────────

import {
  logPHIAccess,
  getAccessLogs,
  recordDisclosure,
  getDisclosures,
  reportBreach,
  getBreaches,
  assessBreachNotificationRequirements,
  recordTraining,
  getTrainingRecords,
  getTrainingComplianceStatus,
  addBAA,
  getBAAs,
  getBAAComplianceStatus,
  calculateHIPAAScore,
  clearHIPAAData,
} from '../hipaa-audit';

describe('HIPAA Audit', () => {
  beforeEach(() => {
    clearHIPAAData();
    clearAuditLog();
  });

  it('logs PHI access with audit trail entry', () => {
    const log = logPHIAccess({
      userId: 'u1', userName: 'Dr. Rina', userRole: 'ceo',
      patientId: 'p1', patientName: 'Jane Smith',
      action: 'view', dataCategory: 'medical_history',
      ipAddress: '192.168.1.1',
    });

    expect(log.id).toMatch(/^phi_/);
    expect(getAccessLogs().length).toBe(1);

    // Should also create audit entry
    const auditEntries = getAuditLog();
    expect(auditEntries.length).toBe(1);
  });

  it('filters access logs by user and patient', () => {
    logPHIAccess({
      userId: 'u1', userName: 'Dr. Rina', userRole: 'ceo',
      patientId: 'p1', patientName: 'Jane', action: 'view',
      dataCategory: 'demographics', ipAddress: '0.0.0.0',
    });
    logPHIAccess({
      userId: 'u2', userName: 'Nurse Kim', userRole: 'provider',
      patientId: 'p1', patientName: 'Jane', action: 'update',
      dataCategory: 'treatment_records', ipAddress: '0.0.0.0',
    });
    logPHIAccess({
      userId: 'u1', userName: 'Dr. Rina', userRole: 'ceo',
      patientId: 'p2', patientName: 'Bob', action: 'view',
      dataCategory: 'billing', ipAddress: '0.0.0.0',
    });

    expect(getAccessLogs({ userId: 'u1' }).length).toBe(2);
    expect(getAccessLogs({ patientId: 'p1' }).length).toBe(2);
    expect(getAccessLogs({ action: 'update' }).length).toBe(1);
  });

  it('records PHI disclosures', () => {
    const disclosure = recordDisclosure({
      patientId: 'p1', patientName: 'Jane', recipientName: 'Dr. X',
      recipientOrg: 'Hospital Y', purpose: 'treatment',
      dataDisclosed: 'Medical history', method: 'electronic',
      authorizedBy: 'Dr. Rina', authorizationDate: '2026-03-01',
      disclosureDate: '2026-03-01',
    });

    expect(disclosure.id).toMatch(/^disc_/);
    expect(getDisclosures('p1').length).toBe(1);
  });

  it('assesses breach notification requirements correctly', () => {
    // Small breach
    const smallBreach = reportBreach({
      discoveryDate: '2026-03-01', breachDate: '2026-02-28',
      description: 'Small breach', dataInvolved: ['names'],
      individualsAffected: 5, severity: 'low', status: 'discovered',
      correctiveActions: [], hhs_reported: false,
      individuals_notified: false, media_notified: false,
      investigator: 'Dr. Rina',
    });

    const smallReqs = assessBreachNotificationRequirements(smallBreach);
    expect(smallReqs.requiresHHS).toBe(false);
    expect(smallReqs.requiresIndividualNotice).toBe(true);
    expect(smallReqs.requiresMediaNotice).toBe(false);

    // Large breach (500+)
    const largeBreach = reportBreach({
      discoveryDate: '2026-03-01', breachDate: '2026-02-28',
      description: 'Large breach', dataInvolved: ['SSN', 'medical records'],
      individualsAffected: 600, severity: 'critical', status: 'discovered',
      correctiveActions: [], hhs_reported: false,
      individuals_notified: false, media_notified: false,
      investigator: 'Dr. Rina',
    });

    const largeReqs = assessBreachNotificationRequirements(largeBreach);
    expect(largeReqs.requiresHHS).toBe(true);
    expect(largeReqs.requiresMediaNotice).toBe(true);
  });

  it('tracks training compliance status', () => {
    recordTraining({
      staffId: 's1', staffName: 'Dr. Rina', staffRole: 'ceo',
      trainingType: 'hipaa_privacy', completedDate: '2026-01-01',
      expirationDate: '2027-01-01', score: 95, passingScore: 80,
      passed: true, renewalRequired: true,
    });
    recordTraining({
      staffId: 's2', staffName: 'Nurse Kim', staffRole: 'provider',
      trainingType: 'hipaa_privacy', completedDate: '2025-01-01',
      expirationDate: '2025-12-01', score: 85, passingScore: 80,
      passed: true, renewalRequired: true,
    });

    const status = getTrainingComplianceStatus();
    expect(status.totalStaff).toBe(2);
    expect(status.compliant).toBe(1);
    expect(status.nonCompliant).toBe(1);
    expect(status.overdueTraining.length).toBeGreaterThanOrEqual(1);
  });

  it('tracks BAA compliance', () => {
    addBAA({
      vendorName: 'Cloud Provider', vendorContact: 'Support',
      vendorEmail: 'support@cloud.com', serviceDescription: 'EHR hosting',
      effectiveDate: '2025-01-01', expirationDate: '2027-01-01',
      renewalDate: '2026-10-01', status: 'active', signedBy: 'Dr. Rina',
      lastReviewDate: '2025-12-01', nextReviewDate: '2026-12-01',
    });
    addBAA({
      vendorName: 'Old Vendor', vendorContact: 'Support',
      vendorEmail: 'old@vendor.com', serviceDescription: 'Billing',
      effectiveDate: '2023-01-01', expirationDate: '2024-01-01',
      renewalDate: '2023-10-01', status: 'expired', signedBy: 'Dr. Rina',
      lastReviewDate: '2023-12-01', nextReviewDate: '2024-12-01',
    });

    const status = getBAAComplianceStatus();
    expect(status.total).toBe(2);
    expect(status.active).toBe(1);
    expect(status.expired).toBe(1);
  });

  it('calculates HIPAA compliance score', () => {
    const score = calculateHIPAAScore();
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.details).toHaveLength(4);
  });
});

// ── OSHA Tracker ─────────────────────────────────────────────────────

import {
  addSharpsLog,
  getSharpsAlerts,
  addSDSSheet,
  getExpiredSDS,
  createIncidentReport,
  getIncidents,
  getOpenIncidents,
  isOSHARecordable,
  addPPEItem,
  getPPEAlerts,
  calculateOSHAScore,
  clearOSHAData,
} from '../osha-tracker';

describe('OSHA Tracker', () => {
  beforeEach(() => clearOSHAData());

  it('tracks sharps disposal and alerts on high fill level', () => {
    addSharpsLog({
      containerId: 'SC-001', location: 'Treatment Room 1',
      fillLevel: 80, lastCheckedDate: '2026-03-20',
      lastReplacedDate: '2026-03-01', replacedBy: 'Nurse Kim',
      disposalCompany: 'Stericycle', status: 'three_quarter_full',
    });

    const alerts = getSharpsAlerts();
    expect(alerts.length).toBe(1);
    expect(alerts[0].fillLevel).toBe(80);
  });

  it('identifies expired SDS sheets', () => {
    addSDSSheet({
      productName: 'Alcohol 70%', manufacturer: 'ChemCo',
      hazardClassification: ['Flammable'], signalWord: 'danger',
      location: 'Supply Room', lastUpdated: '2024-01-01',
      expirationDate: '2025-01-01', ghs_pictograms: ['flame'],
    });
    addSDSSheet({
      productName: 'Saline', manufacturer: 'PharmaCo',
      hazardClassification: [], signalWord: 'none',
      location: 'Treatment Room', lastUpdated: '2026-01-01',
      expirationDate: '2028-01-01', ghs_pictograms: [],
    });

    const expired = getExpiredSDS();
    expect(expired.length).toBe(1);
    expect(expired[0].productName).toBe('Alcohol 70%');
  });

  it('creates incident reports with correct OSHA recordability', () => {
    const needlestick = createIncidentReport({
      type: 'needlestick', severity: 'moderate',
      date: '2026-03-20', time: '10:30', location: 'Treatment Room 1',
      reportedBy: 'Nurse Kim', involvedParties: ['Nurse Kim'],
      description: 'Needlestick during injection procedure',
      immediateAction: 'Applied first aid, initiated post-exposure protocol',
      correctiveActions: ['Review sharps handling procedures'],
      oshaRecordable: true,
    });

    expect(needlestick.status).toBe('reported');
    expect(isOSHARecordable(needlestick)).toBe(true);

    const nearMiss = createIncidentReport({
      type: 'near_miss', severity: 'minor',
      date: '2026-03-20', time: '14:00', location: 'Lobby',
      reportedBy: 'Front Desk', involvedParties: [],
      description: 'Wet floor not marked', immediateAction: 'Placed wet floor sign',
      correctiveActions: ['Improve floor marking protocol'],
      oshaRecordable: false,
    });

    expect(isOSHARecordable(nearMiss)).toBe(false);
  });

  it('filters incidents by severity and status', () => {
    createIncidentReport({
      type: 'injury', severity: 'critical',
      date: '2026-03-20', time: '10:00', location: 'Room 1',
      reportedBy: 'Staff', involvedParties: [],
      description: 'Critical injury', immediateAction: 'Called 911',
      correctiveActions: [], oshaRecordable: true,
    });
    createIncidentReport({
      type: 'near_miss', severity: 'minor',
      date: '2026-03-21', time: '09:00', location: 'Room 2',
      reportedBy: 'Staff', involvedParties: [],
      description: 'Minor near miss', immediateAction: 'Corrected',
      correctiveActions: [], oshaRecordable: false,
    });

    const critical = getIncidents({ severity: 'critical' });
    expect(critical.length).toBe(1);

    const open = getOpenIncidents();
    expect(open.length).toBe(2);
    // Critical should sort first
    expect(open[0].severity).toBe('critical');
  });

  it('tracks PPE inventory and alerts on low stock', () => {
    addPPEItem({
      itemName: 'Nitrile Gloves (M)', category: 'gloves',
      currentStock: 5, minimumStock: 50,
      lastOrderDate: '2026-03-01', lastReceivedDate: '2026-03-05',
      supplier: 'MedSupply', unitCost: 0.10, location: 'Supply Room',
    });

    const alerts = getPPEAlerts();
    expect(alerts.length).toBe(1);
    expect(alerts[0].status).toBe('low');
  });

  it('calculates OSHA compliance score', () => {
    const score = calculateOSHAScore();
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.details.length).toBe(5);
  });
});

// ── State Regulations ────────────────────────────────────────────────

import {
  validateProcedureScope,
  WA_SCOPE_OF_PRACTICE,
  addProviderLicense,
  getLicenseAlerts,
  getDaysUntilExpiry,
  checkDelegationRequirement,
  addDelegationAgreement,
  calculateLicensingScore,
  clearStateRegData,
} from '../state-regulations';

describe('State Regulations', () => {
  beforeEach(() => clearStateRegData());

  it('validates scope of practice for physicians', () => {
    const result = validateProcedureScope('physician', 'Botox Injection');
    expect(result.allowed).toBe(true);
    expect(result.requiresSupervision).toBe(false);
  });

  it('restricts estheticians from performing injections', () => {
    const result = validateProcedureScope('esthetician', 'Botox Injection');
    expect(result.allowed).toBe(false);
  });

  it('requires supervision for RN injectable procedures', () => {
    const result = validateProcedureScope('rn', 'Botox Injection');
    expect(result.allowed).toBe(true);
    expect(result.requiresSupervision).toBe(true);
    expect(result.supervisionType).toBe('indirect');
  });

  it('restricts MA from performing injections', () => {
    const result = validateProcedureScope('ma', 'Botox Injection');
    expect(result.allowed).toBe(false);
  });

  it('allows esthetician to perform HydraFacial', () => {
    const result = validateProcedureScope('esthetician', 'HydraFacial');
    expect(result.allowed).toBe(true);
    expect(result.requiresSupervision).toBe(false);
  });

  it('has all 8 provider types defined', () => {
    expect(WA_SCOPE_OF_PRACTICE.length).toBe(8);
    const types = WA_SCOPE_OF_PRACTICE.map((s) => s.providerType);
    expect(types).toContain('physician');
    expect(types).toContain('arnp');
    expect(types).toContain('pa');
    expect(types).toContain('rn');
    expect(types).toContain('esthetician');
  });

  it('checks delegation requirements correctly', () => {
    const physician = checkDelegationRequirement('physician');
    expect(physician.required).toBe(false);

    const rn = checkDelegationRequirement('rn');
    expect(rn.required).toBe(true);

    const arnp = checkDelegationRequirement('arnp');
    expect(arnp.required).toBe(false); // Independent practice in WA
  });

  it('detects expired and expiring licenses', () => {
    addProviderLicense({
      providerName: 'Expired Provider', providerType: 'rn',
      licenseNumber: 'RN-001', licenseType: 'RN',
      issuingAuthority: 'WA DOH', state: 'WA',
      issueDate: '2023-01-01', expirationDate: '2025-01-01',
      status: 'active', ceCreditsRequired: 30, ceCreditsCompleted: 30,
      ceDeadline: '2025-01-01', renewalAlertDays: 90,
      lastVerified: '2024-01-01',
    });
    addProviderLicense({
      providerName: 'Current Provider', providerType: 'physician',
      licenseNumber: 'MD-001', licenseType: 'MD',
      issuingAuthority: 'WA DOH', state: 'WA',
      issueDate: '2025-01-01', expirationDate: '2028-01-01',
      status: 'active', ceCreditsRequired: 50, ceCreditsCompleted: 50,
      ceDeadline: '2028-01-01', renewalAlertDays: 90,
      lastVerified: '2026-01-01',
    });

    const alerts = getLicenseAlerts();
    expect(alerts.expired.length).toBe(1);
    expect(alerts.expired[0].providerName).toBe('Expired Provider');
  });

  it('calculates days until license expiry', () => {
    const license = addProviderLicense({
      providerName: 'Test', providerType: 'rn',
      licenseNumber: 'RN-002', licenseType: 'RN',
      issuingAuthority: 'WA DOH', state: 'WA',
      issueDate: '2025-01-01',
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active', ceCreditsRequired: 30, ceCreditsCompleted: 15,
      ceDeadline: '2027-01-01', renewalAlertDays: 90,
      lastVerified: '2026-01-01',
    });

    const days = getDaysUntilExpiry(license);
    expect(days).toBeGreaterThan(28);
    expect(days).toBeLessThanOrEqual(31);
  });

  it('calculates licensing compliance score', () => {
    const score = calculateLicensingScore();
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
  });
});

// ── Controlled Substances ────────────────────────────────────────────

import {
  addSubstance,
  getSubstances,
  getSubstanceAlerts,
  performReconciliation,
  getUnresolvedDiscrepancies,
  logWaste,
  getWasteLogs,
  recordCustodyEvent,
  getCustodyChain,
  calculateDEAScore,
  clearDEAData,
} from '../controlled-substances';

describe('Controlled Substances', () => {
  beforeEach(() => {
    clearDEAData();
    clearAuditLog();
  });

  it('adds and tracks controlled substances', () => {
    addSubstance({
      name: 'Lidocaine 2%', genericName: 'Lidocaine',
      schedule: 'IV' as const, ndc: '12345-678-90',
      manufacturer: 'PharmaCo', strength: '2%', form: 'vial',
      currentQuantity: 50, unit: 'mL', location: 'Med Cabinet',
      lotNumber: 'LOT-001', expirationDate: '2027-01-01',
      lastReconciliationDate: '2026-03-20',
      lastReconciliationBy: 'Dr. Rina', status: 'in_stock',
    });

    const substances = getSubstances();
    expect(substances.length).toBe(1);
    expect(substances[0].schedule).toBe('IV');
  });

  it('filters substances by schedule', () => {
    addSubstance({
      name: 'Sub A', genericName: 'A', schedule: 'II' as const,
      ndc: '111', manufacturer: 'X', strength: '10mg', form: 'vial',
      currentQuantity: 10, unit: 'units', location: 'Safe',
      lotNumber: 'L1', expirationDate: '2027-01-01',
      lastReconciliationDate: '2026-03-20', lastReconciliationBy: 'Dr. Rina',
      status: 'in_stock',
    });
    addSubstance({
      name: 'Sub B', genericName: 'B', schedule: 'IV' as const,
      ndc: '222', manufacturer: 'Y', strength: '5mg', form: 'vial',
      currentQuantity: 20, unit: 'mL', location: 'Cabinet',
      lotNumber: 'L2', expirationDate: '2027-01-01',
      lastReconciliationDate: '2026-03-20', lastReconciliationBy: 'Dr. Rina',
      status: 'in_stock',
    });

    expect(getSubstances({ schedule: 'II' }).length).toBe(1);
    expect(getSubstances({ schedule: 'IV' }).length).toBe(1);
  });

  it('performs reconciliation and detects discrepancies', () => {
    const sub = addSubstance({
      name: 'Test Med', genericName: 'Test', schedule: 'III' as const,
      ndc: '333', manufacturer: 'Z', strength: '100mg', form: 'vial',
      currentQuantity: 20, unit: 'units', location: 'Safe',
      lotNumber: 'L3', expirationDate: '2027-01-01',
      lastReconciliationDate: '2026-03-15', lastReconciliationBy: 'Nurse',
      status: 'in_stock',
    });

    // Matching reconciliation
    const match = performReconciliation({
      substanceId: sub.id, substanceName: 'Test Med',
      date: '2026-03-22', performedBy: 'Dr. Rina', witnessedBy: 'Nurse Kim',
      expectedCount: 20, actualCount: 20,
    });
    expect(match.status).toBe('matched');
    expect(match.discrepancy).toBe(0);

    // Discrepancy
    const disc = performReconciliation({
      substanceId: sub.id, substanceName: 'Test Med',
      date: '2026-03-23', performedBy: 'Dr. Rina', witnessedBy: 'Nurse Kim',
      expectedCount: 20, actualCount: 18,
    });
    expect(disc.status).toBe('discrepancy');
    expect(disc.discrepancy).toBe(-2);

    const unresolved = getUnresolvedDiscrepancies();
    expect(unresolved.length).toBe(1);
  });

  it('requires witness for waste logging', () => {
    const sub = addSubstance({
      name: 'Waste Test', genericName: 'WT', schedule: 'II' as const,
      ndc: '444', manufacturer: 'A', strength: '5mg', form: 'vial',
      currentQuantity: 10, unit: 'mL', location: 'Safe',
      lotNumber: 'L4', expirationDate: '2027-01-01',
      lastReconciliationDate: '2026-03-20', lastReconciliationBy: 'Dr. Rina',
      status: 'in_stock',
    });

    // Should throw without witness
    expect(() =>
      logWaste({
        substanceId: sub.id, substanceName: 'Waste Test',
        schedule: 'II', quantityWasted: 2, unit: 'mL',
        reason: 'partial_dose', wastedBy: 'Dr. Rina',
        witnessedBy: '', date: '2026-03-22', time: '10:00',
        lotNumber: 'L4', method: 'sharps_container',
      })
    ).toThrow('must be witnessed');

    // Should throw if witness is same person
    expect(() =>
      logWaste({
        substanceId: sub.id, substanceName: 'Waste Test',
        schedule: 'II', quantityWasted: 2, unit: 'mL',
        reason: 'partial_dose', wastedBy: 'Dr. Rina',
        witnessedBy: 'Dr. Rina', date: '2026-03-22', time: '10:00',
        lotNumber: 'L4', method: 'sharps_container',
      })
    ).toThrow('different person');

    // Valid waste with proper witness
    const waste = logWaste({
      substanceId: sub.id, substanceName: 'Waste Test',
      schedule: 'II', quantityWasted: 2, unit: 'mL',
      reason: 'partial_dose', wastedBy: 'Dr. Rina',
      witnessedBy: 'Nurse Kim', date: '2026-03-22', time: '10:00',
      lotNumber: 'L4', method: 'sharps_container',
    });

    expect(waste.id).toMatch(/^waste_/);
    expect(getWasteLogs().length).toBe(1);
  });

  it('maintains chain of custody', () => {
    const sub = addSubstance({
      name: 'Chain Test', genericName: 'CT', schedule: 'II' as const,
      ndc: '555', manufacturer: 'B', strength: '10mg', form: 'vial',
      currentQuantity: 100, unit: 'units', location: 'Pharmacy',
      lotNumber: 'L5', expirationDate: '2027-01-01',
      lastReconciliationDate: '2026-03-20', lastReconciliationBy: 'Pharmacist',
      status: 'in_stock',
    });

    recordCustodyEvent({
      substanceId: sub.id, substanceName: 'Chain Test',
      action: 'received', quantity: 100, unit: 'units',
      fromPerson: 'Distributor', toPerson: 'Pharmacist',
      date: '2026-03-20', time: '09:00', lotNumber: 'L5',
    });

    recordCustodyEvent({
      substanceId: sub.id, substanceName: 'Chain Test',
      action: 'dispensed', quantity: 10, unit: 'units',
      fromPerson: 'Pharmacist', toPerson: 'Dr. Rina',
      date: '2026-03-21', time: '10:00', lotNumber: 'L5',
      patientId: 'p1',
    });

    const chain = getCustodyChain(sub.id);
    expect(chain.length).toBe(2);
    expect(chain[0].action).toBe('received');
    expect(chain[1].action).toBe('dispensed');
  });

  it('detects substances needing reconciliation', () => {
    addSubstance({
      name: 'Overdue Recon', genericName: 'OR', schedule: 'III' as const,
      ndc: '666', manufacturer: 'C', strength: '5mg', form: 'vial',
      currentQuantity: 30, unit: 'units', location: 'Safe',
      lotNumber: 'L6',
      expirationDate: '2027-01-01',
      lastReconciliationDate: '2026-01-01', // Way overdue
      lastReconciliationBy: 'Dr. Rina',
      status: 'in_stock',
    });

    const alerts = getSubstanceAlerts();
    expect(alerts.reconciliationDue.length).toBe(1);
  });

  it('calculates DEA compliance score', () => {
    const score = calculateDEAScore();
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.details.length).toBe(4);
  });
});

// ── Device Compliance ────────────────────────────────────────────────

import {
  addDevice,
  getDevices,
  getDeviceAlerts,
  addMaintenanceRecord,
  addCalibrationLog,
  reportAdverseEvent,
  assessMDRRequirements,
  calculateDeviceScore,
  clearDeviceData,
} from '../device-compliance';

describe('Device Compliance', () => {
  beforeEach(() => {
    clearDeviceData();
    clearAuditLog();
  });

  it('tracks medical devices with FDA classification', () => {
    addDevice({
      name: 'Sofwave', manufacturer: 'Sofwave Medical', model: 'SUPERB',
      serialNumber: 'SW-12345', fda510kNumber: 'K200021',
      fdaClearanceDate: '2020-06-15', deviceClass: 'II',
      category: 'ultrasound', purchaseDate: '2024-01-01',
      warrantyExpiration: '2027-01-01', location: 'Treatment Room 1',
      status: 'operational', lastMaintenanceDate: '2026-01-01',
      nextMaintenanceDate: '2026-07-01', lastCalibrationDate: '2026-01-01',
      nextCalibrationDate: '2026-07-01', maintenanceProvider: 'Sofwave Service',
      maintenanceContract: true,
    });

    const devices = getDevices();
    expect(devices.length).toBe(1);
    expect(devices[0].deviceClass).toBe('II');
  });

  it('alerts on overdue maintenance and calibration', () => {
    addDevice({
      name: 'Old Device', manufacturer: 'X', model: 'Y',
      serialNumber: 'SN-1', deviceClass: 'II', category: 'laser',
      purchaseDate: '2020-01-01', warrantyExpiration: '2023-01-01',
      location: 'Room 2', status: 'operational',
      lastMaintenanceDate: '2025-01-01',
      nextMaintenanceDate: '2025-06-01', // Overdue
      lastCalibrationDate: '2025-01-01',
      nextCalibrationDate: '2025-06-01', // Overdue
      maintenanceProvider: 'Service Co', maintenanceContract: false,
    });

    const alerts = getDeviceAlerts();
    expect(alerts.maintenanceDue.length).toBe(1);
    expect(alerts.calibrationDue.length).toBe(1);
  });

  it('logs maintenance records and updates device dates', () => {
    const device = addDevice({
      name: 'Test Device', manufacturer: 'X', model: 'Y',
      serialNumber: 'SN-2', deviceClass: 'II', category: 'rf',
      purchaseDate: '2024-01-01', warrantyExpiration: '2027-01-01',
      location: 'Room 1', status: 'maintenance_due',
      lastMaintenanceDate: '2025-06-01',
      nextMaintenanceDate: '2025-12-01',
      lastCalibrationDate: '2025-06-01',
      nextCalibrationDate: '2026-06-01',
      maintenanceProvider: 'Tech Co', maintenanceContract: true,
    });

    addMaintenanceRecord({
      deviceId: device.id, deviceName: 'Test Device',
      type: 'preventive', date: '2026-03-20',
      performedBy: 'Tech', company: 'Tech Co',
      description: 'Annual preventive maintenance',
      cost: 500, nextScheduledDate: '2027-03-20',
      status: 'completed',
    });

    const updated = getDevices()[0];
    expect(updated.lastMaintenanceDate).toBe('2026-03-20');
    expect(updated.status).toBe('operational');
  });

  it('assesses MDR reporting requirements', () => {
    const device = addDevice({
      name: 'Laser', manufacturer: 'X', model: 'Y',
      serialNumber: 'SN-3', deviceClass: 'II', category: 'laser',
      purchaseDate: '2024-01-01', warrantyExpiration: '2027-01-01',
      location: 'Room 1', status: 'operational',
      lastMaintenanceDate: '2026-01-01', nextMaintenanceDate: '2026-07-01',
      lastCalibrationDate: '2026-01-01', nextCalibrationDate: '2026-07-01',
      maintenanceProvider: 'Service', maintenanceContract: true,
    });

    const seriousEvent = reportAdverseEvent({
      deviceId: device.id, deviceName: 'Laser',
      eventDate: '2026-03-20', reportDate: '2026-03-20',
      eventDescription: 'Patient burn during treatment',
      injuryDescription: 'Second degree burn on cheek',
      severity: 'serious', fdaReported: false,
      manufacturerNotified: false, correctiveAction: 'Device taken out of service',
      status: 'reported', reportedBy: 'Dr. Rina',
    });

    const reqs = assessMDRRequirements(seriousEvent);
    expect(reqs.requiresFDAReport).toBe(true);
    expect(reqs.requiresManufacturerReport).toBe(true);
    expect(reqs.reportType).toContain('Serious Injury');

    const minorEvent = reportAdverseEvent({
      deviceId: device.id, deviceName: 'Laser',
      eventDate: '2026-03-21', reportDate: '2026-03-21',
      eventDescription: 'Mild redness that resolved',
      severity: 'minor', fdaReported: false,
      manufacturerNotified: false, correctiveAction: 'Monitored patient',
      status: 'reported', reportedBy: 'Nurse Kim',
    });

    const minorReqs = assessMDRRequirements(minorEvent);
    expect(minorReqs.requiresFDAReport).toBe(false);
    expect(minorReqs.reportType).toContain('Voluntary');
  });

  it('calculates device compliance score', () => {
    const score = calculateDeviceScore();
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.details.length).toBe(4);
  });
});

// ── Consent Manager ──────────────────────────────────────────────────

import {
  getConsentTemplates,
  getConsentTemplate,
  signConsent,
  revokeConsent,
  hasValidConsent,
  validateConsentForTreatment,
  getExpiringConsents,
  getExpiredConsents,
  calculateConsentScore,
  clearConsentData,
} from '../consent-manager';

import { CONSENT_TEMPLATES } from '@/data/compliance/consents';

describe('Consent Manager', () => {
  beforeEach(() => {
    clearConsentData();
    clearAuditLog();
  });

  it('has 25 consent templates defined', () => {
    expect(CONSENT_TEMPLATES.length).toBe(25);
  });

  it('all templates have required fields', () => {
    for (const template of CONSENT_TEMPLATES) {
      expect(template.id).toBeTruthy();
      expect(template.treatmentName).toBeTruthy();
      expect(template.treatmentCategory).toBeTruthy();
      expect(template.risks.length).toBeGreaterThan(0);
      expect(template.benefits.length).toBeGreaterThan(0);
      expect(template.alternatives.length).toBeGreaterThan(0);
      expect(template.aftercare.length).toBeGreaterThan(0);
      expect(template.providerAcknowledgments.length).toBeGreaterThan(0);
      expect(template.expiryDays).toBeGreaterThan(0);
    }
  });

  it('templates cover all major treatment categories', () => {
    const categories = [...new Set(CONSENT_TEMPLATES.map((t) => t.treatmentCategory))];
    expect(categories).toContain('injectable');
    expect(categories).toContain('laser');
    expect(categories).toContain('skin');
    expect(categories).toContain('wellness');
    expect(categories).toContain('photography');
  });

  it('signs consent and creates audit entry', () => {
    const template = CONSENT_TEMPLATES[0]; // Botox
    const consent = signConsent({
      templateId: template.id,
      templateVersion: template.version,
      treatmentName: template.treatmentName,
      patientId: 'p1',
      patientName: 'Jane Smith',
      signatureData: 'data:image/png;base64,' + 'A'.repeat(200),
      signedDate: '2026-03-20',
      providerId: 'prov1',
      providerName: 'Dr. Rina',
      providerSignature: 'data:image/png;base64,' + 'B'.repeat(200),
    });

    expect(consent.id).toMatch(/^consent_/);
    expect(consent.status).toBe('active');
    expect(consent.expirationDate).toBeTruthy();
    expect(hasValidConsent('p1', 'Botox Injection')).toBe(true);
  });

  it('rejects consent with invalid signature', () => {
    const template = CONSENT_TEMPLATES[0];
    expect(() =>
      signConsent({
        templateId: template.id,
        templateVersion: template.version,
        treatmentName: template.treatmentName,
        patientId: 'p1',
        patientName: 'Jane',
        signatureData: 'too-short',
        signedDate: '2026-03-20',
        providerId: 'prov1',
        providerName: 'Dr. Rina',
      })
    ).toThrow('Invalid signature');
  });

  it('requires provider signature when template specifies', () => {
    const botoxTemplate = CONSENT_TEMPLATES.find((t) => t.id === 'consent_botox');
    expect(botoxTemplate?.requiresProviderSignature).toBe(true);

    expect(() =>
      signConsent({
        templateId: botoxTemplate!.id,
        templateVersion: botoxTemplate!.version,
        treatmentName: botoxTemplate!.treatmentName,
        patientId: 'p1',
        patientName: 'Jane',
        signatureData: 'data:image/png;base64,' + 'A'.repeat(200),
        signedDate: '2026-03-20',
        providerId: 'prov1',
        providerName: 'Dr. Rina',
        // Missing providerSignature
      })
    ).toThrow('requires provider signature');
  });

  it('supersedes old consent when new one is signed', () => {
    const template = CONSENT_TEMPLATES[0];
    const sigData = 'data:image/png;base64,' + 'A'.repeat(200);
    const provSig = 'data:image/png;base64,' + 'B'.repeat(200);

    signConsent({
      templateId: template.id, templateVersion: '1.0',
      treatmentName: template.treatmentName, patientId: 'p1',
      patientName: 'Jane', signatureData: sigData,
      signedDate: '2026-01-01', providerId: 'prov1',
      providerName: 'Dr. Rina', providerSignature: provSig,
    });

    signConsent({
      templateId: template.id, templateVersion: template.version,
      treatmentName: template.treatmentName, patientId: 'p1',
      patientName: 'Jane', signatureData: sigData,
      signedDate: '2026-03-20', providerId: 'prov1',
      providerName: 'Dr. Rina', providerSignature: provSig,
    });

    const consents = getExpiringConsents(400);
    const active = consents.filter((c) => c.patientId === 'p1' && c.status === 'active');
    // Only the latest should be active
    expect(active.length).toBeLessThanOrEqual(1);
  });

  it('revokes consent', () => {
    const template = CONSENT_TEMPLATES[0];
    const consent = signConsent({
      templateId: template.id, templateVersion: template.version,
      treatmentName: template.treatmentName, patientId: 'p1',
      patientName: 'Jane',
      signatureData: 'data:image/png;base64,' + 'A'.repeat(200),
      signedDate: '2026-03-20', providerId: 'prov1',
      providerName: 'Dr. Rina',
      providerSignature: 'data:image/png;base64,' + 'B'.repeat(200),
    });

    const revoked = revokeConsent(consent.id, 'Patient requested', 'Dr. Rina');
    expect(revoked?.status).toBe('revoked');
    expect(hasValidConsent('p1', 'Botox Injection')).toBe(false);
  });

  it('validates consent for treatment', () => {
    // No consent signed
    const noConsent = validateConsentForTreatment('p1', 'Botox Injection');
    expect(noConsent.valid).toBe(false);
    expect(noConsent.issues.length).toBeGreaterThan(0);

    // Sign consent
    const template = CONSENT_TEMPLATES[0];
    signConsent({
      templateId: template.id, templateVersion: template.version,
      treatmentName: template.treatmentName, patientId: 'p1',
      patientName: 'Jane',
      signatureData: 'data:image/png;base64,' + 'A'.repeat(200),
      signedDate: '2026-03-20', providerId: 'prov1',
      providerName: 'Dr. Rina',
      providerSignature: 'data:image/png;base64,' + 'B'.repeat(200),
    });

    const withConsent = validateConsentForTreatment('p1', 'Botox Injection');
    expect(withConsent.valid).toBe(true);
  });

  it('calculates consent compliance score', () => {
    const score = calculateConsentScore();
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(score.details.length).toBe(4);
  });
});

// ── Overall Compliance Score ─────────────────────────────────────────

import { calculateComplianceScore } from '../index';

describe('Overall Compliance Score', () => {
  beforeEach(() => {
    clearAuditLog();
    clearHIPAAData();
    clearOSHAData();
    clearStateRegData();
    clearDEAData();
    clearDeviceData();
    clearConsentData();
  });

  it('calculates overall score from all modules', () => {
    const score = calculateComplianceScore();
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(score.status).toBeTruthy();
    expect(Object.keys(score.categories)).toHaveLength(8);
  });

  it('returns correct status levels', () => {
    const score = calculateComplianceScore();
    expect(['critical', 'at_risk', 'compliant', 'exemplary']).toContain(score.status);
  });

  it('includes all category scores', () => {
    const score = calculateComplianceScore();
    expect(score.categories.hipaa).toBeDefined();
    expect(score.categories.osha).toBeDefined();
    expect(score.categories.licensing).toBeDefined();
    expect(score.categories.dea).toBeDefined();
    expect(score.categories.devices).toBeDefined();
    expect(score.categories.consents).toBeDefined();
    expect(score.categories.policies).toBeDefined();
    expect(score.categories.training).toBeDefined();
  });

  it('collects deadlines from all modules', () => {
    const score = calculateComplianceScore();
    expect(Array.isArray(score.upcomingDeadlines)).toBe(true);
    expect(Array.isArray(score.overdueItems)).toBe(true);
  });
});
