/**
 * Qualiphy GFE Platform Integration
 * Rani Beauty Clinic
 *
 * Handles quick-entry block generation, GFE status tracking,
 * expiration monitoring, auto-reminders, and MD review queue.
 */

import type {
  QualiphyQuickEntry,
  QualiphyReminder,
  GFERecord,
  GFEStatus,
  PatientProfile,
  MedicalHistory,
  Gender,
} from './types';

// ============================================================
// CONSTANTS
// ============================================================

/** GFE valid for 1 year from completion */
export const GFE_VALIDITY_DAYS = 365;

/** Days before expiration to start renewal reminders */
export const GFE_RENEWAL_WINDOW_DAYS = 30;

/** Maximum reminders to send for an incomplete GFE */
export const MAX_GFE_REMINDERS = 3;

/** Days between GFE reminders */
export const GFE_REMINDER_INTERVAL_DAYS = 3;

// ============================================================
// QUICK-ENTRY BLOCK GENERATOR
// ============================================================

/**
 * Generates a copy-paste ready quick-entry block for Qualiphy.
 * Formatted for fast data entry into the Qualiphy platform.
 */
export function generateQuickEntryBlock(
  patient: PatientProfile,
  medicalHistory: MedicalHistory,
  servicesRequested: string[]
): QualiphyQuickEntry {
  return {
    firstName: patient.firstName,
    lastName: patient.lastName,
    dob: patient.dob,
    gender: formatGenderForQualiphy(patient.gender),
    phone: formatPhoneForQualiphy(patient.phone),
    email: patient.email,
    servicesRequested,
    medicalHistory: medicalHistory.conditions.join(', ') || 'None reported',
    currentMedications: medicalHistory.currentMedications.join(', ') || 'None reported',
    allergies: medicalHistory.allergies.join(', ') || 'NKDA',
  };
}

/**
 * Formats gender for Qualiphy platform.
 */
function formatGenderForQualiphy(gender: Gender): string {
  switch (gender) {
    case 'male': return 'Male';
    case 'female': return 'Female';
    case 'non_binary': return 'Non-Binary';
    case 'prefer_not_to_say': return 'Prefer Not to Say';
  }
}

/**
 * Formats phone number for Qualiphy (XXX-XXX-XXXX).
 */
function formatPhoneForQualiphy(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

/**
 * Formats the quick-entry block as a copy-paste string.
 */
export function formatQuickEntryAsText(entry: QualiphyQuickEntry): string {
  const lines = [
    '--- QUALIPHY QUICK ENTRY ---',
    `Name: ${entry.firstName} ${entry.lastName}`,
    `DOB: ${entry.dob}`,
    `Gender: ${entry.gender}`,
    `Phone: ${entry.phone}`,
    `Email: ${entry.email}`,
    `Services Requested: ${entry.servicesRequested.join(', ')}`,
    `Medical History: ${entry.medicalHistory}`,
    `Current Medications: ${entry.currentMedications}`,
    `Allergies: ${entry.allergies}`,
    '--- END QUICK ENTRY ---',
  ];
  return lines.join('\n');
}

/**
 * Formats the quick-entry block as structured JSON for API integration.
 */
export function formatQuickEntryAsJSON(entry: QualiphyQuickEntry): string {
  return JSON.stringify(entry, null, 2);
}

// ============================================================
// GFE STATUS TRACKING
// ============================================================

/**
 * Creates a new GFE tracking record.
 */
export function createGFETracker(patientId: string): GFERecord {
  return {
    patientId,
    status: 'pending',
    provider: '',
    platform: 'qualiphy',
  };
}

/**
 * Schedules a GFE appointment.
 */
export function scheduleGFE(record: GFERecord, scheduledDate: Date): GFERecord {
  return {
    ...record,
    status: 'scheduled',
    scheduledAt: scheduledDate,
  };
}

/**
 * Marks a GFE as completed.
 */
export function completeGFE(record: GFERecord, provider: string): GFERecord {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + GFE_VALIDITY_DAYS);

  return {
    ...record,
    status: 'completed',
    completedAt: now,
    expiresAt,
    provider,
  };
}

/**
 * Marks a GFE as expired.
 */
export function expireGFE(record: GFERecord): GFERecord {
  return {
    ...record,
    status: 'expired',
  };
}

/**
 * Gets the current GFE status with details.
 */
export function getGFEStatusDetails(record: GFERecord, asOf?: Date): {
  status: GFEStatus;
  isValid: boolean;
  daysUntilExpiration: number | null;
  needsRenewal: boolean;
  statusMessage: string;
} {
  const now = asOf ?? new Date();

  if (record.status === 'pending') {
    return {
      status: 'pending',
      isValid: false,
      daysUntilExpiration: null,
      needsRenewal: false,
      statusMessage: 'GFE has not been started. Patient needs to complete virtual exam via Qualiphy.',
    };
  }

  if (record.status === 'scheduled') {
    return {
      status: 'scheduled',
      isValid: false,
      daysUntilExpiration: null,
      needsRenewal: false,
      statusMessage: `GFE scheduled for ${record.scheduledAt?.toLocaleDateString() ?? 'unknown date'}.`,
    };
  }

  if (record.status === 'completed' && record.expiresAt) {
    const daysUntil = Math.floor(
      (record.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0) {
      return {
        status: 'expired',
        isValid: false,
        daysUntilExpiration: daysUntil,
        needsRenewal: true,
        statusMessage: `GFE expired ${Math.abs(daysUntil)} days ago. Renewal required.`,
      };
    }

    const needsRenewal = daysUntil <= GFE_RENEWAL_WINDOW_DAYS;
    return {
      status: 'completed',
      isValid: true,
      daysUntilExpiration: daysUntil,
      needsRenewal,
      statusMessage: needsRenewal
        ? `GFE expires in ${daysUntil} days. Schedule renewal.`
        : `GFE valid. Expires in ${daysUntil} days.`,
    };
  }

  return {
    status: 'expired',
    isValid: false,
    daysUntilExpiration: null,
    needsRenewal: true,
    statusMessage: 'GFE expired. Renewal required before continuing treatment.',
  };
}

// ============================================================
// EXPIRATION MONITORING
// ============================================================

/**
 * Returns GFE records that are expiring within the specified window.
 */
export function getExpiringGFEs(
  records: GFERecord[],
  withinDays: number = GFE_RENEWAL_WINDOW_DAYS,
  asOf?: Date
): GFERecord[] {
  const now = asOf ?? new Date();
  const windowEnd = new Date(now.getTime() + withinDays * 24 * 60 * 60 * 1000);

  return records.filter((r) => {
    if (r.status !== 'completed' || !r.expiresAt) return false;
    return r.expiresAt > now && r.expiresAt <= windowEnd;
  });
}

/**
 * Returns GFE records that have already expired.
 */
export function getExpiredGFEs(records: GFERecord[], asOf?: Date): GFERecord[] {
  const now = asOf ?? new Date();
  return records.filter((r) => {
    if (!r.expiresAt) return r.status === 'expired';
    return r.expiresAt < now;
  });
}

/**
 * Returns GFE records that are still pending (not completed).
 */
export function getIncompleteGFEs(records: GFERecord[]): GFERecord[] {
  return records.filter((r) => r.status === 'pending' || r.status === 'scheduled');
}

// ============================================================
// AUTO-REMINDERS
// ============================================================

/**
 * Generates a GFE reminder message for a patient.
 */
export function generateGFEReminder(
  patientFirstName: string,
  reminderNumber: number,
  isRenewal: boolean = false
): QualiphyReminder & { text: string } {
  const now = new Date();
  let text: string;

  if (isRenewal) {
    text = reminderNumber === 1
      ? `Hey ${patientFirstName}! Your annual virtual exam is coming up for renewal. It's quick (about 10 min) and keeps your prescriptions active. We'll send you the link shortly! - Rina @ Rani (425) 539-4440`
      : `${patientFirstName}, friendly reminder - your virtual exam renewal is needed to continue your treatment. Reply and we'll send the Qualiphy link right over! - Rina (425) 539-4440`;
  } else {
    switch (reminderNumber) {
      case 1:
        text = `Hey ${patientFirstName}! One quick step left before we can start your treatment - a virtual exam through Qualiphy. Takes about 10 minutes from your phone. We'll send the link shortly! - Rina @ Rani (425) 539-4440`;
        break;
      case 2:
        text = `${patientFirstName}, just checking in! Your virtual exam is still needed to move forward with your treatment. It's super quick. Ready to get it done? Reply YES and I'll send the link! - Rina (425) 539-4440`;
        break;
      default:
        text = `${patientFirstName}, we really want to get you started! Your Qualiphy exam is the last step. Call us at (425) 539-4440 if you need help or have questions about the process. - Rina @ Rani`;
        break;
    }
  }

  return {
    patientId: '', // Set by caller
    type: reminderNumber === 1 ? 'initial' : reminderNumber === 2 ? 'follow_up' : 'final',
    sentAt: now,
    channel: 'sms',
    message: text,
    text,
  };
}

/**
 * Generates batch GFE reminders for all patients with incomplete GFEs.
 */
export function generateBatchGFEReminders(
  incompleteGFEs: GFERecord[],
  patientNames: Map<string, string>,
  remindersSent: Map<string, number>,
  asOf?: Date
): Array<{ patientId: string; reminder: QualiphyReminder & { text: string } }> {
  const results: Array<{ patientId: string; reminder: QualiphyReminder & { text: string } }> = [];

  for (const gfe of incompleteGFEs) {
    const sentCount = remindersSent.get(gfe.patientId) ?? 0;
    if (sentCount >= MAX_GFE_REMINDERS) continue;

    const firstName = patientNames.get(gfe.patientId) ?? 'there';
    const reminder = generateGFEReminder(firstName, sentCount + 1);
    reminder.patientId = gfe.patientId;

    results.push({ patientId: gfe.patientId, reminder });
  }

  return results;
}

// ============================================================
// MD REVIEW QUEUE
// ============================================================

/** MD review request for soft-flagged patients */
export interface MDReviewRequest {
  patientId: string;
  patientName: string;
  requestedAt: Date;
  reason: string;
  softFlags: string[];
  gfeStatus: GFEStatus;
  priority: 'routine' | 'urgent';
  status: 'pending' | 'in_review' | 'approved' | 'denied' | 'needs_info';
  reviewerNotes?: string;
  reviewedAt?: Date;
  reviewedBy?: string;
}

/**
 * Creates an MD review request for a soft-flagged patient.
 */
export function createMDReviewRequest(
  patientId: string,
  patientName: string,
  softFlags: string[],
  gfeStatus: GFEStatus
): MDReviewRequest {
  // Determine priority based on flag types
  const urgentFlags = ['Active cancer', 'History of suicidal ideation or depression'];
  const isUrgent = softFlags.some((flag) =>
    urgentFlags.some((uf) => flag.toLowerCase().includes(uf.toLowerCase()))
  );

  return {
    patientId,
    patientName,
    requestedAt: new Date(),
    reason: `Patient has ${softFlags.length} condition(s) requiring physician review before treatment can proceed.`,
    softFlags,
    gfeStatus,
    priority: isUrgent ? 'urgent' : 'routine',
    status: 'pending',
  };
}

/**
 * Updates an MD review request with reviewer decision.
 */
export function updateMDReview(
  request: MDReviewRequest,
  status: MDReviewRequest['status'],
  reviewedBy: string,
  notes?: string
): MDReviewRequest {
  return {
    ...request,
    status,
    reviewedBy,
    reviewedAt: new Date(),
    reviewerNotes: notes,
  };
}

/**
 * Returns all pending MD review requests sorted by priority.
 */
export function getPendingMDReviews(requests: MDReviewRequest[]): MDReviewRequest[] {
  return requests
    .filter((r) => r.status === 'pending' || r.status === 'in_review')
    .sort((a, b) => {
      // Urgent first
      if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
      if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
      // Then by date (oldest first)
      return a.requestedAt.getTime() - b.requestedAt.getTime();
    });
}

/**
 * Formats the MD review queue as a readable summary.
 */
export function formatMDReviewQueue(requests: MDReviewRequest[]): string {
  const pending = getPendingMDReviews(requests);

  if (pending.length === 0) {
    return 'MD Review Queue: Empty - No pending reviews.';
  }

  const lines = [
    `MD Review Queue - ${pending.length} pending`,
    '='.repeat(45),
    '',
  ];

  for (const req of pending) {
    const priorityLabel = req.priority === 'urgent' ? '[URGENT]' : '[Routine]';
    const daysWaiting = Math.floor(
      (Date.now() - req.requestedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    lines.push(`${priorityLabel} ${req.patientName}`);
    lines.push(`  Flags: ${req.softFlags.join(', ')}`);
    lines.push(`  GFE: ${req.gfeStatus} | Waiting: ${daysWaiting} day(s)`);
    lines.push('');
  }

  return lines.join('\n');
}
