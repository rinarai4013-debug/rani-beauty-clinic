/**
 * RaniOS Data Portability
 *
 * Full tenant data export (CSV/JSON), scheduled exports,
 * GDPR handling, data deletion, import from other platforms,
 * migration wizard, export history.
 */

import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────

export type ExportFormat = 'csv' | 'json' | 'xlsx';

export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'expired';

export type ExportScope =
  | 'full'
  | 'clients'
  | 'appointments'
  | 'transactions'
  | 'reviews'
  | 'messages'
  | 'inventory'
  | 'kpis'
  | 'memberships'
  | 'packages'
  | 'intakes'
  | 'alerts';

export type ImportSource = 'zenoti' | 'vagaro' | 'boulevard' | 'mindbody' | 'csv' | 'json';

export type ImportStatus = 'pending' | 'mapping' | 'validating' | 'importing' | 'completed' | 'failed';

export type GdprRequestType = 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';

export type GdprRequestStatus = 'received' | 'processing' | 'completed' | 'denied';

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

export interface DataExport {
  id: string;
  tenantId: string;
  requestedBy: string;
  scope: ExportScope[];
  format: ExportFormat;
  status: ExportStatus;
  progress: number; // 0-100
  fileUrl: string | null;
  fileSize: number | null;
  recordCount: number;
  error: string | null;
  requestedAt: number;
  completedAt: number | null;
  expiresAt: number | null;
  metadata: Record<string, unknown>;
}

export interface ScheduledExport {
  id: string;
  tenantId: string;
  scope: ExportScope[];
  format: ExportFormat;
  frequency: ScheduleFrequency;
  dayOfWeek: number | null; // 0-6 for weekly
  dayOfMonth: number | null; // 1-28 for monthly
  hour: number; // 0-23
  timezone: string;
  enabled: boolean;
  lastRunAt: number | null;
  nextRunAt: number;
  destination: 'download' | 'email' | 's3';
  destinationConfig: Record<string, string>;
  createdAt: number;
}

export interface GdprRequest {
  id: string;
  tenantId: string;
  requestType: GdprRequestType;
  subjectEmail: string;
  subjectName: string;
  status: GdprRequestStatus;
  requestedAt: number;
  deadline: number; // 30 days from request
  completedAt: number | null;
  notes: string;
  dataIncluded: ExportScope[];
  exportId: string | null;
  verificationMethod: 'email' | 'id_check' | 'phone';
  verified: boolean;
}

export interface DataImport {
  id: string;
  tenantId: string;
  source: ImportSource;
  status: ImportStatus;
  fileName: string | null;
  fileSize: number | null;
  fieldMapping: FieldMapping[];
  validationErrors: ValidationError[];
  progress: number; // 0-100
  recordsTotal: number;
  recordsImported: number;
  recordsSkipped: number;
  recordsFailed: number;
  startedAt: number;
  completedAt: number | null;
  error: string | null;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  targetTable: string;
  transform: string | null; // e.g. 'date:MM/DD/YYYY', 'phone:E164'
  required: boolean;
  mapped: boolean;
}

export interface ValidationError {
  row: number;
  field: string;
  value: string;
  error: string;
  severity: 'warning' | 'error';
}

export interface MigrationWizardState {
  tenantId: string;
  source: ImportSource;
  step: 'select_source' | 'upload_file' | 'map_fields' | 'validate' | 'review' | 'import' | 'complete';
  importId: string | null;
  mappingSuggestions: FieldMapping[];
  estimatedTime: number; // minutes
  previewData: Record<string, unknown>[];
}

export interface DeletionRequest {
  id: string;
  tenantId: string;
  requestedBy: string;
  scope: 'client' | 'all_data' | 'specific_records';
  targetIds: string[];
  status: 'pending' | 'confirmed' | 'processing' | 'completed';
  confirmationCode: string;
  confirmedAt: number | null;
  completedAt: number | null;
  recordsDeleted: number;
  createdAt: number;
}

// ─── Schemas ──────────────────────────────────────────────────────

export const CreateExportSchema = z.object({
  tenantId: z.string().min(1),
  requestedBy: z.string().min(1),
  scope: z.array(z.enum([
    'full', 'clients', 'appointments', 'transactions', 'reviews',
    'messages', 'inventory', 'kpis', 'memberships', 'packages', 'intakes', 'alerts',
  ])).min(1),
  format: z.enum(['csv', 'json', 'xlsx']),
});

export const CreateScheduledExportSchema = z.object({
  tenantId: z.string().min(1),
  scope: z.array(z.enum([
    'full', 'clients', 'appointments', 'transactions', 'reviews',
    'messages', 'inventory', 'kpis', 'memberships', 'packages', 'intakes', 'alerts',
  ])).min(1),
  format: z.enum(['csv', 'json', 'xlsx']),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  dayOfWeek: z.number().min(0).max(6).nullable().optional(),
  dayOfMonth: z.number().min(1).max(28).nullable().optional(),
  hour: z.number().min(0).max(23),
  timezone: z.string(),
  destination: z.enum(['download', 'email', 's3']),
  destinationConfig: z.record(z.string()).optional().default({}),
});

export const CreateGdprRequestSchema = z.object({
  tenantId: z.string().min(1),
  requestType: z.enum(['access', 'rectification', 'erasure', 'portability', 'restriction']),
  subjectEmail: z.string().email(),
  subjectName: z.string().min(1),
  verificationMethod: z.enum(['email', 'id_check', 'phone']),
});

export const ImportDataSchema = z.object({
  tenantId: z.string().min(1),
  source: z.enum(['zenoti', 'vagaro', 'boulevard', 'mindbody', 'csv', 'json']),
  fileName: z.string().optional(),
});

// ─── Constants ────────────────────────────────────────────────────

export const IMPORT_FIELD_MAPS: Record<ImportSource, FieldMapping[]> = {
  zenoti: [
    { sourceField: 'guest_id', targetField: 'Client ID', targetTable: 'Clients', transform: null, required: true, mapped: true },
    { sourceField: 'first_name', targetField: 'First Name', targetTable: 'Clients', transform: null, required: true, mapped: true },
    { sourceField: 'last_name', targetField: 'Last Name', targetTable: 'Clients', transform: null, required: true, mapped: true },
    { sourceField: 'email', targetField: 'Email', targetTable: 'Clients', transform: null, required: true, mapped: true },
    { sourceField: 'mobile_phone', targetField: 'Phone', targetTable: 'Clients', transform: 'phone:E164', required: false, mapped: true },
    { sourceField: 'appointment_date', targetField: 'Date', targetTable: 'Appointments', transform: 'date:YYYY-MM-DD', required: true, mapped: true },
    { sourceField: 'service_name', targetField: 'Service', targetTable: 'Appointments', transform: null, required: true, mapped: true },
    { sourceField: 'therapist_name', targetField: 'Provider', targetTable: 'Appointments', transform: null, required: false, mapped: true },
    { sourceField: 'invoice_total', targetField: 'Amount', targetTable: 'Transactions', transform: 'currency:USD', required: true, mapped: true },
    { sourceField: 'payment_method', targetField: 'Payment Method', targetTable: 'Transactions', transform: null, required: false, mapped: true },
  ],
  vagaro: [
    { sourceField: 'Customer First Name', targetField: 'First Name', targetTable: 'Clients', transform: null, required: true, mapped: true },
    { sourceField: 'Customer Last Name', targetField: 'Last Name', targetTable: 'Clients', transform: null, required: true, mapped: true },
    { sourceField: 'Customer Email', targetField: 'Email', targetTable: 'Clients', transform: null, required: true, mapped: true },
    { sourceField: 'Customer Phone', targetField: 'Phone', targetTable: 'Clients', transform: 'phone:E164', required: false, mapped: true },
    { sourceField: 'Appointment Date', targetField: 'Date', targetTable: 'Appointments', transform: 'date:MM/DD/YYYY', required: true, mapped: true },
    { sourceField: 'Service', targetField: 'Service', targetTable: 'Appointments', transform: null, required: true, mapped: true },
    { sourceField: 'Staff', targetField: 'Provider', targetTable: 'Appointments', transform: null, required: false, mapped: true },
    { sourceField: 'Total', targetField: 'Amount', targetTable: 'Transactions', transform: 'currency:USD', required: true, mapped: true },
  ],
  boulevard: [
    { sourceField: 'client.firstName', targetField: 'First Name', targetTable: 'Clients', transform: null, required: true, mapped: true },
    { sourceField: 'client.lastName', targetField: 'Last Name', targetTable: 'Clients', transform: null, required: true, mapped: true },
    { sourceField: 'client.email', targetField: 'Email', targetTable: 'Clients', transform: null, required: true, mapped: true },
    { sourceField: 'client.mobilePhone', targetField: 'Phone', targetTable: 'Clients', transform: 'phone:E164', required: false, mapped: true },
    { sourceField: 'appointment.startAt', targetField: 'Date', targetTable: 'Appointments', transform: 'date:ISO', required: true, mapped: true },
    { sourceField: 'appointment.service.name', targetField: 'Service', targetTable: 'Appointments', transform: null, required: true, mapped: true },
    { sourceField: 'appointment.staff.name', targetField: 'Provider', targetTable: 'Appointments', transform: null, required: false, mapped: true },
    { sourceField: 'order.total', targetField: 'Amount', targetTable: 'Transactions', transform: 'currency:USD', required: true, mapped: true },
  ],
  mindbody: [
    { sourceField: 'Client.FirstName', targetField: 'First Name', targetTable: 'Clients', transform: null, required: true, mapped: true },
    { sourceField: 'Client.LastName', targetField: 'Last Name', targetTable: 'Clients', transform: null, required: true, mapped: true },
    { sourceField: 'Client.Email', targetField: 'Email', targetTable: 'Clients', transform: null, required: true, mapped: true },
    { sourceField: 'Client.MobilePhone', targetField: 'Phone', targetTable: 'Clients', transform: 'phone:E164', required: false, mapped: true },
    { sourceField: 'Appointment.StartDateTime', targetField: 'Date', targetTable: 'Appointments', transform: 'date:ISO', required: true, mapped: true },
    { sourceField: 'Appointment.SessionType.Name', targetField: 'Service', targetTable: 'Appointments', transform: null, required: true, mapped: true },
    { sourceField: 'Appointment.Staff.Name', targetField: 'Provider', targetTable: 'Appointments', transform: null, required: false, mapped: true },
    { sourceField: 'Sale.Total', targetField: 'Amount', targetTable: 'Transactions', transform: 'currency:USD', required: true, mapped: true },
  ],
  csv: [],
  json: [],
};

const EXPORT_TABLE_COLUMNS: Record<ExportScope, string[]> = {
  full: [],
  clients: ['Client ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Status', 'LTV', 'Segment', 'Created At', 'Last Visit'],
  appointments: ['Appointment ID', 'Client', 'Service', 'Provider', 'Date', 'Time', 'Duration', 'Status', 'Notes'],
  transactions: ['Transaction ID', 'Client', 'Service', 'Amount', 'Payment Method', 'Date', 'Status', 'Provider'],
  reviews: ['Review ID', 'Client', 'Rating', 'Text', 'Source', 'Date', 'Response', 'Response Date'],
  messages: ['Message ID', 'Client', 'Channel', 'Direction', 'Content', 'Status', 'Sent At'],
  inventory: ['Product ID', 'Name', 'Category', 'Quantity', 'Par Level', 'Cost', 'Expiry Date', 'Supplier'],
  kpis: ['Date', 'Revenue', 'Bookings', 'New Clients', 'Retention Rate', 'Avg Ticket', 'Utilization'],
  memberships: ['Membership ID', 'Client', 'Plan', 'Status', 'Start Date', 'Renewal Date', 'Monthly Amount'],
  packages: ['Package ID', 'Client', 'Name', 'Sessions Total', 'Sessions Used', 'Purchase Date', 'Expiry Date', 'Amount'],
  intakes: ['Intake ID', 'Client', 'Date', 'Concerns', 'Medical History', 'AI Summary', 'Status'],
  alerts: ['Alert ID', 'Type', 'Severity', 'Message', 'Status', 'Created At', 'Resolved At'],
};

// ─── In-Memory Stores ─────────────────────────────────────────────

const exports = new Map<string, DataExport>();
const scheduledExports = new Map<string, ScheduledExport>();
const gdprRequests = new Map<string, GdprRequest>();
const imports = new Map<string, DataImport>();
const deletionRequests = new Map<string, DeletionRequest>();

// ─── Export Functions ─────────────────────────────────────────────

export function createExport(input: z.infer<typeof CreateExportSchema>): DataExport {
  const exp: DataExport = {
    id: `exp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    tenantId: input.tenantId,
    requestedBy: input.requestedBy,
    scope: input.scope,
    format: input.format,
    status: 'pending',
    progress: 0,
    fileUrl: null,
    fileSize: null,
    recordCount: 0,
    error: null,
    requestedAt: Date.now(),
    completedAt: null,
    expiresAt: null,
    metadata: {},
  };

  exports.set(exp.id, exp);
  processExport(exp.id);

  return exp;
}

function processExport(exportId: string): void {
  const exp = exports.get(exportId);
  if (!exp) return;

  exp.status = 'processing';
  exp.progress = 10;

  // Simulate processing
  const tables = exp.scope.includes('full')
    ? Object.keys(EXPORT_TABLE_COLUMNS).filter(k => k !== 'full') as ExportScope[]
    : exp.scope;

  let totalRecords = 0;
  tables.forEach(table => {
    // Simulate record counts
    const mockCounts: Record<string, number> = {
      clients: 250, appointments: 1500, transactions: 3200, reviews: 85,
      messages: 5600, inventory: 120, kpis: 365, memberships: 45,
      packages: 80, intakes: 210, alerts: 340,
    };
    totalRecords += mockCounts[table] || 100;
  });

  exp.recordCount = totalRecords;
  exp.progress = 100;
  exp.status = 'completed';
  exp.completedAt = Date.now();
  exp.fileUrl = `/api/saas/exports/${exp.id}/download`;
  exp.fileSize = totalRecords * 256; // rough estimate
  exp.expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
}

export function getExport(exportId: string): DataExport | null {
  return exports.get(exportId) || null;
}

export function getExportHistory(
  tenantId: string,
  limit: number = 20,
): DataExport[] {
  return Array.from(exports.values())
    .filter(e => e.tenantId === tenantId)
    .sort((a, b) => b.requestedAt - a.requestedAt)
    .slice(0, limit);
}

export function generateExportData(
  scope: ExportScope,
  format: ExportFormat,
): { columns: string[]; data: Record<string, unknown>[]; format: ExportFormat } {
  const columns = EXPORT_TABLE_COLUMNS[scope] || [];
  // Return structure only (actual data would come from Airtable)
  return { columns, data: [], format };
}

// ─── Scheduled Exports ────────────────────────────────────────────

export function createScheduledExport(
  input: z.infer<typeof CreateScheduledExportSchema>,
): ScheduledExport {
  const scheduled: ScheduledExport = {
    id: `sched_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    tenantId: input.tenantId,
    scope: input.scope,
    format: input.format,
    frequency: input.frequency,
    dayOfWeek: input.dayOfWeek ?? null,
    dayOfMonth: input.dayOfMonth ?? null,
    hour: input.hour,
    timezone: input.timezone,
    enabled: true,
    lastRunAt: null,
    nextRunAt: calculateNextRun(input.frequency, input.hour, input.dayOfWeek ?? null, input.dayOfMonth ?? null),
    destination: input.destination,
    destinationConfig: input.destinationConfig || {},
    createdAt: Date.now(),
  };

  scheduledExports.set(scheduled.id, scheduled);
  return scheduled;
}

export function getScheduledExports(tenantId: string): ScheduledExport[] {
  return Array.from(scheduledExports.values())
    .filter(s => s.tenantId === tenantId)
    .sort((a, b) => a.nextRunAt - b.nextRunAt);
}

export function toggleScheduledExport(id: string, enabled: boolean): boolean {
  const sched = scheduledExports.get(id);
  if (!sched) return false;
  sched.enabled = enabled;
  return true;
}

export function deleteScheduledExport(id: string): boolean {
  return scheduledExports.delete(id);
}

function calculateNextRun(
  frequency: ScheduleFrequency,
  hour: number,
  dayOfWeek: number | null,
  dayOfMonth: number | null,
): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);

  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }

  switch (frequency) {
    case 'daily':
      break;
    case 'weekly':
      if (dayOfWeek !== null) {
        while (next.getDay() !== dayOfWeek) {
          next.setDate(next.getDate() + 1);
        }
      }
      break;
    case 'monthly':
      if (dayOfMonth !== null) {
        next.setDate(dayOfMonth);
        if (next.getTime() <= now.getTime()) {
          next.setMonth(next.getMonth() + 1);
        }
      }
      break;
  }

  return next.getTime();
}

// ─── GDPR Handling ────────────────────────────────────────────────

export function createGdprRequest(
  input: z.infer<typeof CreateGdprRequestSchema>,
): GdprRequest {
  const request: GdprRequest = {
    id: `gdpr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    tenantId: input.tenantId,
    requestType: input.requestType,
    subjectEmail: input.subjectEmail,
    subjectName: input.subjectName,
    status: 'received',
    requestedAt: Date.now(),
    deadline: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    completedAt: null,
    notes: '',
    dataIncluded: ['clients', 'appointments', 'transactions', 'messages', 'intakes'],
    exportId: null,
    verificationMethod: input.verificationMethod,
    verified: false,
  };

  gdprRequests.set(request.id, request);
  return request;
}

export function verifyGdprRequest(requestId: string): boolean {
  const request = gdprRequests.get(requestId);
  if (!request) return false;
  request.verified = true;
  return true;
}

export function processGdprRequest(requestId: string): GdprRequest | null {
  const request = gdprRequests.get(requestId);
  if (!request || !request.verified) return null;

  request.status = 'processing';

  switch (request.requestType) {
    case 'access':
    case 'portability': {
      const exp = createExport({
        tenantId: request.tenantId,
        requestedBy: `gdpr:${request.subjectEmail}`,
        scope: request.dataIncluded,
        format: 'json',
      });
      request.exportId = exp.id;
      break;
    }
    case 'erasure': {
      // Create deletion request
      createDeletionRequest(request.tenantId, `gdpr:${request.subjectEmail}`, 'client', [request.subjectEmail]);
      break;
    }
    case 'rectification':
    case 'restriction':
      // These require manual handling
      break;
  }

  request.status = 'completed';
  request.completedAt = Date.now();
  return request;
}

export function getGdprRequests(
  tenantId: string,
  status?: GdprRequestStatus,
): GdprRequest[] {
  let result = Array.from(gdprRequests.values())
    .filter(r => r.tenantId === tenantId);
  if (status) result = result.filter(r => r.status === status);
  return result.sort((a, b) => b.requestedAt - a.requestedAt);
}

// ─── Data Deletion ────────────────────────────────────────────────

export function createDeletionRequest(
  tenantId: string,
  requestedBy: string,
  scope: DeletionRequest['scope'],
  targetIds: string[],
): DeletionRequest {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const request: DeletionRequest = {
    id: `del_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    tenantId,
    requestedBy,
    scope,
    targetIds,
    status: 'pending',
    confirmationCode: code,
    confirmedAt: null,
    completedAt: null,
    recordsDeleted: 0,
    createdAt: Date.now(),
  };

  deletionRequests.set(request.id, request);
  return request;
}

export function confirmDeletion(requestId: string, code: string): boolean {
  const request = deletionRequests.get(requestId);
  if (!request || request.confirmationCode !== code) return false;

  request.status = 'confirmed';
  request.confirmedAt = Date.now();
  processDeletion(requestId);
  return true;
}

function processDeletion(requestId: string): void {
  const request = deletionRequests.get(requestId);
  if (!request || request.status !== 'confirmed') return;

  request.status = 'processing';

  // Simulate deletion
  request.recordsDeleted = request.targetIds.length * 15; // rough estimate
  request.status = 'completed';
  request.completedAt = Date.now();
}

export function getDeletionRequests(tenantId: string): DeletionRequest[] {
  return Array.from(deletionRequests.values())
    .filter(r => r.tenantId === tenantId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ─── Import Functions ─────────────────────────────────────────────

export function createImport(input: z.infer<typeof ImportDataSchema>): DataImport {
  const imp: DataImport = {
    id: `imp_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
    tenantId: input.tenantId,
    source: input.source,
    status: 'pending',
    fileName: input.fileName || null,
    fileSize: null,
    fieldMapping: IMPORT_FIELD_MAPS[input.source] || [],
    validationErrors: [],
    progress: 0,
    recordsTotal: 0,
    recordsImported: 0,
    recordsSkipped: 0,
    recordsFailed: 0,
    startedAt: Date.now(),
    completedAt: null,
    error: null,
  };

  imports.set(imp.id, imp);
  return imp;
}

export function updateImportMapping(
  importId: string,
  mappings: FieldMapping[],
): boolean {
  const imp = imports.get(importId);
  if (!imp) return false;
  imp.fieldMapping = mappings;
  imp.status = 'mapping';
  return true;
}

export function validateImport(importId: string): ValidationError[] {
  const imp = imports.get(importId);
  if (!imp) return [];

  imp.status = 'validating';
  const errors: ValidationError[] = [];

  // Check required mappings
  imp.fieldMapping.forEach(m => {
    if (m.required && !m.mapped) {
      errors.push({
        row: 0,
        field: m.sourceField,
        value: '',
        error: `Required field "${m.sourceField}" is not mapped`,
        severity: 'error',
      });
    }
  });

  imp.validationErrors = errors;
  return errors;
}

export function executeImport(importId: string): DataImport | null {
  const imp = imports.get(importId);
  if (!imp) return null;

  const errors = imp.validationErrors.filter(e => e.severity === 'error');
  if (errors.length > 0) {
    imp.status = 'failed';
    imp.error = `${errors.length} validation errors prevent import`;
    return imp;
  }

  imp.status = 'importing';
  imp.progress = 50;

  // Simulate import
  imp.recordsTotal = 500;
  imp.recordsImported = 485;
  imp.recordsSkipped = 10;
  imp.recordsFailed = 5;
  imp.progress = 100;
  imp.status = 'completed';
  imp.completedAt = Date.now();

  return imp;
}

export function getImport(importId: string): DataImport | null {
  return imports.get(importId) || null;
}

export function getImportHistory(tenantId: string): DataImport[] {
  return Array.from(imports.values())
    .filter(i => i.tenantId === tenantId)
    .sort((a, b) => b.startedAt - a.startedAt);
}

// ─── Migration Wizard ─────────────────────────────────────────────

export function initializeMigrationWizard(
  tenantId: string,
  source: ImportSource,
): MigrationWizardState {
  const imp = createImport({ tenantId, source });

  return {
    tenantId,
    source,
    step: 'select_source',
    importId: imp.id,
    mappingSuggestions: IMPORT_FIELD_MAPS[source] || [],
    estimatedTime: source === 'csv' || source === 'json' ? 5 : 15,
    previewData: [],
  };
}

export function advanceMigrationStep(
  state: MigrationWizardState,
  step: MigrationWizardState['step'],
): MigrationWizardState {
  return { ...state, step };
}

// ─── Export Column Info ───────────────────────────────────────────

export function getExportColumns(scope: ExportScope): string[] {
  return EXPORT_TABLE_COLUMNS[scope] || [];
}

export function getAllExportScopes(): { scope: ExportScope; columns: string[] }[] {
  return Object.entries(EXPORT_TABLE_COLUMNS)
    .filter(([scope]) => scope !== 'full')
    .map(([scope, columns]) => ({ scope: scope as ExportScope, columns }));
}

// ─── Reset (for testing) ──────────────────────────────────────────

export function resetDataExport(): void {
  exports.clear();
  scheduledExports.clear();
  gdprRequests.clear();
  imports.clear();
  deletionRequests.clear();
}
