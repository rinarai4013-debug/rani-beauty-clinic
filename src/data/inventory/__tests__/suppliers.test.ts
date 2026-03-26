import { describe, it, expect } from 'vitest';
import {
  suppliers,
  getSupplierById,
  getActiveSuppliers,
  getSuppliersByCategory,
  calculateSupplierScore,
  type Supplier,
} from '../suppliers';

/* ─── Supplier Data Tests ─────────────────────────────────────────────*/

describe('Supplier Directory', () => {
  it('should have at least 15 suppliers', () => {
    expect(suppliers.length).toBeGreaterThanOrEqual(15);
  });

  it('should have all required supplier fields', () => {
    for (const supplier of suppliers) {
      expect(supplier.id).toBeTruthy();
      expect(supplier.name).toBeTruthy();
      expect(supplier.shortName).toBeTruthy();
      expect(supplier.contactName).toBeTruthy();
      expect(supplier.contactEmail).toBeTruthy();
      expect(supplier.contactPhone).toBeTruthy();
      expect(supplier.website).toBeTruthy();
      expect(supplier.address).toBeDefined();
      expect(typeof supplier.leadTimeDays).toBe('number');
      expect(typeof supplier.minimumOrderAmount).toBe('number');
      expect(supplier.paymentTerms).toBeTruthy();
      expect(typeof supplier.onTimeDeliveryRate).toBe('number');
      expect(typeof supplier.qualityScore).toBe('number');
      expect(typeof supplier.autoReplenish).toBe('boolean');
      expect(supplier.returnPolicy).toBeTruthy();
      expect(supplier.orderMethod).toBeTruthy();
      expect(typeof supplier.active).toBe('boolean');
    }
  });

  it('should have unique IDs', () => {
    const ids = suppliers.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have on-time delivery rates between 0 and 100', () => {
    for (const s of suppliers) {
      expect(s.onTimeDeliveryRate).toBeGreaterThanOrEqual(0);
      expect(s.onTimeDeliveryRate).toBeLessThanOrEqual(100);
    }
  });

  it('should have quality scores between 1 and 5', () => {
    for (const s of suppliers) {
      expect(s.qualityScore).toBeGreaterThanOrEqual(1);
      expect(s.qualityScore).toBeLessThanOrEqual(5);
    }
  });

  it('should have positive lead times', () => {
    for (const s of suppliers) {
      expect(s.leadTimeDays).toBeGreaterThan(0);
    }
  });

  it('should have valid order methods', () => {
    const validMethods = ['portal', 'email', 'phone', 'fax'];
    for (const s of suppliers) {
      expect(validMethods).toContain(s.orderMethod);
    }
  });

  it('should have valid payment terms', () => {
    const validTerms = ['net-15', 'net-30', 'net-45', 'net-60', 'cod', 'prepaid', 'credit-card'];
    for (const s of suppliers) {
      expect(validTerms).toContain(s.paymentTerms);
    }
  });
});

describe('getSupplierById', () => {
  it('should find Allergan by ID', () => {
    const supplier = getSupplierById('sup-allergan');
    expect(supplier).toBeDefined();
    expect(supplier?.name).toContain('Allergan');
  });

  it('should return undefined for unknown supplier', () => {
    expect(getSupplierById('sup-unknown')).toBeUndefined();
  });
});

describe('getActiveSuppliers', () => {
  it('should return only active suppliers', () => {
    const active = getActiveSuppliers();
    for (const s of active) {
      expect(s.active).toBe(true);
    }
  });

  it('should return at least 15 suppliers', () => {
    expect(getActiveSuppliers().length).toBeGreaterThanOrEqual(15);
  });
});

describe('getSuppliersByCategory', () => {
  it('should find suppliers by category keyword', () => {
    const neuroSuppliers = getSuppliersByCategory('neurotoxin');
    expect(neuroSuppliers.length).toBeGreaterThan(0);
  });

  it('should be case-insensitive', () => {
    const result1 = getSuppliersByCategory('Filler');
    const result2 = getSuppliersByCategory('filler');
    expect(result1.length).toBe(result2.length);
  });

  it('should return empty for unknown category', () => {
    expect(getSuppliersByCategory('quantum-physics')).toHaveLength(0);
  });
});

describe('calculateSupplierScore', () => {
  it('should return a score between 0 and 100', () => {
    for (const supplier of suppliers) {
      const score = calculateSupplierScore(supplier);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it('should weight delivery rate at 40%', () => {
    const base: Supplier = {
      id: 'test', name: 'Test', shortName: 'T', category: 'Test',
      contactName: '', contactEmail: '', contactPhone: '', website: '',
      address: { street: '', city: '', state: '', zip: '' },
      leadTimeDays: 2, minimumOrderAmount: 0, paymentTerms: 'net-30',
      onTimeDeliveryRate: 100, qualityScore: 5, autoReplenish: false,
      returnPolicy: '', orderMethod: 'email', active: true,
    };
    const highDelivery = calculateSupplierScore({ ...base, onTimeDeliveryRate: 100 });
    const lowDelivery = calculateSupplierScore({ ...base, onTimeDeliveryRate: 50 });
    expect(highDelivery).toBeGreaterThan(lowDelivery);
    // The 40% weight on 50-point difference = 20 point impact
    expect(highDelivery - lowDelivery).toBe(20);
  });

  it('should give higher scores to faster lead times', () => {
    const base: Supplier = {
      id: 'test', name: 'Test', shortName: 'T', category: 'Test',
      contactName: '', contactEmail: '', contactPhone: '', website: '',
      address: { street: '', city: '', state: '', zip: '' },
      leadTimeDays: 2, minimumOrderAmount: 0, paymentTerms: 'net-30',
      onTimeDeliveryRate: 90, qualityScore: 4, autoReplenish: false,
      returnPolicy: '', orderMethod: 'email', active: true,
    };
    const fast = calculateSupplierScore({ ...base, leadTimeDays: 2 });
    const slow = calculateSupplierScore({ ...base, leadTimeDays: 10 });
    expect(fast).toBeGreaterThan(slow);
  });
});
