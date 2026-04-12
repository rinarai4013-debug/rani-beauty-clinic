import { describe, it, expect } from 'vitest';
import {
  ClientSchema,
  ClientIntakeSchema,
  AppointmentSchema,
  TransactionSchema,
  MembershipSchema,
  ReviewSchema,
  AlertSchema,
  KPISnapshotSchema,
  validateRecord,
  getSchema,
  SCHEMA_MAP,
} from '../schemas';

describe('Airtable Schemas', () => {
  describe('ClientSchema', () => {
    it('accepts a valid client record', () => {
      const result = ClientSchema.safeParse({
        Client: 'Jane Doe',
        Email: 'jane@example.com',
        Phone: '425-555-0100',
        Status: 'Active',
        'Preferred Contact': 'Email',
      });
      expect(result.success).toBe(true);
    });

    it('requires Client name', () => {
      const result = ClientSchema.safeParse({ Email: 'jane@example.com' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid email format', () => {
      const result = ClientSchema.safeParse({ Client: 'Jane', Email: 'not-an-email' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid status enum', () => {
      const result = ClientSchema.safeParse({ Client: 'Jane', Status: 'InvalidStatus' });
      expect(result.success).toBe(false);
    });

    it('allows passthrough of extra fields', () => {
      const result = ClientSchema.safeParse({
        Client: 'Jane',
        CustomField: 'extra-value',
      });
      expect(result.success).toBe(true);
      expect((result as { data: Record<string, unknown> }).data.CustomField).toBe('extra-value');
    });
  });

  describe('ClientIntakeSchema', () => {
    it('accepts a valid intake record', () => {
      const result = ClientIntakeSchema.safeParse({
        'Full Name': 'Jane Doe',
        Email: 'jane@example.com',
        'Processing Status': 'New',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid processing status', () => {
      const result = ClientIntakeSchema.safeParse({
        'Processing Status': 'InvalidState',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('AppointmentSchema', () => {
    it('accepts valid appointment data', () => {
      const result = AppointmentSchema.safeParse({
        'Service Name': 'HydraFacial',
        'Service Category': 'Facial',
        Provider: 'Rina',
        Date: '2026-03-15',
        'Amount Paid': 275,
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid service category', () => {
      const result = AppointmentSchema.safeParse({
        'Service Category': 'InvalidCategory',
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative amounts', () => {
      const result = AppointmentSchema.safeParse({
        'Amount Paid': -50,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('TransactionSchema', () => {
    it('accepts valid transaction', () => {
      const result = TransactionSchema.safeParse({
        Date: '2026-04-01',
        Amount: 495,
        'Payment Method': 'Credit Card',
        Provider: 'Rina',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid payment method', () => {
      const result = TransactionSchema.safeParse({
        'Payment Method': 'Bitcoin',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ReviewSchema', () => {
    it('rejects star rating out of range', () => {
      expect(ReviewSchema.safeParse({ 'Star Rating': 0 }).success).toBe(false);
      expect(ReviewSchema.safeParse({ 'Star Rating': 6 }).success).toBe(false);
    });

    it('accepts valid 5-star review', () => {
      const result = ReviewSchema.safeParse({
        'Star Rating': 5,
        'Review Text': 'Amazing experience',
        Sentiment: 'Positive',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('KPISnapshotSchema', () => {
    it('rejects percentage over 100', () => {
      const result = KPISnapshotSchema.safeParse({ 'Show Rate': 150 });
      expect(result.success).toBe(false);
    });

    it('accepts valid KPI data', () => {
      const result = KPISnapshotSchema.safeParse({
        Date: '2026-04-01',
        Revenue: 5000,
        'Total Bookings': 12,
        'Show Rate': 92,
        'Close Rate': 75,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('AlertSchema', () => {
    it('rejects invalid severity', () => {
      const result = AlertSchema.safeParse({ Severity: 'Urgent' });
      expect(result.success).toBe(false);
    });

    it('accepts valid alert', () => {
      const result = AlertSchema.safeParse({
        Severity: 'High',
        'Metric Name': 'Revenue',
        Message: 'Revenue below target',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('MembershipSchema', () => {
    it('rejects churn risk score over 100', () => {
      const result = MembershipSchema.safeParse({ 'Churn Risk Score': 110 });
      expect(result.success).toBe(false);
    });
  });
});

describe('validateRecord', () => {
  it('returns success for valid client data', () => {
    const result = validateRecord('Clients', { Client: 'Jane Doe' });
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('returns errors for invalid data', () => {
    const result = validateRecord('Clients', { Email: 'bad' });
    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors!.length).toBeGreaterThan(0);
  });

  it('returns error for unknown table name', () => {
    const result = validateRecord('Nonexistent', {});
    expect(result.success).toBe(false);
    expect(result.errors![0].message).toContain('No schema defined');
  });
});

describe('getSchema / SCHEMA_MAP', () => {
  it('returns schema for known table', () => {
    expect(getSchema('Clients')).toBeDefined();
    expect(getSchema('Appointments')).toBeDefined();
  });

  it('returns undefined for unknown table', () => {
    expect(getSchema('FakeTable')).toBeUndefined();
  });

  it('has 12 table schemas', () => {
    expect(Object.keys(SCHEMA_MAP)).toHaveLength(12);
  });
});
