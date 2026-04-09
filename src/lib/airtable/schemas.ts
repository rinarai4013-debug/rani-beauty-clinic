// Zod validation schemas for all 12 Airtable tables
// Validates records before writes and after reads for data integrity

import { z } from 'zod';

// ─── Reusable field schemas ───────────────────────────────────────────────────

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Expected YYYY-MM-DD date format').optional();
const positiveNumber = z.number().nonnegative().optional();
const percentage = z.number().min(0).max(100).optional();
const airtableLinkedRecords = z.array(z.string()).optional();

// ─── Table schemas ────────────────────────────────────────────────────────────

export const ClientSchema = z.object({
  'Client': z.string().min(1, 'Client name is required'),
  'Email': z.string().email('Invalid email').optional(),
  'Phone': z.string().optional(),
  'Preferred Contact': z.enum(['Email', 'Phone', 'Text']).optional(),
  'Status': z.enum(['New Lead', 'Active', 'Lapsed 30', 'Lapsed 60', 'Lapsed 90', 'Churned']).optional(),
  'Lead Source': z.string().optional(),
  'Lead Medium': z.string().optional(),
  'Lead Campaign': z.string().optional(),
  'Lead Ad Set': z.string().optional(),
  'Lead Ad': z.string().optional(),
  'Lead Offer': z.string().optional(),
  'Lead Landing Page': z.string().optional(),
  'Lead Keyword': z.string().optional(),
  'Lead Referrer': z.string().optional(),
  'First Touch At': z.string().optional(),
  'Last Touch At': z.string().optional(),
  'Attribution ID': z.string().optional(),
  'UTM Source': z.string().optional(),
  'UTM Medium': z.string().optional(),
  'UTM Campaign': z.string().optional(),
  'UTM Content': z.string().optional(),
  'UTM Term': z.string().optional(),
  'First Booking Source': z.string().optional(),
  'First Booking Offer': z.string().optional(),
  'Attributed Revenue': positiveNumber,
  'Attribution Model': z.string().optional(),
  'Client Intakes': airtableLinkedRecords,
  'Intake Intelligence': airtableLinkedRecords,
  'Appointments': airtableLinkedRecords,
  'Packages': airtableLinkedRecords,
  'Memberships': airtableLinkedRecords,
  'Transactions': airtableLinkedRecords,
  'Messages Log': airtableLinkedRecords,
  'Reviews': airtableLinkedRecords,
}).passthrough();

export const ClientIntakeSchema = z.object({
  'Full Name': z.string().min(1).optional(),
  'Email': z.string().email().optional(),
  'Phone Number': z.string().optional(),
  'Intake Summary (AI)': z.string().optional(),
  'Program Plan (AI)': z.string().optional(),
  'Cost Breakdown (AI)': z.string().optional(),
  'Timeline (AI)': z.string().optional(),
  'Suggested Next Step (AI)': z.string().optional(),
  'Treatment Value (AI)': z.string().optional(),
  'Processing Status': z.enum(['New', 'Processed', 'Responded']).optional(),
}).passthrough();

export const AppointmentSchema = z.object({
  'Service Name': z.string().optional(),
  'Service Category': z.enum(['Consult', 'Laser', 'Injectable', 'Facial', 'Body', 'Wellness', 'Follow-Up']).optional(),
  'Provider': z.enum(['Rina', 'Mom']).optional(),
  'Date': dateString,
  'Time': z.string().optional(),
  'Duration': positiveNumber,
  'Status': z.string().optional(),
  'Is Consult': z.boolean().optional(),
  'Consult Type': z.string().optional(),
  'Consult Outcome': z.string().optional(),
  'Deposit Amount': positiveNumber,
  'Deposit Paid': z.boolean().optional(),
  'Amount Quoted': positiveNumber,
  'Amount Paid': positiveNumber,
  'Booking Source': z.string().optional(),
  'Review Requested': z.boolean().optional(),
  'Review Received': z.boolean().optional(),
}).passthrough();

export const PackageSchema = z.object({
  'Package Name': z.string().optional(),
  'Package Tier': z.string().optional(),
  'Package Type': z.string().optional(),
  'Total Value': positiveNumber,
  'Sessions Total': z.number().int().nonnegative().optional(),
  'Sessions Completed': z.number().int().nonnegative().optional(),
  'Sessions Remaining': z.number().int().nonnegative().optional(),
  'Status': z.string().optional(),
}).passthrough();

export const MembershipSchema = z.object({
  'Tier': z.string().optional(),
  'Monthly Price': positiveNumber,
  'Status': z.string().optional(),
  'Start Date': dateString,
  'Churn Risk Score': percentage,
}).passthrough();

export const TransactionSchema = z.object({
  'Date': dateString,
  'Type': z.string().optional(),
  'Amount': z.number().optional(),
  'Payment Method': z.enum(['Credit Card', 'Debit Card', 'Cash', 'Afterpay', 'Cherry', 'PatientFi', 'ACH']).optional(),
  'Provider': z.enum(['Rina', 'Mom']).optional(),
  'Service Name': z.string().optional(),
  'Status': z.string().optional(),
  'Is Financing': z.boolean().optional(),
  'Financing Provider': z.string().optional(),
}).passthrough();

export const MessagesLogSchema = z.object({
  'Type': z.string().optional(),
  'Direction': z.string().optional(),
  'Status': z.string().optional(),
  'Message': z.string().optional(),
  'Date': dateString,
}).passthrough();

export const ReviewSchema = z.object({
  'Platform': z.string().optional(),
  'Star Rating': z.number().min(1).max(5).optional(),
  'Review Text': z.string().optional(),
  'Reviewer Name': z.string().optional(),
  'Review Date': dateString,
  'Sentiment': z.enum(['Positive', 'Neutral', 'Negative']).optional(),
  'Response Status': z.string().optional(),
  'AI Draft Response': z.string().optional(),
}).passthrough();

export const KPISnapshotSchema = z.object({
  'Date': dateString,
  'Period': z.string().optional(),
  'Revenue': positiveNumber,
  'Revenue MTD': positiveNumber,
  'Total Bookings': z.number().int().nonnegative().optional(),
  'Total Shows': z.number().int().nonnegative().optional(),
  'Total No-Shows': z.number().int().nonnegative().optional(),
  'Show Rate': percentage,
  'New Leads': z.number().int().nonnegative().optional(),
  'Consultations Completed': z.number().int().nonnegative().optional(),
  'Packages Sold': z.number().int().nonnegative().optional(),
  'Close Rate': percentage,
  'Average Ticket': positiveNumber,
  'Active Members Count': z.number().int().nonnegative().optional(),
  'New Members': z.number().int().nonnegative().optional(),
  'Churned Members': z.number().int().nonnegative().optional(),
  'Membership MRR': positiveNumber,
  'Review Requests Sent': z.number().int().nonnegative().optional(),
  'Reviews Received': z.number().int().nonnegative().optional(),
  'Average Rating': z.number().min(0).max(5).optional(),
  'Revenue by Provider JSON': z.string().optional(),
}).passthrough();

export const AlertSchema = z.object({
  'Type': z.string().optional(),
  'Severity': z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  'Metric Name': z.string().optional(),
  'Metric Value': z.number().optional(),
  'Threshold Value': z.number().optional(),
  'Message': z.string().optional(),
  'Action Recommended': z.string().optional(),
  'Status': z.string().optional(),
  'Created Date': dateString,
  'Notes': z.string().optional(),
}).passthrough();

export const CompetitorIntelligenceSchema = z.object({
  'Competitor Name': z.string().optional(),
  'Service': z.string().optional(),
  'Price': positiveNumber,
  'Source': z.string().optional(),
  'Date Collected': dateString,
  'Notes': z.string().optional(),
}).passthrough();

export const IntakeIntelligenceSchema = z.object({
  'Client Name': z.string().optional(),
  'Risk Flags': z.string().optional(),
  'Consult Script': z.string().optional(),
  'Recommended Services': z.string().optional(),
  'Estimated Value': positiveNumber,
  'Processing Date': dateString,
}).passthrough();

// ─── Schema registry ──────────────────────────────────────────────────────────

const SCHEMA_MAP: Record<string, z.ZodType> = {
  'Clients': ClientSchema,
  'Client Intakes': ClientIntakeSchema,
  'Appointments': AppointmentSchema,
  'Packages': PackageSchema,
  'Memberships': MembershipSchema,
  'Transactions': TransactionSchema,
  'Messages Log': MessagesLogSchema,
  'Reviews': ReviewSchema,
  'KPI Snapshots': KPISnapshotSchema,
  'Alerts': AlertSchema,
  'Competitor Intelligence': CompetitorIntelligenceSchema,
  'Intake Intelligence': IntakeIntelligenceSchema,
};

export type TableName = keyof typeof SCHEMA_MAP;

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: Array<{ path: string; message: string }>;
}

/**
 * Validate a record against the schema for a given table.
 * Returns { success, data, errors }.
 */
export function validateRecord<T = unknown>(
  table: string,
  data: unknown
): ValidationResult<T> {
  const schema = SCHEMA_MAP[table];
  if (!schema) {
    return {
      success: false,
      errors: [{ path: '', message: `No schema defined for table "${table}"` }],
    };
  }

  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as T };
  }

  const errors = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));

  console.warn(
    `[Airtable:Schema] Validation failed for "${table}":`,
    errors
  );

  return { success: false, errors };
}

/**
 * Get the schema for a table (for external use / testing).
 */
export function getSchema(table: string): z.ZodType | undefined {
  return SCHEMA_MAP[table];
}

export { SCHEMA_MAP };
