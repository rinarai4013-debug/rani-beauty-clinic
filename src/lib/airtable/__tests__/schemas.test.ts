import { describe, it, expect } from 'vitest';
import { validateRecord, getSchema, SCHEMA_MAP } from '../schemas';

describe('schemas', () => {
  describe('validateRecord', () => {
    it('validates a correct Client record', () => {
      const result = validateRecord('Clients', {
        'Client': 'Jane Doe',
        'Email': 'jane@example.com',
        'Phone': '555-1234',
        'Status': 'Active',
      });
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('rejects a Client with missing name', () => {
      const result = validateRecord('Clients', {
        'Email': 'jane@example.com',
      });
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.some((e) => e.path.includes('Client'))).toBe(true);
    });

    it('rejects a Client with invalid email', () => {
      const result = validateRecord('Clients', {
        'Client': 'Jane',
        'Email': 'not-an-email',
      });
      expect(result.success).toBe(false);
      expect(result.errors!.some((e) => e.message.includes('email'))).toBe(true);
    });

    it('validates a correct Transaction record', () => {
      const result = validateRecord('Transactions', {
        'Date': '2026-03-15',
        'Amount': 495,
        'Payment Method': 'Credit Card',
        'Provider': 'Rina',
        'Status': 'Completed',
      });
      expect(result.success).toBe(true);
    });

    it('rejects a Transaction with invalid payment method', () => {
      const result = validateRecord('Transactions', {
        'Payment Method': 'Bitcoin',
      });
      expect(result.success).toBe(false);
    });

    it('validates a correct KPI Snapshot record', () => {
      const result = validateRecord('KPI Snapshots', {
        'Date': '2026-03-15',
        'Revenue': 5000,
        'Show Rate': 85,
        'Average Rating': 4.8,
      });
      expect(result.success).toBe(true);
    });

    it('rejects KPI with rating > 5', () => {
      const result = validateRecord('KPI Snapshots', {
        'Average Rating': 6.0,
      });
      expect(result.success).toBe(false);
    });

    it('validates a correct Appointment record', () => {
      const result = validateRecord('Appointments', {
        'Service Name': 'HydraFacial',
        'Service Category': 'Facial',
        'Provider': 'Mom',
        'Date': '2026-04-01',
        'Amount Paid': 275,
      });
      expect(result.success).toBe(true);
    });

    it('rejects an Appointment with invalid category', () => {
      const result = validateRecord('Appointments', {
        'Service Category': 'Surgery',
      });
      expect(result.success).toBe(false);
    });

    it('validates a Review with star rating in range', () => {
      const result = validateRecord('Reviews', {
        'Star Rating': 5,
        'Sentiment': 'Positive',
        'Review Date': '2026-03-20',
      });
      expect(result.success).toBe(true);
    });

    it('rejects a Review with star rating 0', () => {
      const result = validateRecord('Reviews', {
        'Star Rating': 0,
      });
      expect(result.success).toBe(false);
    });

    it('validates an Alert record', () => {
      const result = validateRecord('Alerts', {
        'Severity': 'High',
        'Message': 'Revenue anomaly detected',
        'Status': 'Active',
      });
      expect(result.success).toBe(true);
    });

    it('allows passthrough of unknown fields', () => {
      const result = validateRecord('Clients', {
        'Client': 'Jane',
        'Custom Field': 'extra data',
      });
      expect(result.success).toBe(true);
    });

    it('returns error for unknown table', () => {
      const result = validateRecord('Nonexistent Table', { foo: 'bar' });
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('No schema defined');
    });
  });

  describe('getSchema', () => {
    it('returns schema for known tables', () => {
      expect(getSchema('Clients')).toBeDefined();
      expect(getSchema('Transactions')).toBeDefined();
      expect(getSchema('KPI Snapshots')).toBeDefined();
    });

    it('returns undefined for unknown tables', () => {
      expect(getSchema('Nonexistent')).toBeUndefined();
    });
  });

  describe('SCHEMA_MAP coverage', () => {
    it('has schemas for all 12 tables', () => {
      const expectedTables = [
        'Clients',
        'Client Intakes',
        'Appointments',
        'Packages',
        'Memberships',
        'Transactions',
        'Messages Log',
        'Reviews',
        'KPI Snapshots',
        'Alerts',
        'Competitor Intelligence',
        'Intake Intelligence',
      ];
      for (const table of expectedTables) {
        expect(SCHEMA_MAP[table]).toBeDefined();
      }
    });
  });
});
