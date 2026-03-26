import { describe, it, expect } from 'vitest';
import {
  samplePurchaseOrders,
  sampleWasteEntries,
  generatePONumber,
  calculatePOTotal,
  getApprovalLevel,
  canTransitionTo,
  getReceivingVariance,
  getTotalWasteCost,
  getPreventableWastePercent,
  APPROVAL_THRESHOLDS,
  PO_STATUS_CONFIG,
  PO_PRIORITY_CONFIG,
  WASTE_CATEGORY_CONFIG,
  type POLineItem,
  type POStatus,
  type WasteEntry,
} from '../purchase-orders';

/* ─── Purchase Order Tests ────────────────────────────────────────────*/

describe('PO Number Generation', () => {
  it('should generate PO numbers with correct format', () => {
    const poNum = generatePONumber();
    expect(poNum).toMatch(/^PO-\d{4}-\d{4}$/);
  });

  it('should include current year', () => {
    const poNum = generatePONumber();
    const year = new Date().getFullYear().toString();
    expect(poNum).toContain(year);
  });

  it('should generate unique numbers', () => {
    const nums = new Set(Array.from({ length: 20 }, () => generatePONumber()));
    // With 9000 possible numbers, 20 should all be unique
    expect(nums.size).toBe(20);
  });
});

describe('calculatePOTotal', () => {
  const lineItems: POLineItem[] = [
    { id: '1', productId: 'p1', productName: 'A', sku: 'A1', quantityOrdered: 10, quantityReceived: 0, unitCost: 100, totalCost: 1000 },
    { id: '2', productId: 'p2', productName: 'B', sku: 'B1', quantityOrdered: 5, quantityReceived: 0, unitCost: 200, totalCost: 1000 },
  ];

  it('should calculate subtotal correctly', () => {
    const result = calculatePOTotal(lineItems);
    expect(result.subtotal).toBe(2000);
  });

  it('should apply discount', () => {
    const result = calculatePOTotal(lineItems, 200);
    expect(result.discount).toBe(200);
    expect(result.total).toBe(1800);
  });

  it('should add shipping', () => {
    const result = calculatePOTotal(lineItems, 0, 50);
    expect(result.shippingCost).toBe(50);
    expect(result.total).toBe(2050);
  });

  it('should add tax', () => {
    const result = calculatePOTotal(lineItems, 0, 0, 160);
    expect(result.tax).toBe(160);
    expect(result.total).toBe(2160);
  });

  it('should handle all modifiers together', () => {
    const result = calculatePOTotal(lineItems, 100, 25, 50);
    // 2000 - 100 + 25 + 50 = 1975
    expect(result.total).toBe(1975);
  });

  it('should handle empty line items', () => {
    const result = calculatePOTotal([]);
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe('getApprovalLevel', () => {
  it('should auto-approve amounts under threshold', () => {
    expect(getApprovalLevel(400)).toBe('auto');
    expect(getApprovalLevel(500)).toBe('auto');
  });

  it('should require manager approval for mid-range', () => {
    expect(getApprovalLevel(501)).toBe('manager');
    expect(getApprovalLevel(2000)).toBe('manager');
    expect(getApprovalLevel(5000)).toBe('manager');
  });

  it('should require CEO approval for large orders', () => {
    expect(getApprovalLevel(5001)).toBe('ceo');
    expect(getApprovalLevel(10000)).toBe('ceo');
  });
});

describe('canTransitionTo', () => {
  it('should allow draft to submitted', () => {
    expect(canTransitionTo('draft', 'submitted')).toBe(true);
  });

  it('should allow draft to cancelled', () => {
    expect(canTransitionTo('draft', 'cancelled')).toBe(true);
  });

  it('should not allow draft to received', () => {
    expect(canTransitionTo('draft', 'received')).toBe(false);
  });

  it('should allow submitted to approved', () => {
    expect(canTransitionTo('submitted', 'approved')).toBe(true);
  });

  it('should allow ordered to shipped or received', () => {
    expect(canTransitionTo('ordered', 'shipped')).toBe(true);
    expect(canTransitionTo('ordered', 'received')).toBe(true);
    expect(canTransitionTo('ordered', 'partially_received')).toBe(true);
  });

  it('should not allow received to ordered (backward)', () => {
    expect(canTransitionTo('received', 'ordered')).toBe(false);
  });

  it('should not allow paid to any transition', () => {
    expect(canTransitionTo('paid', 'received')).toBe(false);
    expect(canTransitionTo('paid', 'cancelled')).toBe(false);
  });

  it('should not allow cancelled to any transition', () => {
    expect(canTransitionTo('cancelled', 'draft')).toBe(false);
    expect(canTransitionTo('cancelled', 'submitted')).toBe(false);
  });

  it('should allow full workflow path', () => {
    expect(canTransitionTo('draft', 'submitted')).toBe(true);
    expect(canTransitionTo('submitted', 'approved')).toBe(true);
    expect(canTransitionTo('approved', 'ordered')).toBe(true);
    expect(canTransitionTo('ordered', 'shipped')).toBe(true);
    expect(canTransitionTo('shipped', 'received')).toBe(true);
    expect(canTransitionTo('received', 'invoiced')).toBe(true);
    expect(canTransitionTo('invoiced', 'paid')).toBe(true);
  });
});

describe('getReceivingVariance', () => {
  it('should detect complete receipt', () => {
    const li: POLineItem = {
      id: '1', productId: 'p1', productName: 'A', sku: 'A1',
      quantityOrdered: 10, quantityReceived: 10, unitCost: 100, totalCost: 1000,
    };
    const result = getReceivingVariance(li);
    expect(result.status).toBe('complete');
    expect(result.variance).toBe(0);
    expect(result.percentReceived).toBe(100);
  });

  it('should detect partial receipt', () => {
    const li: POLineItem = {
      id: '1', productId: 'p1', productName: 'A', sku: 'A1',
      quantityOrdered: 10, quantityReceived: 7, unitCost: 100, totalCost: 1000,
    };
    const result = getReceivingVariance(li);
    expect(result.status).toBe('partial');
    expect(result.variance).toBe(-3);
    expect(result.percentReceived).toBe(70);
  });

  it('should detect over-receipt', () => {
    const li: POLineItem = {
      id: '1', productId: 'p1', productName: 'A', sku: 'A1',
      quantityOrdered: 10, quantityReceived: 12, unitCost: 100, totalCost: 1000,
    };
    const result = getReceivingVariance(li);
    expect(result.status).toBe('over');
    expect(result.variance).toBe(2);
  });

  it('should detect pending receipt', () => {
    const li: POLineItem = {
      id: '1', productId: 'p1', productName: 'A', sku: 'A1',
      quantityOrdered: 10, quantityReceived: 0, unitCost: 100, totalCost: 1000,
    };
    const result = getReceivingVariance(li);
    expect(result.status).toBe('pending');
    expect(result.percentReceived).toBe(0);
  });
});

describe('Waste Calculations', () => {
  it('should calculate total waste cost', () => {
    const cost = getTotalWasteCost(sampleWasteEntries);
    expect(cost).toBeGreaterThan(0);
    const manual = sampleWasteEntries.reduce((s, e) => s + e.totalCost, 0);
    expect(cost).toBe(manual);
  });

  it('should calculate preventable waste percentage', () => {
    const pct = getPreventableWastePercent(sampleWasteEntries);
    expect(pct).toBeGreaterThanOrEqual(0);
    expect(pct).toBeLessThanOrEqual(100);
  });

  it('should return 0 for empty waste entries', () => {
    expect(getTotalWasteCost([])).toBe(0);
    expect(getPreventableWastePercent([])).toBe(0);
  });

  it('should have valid waste categories', () => {
    const validCategories = Object.keys(WASTE_CATEGORY_CONFIG);
    for (const entry of sampleWasteEntries) {
      expect(validCategories).toContain(entry.category);
    }
  });

  it('should have positive quantities and costs', () => {
    for (const entry of sampleWasteEntries) {
      expect(entry.quantity).toBeGreaterThan(0);
      expect(entry.unitCost).toBeGreaterThan(0);
      expect(entry.totalCost).toBe(entry.quantity * entry.unitCost);
    }
  });
});

describe('Sample PO Data', () => {
  it('should have valid sample purchase orders', () => {
    expect(samplePurchaseOrders.length).toBeGreaterThan(0);
    for (const po of samplePurchaseOrders) {
      expect(po.id).toBeTruthy();
      expect(po.poNumber).toMatch(/^PO-\d{4}-\d{4}$/);
      expect(po.supplierId).toBeTruthy();
      expect(po.lineItems.length).toBeGreaterThan(0);
      expect(po.total).toBeGreaterThan(0);
      expect(Object.keys(PO_STATUS_CONFIG)).toContain(po.status);
      expect(Object.keys(PO_PRIORITY_CONFIG)).toContain(po.priority);
    }
  });

  it('should have consistent line item totals', () => {
    for (const po of samplePurchaseOrders) {
      for (const li of po.lineItems) {
        expect(li.totalCost).toBe(li.quantityOrdered * li.unitCost);
      }
    }
  });
});

describe('Status/Priority Constants', () => {
  it('should have config for all PO statuses', () => {
    const statuses: POStatus[] = [
      'draft', 'submitted', 'approved', 'ordered', 'shipped',
      'partially_received', 'received', 'invoiced', 'paid', 'cancelled',
    ];
    for (const s of statuses) {
      expect(PO_STATUS_CONFIG[s]).toBeDefined();
      expect(PO_STATUS_CONFIG[s].label).toBeTruthy();
    }
  });

  it('should have config for all priorities', () => {
    expect(PO_PRIORITY_CONFIG.routine).toBeDefined();
    expect(PO_PRIORITY_CONFIG.urgent).toBeDefined();
    expect(PO_PRIORITY_CONFIG.emergency).toBeDefined();
  });

  it('should have valid approval thresholds', () => {
    expect(APPROVAL_THRESHOLDS.autoApprove).toBeGreaterThan(0);
    expect(APPROVAL_THRESHOLDS.managerApproval).toBeGreaterThan(APPROVAL_THRESHOLDS.autoApprove);
    expect(APPROVAL_THRESHOLDS.ceoApproval).toBeGreaterThan(APPROVAL_THRESHOLDS.managerApproval);
  });
});
