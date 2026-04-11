/**
 * GLP-1 Refill Protector
 * Rani Beauty Clinic - Revenue Activation System
 *
 * Monitors all GLP-1, peptide, and hormone patients for refill timing.
 * Sends a multi-touch reminder sequence to prevent churn and protect
 * recurring revenue.
 *
 * Reminder sequence:
 * - Day -7: Soft reminder ("Your next refill is coming up!")
 * - Day -3: Logistics text ("We're preparing your next month's medication")
 * - Day  0: Refill due notification
 * - Day +3: AT-RISK flag ("We noticed you haven't refilled yet. Everything okay?")
 * - Day +7: Escalation to Rina with dollar amount at risk
 *
 * Auto-generates Mangomint tags for patient status tracking.
 */

import { Tables, fetchAll, updateRecord } from '@/lib/airtable/client';

// ── Types ────────────────────────────────────────────────────────────────

export type RefillStatus =
  | 'upcoming'     // 7+ days until refill
  | 'due_soon'     // 1-7 days until refill
  | 'due_today'    // Refill due today
  | 'overdue'      // 1-3 days past due
  | 'at_risk'      // 3-7 days past due
  | 'escalated'    // 7+ days past due, escalated to Rina
  | 'refilled'     // Successfully refilled
  | 'cancelled';   // Patient cancelled program

export type MedicationType = 'glp1' | 'peptide' | 'hormone' | 'rx_skincare';

export interface RefillPatient {
  id: string;
  name: string;
  firstName: string;
  email: string;
  phone: string;
  medication: string;
  medicationType: MedicationType;
  tier: string; // Starter, Premium, VIP
  monthlyPrice: number;
  lastRefillDate: string;
  nextRefillDate: string;
  daysUntilRefill: number;
  status: RefillStatus;
  consecutiveRefills: number; // streak
  totalRefills: number;
  totalSpent: number;
  startDate: string;
  tenureMonths: number;
  projectedAnnualValue: number;
  atRiskRevenue: number; // $ at risk if they churn
  mangomintTag: string;
  remindersSent: ReminderLog[];
  notes?: string;
}

export interface ReminderLog {
  type: ReminderType;
  channel: 'sms' | 'email' | 'internal';
  sentAt: string;
  message: string;
  status: 'sent' | 'delivered' | 'opened' | 'responded';
}

export type ReminderType =
  | 'day_minus_7'
  | 'day_minus_3'
  | 'day_0'
  | 'day_plus_3'
  | 'day_plus_7';

export interface RefillReminder {
  patientId: string;
  patientName: string;
  type: ReminderType;
  channel: 'sms' | 'email' | 'internal';
  scheduledDate: string;
  message: string;
  subject?: string; // email only
  htmlBody?: string; // email only
  priority: 'normal' | 'high' | 'urgent';
  dollarAtRisk: number;
}

export interface RefillDashboard {
  summary: RefillSummary;
  patients: RefillPatient[];
  upcomingReminders: RefillReminder[];
  overduePatients: RefillPatient[];
  atRiskPatients: RefillPatient[];
  escalatedPatients: RefillPatient[];
  revenueProtection: RevenueProtection;
  mangomintExport: MangomintTagExport[];
}

export interface RefillSummary {
  totalRefillPatients: number;
  activeGLP1: number;
  activePeptide: number;
  activeHormone: number;
  activeRxSkincare: number;
  upcomingRefills: number;
  dueSoon: number;
  dueToday: number;
  overdueCount: number;
  atRiskCount: number;
  escalatedCount: number;
  monthlyRecurringRevenue: number;
  revenueAtRisk: number;
  refillRate: number; // percentage
  avgTenureMonths: number;
  avgConsecutiveRefills: number;
}

export interface RevenueProtection {
  totalProtectedThisMonth: number;
  totalAtRiskThisMonth: number;
  totalLostThisMonth: number;
  protectionRate: number;
  interventionsSent: number;
  interventionsConverted: number;
  conversionRate: number;
  projectedMonthlyImpact: number;
  savingsFromChurnPrevention: number;
  monthlyTrend: { month: string; protected: number; atRisk: number; lost: number }[];
}

export interface MangomintTagExport {
  patientName: string;
  email: string;
  phone: string;
  tag: string;
  medication: string;
  status: RefillStatus;
  daysUntilRefill: number;
}

// ── Constants ────────────────────────────────────────────────────────────

const BOOKING_URL = 'https://www.ranibeautyclinic.com/contact';
const CLINIC_PHONE = '(425) 539-4440';

// Average monthly values by medication type
const MEDICATION_MONTHLY_VALUES: Record<string, number> = {
  'GLP-1 Starter': 399,
  'GLP-1 Premium': 499,
  'GLP-1 VIP': 599,
  'Semaglutide': 399,
  'Tirzepatide': 499,
  'BPC-157': 200,
  'Thymosin Alpha-1': 250,
  'PT-141': 200,
  'Testosterone': 200,
  'Progesterone': 150,
  'Tretinoin': 99,
  'Default GLP-1': 449,
  'Default Peptide': 200,
  'Default Hormone': 175,
  'Default Rx Skincare': 99,
};

// Standard refill intervals in days
const REFILL_INTERVALS: Record<MedicationType, number> = {
  glp1: 30,
  peptide: 30,
  hormone: 30,
  rx_skincare: 30,
};

// Mangomint tag templates
const TAG_TEMPLATES: Record<RefillStatus, string> = {
  upcoming: 'Refill-Upcoming',
  due_soon: 'Refill-DueSoon',
  due_today: 'Refill-DueToday',
  overdue: 'Refill-Overdue',
  at_risk: 'Refill-AtRisk',
  escalated: 'Refill-Escalated',
  refilled: 'Refill-Current',
  cancelled: 'Program-Cancelled',
};

// ── Refill Status Calculation ────────────────────────────────────────────

/**
 * Calculate refill status based on days until next refill.
 */
export function calculateRefillStatus(daysUntilRefill: number): RefillStatus {
  if (daysUntilRefill > 7) return 'upcoming';
  if (daysUntilRefill > 0) return 'due_soon';
  if (daysUntilRefill === 0) return 'due_today';
  if (daysUntilRefill >= -3) return 'overdue';
  if (daysUntilRefill >= -7) return 'at_risk';
  return 'escalated';
}

/**
 * Calculate days until next refill from last refill date.
 */
export function calculateDaysUntilRefill(lastRefillDate: string, intervalDays: number = 30): number {
  const last = new Date(lastRefillDate);
  const nextDue = new Date(last);
  nextDue.setDate(nextDue.getDate() + intervalDays);

  const now = new Date();
  const diffMs = nextDue.getTime() - now.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determine medication type from service name.
 */
export function classifyMedication(serviceName: string): MedicationType {
  const s = serviceName.toLowerCase();
  if (s.includes('glp') || s.includes('semaglutide') || s.includes('tirzepatide') || s.includes('weight')) {
    return 'glp1';
  }
  if (s.includes('bpc') || s.includes('thymosin') || s.includes('pt-141') || s.includes('peptide')) {
    return 'peptide';
  }
  if (s.includes('testosterone') || s.includes('progesterone') || s.includes('hormone') || s.includes('estrogen')) {
    return 'hormone';
  }
  if (s.includes('tretinoin') || s.includes('retinol') || s.includes('rx')) {
    return 'rx_skincare';
  }
  return 'glp1'; // default for wellness programs
}

/**
 * Get monthly value for a medication.
 */
export function getMedicationValue(medication: string, medicationType: MedicationType): number {
  const direct = MEDICATION_MONTHLY_VALUES[medication];
  if (direct) return direct;

  const defaultKey = `Default ${medicationType === 'glp1' ? 'GLP-1' : medicationType === 'peptide' ? 'Peptide' : medicationType === 'hormone' ? 'Hormone' : 'Rx Skincare'}`;
  return MEDICATION_MONTHLY_VALUES[defaultKey] || 200;
}

/**
 * Calculate revenue at risk if patient churns.
 * Based on average remaining lifetime of 12 months.
 */
export function calculateAtRiskRevenue(monthlyPrice: number, tenureMonths: number): number {
  const avgLifetimeMonths = 18;
  const remainingMonths = Math.max(3, avgLifetimeMonths - tenureMonths);
  return monthlyPrice * remainingMonths;
}

/**
 * Generate Mangomint tag for a patient.
 */
export function generateMangomintTag(status: RefillStatus, medication: string): string {
  const baseTag = TAG_TEMPLATES[status] || 'Refill-Unknown';
  const medTag = medication.replace(/\s+/g, '-');
  return `${baseTag},${medTag}`;
}

// ── Reminder Message Generation ────────────────────────────────────────

/**
 * Generate Day -7 soft reminder.
 */
export function generateDayMinus7(patient: RefillPatient): RefillReminder {
  const message = `hi ${patient.firstName}! just a heads up, your ${patient.medication} refill is coming up next week. everything going well with your program? let us know if you have any questions!`;

  return {
    patientId: patient.id,
    patientName: patient.name,
    type: 'day_minus_7',
    channel: 'sms',
    scheduledDate: addDays(patient.nextRefillDate, -7),
    message,
    priority: 'normal',
    dollarAtRisk: patient.monthlyPrice,
  };
}

/**
 * Generate Day -3 logistics text.
 */
export function generateDayMinus3(patient: RefillPatient): RefillReminder {
  const message = `${patient.firstName}, we're getting your next month of ${patient.medication} ready! please give us a call at ${CLINIC_PHONE} or book online to schedule your refill visit: ${BOOKING_URL}`;

  return {
    patientId: patient.id,
    patientName: patient.name,
    type: 'day_minus_3',
    channel: 'sms',
    scheduledDate: addDays(patient.nextRefillDate, -3),
    message,
    priority: 'normal',
    dollarAtRisk: patient.monthlyPrice,
  };
}

/**
 * Generate Day 0 refill due notification.
 */
export function generateDay0(patient: RefillPatient): RefillReminder {
  const message = `${patient.firstName}, your ${patient.medication} refill is due today! we have availability this week. book your visit: ${BOOKING_URL} or call ${CLINIC_PHONE}`;

  return {
    patientId: patient.id,
    patientName: patient.name,
    type: 'day_0',
    channel: 'sms',
    scheduledDate: patient.nextRefillDate,
    message,
    priority: 'high',
    dollarAtRisk: patient.monthlyPrice,
  };
}

/**
 * Generate Day +3 at-risk check-in.
 */
export function generateDayPlus3(patient: RefillPatient): RefillReminder {
  const message = `hi ${patient.firstName}, this is Rina from Rani. I noticed you haven't refilled your ${patient.medication} yet. everything okay? I want to make sure you're doing well. text me back or call ${CLINIC_PHONE}`;

  return {
    patientId: patient.id,
    patientName: patient.name,
    type: 'day_plus_3',
    channel: 'sms',
    scheduledDate: addDays(patient.nextRefillDate, 3),
    message,
    priority: 'urgent',
    dollarAtRisk: patient.atRiskRevenue,
  };
}

/**
 * Generate Day +7 escalation to Rina.
 * This is an internal notification, not sent to the patient.
 */
export function generateDayPlus7(patient: RefillPatient): RefillReminder {
  const annualAtRisk = patient.monthlyPrice * 12;

  const message = `URGENT: ${patient.name} has not refilled ${patient.medication} (7 days overdue). Monthly value: $${patient.monthlyPrice}. Annual value at risk: $${annualAtRisk}. Tenure: ${patient.tenureMonths} months, ${patient.consecutiveRefills} consecutive refills. Recommended: Personal call from Rina.`;

  const emailSubject = `Refill Alert: ${patient.name} - $${annualAtRisk}/yr at risk`;

  const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #DC2626; padding: 20px; text-align: center;">
    <h1 style="color: #fff; margin: 0; font-size: 22px;">Refill Alert: Revenue at Risk</h1>
  </div>
  <div style="padding: 24px; background-color: #fff;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #0F1D2C;">Patient</td>
        <td style="padding: 8px 0; color: #333;">${patient.name}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #0F1D2C;">Medication</td>
        <td style="padding: 8px 0; color: #333;">${patient.medication}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #0F1D2C;">Monthly Value</td>
        <td style="padding: 8px 0; color: #333; font-weight: 600;">$${patient.monthlyPrice}/mo</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #DC2626;">Annual at Risk</td>
        <td style="padding: 8px 0; color: #DC2626; font-weight: 700; font-size: 18px;">$${annualAtRisk}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #0F1D2C;">Tenure</td>
        <td style="padding: 8px 0; color: #333;">${patient.tenureMonths} months</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #0F1D2C;">Consecutive Refills</td>
        <td style="padding: 8px 0; color: #333;">${patient.consecutiveRefills}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600; color: #0F1D2C;">Days Overdue</td>
        <td style="padding: 8px 0; color: #DC2626; font-weight: 600;">7 days</td>
      </tr>
    </table>
    <div style="margin-top: 20px; padding: 16px; background-color: #FEF2F2; border-radius: 8px;">
      <p style="margin: 0; font-weight: 600; color: #991B1B;">Recommended Action:</p>
      <p style="margin: 8px 0 0; color: #7F1D1D;">Personal phone call from Rina. Check on patient well-being, address any concerns, and schedule refill appointment.</p>
    </div>
    <div style="margin-top: 16px;">
      <p style="color: #666; font-size: 13px;">Phone: ${patient.phone} | Email: ${patient.email}</p>
    </div>
  </div>
  <div style="background-color: #F8F6F1; padding: 12px; text-align: center;">
    <p style="margin: 0; color: #888; font-size: 11px;">Rani Beauty Clinic Revenue Protection System</p>
  </div>
</div>`;

  return {
    patientId: patient.id,
    patientName: patient.name,
    type: 'day_plus_7',
    channel: 'internal',
    scheduledDate: addDays(patient.nextRefillDate, 7),
    message,
    subject: emailSubject,
    htmlBody,
    priority: 'urgent',
    dollarAtRisk: annualAtRisk,
  };
}

/**
 * Generate all applicable reminders for a patient based on their current status.
 */
export function generateReminders(patient: RefillPatient): RefillReminder[] {
  const reminders: RefillReminder[] = [];
  const days = patient.daysUntilRefill;

  // Generate reminders based on where we are in the cycle
  if (days <= 7 && days > 3) {
    reminders.push(generateDayMinus7(patient));
  }
  if (days <= 3 && days > 0) {
    reminders.push(generateDayMinus3(patient));
  }
  if (days === 0) {
    reminders.push(generateDay0(patient));
  }
  if (days < -3 && days >= -7) {
    reminders.push(generateDayPlus3(patient));
  }
  if (days < -7) {
    reminders.push(generateDayPlus7(patient));
  }

  return reminders;
}

// ── Revenue Protection Calculator ────────────────────────────────────────

/**
 * Calculate revenue protection metrics.
 */
export function calculateRevenueProtection(patients: RefillPatient[]): RevenueProtection {
  const onTrack = patients.filter(p =>
    p.status === 'upcoming' || p.status === 'due_soon' || p.status === 'refilled'
  );
  const atRisk = patients.filter(p =>
    p.status === 'overdue' || p.status === 'at_risk'
  );
  const lost = patients.filter(p =>
    p.status === 'escalated' || p.status === 'cancelled'
  );

  const totalProtected = onTrack.reduce((s, p) => s + p.monthlyPrice, 0);
  const totalAtRisk = atRisk.reduce((s, p) => s + p.monthlyPrice, 0);
  const totalLost = lost.reduce((s, p) => s + p.monthlyPrice, 0);

  const totalPatients = patients.length;
  const protectionRate = totalPatients > 0
    ? Math.round((onTrack.length / totalPatients) * 100)
    : 0;

  // Estimate savings from interventions
  // Assume 30% of at-risk patients would have churned without intervention
  const estimatedChurnWithout = Math.round(atRisk.length * 0.3);
  const avgMonthlyValue = patients.length > 0
    ? patients.reduce((s, p) => s + p.monthlyPrice, 0) / patients.length
    : 0;
  const savingsFromChurnPrevention = Math.round(estimatedChurnWithout * avgMonthlyValue * 12);

  return {
    totalProtectedThisMonth: totalProtected,
    totalAtRiskThisMonth: totalAtRisk,
    totalLostThisMonth: totalLost,
    protectionRate,
    interventionsSent: 0, // tracked over time
    interventionsConverted: 0,
    conversionRate: 0,
    projectedMonthlyImpact: totalProtected + (totalAtRisk * 0.5), // assume 50% recovery
    savingsFromChurnPrevention,
    monthlyTrend: [], // populated from historical data
  };
}

// ── Core Engine ────────────────────────────────────────────────────────

interface AppointmentFields {
  'Service Name': string;
  'Service Category': string;
  Date: string;
  Status: string;
  'Amount Paid': number;
  Provider: string;
}

interface ClientFields {
  Client: string;
  Email: string;
  Phone: string;
  Status: string;
}

/**
 * Build refill patient profile from raw data.
 */
export function buildRefillPatient(
  client: { id: string; fields: ClientFields },
  appointments: { fields: AppointmentFields }[],
  now: Date = new Date(),
): RefillPatient | null {
  const name = client.fields.Client || 'Unknown';
  const firstName = name.split(' ')[0] || name;

  // Filter to refill-eligible services
  const refillAppts = appointments.filter(a => {
    const s = (a.fields['Service Name'] || '').toLowerCase();
    return (
      s.includes('glp') || s.includes('semaglutide') || s.includes('tirzepatide') ||
      s.includes('weight') || s.includes('peptide') || s.includes('bpc') ||
      s.includes('hormone') || s.includes('testosterone') || s.includes('tretinoin')
    );
  }).filter(a => a.fields.Status === 'Completed' || a.fields.Status === 'completed');

  if (refillAppts.length === 0) return null;

  // Sort by date (newest first)
  const sorted = refillAppts.sort((a, b) =>
    new Date(b.fields.Date).getTime() - new Date(a.fields.Date).getTime()
  );

  const latestAppt = sorted[0];
  const medication = latestAppt.fields['Service Name'] || 'GLP-1';
  const medicationType = classifyMedication(medication);
  const monthlyPrice = getMedicationValue(medication, medicationType);

  const lastRefillDate = latestAppt.fields.Date;
  const interval = REFILL_INTERVALS[medicationType];
  const daysUntilRefill = calculateDaysUntilRefill(lastRefillDate, interval);
  const status = calculateRefillStatus(daysUntilRefill);

  const nextRefillDate = new Date(lastRefillDate);
  nextRefillDate.setDate(nextRefillDate.getDate() + interval);

  // Calculate tenure
  const firstAppt = sorted[sorted.length - 1];
  const startDate = firstAppt.fields.Date;
  const tenureMonths = Math.max(1, Math.floor(
    (now.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
  ));

  // Calculate total spent on this medication
  const totalSpent = sorted.reduce((s, a) => s + (a.fields['Amount Paid'] || monthlyPrice), 0);

  // Determine tier
  let tier = 'Starter';
  if (medication.toLowerCase().includes('vip') || monthlyPrice >= 550) tier = 'VIP';
  else if (medication.toLowerCase().includes('premium') || monthlyPrice >= 450) tier = 'Premium';

  return {
    id: client.id,
    name,
    firstName,
    email: client.fields.Email || '',
    phone: client.fields.Phone || '',
    medication,
    medicationType,
    tier,
    monthlyPrice,
    lastRefillDate,
    nextRefillDate: nextRefillDate.toISOString().split('T')[0],
    daysUntilRefill,
    status,
    consecutiveRefills: sorted.length, // simplified
    totalRefills: sorted.length,
    totalSpent,
    startDate,
    tenureMonths,
    projectedAnnualValue: monthlyPrice * 12,
    atRiskRevenue: calculateAtRiskRevenue(monthlyPrice, tenureMonths),
    mangomintTag: generateMangomintTag(status, medication),
    remindersSent: [],
  };
}

/**
 * Fetch all refill patients from Airtable.
 */
export async function fetchRefillPatients(): Promise<RefillPatient[]> {
  const [clients, appointments] = await Promise.all([
    fetchAll<ClientFields>(Tables.clients(), {
      filterByFormula: `OR({Status} = 'Active', {Status} = 'Lapsed 30')`,
    }, true),
    fetchAll<AppointmentFields>(Tables.appointments(), {
      filterByFormula: `{Status} = 'Completed'`,
      sort: [{ field: 'Date', direction: 'desc' }],
    }),
  ]);

  const now = new Date();
  const patients: RefillPatient[] = [];

  for (const client of clients) {
    const patient = buildRefillPatient(client, appointments, now);
    if (patient) {
      patients.push(patient);
    }
  }

  // Sort by urgency (most overdue first)
  return patients.sort((a, b) => a.daysUntilRefill - b.daysUntilRefill);
}

/**
 * Build the full refill protector dashboard.
 */
export async function buildRefillDashboard(): Promise<RefillDashboard> {
  const patients = await fetchRefillPatients();

  const activeGLP1 = patients.filter(p => p.medicationType === 'glp1').length;
  const activePeptide = patients.filter(p => p.medicationType === 'peptide').length;
  const activeHormone = patients.filter(p => p.medicationType === 'hormone').length;
  const activeRxSkincare = patients.filter(p => p.medicationType === 'rx_skincare').length;

  const upcomingRefills = patients.filter(p => p.status === 'upcoming').length;
  const dueSoon = patients.filter(p => p.status === 'due_soon').length;
  const dueToday = patients.filter(p => p.status === 'due_today').length;
  const overduePatients = patients.filter(p => p.status === 'overdue');
  const atRiskPatients = patients.filter(p => p.status === 'at_risk');
  const escalatedPatients = patients.filter(p => p.status === 'escalated');

  const monthlyRecurringRevenue = patients.reduce((s, p) => s + p.monthlyPrice, 0);
  const revenueAtRisk = [...overduePatients, ...atRiskPatients, ...escalatedPatients]
    .reduce((s, p) => s + p.monthlyPrice, 0);

  const avgTenure = patients.length > 0
    ? Math.round(patients.reduce((s, p) => s + p.tenureMonths, 0) / patients.length)
    : 0;

  const avgConsecutive = patients.length > 0
    ? Math.round(patients.reduce((s, p) => s + p.consecutiveRefills, 0) / patients.length)
    : 0;

  const onTrack = patients.filter(p =>
    p.status === 'upcoming' || p.status === 'due_soon' || p.status === 'refilled'
  ).length;
  const refillRate = patients.length > 0 ? Math.round((onTrack / patients.length) * 100) : 0;

  // Generate all upcoming reminders
  const allReminders: RefillReminder[] = [];
  for (const patient of patients) {
    const reminders = generateReminders(patient);
    allReminders.push(...reminders);
  }

  // Sort reminders by priority then date
  const priorityOrder = { urgent: 0, high: 1, normal: 2 };
  allReminders.sort((a, b) =>
    priorityOrder[a.priority] - priorityOrder[b.priority] ||
    new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );

  // Mangomint export
  const mangomintExport: MangomintTagExport[] = patients.map(p => ({
    patientName: p.name,
    email: p.email,
    phone: p.phone,
    tag: p.mangomintTag,
    medication: p.medication,
    status: p.status,
    daysUntilRefill: p.daysUntilRefill,
  }));

  const revenueProtection = calculateRevenueProtection(patients);

  return {
    summary: {
      totalRefillPatients: patients.length,
      activeGLP1,
      activePeptide,
      activeHormone,
      activeRxSkincare,
      upcomingRefills,
      dueSoon,
      dueToday,
      overdueCount: overduePatients.length,
      atRiskCount: atRiskPatients.length,
      escalatedCount: escalatedPatients.length,
      monthlyRecurringRevenue,
      revenueAtRisk,
      refillRate,
      avgTenureMonths: avgTenure,
      avgConsecutiveRefills: avgConsecutive,
    },
    patients,
    upcomingReminders: allReminders,
    overduePatients,
    atRiskPatients,
    escalatedPatients,
    revenueProtection,
    mangomintExport,
  };
}

/**
 * Export refill data for Mangomint import.
 */
export function exportMangomintTags(exports: MangomintTagExport[]): string {
  const headers = [
    'Patient Name',
    'Email',
    'Phone',
    'Tags',
    'Medication',
    'Status',
    'Days Until Refill',
  ];

  const rows = exports.map(e => [
    `"${e.patientName}"`,
    `"${e.email}"`,
    `"${e.phone}"`,
    `"${e.tag}"`,
    `"${e.medication}"`,
    e.status,
    e.daysUntilRefill,
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Export refill patients as CSV.
 */
export function exportRefillCSV(patients: RefillPatient[]): string {
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Medication',
    'Type',
    'Tier',
    'Monthly Price',
    'Last Refill',
    'Next Refill',
    'Days Until',
    'Status',
    'Consecutive Refills',
    'Tenure (Months)',
    'Annual Value',
    'At Risk Revenue',
  ];

  const rows = patients.map(p => [
    `"${p.name}"`,
    `"${p.email}"`,
    `"${p.phone}"`,
    `"${p.medication}"`,
    p.medicationType,
    p.tier,
    p.monthlyPrice,
    p.lastRefillDate,
    p.nextRefillDate,
    p.daysUntilRefill,
    p.status,
    p.consecutiveRefills,
    p.tenureMonths,
    p.projectedAnnualValue,
    p.atRiskRevenue,
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

// ── Utilities ────────────────────────────────────────────────────────────

/**
 * Add days to a date string, returning ISO date string.
 */
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Get a friendly status label.
 */
export function getStatusLabel(status: RefillStatus): string {
  const labels: Record<RefillStatus, string> = {
    upcoming: 'On Track',
    due_soon: 'Due Soon',
    due_today: 'Due Today',
    overdue: 'Overdue',
    at_risk: 'At Risk',
    escalated: 'Escalated',
    refilled: 'Refilled',
    cancelled: 'Cancelled',
  };
  return labels[status];
}

/**
 * Get status color for UI display (Tailwind classes).
 */
export function getStatusColor(status: RefillStatus): string {
  const colors: Record<RefillStatus, string> = {
    upcoming: 'text-green-600 bg-green-50',
    due_soon: 'text-amber-600 bg-amber-50',
    due_today: 'text-orange-600 bg-orange-50',
    overdue: 'text-red-500 bg-red-50',
    at_risk: 'text-red-700 bg-red-100',
    escalated: 'text-red-900 bg-red-200',
    refilled: 'text-emerald-600 bg-emerald-50',
    cancelled: 'text-gray-500 bg-gray-100',
  };
  return colors[status];
}
