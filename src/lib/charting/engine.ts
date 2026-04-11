// Charting Engine - Rani Beauty Clinic
// Validation, compliance checking, and Airtable storage for clinical charts
// COMPLIANCE: Every treatment must be charted before checkout. No exceptions.

import { Tables, rateLimitedQuery, fetchAll, createRecord, updateRecord } from '@/lib/airtable/client';
import { sanitizeFormulaValue } from '@/lib/airtable/sanitize';
import {
  type ChartTemplateType,
  type ChartTemplate,
  type ChartField,
  CHART_TEMPLATES,
  getTemplate,
} from './templates';

// ─── Types ───

export interface ChartNote {
  id?: string; // Airtable record ID
  chartId: string; // Unique chart identifier (UUID)
  templateType: ChartTemplateType;
  clientName: string;
  clientId?: string; // Mangomint client ID
  providerId?: string;
  providerName: string;
  appointmentId?: string; // Mangomint appointment ID
  appointmentDate: string; // ISO date
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  status: ChartStatus;
  data: Record<string, unknown>; // Field values keyed by field ID
  complianceStatus: ComplianceStatus;
  requiresMdReview: boolean;
  mdReviewDate?: string;
  mdReviewNotes?: string;
}

export type ChartStatus = 'draft' | 'complete' | 'signed' | 'reviewed' | 'amended';
export type ComplianceStatus = 'incomplete' | 'complete' | 'blocked' | 'override';

export interface ValidationError {
  fieldId: string;
  fieldLabel: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ComplianceCheck {
  isCompliant: boolean;
  blocksCheckout: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  completionPercentage: number;
  missingRequired: string[];
}

export interface ChartListFilter {
  clientName?: string;
  providerName?: string;
  templateType?: ChartTemplateType;
  status?: ChartStatus;
  dateFrom?: string;
  dateTo?: string;
  appointmentId?: string;
  limit?: number;
}

// ─── Airtable Schema for ChartNotes ───
// Table: "Chart Notes" (must be created in Airtable)
// Fields:
//   Chart ID - Single line text (unique)
//   Template Type - Single select (injection_log, soap_note, consultation, program_note, body_treatment, lab_draw)
//   Client Name - Single line text
//   Client ID - Single line text (Mangomint ID)
//   Provider Name - Single line text
//   Provider ID - Single line text
//   Appointment ID - Single line text (Mangomint)
//   Appointment Date - Date
//   Status - Single select (draft, complete, signed, reviewed, amended)
//   Compliance Status - Single select (incomplete, complete, blocked, override)
//   Requires MD Review - Checkbox
//   MD Review Date - Date
//   MD Review Notes - Long text
//   Chart Data JSON - Long text (JSON stringified field data)
//   Created At - Date time
//   Updated At - Date time

const CHART_TABLE_NAME = 'Chart Notes';

function getChartTable() {
  return Tables.chartNotes();
}

// ─── Validation Engine ───

export function validateChart(
  templateType: ChartTemplateType,
  data: Record<string, unknown>
): ComplianceCheck {
  const template = getTemplate(templateType);
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const missingRequired: string[] = [];

  let totalRequired = 0;
  let completedRequired = 0;

  for (const field of template.fields) {
    // Check if field is conditionally hidden
    if (field.conditionalOn) {
      const parentValue = data[field.conditionalOn.field];
      const expectedValues = Array.isArray(field.conditionalOn.value)
        ? field.conditionalOn.value
        : [field.conditionalOn.value];

      // If the parent condition is not met, skip this field
      if (!expectedValues.includes(String(parentValue))) {
        continue;
      }
    }

    if (field.required) {
      totalRequired++;
      const value = data[field.id];

      if (isFieldEmpty(value, field)) {
        errors.push({
          fieldId: field.id,
          fieldLabel: field.label,
          message: `${field.label} is required`,
          severity: 'error',
        });
        missingRequired.push(field.label);
      } else {
        completedRequired++;

        // Type-specific validation
        const typeError = validateFieldType(field, value);
        if (typeError) {
          errors.push(typeError);
        }
      }
    } else {
      // Validate non-required fields that have values
      const value = data[field.id];
      if (!isFieldEmpty(value, field)) {
        const typeError = validateFieldType(field, value);
        if (typeError) {
          warnings.push(typeError);
        }
      }
    }
  }

  // Business-rule validations
  const businessWarnings = validateBusinessRules(templateType, data);
  warnings.push(...businessWarnings);

  const completionPercentage =
    totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 100;

  return {
    isCompliant: errors.length === 0,
    blocksCheckout: template.blocksCheckout && errors.length > 0,
    errors,
    warnings,
    completionPercentage,
    missingRequired,
  };
}

function isFieldEmpty(value: unknown, field: ChartField): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (field.type === 'checkbox' && value !== true) return true;
  if (field.type === 'multiselect' && Array.isArray(value) && value.length === 0) return true;
  return false;
}

function validateFieldType(field: ChartField, value: unknown): ValidationError | null {
  switch (field.type) {
    case 'number': {
      const num = Number(value);
      if (isNaN(num)) {
        return {
          fieldId: field.id,
          fieldLabel: field.label,
          message: `${field.label} must be a number`,
          severity: 'error',
        };
      }
      if (field.min !== undefined && num < field.min) {
        return {
          fieldId: field.id,
          fieldLabel: field.label,
          message: `${field.label} must be at least ${field.min}`,
          severity: 'error',
        };
      }
      if (field.max !== undefined && num > field.max) {
        return {
          fieldId: field.id,
          fieldLabel: field.label,
          message: `${field.label} must be at most ${field.max}`,
          severity: 'error',
        };
      }
      break;
    }
    case 'date': {
      const dateStr = String(value);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return {
          fieldId: field.id,
          fieldLabel: field.label,
          message: `${field.label} must be a valid date (YYYY-MM-DD)`,
          severity: 'error',
        };
      }
      break;
    }
    case 'select': {
      if (field.options) {
        const validValues = field.options.map((o) => o.value);
        if (!validValues.includes(String(value))) {
          return {
            fieldId: field.id,
            fieldLabel: field.label,
            message: `${field.label} has an invalid selection`,
            severity: 'error',
          };
        }
      }
      break;
    }
    case 'multiselect': {
      if (field.options && Array.isArray(value)) {
        const validValues = field.options.map((o) => o.value);
        const invalid = (value as string[]).filter((v) => !validValues.includes(v));
        if (invalid.length > 0) {
          return {
            fieldId: field.id,
            fieldLabel: field.label,
            message: `${field.label} has invalid selections: ${invalid.join(', ')}`,
            severity: 'error',
          };
        }
      }
      break;
    }
  }
  return null;
}

// ─── Business Rule Validation ───

function validateBusinessRules(
  templateType: ChartTemplateType,
  data: Record<string, unknown>
): ValidationError[] {
  const warnings: ValidationError[] = [];

  if (templateType === 'injection_log') {
    // BUD enforcement: check if BUD is in the past
    const bud = data.bud as string;
    if (bud) {
      const budDate = new Date(bud);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (budDate < today) {
        warnings.push({
          fieldId: 'bud',
          fieldLabel: 'BUD (Beyond Use Date)',
          message: 'WARNING: This vial is past its Beyond Use Date. Do NOT inject from expired vials.',
          severity: 'error',
        });
      }
    }

    // Pregnancy check: if positive, this is a hard stop
    if (data.pregnancy_status === 'positive') {
      warnings.push({
        fieldId: 'pregnancy_status',
        fieldLabel: 'Pregnancy Status',
        message: 'STOP: Client reports positive pregnancy status. Do not administer injection.',
        severity: 'error',
      });
    }

    // Adverse event requires Dr. Landfield notification
    if (data.adverse_event === 'yes' && !data.dr_landfield_notified) {
      warnings.push({
        fieldId: 'dr_landfield_notified',
        fieldLabel: 'Dr. Landfield Notified',
        message: 'Adverse event reported - Dr. Landfield must be notified within 24 hours.',
        severity: 'error',
      });
    }
  }

  if (templateType === 'program_note') {
    // Lab currency check: no GLP-1/HRT injection if labs > 120 days old
    const labDate = data.last_lab_date as string;
    if (labDate && data.labs_current === 'overdue') {
      warnings.push({
        fieldId: 'labs_current',
        fieldLabel: 'Labs Current',
        message: 'Labs are overdue. No GLP-1/HRT injection without current labs or MD override.',
        severity: 'error',
      });
    }
  }

  if (templateType === 'lab_draw') {
    // Labeling compliance
    if (!data.labeled_correctly) {
      warnings.push({
        fieldId: 'labeled_correctly',
        fieldLabel: 'Labeled Correctly',
        message: 'Specimens must be labeled with 2 patient identifiers before leaving the draw area.',
        severity: 'error',
      });
    }
  }

  return warnings;
}

// ─── Compliance Check for Checkout ───

export function canCheckout(
  templateType: ChartTemplateType,
  data: Record<string, unknown>
): { allowed: boolean; reason?: string } {
  const template = getTemplate(templateType);
  if (!template.blocksCheckout) {
    return { allowed: true };
  }

  const check = validateChart(templateType, data);
  if (check.blocksCheckout) {
    return {
      allowed: false,
      reason: `Chart must be completed before checkout. Missing: ${check.missingRequired.join(', ')}`,
    };
  }

  // Check for chart_completed checkbox
  if (data.chart_completed !== true) {
    return {
      allowed: false,
      reason: 'Provider must confirm chart is completed before checkout.',
    };
  }

  return { allowed: true };
}

// ─── Check if appointment has a chart ───

export async function getChartForAppointment(
  appointmentId: string
): Promise<ChartNote | null> {
  try {
    const table = getChartTable();
    const records = await rateLimitedQuery(async () => {
      return new Promise<Array<{ id: string; fields: Record<string, unknown> }>>((resolve, reject) => {
        table
          .select({
            filterByFormula: `{Appointment ID} = "${sanitizeFormulaValue(appointmentId)}"`,
            maxRecords: 1,
          })
          .firstPage((err: Error | null, recs: Array<{ id: string; fields: Record<string, unknown> }>) => {
            if (err) reject(err);
            else resolve(recs || []);
          });
      });
    });

    if (records.length === 0) return null;
    return recordToChartNote(records[0]);
  } catch {
    return null;
  }
}

// ─── CRUD Operations ───

export async function createChart(chart: Omit<ChartNote, 'id'>): Promise<string> {
  const validation = validateChart(chart.templateType, chart.data);

  const fields: Record<string, unknown> = {
    'Chart ID': chart.chartId,
    'Template Type': chart.templateType,
    'Client Name': chart.clientName,
    'Client ID': chart.clientId || '',
    'Provider Name': chart.providerName,
    'Provider ID': chart.providerId || '',
    'Appointment ID': chart.appointmentId || '',
    'Appointment Date': chart.appointmentDate,
    'Status': chart.status,
    'Compliance Status': validation.isCompliant ? 'complete' : 'incomplete',
    'Requires MD Review': chart.requiresMdReview,
    'Chart Data JSON': JSON.stringify(chart.data),
    'Created At': chart.createdAt,
    'Updated At': chart.updatedAt,
  };

  const table = getChartTable();
  return rateLimitedQuery(async () => {
    return new Promise<string>((resolve, reject) => {
      table.create(
        [{ fields }],
        { typecast: true },
        (err: Error | null, records: Array<{ id: string }>) => {
          if (err) reject(err);
          else resolve(records[0].id);
        }
      );
    });
  });
}

export async function updateChart(
  recordId: string,
  updates: Partial<ChartNote>
): Promise<void> {
  const fields: Record<string, unknown> = {
    'Updated At': new Date().toISOString(),
  };

  if (updates.status) fields['Status'] = updates.status;
  if (updates.complianceStatus) fields['Compliance Status'] = updates.complianceStatus;
  if (updates.data) fields['Chart Data JSON'] = JSON.stringify(updates.data);
  if (updates.mdReviewDate) fields['MD Review Date'] = updates.mdReviewDate;
  if (updates.mdReviewNotes) fields['MD Review Notes'] = updates.mdReviewNotes;
  if (updates.providerName) fields['Provider Name'] = updates.providerName;
  if (updates.clientName) fields['Client Name'] = updates.clientName;

  // If data is updated, re-validate compliance
  if (updates.data && updates.templateType) {
    const validation = validateChart(
      updates.templateType as ChartTemplateType,
      updates.data as Record<string, unknown>
    );
    fields['Compliance Status'] = validation.isCompliant ? 'complete' : 'incomplete';
  }

  const table = getChartTable();
  await rateLimitedQuery(async () => {
    return new Promise<void>((resolve, reject) => {
      table.update(
        [{ id: recordId, fields }],
        { typecast: true },
        (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });
}

export async function listCharts(filters: ChartListFilter): Promise<ChartNote[]> {
  const formulaParts: string[] = [];

  if (filters.clientName) {
    formulaParts.push(`FIND("${sanitizeFormulaValue(filters.clientName)}", {Client Name})`);
  }
  if (filters.providerName) {
    formulaParts.push(`{Provider Name} = "${sanitizeFormulaValue(filters.providerName)}"`);
  }
  if (filters.templateType) {
    formulaParts.push(`{Template Type} = "${sanitizeFormulaValue(filters.templateType)}"`);
  }
  if (filters.status) {
    formulaParts.push(`{Status} = "${sanitizeFormulaValue(filters.status)}"`);
  }
  if (filters.dateFrom) {
    formulaParts.push(`IS_AFTER({Appointment Date}, "${sanitizeFormulaValue(filters.dateFrom)}")`);
  }
  if (filters.dateTo) {
    formulaParts.push(`IS_BEFORE({Appointment Date}, "${sanitizeFormulaValue(filters.dateTo)}")`);
  }
  if (filters.appointmentId) {
    formulaParts.push(`{Appointment ID} = "${sanitizeFormulaValue(filters.appointmentId)}"`);
  }

  const filterByFormula =
    formulaParts.length > 1
      ? `AND(${formulaParts.join(', ')})`
      : formulaParts.length === 1
        ? formulaParts[0]
        : '';

  const table = getChartTable();
  const records = await rateLimitedQuery(async () => {
    return new Promise<Array<{ id: string; fields: Record<string, unknown> }>>((resolve, reject) => {
      const allRecords: Array<{ id: string; fields: Record<string, unknown> }> = [];
      table
        .select({
          ...(filterByFormula ? { filterByFormula } : {}),
          sort: [{ field: 'Appointment Date', direction: 'desc' }],
          maxRecords: filters.limit || 50,
        })
        .eachPage(
          (pageRecords: Array<{ id: string; fields: Record<string, unknown> }>, fetchNext: () => void) => {
            pageRecords.forEach((r: { id: string; fields: Record<string, unknown> }) => allRecords.push({ id: r.id, fields: r.fields }));
            fetchNext();
          },
          (err: Error | null) => {
            if (err) reject(err);
            else resolve(allRecords);
          }
        );
    });
  });

  return records.map(recordToChartNote);
}

export async function getChartById(recordId: string): Promise<ChartNote | null> {
  try {
    const table = getChartTable();
    const record = await rateLimitedQuery(async () => {
      return new Promise<{ id: string; fields: Record<string, unknown> }>((resolve, reject) => {
        table.find(recordId, (err: Error | null, rec: { id: string; fields: Record<string, unknown> }) => {
          if (err) reject(err);
          else resolve({ id: rec.id, fields: rec.fields });
        });
      });
    });
    return recordToChartNote(record);
  } catch {
    return null;
  }
}

// ─── Helpers ───

function recordToChartNote(record: { id: string; fields: Record<string, unknown> }): ChartNote {
  const f = record.fields;
  let chartData: Record<string, unknown> = {};
  try {
    chartData = JSON.parse((f['Chart Data JSON'] as string) || '{}');
  } catch {
    chartData = {};
  }

  return {
    id: record.id,
    chartId: (f['Chart ID'] as string) || '',
    templateType: (f['Template Type'] as ChartTemplateType) || 'soap_note',
    clientName: (f['Client Name'] as string) || '',
    clientId: (f['Client ID'] as string) || undefined,
    providerName: (f['Provider Name'] as string) || '',
    providerId: (f['Provider ID'] as string) || undefined,
    appointmentId: (f['Appointment ID'] as string) || undefined,
    appointmentDate: (f['Appointment Date'] as string) || '',
    createdAt: (f['Created At'] as string) || '',
    updatedAt: (f['Updated At'] as string) || '',
    status: (f['Status'] as ChartStatus) || 'draft',
    data: chartData,
    complianceStatus: (f['Compliance Status'] as ComplianceStatus) || 'incomplete',
    requiresMdReview: (f['Requires MD Review'] as boolean) || false,
    mdReviewDate: (f['MD Review Date'] as string) || undefined,
    mdReviewNotes: (f['MD Review Notes'] as string) || undefined,
  };
}

// ─── Generate unique chart ID ───

export function generateChartId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `RBC-${timestamp}-${random}`.toUpperCase();
}

// ─── Service → Template Type Mapping ───

const INJECTION_KEYWORDS = [
  'b12', 'lipo', 'glutathione', 'biotin', 'vitamin d', 'tri-immune', 'nad',
  'semaglutide', 'tirzepatide', 'liraglutide', 'testosterone', 'estradiol',
  'progesterone', 'sermorelin', 'bpc', 'tb-500', 'ghk', 'cjc', 'ipamorelin',
  'vitamin', 'injection', 'shot', 'peptide',
];

const GLP1_HRT_KEYWORDS = [
  'glp-1', 'glp1', 'gip', 'semaglutide program', 'tirzepatide program',
  'hrt', 'hormone', 'check-in', 'dose escalation', 'protocol adjustment',
];

const BODY_KEYWORDS = [
  'body', 'abdomen', 'thigh', 'arm', 'buttock', 'legs',
];

const LAB_KEYWORDS = [
  'lab', 'blood draw', 'phlebotomy', 'panel', 'a1c', 'cbc', 'cmp',
  'lipid', 'thyroid', 'hormone panel',
];

const CONSULT_KEYWORDS = [
  'consult', 'consultation', 'skin scan', 'aura', 'assessment',
];

export function inferTemplateType(serviceName: string): ChartTemplateType {
  const lower = serviceName.toLowerCase();

  if (CONSULT_KEYWORDS.some((kw) => lower.includes(kw))) return 'consultation';
  if (LAB_KEYWORDS.some((kw) => lower.includes(kw))) return 'lab_draw';
  if (GLP1_HRT_KEYWORDS.some((kw) => lower.includes(kw))) return 'program_note';
  if (BODY_KEYWORDS.some((kw) => lower.includes(kw)) && lower.includes('rf')) return 'body_treatment';
  if (INJECTION_KEYWORDS.some((kw) => lower.includes(kw))) return 'injection_log';

  // Default to SOAP note for aesthetic treatments
  return 'soap_note';
}

// ─── Compliance Summary for Dashboard ───

export interface ComplianceSummary {
  totalChartsToday: number;
  completedCharts: number;
  pendingCharts: number;
  blockedCheckouts: number;
  mdReviewPending: number;
}

export async function getComplianceSummary(): Promise<ComplianceSummary> {
  const today = new Date().toISOString().substring(0, 10);

  try {
    const charts = await listCharts({
      dateFrom: today,
      dateTo: today,
      limit: 100,
    });

    return {
      totalChartsToday: charts.length,
      completedCharts: charts.filter((c) => c.status === 'complete' || c.status === 'signed').length,
      pendingCharts: charts.filter((c) => c.status === 'draft').length,
      blockedCheckouts: charts.filter(
        (c) => c.complianceStatus === 'incomplete' || c.complianceStatus === 'blocked'
      ).length,
      mdReviewPending: charts.filter(
        (c) => c.requiresMdReview && !c.mdReviewDate
      ).length,
    };
  } catch {
    return {
      totalChartsToday: 0,
      completedCharts: 0,
      pendingCharts: 0,
      blockedCheckouts: 0,
      mdReviewPending: 0,
    };
  }
}
