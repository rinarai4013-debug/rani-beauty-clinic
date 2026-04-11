/**
 * HIPAA Audit Engine
 * Track access logs, PHI disclosures, breach notifications,
 * training completions, and Business Associate Agreements.
 *
 * Storage: in-memory module state as the primary store (fast reads
 * for the current request + hot dyno). Optional dual-write to
 * Airtable via `./persistence.ts` when
 * `COMPLIANCE_PERSISTENCE_ENABLED=1`. See that file for the
 * required Airtable table schemas and the wire-first/provision-later
 * rationale.
 */

import type {
  PHIAccessLog,
  PHIDisclosure,
  BreachNotification,
  TrainingCompletion,
  BusinessAssociateAgreement,
} from '@/types/compliance';
import { createAuditEntry } from './audit-trail';
import {
  persistPhiAccessLog,
  persistBreach,
  persistBaa,
  persistTraining,
} from './persistence';

// ── In-memory stores ─────────────────────────────────────────────────

let accessLogs: PHIAccessLog[] = [];
let disclosures: PHIDisclosure[] = [];
let breaches: BreachNotification[] = [];
let trainingRecords: TrainingCompletion[] = [];
let baas: BusinessAssociateAgreement[] = [];

// ── PHI Access Logging ───────────────────────────────────────────────

export function logPHIAccess(params: Omit<PHIAccessLog, 'id' | 'timestamp'>): PHIAccessLog {
  const entry: PHIAccessLog = {
    id: `phi_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    ...params,
  };
  accessLogs = [...accessLogs, entry];

  createAuditEntry({
    userId: params.userId,
    userName: params.userName,
    userRole: params.userRole,
    action: `phi_${params.action}` as any,
    resourceType: 'patient_record',
    resourceId: params.patientId,
    details: `${params.action} ${params.dataCategory} for patient ${params.patientName}${params.details ? `: ${params.details}` : ''}`,
    ipAddress: params.ipAddress,
  });

  // Fire-and-forget dual-write to Airtable when persistence is enabled.
  // Never blocks the sync return — see ./persistence.ts for contract.
  persistPhiAccessLog(entry);

  return entry;
}

export function getAccessLogs(filters?: {
  userId?: string;
  patientId?: string;
  action?: PHIAccessLog['action'];
  startDate?: string;
  endDate?: string;
}): PHIAccessLog[] {
  let result = [...accessLogs];
  if (filters?.userId) result = result.filter((l) => l.userId === filters.userId);
  if (filters?.patientId) result = result.filter((l) => l.patientId === filters.patientId);
  if (filters?.action) result = result.filter((l) => l.action === filters.action);
  if (filters?.startDate) {
    const start = new Date(filters.startDate).getTime();
    result = result.filter((l) => new Date(l.timestamp).getTime() >= start);
  }
  if (filters?.endDate) {
    const end = new Date(filters.endDate).getTime();
    result = result.filter((l) => new Date(l.timestamp).getTime() <= end);
  }
  return result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// ── PHI Disclosures ──────────────────────────────────────────────────

export function recordDisclosure(params: Omit<PHIDisclosure, 'id'>): PHIDisclosure {
  const disclosure: PHIDisclosure = {
    id: `disc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...params,
  };
  disclosures = [...disclosures, disclosure];
  return disclosure;
}

export function getDisclosures(patientId?: string): PHIDisclosure[] {
  const result = patientId ? disclosures.filter((d) => d.patientId === patientId) : [...disclosures];
  return result.sort((a, b) => new Date(b.disclosureDate).getTime() - new Date(a.disclosureDate).getTime());
}

// ── Breach Notifications ─────────────────────────────────────────────

export function reportBreach(params: Omit<BreachNotification, 'id'>): BreachNotification {
  const breach: BreachNotification = {
    id: `breach_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...params,
  };
  breaches = [...breaches, breach];

  createAuditEntry({
    userId: params.investigator,
    userName: params.investigator,
    userRole: 'compliance',
    action: 'breach_report',
    resourceType: 'breach',
    resourceId: breach.id,
    details: `Breach reported: ${params.description}. ${params.individualsAffected} individuals affected.`,
    ipAddress: '0.0.0.0',
  });

  // Fire-and-forget dual-write to Airtable `HIPAA Breaches` table.
  persistBreach(breach);

  return breach;
}

export function updateBreach(
  id: string,
  updates: Partial<BreachNotification>
): BreachNotification | null {
  const index = breaches.findIndex((b) => b.id === id);
  if (index === -1) return null;
  breaches[index] = { ...breaches[index], ...updates };
  return breaches[index];
}

export function getBreaches(): BreachNotification[] {
  return [...breaches].sort(
    (a, b) => new Date(b.discoveryDate).getTime() - new Date(a.discoveryDate).getTime()
  );
}

/**
 * Check if breach requires HHS notification (500+ individuals)
 * or individual notification (any unsecured PHI breach)
 */
export function assessBreachNotificationRequirements(breach: BreachNotification): {
  requiresHHS: boolean;
  requiresIndividualNotice: boolean;
  requiresMediaNotice: boolean;
  deadlineHHS: string;
  deadlineIndividuals: string;
  deadlineMedia: string;
} {
  // Anchor the date math to UTC so the +60-day deadline calculation
  // doesn't drift by a day in negative-offset timezones (Pacific,
  // Mountain, Central, Eastern). This is the same TZ-parsing bug
  // class fixed in Wave 11 Bug 4 (schedule/optimizer.ts). Previously:
  //   new Date('2026-02-10').setDate(+60)
  // would give Apr 10 in Pacific instead of Apr 11 UTC.
  const discoveryUtc = new Date(`${breach.discoveryDate}T00:00:00Z`);
  const sixtyDaysOut = new Date(discoveryUtc);
  sixtyDaysOut.setUTCDate(sixtyDaysOut.getUTCDate() + 60);

  const deadlineStr = sixtyDaysOut.toISOString().split('T')[0];

  return {
    requiresHHS: breach.individualsAffected >= 500,
    requiresIndividualNotice: true, // All breaches require individual notice
    requiresMediaNotice: breach.individualsAffected >= 500,
    deadlineHHS: deadlineStr,
    deadlineIndividuals: deadlineStr,
    deadlineMedia: deadlineStr,
  };
}

// ── Training Tracking ────────────────────────────────────────────────

export function recordTraining(params: Omit<TrainingCompletion, 'id'>): TrainingCompletion {
  const record: TrainingCompletion = {
    id: `train_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...params,
  };
  trainingRecords = [...trainingRecords, record];

  createAuditEntry({
    userId: params.staffId,
    userName: params.staffName,
    userRole: params.staffRole,
    action: 'training_complete',
    resourceType: 'training',
    resourceId: record.id,
    details: `Completed ${params.trainingType} training. Score: ${params.score ?? 'N/A'}. Passed: ${params.passed}`,
    ipAddress: '0.0.0.0',
  });

  // Fire-and-forget dual-write to Airtable `HIPAA Training` table.
  persistTraining(record);

  return record;
}

export function getTrainingRecords(staffId?: string): TrainingCompletion[] {
  const result = staffId
    ? trainingRecords.filter((t) => t.staffId === staffId)
    : [...trainingRecords];
  return result.sort(
    (a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
  );
}

export function getTrainingComplianceStatus(): {
  totalStaff: number;
  compliant: number;
  nonCompliant: number;
  upcomingExpirations: TrainingCompletion[];
  overdueTraining: TrainingCompletion[];
} {
  const now = new Date();
  const thirtyDaysOut = new Date();
  thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

  const staffIds = [...new Set(trainingRecords.map((t) => t.staffId))];
  let compliant = 0;
  let nonCompliant = 0;

  for (const staffId of staffIds) {
    const records = trainingRecords.filter((t) => t.staffId === staffId);
    const allCurrent = records.every(
      (t) => t.passed && new Date(t.expirationDate) > now
    );
    if (allCurrent) compliant++;
    else nonCompliant++;
  }

  const upcomingExpirations = trainingRecords.filter(
    (t) => new Date(t.expirationDate) > now && new Date(t.expirationDate) <= thirtyDaysOut
  );

  const overdueTraining = trainingRecords.filter(
    (t) => t.renewalRequired && new Date(t.expirationDate) <= now
  );

  return {
    totalStaff: staffIds.length,
    compliant,
    nonCompliant,
    upcomingExpirations,
    overdueTraining,
  };
}

// ── BAA Management ───────────────────────────────────────────────────

export function addBAA(params: Omit<BusinessAssociateAgreement, 'id'>): BusinessAssociateAgreement {
  const baa: BusinessAssociateAgreement = {
    id: `baa_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    ...params,
  };
  baas = [...baas, baa];

  // Fire-and-forget dual-write to Airtable `BAAs` table.
  persistBaa(baa);

  return baa;
}

export function updateBAA(
  id: string,
  updates: Partial<BusinessAssociateAgreement>
): BusinessAssociateAgreement | null {
  const index = baas.findIndex((b) => b.id === id);
  if (index === -1) return null;
  baas[index] = { ...baas[index], ...updates };
  return baas[index];
}

export function getBAAs(): BusinessAssociateAgreement[] {
  return [...baas].sort(
    (a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime()
  );
}

export function getBAAComplianceStatus(): {
  total: number;
  active: number;
  expiringSoon: number;
  expired: number;
} {
  const now = new Date();
  const ninetyDaysOut = new Date();
  ninetyDaysOut.setDate(ninetyDaysOut.getDate() + 90);

  return {
    total: baas.length,
    active: baas.filter((b) => b.status === 'active').length,
    expiringSoon: baas.filter(
      (b) => b.status === 'active' && new Date(b.expirationDate) <= ninetyDaysOut
    ).length,
    expired: baas.filter((b) => b.status === 'expired').length,
  };
}

// ── HIPAA Compliance Score ───────────────────────────────────────────

export function calculateHIPAAScore(): {
  score: number;
  issues: number;
  details: { area: string; score: number; maxScore: number; issues: string[] }[];
} {
  const areas: { area: string; score: number; maxScore: number; issues: string[] }[] = [];
  const now = new Date();

  // Training compliance (25 points)
  const trainingStatus = getTrainingComplianceStatus();
  const trainingScore = trainingStatus.totalStaff > 0
    ? Math.round((trainingStatus.compliant / trainingStatus.totalStaff) * 25)
    : 25;
  const trainingIssues: string[] = [];
  if (trainingStatus.overdueTraining.length > 0) {
    trainingIssues.push(`${trainingStatus.overdueTraining.length} overdue training(s)`);
  }
  if (trainingStatus.upcomingExpirations.length > 0) {
    trainingIssues.push(`${trainingStatus.upcomingExpirations.length} expiring within 30 days`);
  }
  areas.push({ area: 'Training', score: trainingScore, maxScore: 25, issues: trainingIssues });

  // BAA compliance (25 points)
  const baaStatus = getBAAComplianceStatus();
  let baaScore = 25;
  const baaIssues: string[] = [];
  if (baaStatus.expired > 0) {
    baaScore -= baaStatus.expired * 10;
    baaIssues.push(`${baaStatus.expired} expired BAA(s)`);
  }
  if (baaStatus.expiringSoon > 0) {
    baaScore -= baaStatus.expiringSoon * 3;
    baaIssues.push(`${baaStatus.expiringSoon} BAA(s) expiring within 90 days`);
  }
  areas.push({ area: 'BAAs', score: Math.max(0, baaScore), maxScore: 25, issues: baaIssues });

  // Breach response (25 points)
  const activeBreaches = breaches.filter((b) => b.status !== 'resolved');
  let breachScore = 25;
  const breachIssues: string[] = [];
  for (const breach of activeBreaches) {
    breachScore -= 10;
    breachIssues.push(`Active breach: ${breach.description.substring(0, 50)}...`);
  }
  areas.push({ area: 'Breach Response', score: Math.max(0, breachScore), maxScore: 25, issues: breachIssues });

  // Access controls (25 points)
  const recentLogs = accessLogs.filter(
    (l) => new Date(l.timestamp).getTime() > now.getTime() - 30 * 24 * 60 * 60 * 1000
  );
  let accessScore = 25;
  const accessIssues: string[] = [];
  const deletions = recentLogs.filter((l) => l.action === 'delete');
  const exports = recentLogs.filter((l) => l.action === 'export');
  if (deletions.length > 5) {
    accessScore -= 5;
    accessIssues.push(`${deletions.length} PHI deletions in past 30 days`);
  }
  if (exports.length > 20) {
    accessScore -= 5;
    accessIssues.push(`${exports.length} PHI exports in past 30 days (review for necessity)`);
  }
  areas.push({ area: 'Access Controls', score: Math.max(0, accessScore), maxScore: 25, issues: accessIssues });

  const totalScore = areas.reduce((sum, a) => sum + a.score, 0);
  const totalIssues = areas.reduce((sum, a) => sum + a.issues.length, 0);

  return { score: totalScore, issues: totalIssues, details: areas };
}

// ── Seed / Reset ─────────────────────────────────────────────────────

export function seedHIPAAData(data: {
  accessLogs?: PHIAccessLog[];
  disclosures?: PHIDisclosure[];
  breaches?: BreachNotification[];
  trainingRecords?: TrainingCompletion[];
  baas?: BusinessAssociateAgreement[];
}): void {
  if (data.accessLogs) accessLogs = [...accessLogs, ...data.accessLogs];
  if (data.disclosures) disclosures = [...disclosures, ...data.disclosures];
  if (data.breaches) breaches = [...breaches, ...data.breaches];
  if (data.trainingRecords) trainingRecords = [...trainingRecords, ...data.trainingRecords];
  if (data.baas) baas = [...baas, ...data.baas];
}

export function clearHIPAAData(): void {
  accessLogs = [];
  disclosures = [];
  breaches = [];
  trainingRecords = [];
  baas = [];
}
