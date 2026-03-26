// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

// Mock Airtable dependencies before importing engine
vi.mock('@/lib/airtable/client', () => ({
  Tables: {},
  rateLimitedQuery: vi.fn(),
  fetchAll: vi.fn(),
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
}));
vi.mock('@/lib/airtable/sanitize', () => ({
  sanitizeFormulaValue: vi.fn((v: string) => v),
}));

import {
  validateChart,
  canCheckout,
  generateChartId,
  inferTemplateType,
  type ComplianceCheck,
} from '../engine';
import { getTemplate, CHART_TEMPLATES, type ChartTemplateType } from '../templates';

// ── Template Registry ──

describe('CHART_TEMPLATES', () => {
  it('has exactly 6 template types', () => {
    expect(Object.keys(CHART_TEMPLATES)).toHaveLength(6);
  });

  it('contains injection_log template', () => {
    expect(CHART_TEMPLATES).toHaveProperty('injection_log');
  });

  it('contains soap_note template', () => {
    expect(CHART_TEMPLATES).toHaveProperty('soap_note');
  });

  it('contains consultation template', () => {
    expect(CHART_TEMPLATES).toHaveProperty('consultation');
  });

  it('contains program_note template', () => {
    expect(CHART_TEMPLATES).toHaveProperty('program_note');
  });

  it('contains body_treatment template', () => {
    expect(CHART_TEMPLATES).toHaveProperty('body_treatment');
  });

  it('contains lab_draw template', () => {
    expect(CHART_TEMPLATES).toHaveProperty('lab_draw');
  });
});

describe('getTemplate', () => {
  it('returns a template for each valid type', () => {
    const types: ChartTemplateType[] = [
      'injection_log', 'soap_note', 'consultation',
      'program_note', 'body_treatment', 'lab_draw',
    ];
    for (const type of types) {
      const template = getTemplate(type);
      expect(template).toBeDefined();
      expect(template.type).toBe(type);
    }
  });

  it('each template has name, description, and fields', () => {
    const types: ChartTemplateType[] = [
      'injection_log', 'soap_note', 'consultation',
      'program_note', 'body_treatment', 'lab_draw',
    ];
    for (const type of types) {
      const t = getTemplate(type);
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.fields.length).toBeGreaterThan(0);
    }
  });

  it('each template has sections array', () => {
    const types: ChartTemplateType[] = [
      'injection_log', 'soap_note', 'consultation',
      'program_note', 'body_treatment', 'lab_draw',
    ];
    for (const type of types) {
      expect(getTemplate(type).sections.length).toBeGreaterThan(0);
    }
  });

  it('each template specifies blocksCheckout flag', () => {
    const types: ChartTemplateType[] = [
      'injection_log', 'soap_note', 'consultation',
      'program_note', 'body_treatment', 'lab_draw',
    ];
    for (const type of types) {
      expect(typeof getTemplate(type).blocksCheckout).toBe('boolean');
    }
  });
});

// ── validateChart - Required Fields ──

describe('validateChart - required field enforcement', () => {
  it('reports missing required fields as errors', () => {
    const result = validateChart('injection_log', {});
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.isCompliant).toBe(false);
  });

  it('returns isCompliant true when all required fields are filled', () => {
    // Build data with all required fields for soap_note
    const template = getTemplate('soap_note');
    const data: Record<string, unknown> = {};
    for (const field of template.fields) {
      if (field.required) {
        switch (field.type) {
          case 'text':
          case 'textarea':
            data[field.id] = 'Test value';
            break;
          case 'number':
            data[field.id] = field.min ?? 1;
            break;
          case 'date':
            data[field.id] = '2026-03-20';
            break;
          case 'checkbox':
            data[field.id] = true;
            break;
          case 'select':
          case 'radio':
            data[field.id] = field.options?.[0]?.value ?? 'value';
            break;
          case 'multiselect':
            data[field.id] = [field.options?.[0]?.value ?? 'value'];
            break;
          case 'signature':
            data[field.id] = 'Provider Signature';
            break;
          default:
            data[field.id] = 'value';
        }
      }
    }
    const result = validateChart('soap_note', data);
    expect(result.isCompliant).toBe(true);
    expect(result.missingRequired).toHaveLength(0);
  });

  it('completionPercentage is 0 when all required fields are missing', () => {
    const result = validateChart('injection_log', {});
    expect(result.completionPercentage).toBe(0);
  });

  it('completionPercentage is 100 when all required fields are filled', () => {
    const template = getTemplate('soap_note');
    const data: Record<string, unknown> = {};
    for (const field of template.fields) {
      if (field.required) {
        switch (field.type) {
          case 'checkbox': data[field.id] = true; break;
          case 'multiselect': data[field.id] = [field.options?.[0]?.value]; break;
          case 'select':
          case 'radio': data[field.id] = field.options?.[0]?.value; break;
          case 'number': data[field.id] = field.min ?? 1; break;
          case 'date': data[field.id] = '2026-03-20'; break;
          default: data[field.id] = 'value';
        }
      }
    }
    const result = validateChart('soap_note', data);
    expect(result.completionPercentage).toBe(100);
  });

  it('missingRequired lists field labels', () => {
    const result = validateChart('injection_log', {});
    expect(result.missingRequired.length).toBeGreaterThan(0);
    // Each missing required should be a string (field label)
    for (const label of result.missingRequired) {
      expect(typeof label).toBe('string');
    }
  });
});

// ── validateChart - Type Validation ──

describe('validateChart - field type validation', () => {
  it('rejects non-numeric value for number field', () => {
    const template = getTemplate('injection_log');
    const numField = template.fields.find(f => f.type === 'number' && f.required);
    if (!numField) return; // Skip if no required number fields
    const data: Record<string, unknown> = { [numField.id]: 'not-a-number' };
    const result = validateChart('injection_log', data);
    const fieldError = result.errors.find(e => e.fieldId === numField.id);
    expect(fieldError).toBeDefined();
  });

  it('rejects number below minimum', () => {
    const template = getTemplate('injection_log');
    const numField = template.fields.find(f => f.type === 'number' && f.min !== undefined);
    if (!numField) return;
    const data: Record<string, unknown> = { [numField.id]: numField.min! - 1 };
    const result = validateChart('injection_log', data);
    const fieldError = [...result.errors, ...result.warnings].find(e => e.fieldId === numField.id);
    expect(fieldError).toBeDefined();
  });

  it('rejects number above maximum', () => {
    const template = getTemplate('injection_log');
    const numField = template.fields.find(f => f.type === 'number' && f.max !== undefined);
    if (!numField) return;
    const data: Record<string, unknown> = { [numField.id]: numField.max! + 1 };
    const result = validateChart('injection_log', data);
    const fieldError = [...result.errors, ...result.warnings].find(e => e.fieldId === numField.id);
    expect(fieldError).toBeDefined();
  });

  it('rejects invalid date format', () => {
    const template = getTemplate('injection_log');
    const dateField = template.fields.find(f => f.type === 'date');
    if (!dateField) return;
    const data: Record<string, unknown> = { [dateField.id]: '03/20/2026' };
    const result = validateChart('injection_log', data);
    const fieldError = [...result.errors, ...result.warnings].find(e => e.fieldId === dateField.id);
    expect(fieldError).toBeDefined();
  });

  it('accepts valid date format YYYY-MM-DD', () => {
    const template = getTemplate('injection_log');
    const dateField = template.fields.find(f => f.type === 'date' && f.required);
    if (!dateField) return;
    // Just check that a valid date alone doesn't produce a date-format error
    const data: Record<string, unknown> = { [dateField.id]: '2026-03-20' };
    const result = validateChart('injection_log', data);
    const dateError = [...result.errors, ...result.warnings].find(
      e => e.fieldId === dateField.id && e.message.includes('valid date')
    );
    expect(dateError).toBeUndefined();
  });

  it('rejects invalid select option', () => {
    const template = getTemplate('injection_log');
    const selectField = template.fields.find(f => f.type === 'select' && f.options);
    if (!selectField) return;
    const data: Record<string, unknown> = { [selectField.id]: 'invalid_option_xyz' };
    const result = validateChart('injection_log', data);
    const fieldError = [...result.errors, ...result.warnings].find(e => e.fieldId === selectField.id);
    expect(fieldError).toBeDefined();
  });

  it('rejects invalid multiselect option', () => {
    const template = getTemplate('injection_log');
    const msField = template.fields.find(f => f.type === 'multiselect' && f.options);
    if (!msField) return;
    const data: Record<string, unknown> = { [msField.id]: ['invalid_xyz'] };
    const result = validateChart('injection_log', data);
    const fieldError = [...result.errors, ...result.warnings].find(e => e.fieldId === msField.id);
    expect(fieldError).toBeDefined();
  });
});

// ── Business Rule Validation ──

describe('validateChart - business rules', () => {
  it('warns on expired BUD for injection_log', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const data = { bud: yesterday.toISOString().substring(0, 10) };
    const result = validateChart('injection_log', data);
    const budWarning = result.warnings.find(w => w.fieldId === 'bud');
    expect(budWarning).toBeDefined();
    expect(budWarning!.message).toContain('Beyond Use Date');
  });

  it('no BUD warning when BUD is in the future', () => {
    const future = new Date();
    future.setDate(future.getDate() + 30);
    const data = { bud: future.toISOString().substring(0, 10) };
    const result = validateChart('injection_log', data);
    const budWarning = result.warnings.find(w => w.fieldId === 'bud');
    expect(budWarning).toBeUndefined();
  });

  it('pregnancy hard stop for injection_log', () => {
    const data = { pregnancy_status: 'positive' };
    const result = validateChart('injection_log', data);
    const pregWarning = result.warnings.find(w => w.fieldId === 'pregnancy_status');
    expect(pregWarning).toBeDefined();
    expect(pregWarning!.message).toContain('STOP');
    expect(pregWarning!.severity).toBe('error');
  });

  it('no pregnancy warning when status is negative', () => {
    const data = { pregnancy_status: 'negative' };
    const result = validateChart('injection_log', data);
    const pregWarning = result.warnings.find(w => w.fieldId === 'pregnancy_status');
    expect(pregWarning).toBeUndefined();
  });

  it('adverse event requires Dr. Landfield notification', () => {
    const data = { adverse_event: 'yes', dr_landfield_notified: false };
    const result = validateChart('injection_log', data);
    const drWarning = result.warnings.find(w => w.fieldId === 'dr_landfield_notified');
    expect(drWarning).toBeDefined();
    expect(drWarning!.message).toContain('Dr. Landfield');
  });

  it('no Dr. Landfield warning when notified', () => {
    const data = { adverse_event: 'yes', dr_landfield_notified: true };
    const result = validateChart('injection_log', data);
    const drWarning = result.warnings.find(w => w.fieldId === 'dr_landfield_notified');
    expect(drWarning).toBeUndefined();
  });

  it('program_note warns when labs are overdue', () => {
    const data = { last_lab_date: '2025-01-01', labs_current: 'overdue' };
    const result = validateChart('program_note', data);
    const labWarning = result.warnings.find(w => w.fieldId === 'labs_current');
    expect(labWarning).toBeDefined();
    expect(labWarning!.message).toContain('Labs are overdue');
  });

  it('lab_draw warns when specimens not labeled correctly', () => {
    const data = { labeled_correctly: false };
    const result = validateChart('lab_draw', data);
    const labelWarning = result.warnings.find(w => w.fieldId === 'labeled_correctly');
    expect(labelWarning).toBeDefined();
    expect(labelWarning!.message).toContain('2 patient identifiers');
  });

  it('lab_draw no warning when labeled correctly', () => {
    const data = { labeled_correctly: true };
    const result = validateChart('lab_draw', data);
    const labelWarning = result.warnings.find(w => w.fieldId === 'labeled_correctly');
    expect(labelWarning).toBeUndefined();
  });
});

// ── canCheckout ──

describe('canCheckout', () => {
  it('returns allowed true when template does not block checkout', () => {
    // consultation may not block checkout
    const template = getTemplate('consultation');
    if (!template.blocksCheckout) {
      const result = canCheckout('consultation', {});
      expect(result.allowed).toBe(true);
    }
  });

  it('returns allowed false when required fields are missing on blocking template', () => {
    // Find a template that blocks checkout
    const types: ChartTemplateType[] = [
      'injection_log', 'soap_note', 'consultation',
      'program_note', 'body_treatment', 'lab_draw',
    ];
    const blockingType = types.find(t => getTemplate(t).blocksCheckout);
    if (!blockingType) return;

    const result = canCheckout(blockingType, {});
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
  });

  it('returns allowed false when chart_completed is not true', () => {
    const types: ChartTemplateType[] = [
      'injection_log', 'soap_note', 'consultation',
      'program_note', 'body_treatment', 'lab_draw',
    ];
    const blockingType = types.find(t => getTemplate(t).blocksCheckout);
    if (!blockingType) return;

    // Fill all required fields but leave chart_completed false
    const template = getTemplate(blockingType);
    const data: Record<string, unknown> = {};
    for (const field of template.fields) {
      if (field.required) {
        switch (field.type) {
          case 'checkbox': data[field.id] = true; break;
          case 'multiselect': data[field.id] = [field.options?.[0]?.value]; break;
          case 'select':
          case 'radio': data[field.id] = field.options?.[0]?.value; break;
          case 'number': data[field.id] = field.min ?? 1; break;
          case 'date': data[field.id] = '2026-03-20'; break;
          default: data[field.id] = 'value';
        }
      }
    }
    data.chart_completed = false;
    const result = canCheckout(blockingType, data);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('completed before checkout');
  });

  it('reason includes missing field names', () => {
    const types: ChartTemplateType[] = [
      'injection_log', 'soap_note', 'consultation',
      'program_note', 'body_treatment', 'lab_draw',
    ];
    const blockingType = types.find(t => getTemplate(t).blocksCheckout);
    if (!blockingType) return;

    const result = canCheckout(blockingType, {});
    if (!result.allowed) {
      expect(result.reason).toContain('Missing');
    }
  });
});

// ── generateChartId ──

describe('generateChartId', () => {
  it('starts with RBC- prefix', () => {
    const id = generateChartId();
    expect(id).toMatch(/^RBC-/);
  });

  it('is uppercase', () => {
    const id = generateChartId();
    expect(id).toBe(id.toUpperCase());
  });

  it('generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateChartId());
    }
    expect(ids.size).toBe(100);
  });

  it('contains a timestamp component and random component', () => {
    const id = generateChartId();
    // Format: RBC-{timestamp}-{random}
    const parts = id.split('-');
    expect(parts.length).toBeGreaterThanOrEqual(3);
  });
});

// ── inferTemplateType ──

describe('inferTemplateType', () => {
  it('infers consultation for consult services', () => {
    expect(inferTemplateType('Skin Consultation')).toBe('consultation');
  });

  it('infers consultation for aura scan', () => {
    expect(inferTemplateType('Aura Scan')).toBe('consultation');
  });

  it('infers lab_draw for lab services', () => {
    expect(inferTemplateType('Lab Blood Draw')).toBe('lab_draw');
    expect(inferTemplateType('CBC Panel')).toBe('lab_draw');
  });

  it('infers program_note for GLP-1 services', () => {
    expect(inferTemplateType('GLP-1 Check-in')).toBe('program_note');
    expect(inferTemplateType('Semaglutide Program')).toBe('program_note');
  });

  it('infers program_note for HRT services', () => {
    expect(inferTemplateType('HRT Dose Escalation')).toBe('program_note');
    expect(inferTemplateType('Hormone Check-in')).toBe('program_note');
  });

  it('infers injection_log for wellness injections', () => {
    expect(inferTemplateType('B12 Injection')).toBe('injection_log');
    expect(inferTemplateType('Glutathione Shot')).toBe('injection_log');
    expect(inferTemplateType('NAD+ IV')).toBe('injection_log');
  });

  it('infers injection_log for vitamin services', () => {
    expect(inferTemplateType('Vitamin D3 Injection')).toBe('injection_log');
    expect(inferTemplateType('Tri-Immune Boost')).toBe('injection_log');
  });

  it('infers injection_log for peptide services', () => {
    expect(inferTemplateType('BPC-157 Peptide')).toBe('injection_log');
    expect(inferTemplateType('Sermorelin Injection')).toBe('injection_log');
  });

  it('infers body_treatment for RF body treatments', () => {
    expect(inferTemplateType('RF Body Abdomen')).toBe('body_treatment');
  });

  it('defaults to soap_note for aesthetic treatments', () => {
    expect(inferTemplateType('HydraFacial Signature')).toBe('soap_note');
    expect(inferTemplateType('VI Peel Advanced')).toBe('soap_note');
    expect(inferTemplateType('Sofwave')).toBe('soap_note');
    expect(inferTemplateType('PicoWay Laser')).toBe('soap_note');
  });

  it('is case-insensitive', () => {
    expect(inferTemplateType('CONSULT')).toBe('consultation');
    expect(inferTemplateType('b12 injection')).toBe('injection_log');
  });
});
