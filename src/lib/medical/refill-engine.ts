/**
 * Medication Refill Engine
 * Rani Beauty Clinic
 *
 * Manages refill due dates, lookahead windows, batch reminders,
 * churn risk flagging, revenue-at-risk calculations, auto-order generation,
 * and payment failure handling.
 */

import type {
  RefillRecord,
  RefillStatus,
  RefillBatch,
  DoseLevel,
  DateRange,
} from './types';

// ============================================================
// CONSTANTS
// ============================================================

/** Days before refill due date to send first reminder */
export const FIRST_REMINDER_DAYS = 7;

/** Days before refill due date to send second reminder */
export const SECOND_REMINDER_DAYS = 3;

/** Days after refill due date with no response = churn risk */
export const CHURN_RISK_DAYS = 5;

/** Maximum payment retry attempts before cancellation */
export const MAX_PAYMENT_RETRIES = 3;

/** Days between payment retry attempts */
export const PAYMENT_RETRY_INTERVAL_DAYS = 3;

// ============================================================
// REFILL RECORD MANAGEMENT
// ============================================================

/**
 * Creates a new refill record for a patient.
 */
export function createRefillRecord(
  patientId: string,
  medicationId: string,
  medicationName: string,
  doseLevel: DoseLevel,
  dueDate: Date,
  price: number
): RefillRecord {
  return {
    id: `refill-${patientId}-${Date.now()}`,
    patientId,
    medicationId,
    medicationName,
    doseLevel,
    dueDate,
    status: 'upcoming',
    price,
    paymentStatus: 'pending',
    retryCount: 0,
  };
}

/**
 * Updates refill status.
 */
export function updateRefillStatus(
  refill: RefillRecord,
  status: RefillStatus
): RefillRecord {
  const now = new Date();
  const updated = { ...refill, status };

  switch (status) {
    case 'processing':
      updated.orderedAt = now;
      break;
    case 'shipped':
      updated.shippedAt = now;
      break;
    case 'completed':
      updated.completedAt = now;
      updated.paymentStatus = 'charged';
      break;
    case 'payment_failed':
      updated.paymentStatus = 'failed';
      updated.retryCount = refill.retryCount + 1;
      break;
    case 'cancelled':
      break;
  }

  return updated;
}

/**
 * Calculates the next refill due date based on current refill completion.
 */
export function calculateNextRefillDate(
  completedDate: Date,
  cadenceDays: number = 30
): Date {
  const next = new Date(completedDate);
  next.setDate(next.getDate() + cadenceDays);
  return next;
}

/**
 * Generates the next refill record after a completed refill.
 */
export function generateNextRefill(
  completedRefill: RefillRecord,
  cadenceDays: number = 30
): RefillRecord {
  const completedDate = completedRefill.completedAt ?? new Date();
  const nextDue = calculateNextRefillDate(completedDate, cadenceDays);

  return createRefillRecord(
    completedRefill.patientId,
    completedRefill.medicationId,
    completedRefill.medicationName,
    completedRefill.doseLevel,
    nextDue,
    completedRefill.price
  );
}

// ============================================================
// LOOKAHEAD & QUERIES
// ============================================================

/**
 * Returns refills due within the next N days.
 */
export function getRefillsDueWithin(
  refills: RefillRecord[],
  days: number,
  asOf?: Date
): RefillRecord[] {
  const now = asOf ?? new Date();
  const windowEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return refills
    .filter((r) => {
      if (r.status !== 'upcoming' && r.status !== 'due') return false;
      return r.dueDate >= now && r.dueDate <= windowEnd;
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

/**
 * 7-day lookahead for upcoming refills.
 */
export function get7DayLookahead(refills: RefillRecord[], asOf?: Date): RefillRecord[] {
  return getRefillsDueWithin(refills, 7, asOf);
}

/**
 * 14-day lookahead for upcoming refills.
 */
export function get14DayLookahead(refills: RefillRecord[], asOf?: Date): RefillRecord[] {
  return getRefillsDueWithin(refills, 14, asOf);
}

/**
 * Returns overdue refills (past due date with no action).
 */
export function getOverdueRefills(refills: RefillRecord[], asOf?: Date): RefillRecord[] {
  const now = asOf ?? new Date();
  return refills
    .filter((r) => {
      if (r.status !== 'upcoming' && r.status !== 'due') return false;
      return r.dueDate < now;
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

/**
 * Returns refills by status.
 */
export function getRefillsByStatus(
  refills: RefillRecord[],
  status: RefillStatus
): RefillRecord[] {
  return refills.filter((r) => r.status === status);
}

/**
 * Returns all refills for a specific patient.
 */
export function getPatientRefills(
  refills: RefillRecord[],
  patientId: string
): RefillRecord[] {
  return refills
    .filter((r) => r.patientId === patientId)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

// ============================================================
// BATCH TEXT GENERATOR
// ============================================================

/** Refill reminder text message */
export interface RefillReminderMessage {
  patientId: string;
  phone: string;
  message: string;
  refillId: string;
  reminderType: 'first' | 'second' | 'overdue';
}

/**
 * Generates a refill reminder text message.
 */
export function generateReminderText(
  refill: RefillRecord,
  patientFirstName: string,
  reminderType: 'first' | 'second' | 'overdue'
): string {
  const medName = refill.medicationName;
  const price = `$${refill.price}`;

  switch (reminderType) {
    case 'first':
      return `Hey ${patientFirstName}! Your ${medName} refill is coming up in about a week. Reply YES to confirm and we'll get it processed for you (${price}). Questions? Call (425) 539-4440 - Rina`;

    case 'second':
      return `${patientFirstName}, quick reminder - your ${medName} refill is due in 3 days. Reply YES to confirm (${price}) so there's no gap in your treatment! - Rina @ Rani (425) 539-4440`;

    case 'overdue':
      return `${patientFirstName}, your ${medName} refill is past due. We don't want you to miss a dose! Reply YES to process or call us if you have questions: (425) 539-4440 - Rina`;
  }
}

/**
 * Generates batch reminder messages for all refills needing reminders.
 */
export function generateBatchReminders(
  refills: RefillRecord[],
  patientLookup: Map<string, { firstName: string; phone: string }>,
  asOf?: Date
): RefillReminderMessage[] {
  const now = asOf ?? new Date();
  const messages: RefillReminderMessage[] = [];

  for (const refill of refills) {
    if (refill.status !== 'upcoming' && refill.status !== 'due') continue;

    const patient = patientLookup.get(refill.patientId);
    if (!patient) continue;

    const daysUntilDue = Math.floor(
      (refill.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let reminderType: 'first' | 'second' | 'overdue' | null = null;

    if (daysUntilDue < 0) {
      reminderType = 'overdue';
    } else if (daysUntilDue <= SECOND_REMINDER_DAYS) {
      reminderType = 'second';
    } else if (daysUntilDue <= FIRST_REMINDER_DAYS) {
      reminderType = 'first';
    }

    if (reminderType) {
      messages.push({
        patientId: refill.patientId,
        phone: patient.phone,
        message: generateReminderText(refill, patient.firstName, reminderType),
        refillId: refill.id,
        reminderType,
      });
    }
  }

  // Sort: overdue first, then by due date
  const typeOrder = { overdue: 0, second: 1, first: 2 };
  messages.sort((a, b) => typeOrder[a.reminderType] - typeOrder[b.reminderType]);

  return messages;
}

// ============================================================
// CHURN RISK FLAGGING
// ============================================================

/** Churn risk assessment for a refill */
export interface RefillChurnRisk {
  patientId: string;
  refillId: string;
  medicationName: string;
  daysOverdue: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  monthlyRevenue: number;
  annualRevenueAtRisk: number;
  recommendedAction: string;
}

/**
 * Assesses churn risk for overdue refills.
 */
export function assessChurnRisk(
  refill: RefillRecord,
  monthlyRevenue: number,
  asOf?: Date
): RefillChurnRisk | null {
  const now = asOf ?? new Date();

  if (refill.status !== 'upcoming' && refill.status !== 'due') return null;
  if (refill.dueDate > now) return null;

  const daysOverdue = Math.floor(
    (now.getTime() - refill.dueDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysOverdue < CHURN_RISK_DAYS) return null;

  let riskLevel: RefillChurnRisk['riskLevel'];
  let recommendedAction: string;

  if (daysOverdue >= 30) {
    riskLevel = 'critical';
    recommendedAction = 'Patient likely churned. Initiate win-back sequence. Owner outreach recommended.';
  } else if (daysOverdue >= 14) {
    riskLevel = 'high';
    recommendedAction = 'High churn risk. Personal phone call from Rina. Offer to address any concerns.';
  } else if (daysOverdue >= 7) {
    riskLevel = 'medium';
    recommendedAction = 'Send personalized re-engagement text. Ask about side effects or concerns.';
  } else {
    riskLevel = 'low';
    recommendedAction = 'Send gentle reminder. May just be delayed response.';
  }

  return {
    patientId: refill.patientId,
    refillId: refill.id,
    medicationName: refill.medicationName,
    daysOverdue,
    riskLevel,
    monthlyRevenue,
    annualRevenueAtRisk: monthlyRevenue * 12,
    recommendedAction,
  };
}

/**
 * Flags all at-risk refills from a list.
 */
export function flagAllChurnRisks(
  refills: RefillRecord[],
  revenueByPatient: Map<string, number>,
  asOf?: Date
): RefillChurnRisk[] {
  const risks: RefillChurnRisk[] = [];

  for (const refill of refills) {
    const revenue = revenueByPatient.get(refill.patientId) ?? 0;
    const risk = assessChurnRisk(refill, revenue, asOf);
    if (risk) risks.push(risk);
  }

  // Sort by risk level, then by revenue at risk
  const riskOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  risks.sort((a, b) => {
    const levelDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    if (levelDiff !== 0) return levelDiff;
    return b.annualRevenueAtRisk - a.annualRevenueAtRisk;
  });

  return risks;
}

// ============================================================
// REVENUE AT RISK CALCULATOR
// ============================================================

/** Revenue at risk summary */
export interface RevenueAtRiskSummary {
  totalMonthlyAtRisk: number;
  totalAnnualAtRisk: number;
  patientCount: number;
  byRiskLevel: Record<string, { count: number; monthlyRevenue: number }>;
  topAtRiskPatients: Array<{ patientId: string; monthlyRevenue: number; daysOverdue: number }>;
}

/**
 * Calculates total revenue at risk from overdue refills.
 */
export function calculateRevenueAtRisk(
  churnRisks: RefillChurnRisk[]
): RevenueAtRiskSummary {
  const byRiskLevel: Record<string, { count: number; monthlyRevenue: number }> = {
    low: { count: 0, monthlyRevenue: 0 },
    medium: { count: 0, monthlyRevenue: 0 },
    high: { count: 0, monthlyRevenue: 0 },
    critical: { count: 0, monthlyRevenue: 0 },
  };

  let totalMonthly = 0;
  const patientIds = new Set<string>();

  for (const risk of churnRisks) {
    byRiskLevel[risk.riskLevel].count++;
    byRiskLevel[risk.riskLevel].monthlyRevenue += risk.monthlyRevenue;
    totalMonthly += risk.monthlyRevenue;
    patientIds.add(risk.patientId);
  }

  // Deduplicate patients for top list
  const patientRevenue = new Map<string, { revenue: number; daysOverdue: number }>();
  for (const risk of churnRisks) {
    const existing = patientRevenue.get(risk.patientId);
    if (!existing || risk.daysOverdue > existing.daysOverdue) {
      patientRevenue.set(risk.patientId, {
        revenue: risk.monthlyRevenue,
        daysOverdue: risk.daysOverdue,
      });
    }
  }

  const topAtRisk = Array.from(patientRevenue.entries())
    .map(([patientId, data]) => ({
      patientId,
      monthlyRevenue: data.revenue,
      daysOverdue: data.daysOverdue,
    }))
    .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
    .slice(0, 10);

  return {
    totalMonthlyAtRisk: totalMonthly,
    totalAnnualAtRisk: totalMonthly * 12,
    patientCount: patientIds.size,
    byRiskLevel,
    topAtRiskPatients: topAtRisk,
  };
}

// ============================================================
// AUTO-ORDER GENERATION
// ============================================================

/** Auto-generated refill order */
export interface RefillOrder {
  orderId: string;
  refillId: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  doseLevel: DoseLevel;
  price: number;
  generatedAt: Date;
  status: 'pending_payment' | 'payment_confirmed' | 'sent_to_pharmacy' | 'failed';
}

/**
 * Auto-generates refill orders for confirmed refills.
 */
export function generateRefillOrders(
  confirmedRefills: RefillRecord[]
): RefillOrder[] {
  return confirmedRefills.map((refill) => ({
    orderId: `order-${refill.id}-${Date.now()}`,
    refillId: refill.id,
    patientId: refill.patientId,
    medicationId: refill.medicationId,
    medicationName: refill.medicationName,
    doseLevel: refill.doseLevel,
    price: refill.price,
    generatedAt: new Date(),
    status: 'pending_payment' as const,
  }));
}

/**
 * Generates a batch of refill orders for all due refills.
 */
export function generateRefillBatch(refills: RefillRecord[], asOf?: Date): RefillBatch {
  const now = asOf ?? new Date();
  const dueRefills = refills.filter((r) => {
    if (r.status !== 'upcoming' && r.status !== 'due') return false;
    return r.dueDate <= now;
  });

  const totalRevenue = dueRefills.reduce((sum, r) => sum + r.price, 0);
  const patientIds = new Set(dueRefills.map((r) => r.patientId));

  return {
    generatedAt: now,
    refills: dueRefills,
    totalRevenue,
    totalPatients: patientIds.size,
  };
}

// ============================================================
// PAYMENT FAILURE HANDLING
// ============================================================

/** Payment failure record */
export interface PaymentFailure {
  refillId: string;
  patientId: string;
  failedAt: Date;
  retryCount: number;
  nextRetryDate: Date | null;
  reason: string;
  resolved: boolean;
}

/**
 * Handles a payment failure for a refill.
 */
export function handlePaymentFailure(
  refill: RefillRecord,
  reason: string
): { updatedRefill: RefillRecord; failure: PaymentFailure; action: string } {
  const newRetryCount = refill.retryCount + 1;
  const canRetry = newRetryCount <= MAX_PAYMENT_RETRIES;

  const updatedRefill = updateRefillStatus(
    { ...refill, retryCount: newRetryCount },
    canRetry ? 'payment_failed' : 'cancelled'
  );

  const nextRetryDate = canRetry
    ? new Date(Date.now() + PAYMENT_RETRY_INTERVAL_DAYS * 24 * 60 * 60 * 1000)
    : null;

  const failure: PaymentFailure = {
    refillId: refill.id,
    patientId: refill.patientId,
    failedAt: new Date(),
    retryCount: newRetryCount,
    nextRetryDate,
    reason,
    resolved: false,
  };

  let action: string;
  if (newRetryCount === 1) {
    action = 'Send payment update text. Auto-retry in 3 days.';
  } else if (newRetryCount === 2) {
    action = 'Send second payment notice via email. Auto-retry in 3 days.';
  } else if (newRetryCount === 3) {
    action = 'Final retry. Send urgent text about payment. Manual follow-up if this fails.';
  } else {
    action = 'All retries exhausted. Refill cancelled. Initiate manual outreach and churn-save protocol.';
  }

  return { updatedRefill, failure, action };
}

/**
 * Generates a payment failure notification text.
 */
export function generatePaymentFailureText(
  patientFirstName: string,
  retryCount: number
): string {
  if (retryCount === 1) {
    return `Hey ${patientFirstName}, we had trouble processing your payment for your upcoming refill. Could you update your card on file? Just reply or call us at (425) 539-4440 and we'll get it sorted! - Rina`;
  }

  if (retryCount === 2) {
    return `${patientFirstName}, just a heads up - we still need an updated payment method for your medication refill. We don't want you to miss a dose! Call us at (425) 539-4440 or reply to update. - Rina @ Rani`;
  }

  return `${patientFirstName}, we've been trying to reach you about your payment. Your refill is on hold until we can process payment. Please call us ASAP at (425) 539-4440 so we can keep your treatment on track. - Rina`;
}

/**
 * Returns all refills with payment failures.
 */
export function getPaymentFailures(refills: RefillRecord[]): RefillRecord[] {
  return refills.filter((r) => r.paymentStatus === 'failed');
}

/**
 * Returns refills ready for payment retry.
 */
export function getRefillsReadyForRetry(
  failures: PaymentFailure[],
  asOf?: Date
): PaymentFailure[] {
  const now = asOf ?? new Date();
  return failures.filter(
    (f) => !f.resolved && f.nextRetryDate && f.nextRetryDate <= now
  );
}

// ============================================================
// REPORTING
// ============================================================

/** Refill engine daily report */
export interface RefillDailyReport {
  date: Date;
  refillsDueToday: number;
  refillsDueNext7Days: number;
  refillsDueNext14Days: number;
  overdueRefills: number;
  paymentFailures: number;
  churnRiskCount: number;
  revenueProcessedToday: number;
  revenueAtRisk: number;
}

/**
 * Generates a daily refill report.
 */
export function generateDailyRefillReport(
  refills: RefillRecord[],
  churnRisks: RefillChurnRisk[],
  asOf?: Date
): RefillDailyReport {
  const now = asOf ?? new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const dueToday = refills.filter(
    (r) => r.dueDate >= todayStart && r.dueDate < todayEnd && (r.status === 'upcoming' || r.status === 'due')
  );

  const processedToday = refills.filter(
    (r) => r.completedAt && r.completedAt >= todayStart && r.completedAt < todayEnd
  );

  const revenueAtRisk = calculateRevenueAtRisk(churnRisks);

  return {
    date: now,
    refillsDueToday: dueToday.length,
    refillsDueNext7Days: get7DayLookahead(refills, now).length,
    refillsDueNext14Days: get14DayLookahead(refills, now).length,
    overdueRefills: getOverdueRefills(refills, now).length,
    paymentFailures: getPaymentFailures(refills).length,
    churnRiskCount: churnRisks.length,
    revenueProcessedToday: processedToday.reduce((sum, r) => sum + r.price, 0),
    revenueAtRisk: revenueAtRisk.totalMonthlyAtRisk,
  };
}

/**
 * Formats the daily report as a readable string.
 */
export function formatDailyRefillReport(report: RefillDailyReport): string {
  return [
    `Refill Report - ${report.date.toLocaleDateString()}`,
    '='.repeat(40),
    '',
    `Due Today:        ${report.refillsDueToday}`,
    `Due (7-day):      ${report.refillsDueNext7Days}`,
    `Due (14-day):     ${report.refillsDueNext14Days}`,
    `Overdue:          ${report.overdueRefills}`,
    `Payment Failures: ${report.paymentFailures}`,
    `Churn Risks:      ${report.churnRiskCount}`,
    '',
    `Revenue Processed: $${report.revenueProcessedToday.toLocaleString()}`,
    `Revenue at Risk:   $${report.revenueAtRisk.toLocaleString()}`,
  ].join('\n');
}
