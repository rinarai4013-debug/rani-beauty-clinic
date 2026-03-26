import { describe, it, expect } from 'vitest';
import {
  products,
  getProductById,
  getProductsByCategory,
  getProductsBySupplier,
  getStockStatus,
  getDaysUntilReorder,
  getExpiryRisk,
  calculateBudExpiry,
  getTotalInventoryValue,
  getTotalRetailValue,
  getReorderCount,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  STOCK_STATUS_CONFIG,
  STORAGE_LABELS,
  type Product,
  type StockStatus,
} from '../products';

/* ─── Product Data Tests ──────────────────────────────────────────────
 *  Comprehensive tests for product catalog, stock calculations,
 *  reorder logic, BUD tracking, and utility functions.
 * ──────────────────────────────────────────────────────────────────── */

describe('Product Catalog', () => {
  it('should have at least 50 products', () => {
    expect(products.length).toBeGreaterThanOrEqual(50);
  });

  it('should have all required product fields', () => {
    for (const product of products) {
      expect(product.id).toBeTruthy();
      expect(product.name).toBeTruthy();
      expect(product.sku).toBeTruthy();
      expect(product.category).toBeTruthy();
      expect(product.supplier).toBeTruthy();
      expect(typeof product.unitCost).toBe('number');
      expect(typeof product.retailPrice).toBe('number');
      expect(typeof product.unitsPerCase).toBe('number');
      expect(typeof product.reorderPoint).toBe('number');
      expect(typeof product.parLevel).toBe('number');
      expect(typeof product.isControlled).toBe('boolean');
      expect(typeof product.requiresRx).toBe('boolean');
      expect(typeof product.currentStock).toBe('number');
      expect(typeof product.active).toBe('boolean');
      expect(['room', 'refrigerated', 'frozen']).toContain(product.storageTemp);
    }
  });

  it('should have unique IDs', () => {
    const ids = products.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('should have unique SKUs', () => {
    const skus = products.map((p) => p.sku);
    expect(new Set(skus).size).toBe(skus.length);
  });

  it('should have all 8 categories represented', () => {
    const categories = new Set(products.map((p) => p.category));
    expect(categories.size).toBe(8);
    expect(categories.has('neurotoxins')).toBe(true);
    expect(categories.has('dermal_fillers')).toBe(true);
    expect(categories.has('vitamins_minerals')).toBe(true);
    expect(categories.has('peptides')).toBe(true);
    expect(categories.has('glp1_weight_loss')).toBe(true);
    expect(categories.has('skincare')).toBe(true);
    expect(categories.has('device_consumables')).toBe(true);
    expect(categories.has('supplies')).toBe(true);
  });

  it('should have par levels greater than reorder points', () => {
    for (const product of products) {
      expect(product.parLevel).toBeGreaterThanOrEqual(product.reorderPoint);
    }
  });

  it('should have positive unit costs', () => {
    for (const product of products) {
      expect(product.unitCost).toBeGreaterThan(0);
    }
  });

  it('should never use the word "infusion" in product names or descriptions', () => {
    for (const product of products) {
      expect(product.name.toLowerCase()).not.toContain('infusion');
      expect(product.description.toLowerCase()).not.toContain('infusion');
      if (product.notes) {
        expect(product.notes.toLowerCase()).not.toContain('infusion');
      }
    }
  });

  it('should have neurotoxins with BUD hours', () => {
    const neurotoxins = products.filter((p) => p.category === 'neurotoxins');
    for (const ntx of neurotoxins) {
      expect(ntx.budHours).toBeDefined();
      expect(ntx.budHours).toBeGreaterThan(0);
    }
  });

  it('should have all neurotoxins require Rx', () => {
    const neurotoxins = products.filter((p) => p.category === 'neurotoxins');
    for (const ntx of neurotoxins) {
      expect(ntx.requiresRx).toBe(true);
    }
  });

  it('should have all dermal fillers require Rx', () => {
    const fillers = products.filter((p) => p.category === 'dermal_fillers');
    for (const filler of fillers) {
      expect(filler.requiresRx).toBe(true);
    }
  });

  it('should have retail price of 0 for operational supplies', () => {
    const supplies = products.filter((p) => p.category === 'supplies');
    for (const supply of supplies) {
      expect(supply.retailPrice).toBe(0);
    }
  });
});

describe('getProductById', () => {
  it('should find a product by ID', () => {
    const product = getProductById('ntx-001');
    expect(product).toBeDefined();
    expect(product?.name).toContain('Botox');
  });

  it('should return undefined for non-existent ID', () => {
    expect(getProductById('xxx-999')).toBeUndefined();
  });
});

describe('getProductsByCategory', () => {
  it('should return only products of the specified category', () => {
    const neurotoxins = getProductsByCategory('neurotoxins');
    expect(neurotoxins.length).toBeGreaterThan(0);
    for (const p of neurotoxins) {
      expect(p.category).toBe('neurotoxins');
      expect(p.active).toBe(true);
    }
  });

  it('should return only active products', () => {
    const result = getProductsByCategory('dermal_fillers');
    for (const p of result) {
      expect(p.active).toBe(true);
    }
  });
});

describe('getProductsBySupplier', () => {
  it('should return products for a specific supplier', () => {
    const allerganProducts = getProductsBySupplier('sup-allergan');
    expect(allerganProducts.length).toBeGreaterThan(0);
    for (const p of allerganProducts) {
      expect(p.supplier).toBe('sup-allergan');
    }
  });

  it('should return empty array for unknown supplier', () => {
    expect(getProductsBySupplier('sup-unknown')).toHaveLength(0);
  });
});

describe('getStockStatus', () => {
  const baseProduct: Product = {
    id: 'test',
    name: 'Test',
    sku: 'TST',
    category: 'supplies',
    description: '',
    supplier: 'sup-test',
    unitCost: 10,
    retailPrice: 0,
    unit: 'unit',
    unitsPerCase: 1,
    storageTemp: 'room',
    expirationMonths: 12,
    reorderPoint: 5,
    parLevel: 15,
    isControlled: false,
    requiresRx: false,
    currentStock: 10,
    active: true,
  };

  it('should return "out" when stock is 0', () => {
    expect(getStockStatus({ ...baseProduct, currentStock: 0 })).toBe('out');
  });

  it('should return "critical" when stock is at half reorder point or below', () => {
    expect(getStockStatus({ ...baseProduct, currentStock: 2, reorderPoint: 5 })).toBe('critical');
  });

  it('should return "low" when stock is at or below reorder point', () => {
    expect(getStockStatus({ ...baseProduct, currentStock: 5, reorderPoint: 5 })).toBe('low');
  });

  it('should return "adequate" when stock is between reorder and par level', () => {
    expect(getStockStatus({ ...baseProduct, currentStock: 10, reorderPoint: 5, parLevel: 15 })).toBe('adequate');
  });

  it('should return "full" when stock is at or above par level', () => {
    expect(getStockStatus({ ...baseProduct, currentStock: 15, parLevel: 15 })).toBe('full');
    expect(getStockStatus({ ...baseProduct, currentStock: 20, parLevel: 15 })).toBe('full');
  });
});

describe('getDaysUntilReorder', () => {
  const baseProduct: Product = {
    id: 'test', name: 'Test', sku: 'TST', category: 'supplies', description: '',
    supplier: 'sup-test', unitCost: 10, retailPrice: 0, unit: 'unit', unitsPerCase: 1,
    storageTemp: 'room', expirationMonths: 12, reorderPoint: 5, parLevel: 15,
    isControlled: false, requiresRx: false, currentStock: 10, active: true,
  };

  it('should return null when daily usage is 0', () => {
    expect(getDaysUntilReorder(baseProduct, 0)).toBeNull();
  });

  it('should return 0 when stock is at or below reorder point', () => {
    expect(getDaysUntilReorder({ ...baseProduct, currentStock: 5 }, 1)).toBe(0);
    expect(getDaysUntilReorder({ ...baseProduct, currentStock: 3 }, 1)).toBe(0);
  });

  it('should calculate days correctly', () => {
    // 10 current - 5 reorder = 5 units above, at 1/day = 5 days
    expect(getDaysUntilReorder({ ...baseProduct, currentStock: 10 }, 1)).toBe(5);
    // At 2/day = 2.5, floored to 2
    expect(getDaysUntilReorder({ ...baseProduct, currentStock: 10 }, 2)).toBe(2);
  });

  it('should return null for negative usage', () => {
    expect(getDaysUntilReorder(baseProduct, -1)).toBeNull();
  });
});

describe('getExpiryRisk', () => {
  it('should return "expired" for past dates', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(getExpiryRisk(past)).toBe('expired');
  });

  it('should return "critical" for dates within 30 days', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 15);
    expect(getExpiryRisk(soon)).toBe('critical');
  });

  it('should return "warning" for dates within 90 days', () => {
    const warning = new Date();
    warning.setDate(warning.getDate() + 60);
    expect(getExpiryRisk(warning)).toBe('warning');
  });

  it('should return "ok" for dates beyond 90 days', () => {
    const ok = new Date();
    ok.setDate(ok.getDate() + 120);
    expect(getExpiryRisk(ok)).toBe('ok');
  });
});

describe('calculateBudExpiry', () => {
  it('should calculate BUD expiry correctly', () => {
    const reconTime = new Date('2026-03-25T08:00:00Z');
    const budExpiry = calculateBudExpiry(reconTime, 24);
    expect(budExpiry.getTime()).toBe(new Date('2026-03-26T08:00:00Z').getTime());
  });

  it('should handle short BUD windows', () => {
    const reconTime = new Date('2026-03-25T10:00:00Z');
    const budExpiry = calculateBudExpiry(reconTime, 4);
    expect(budExpiry.getTime()).toBe(new Date('2026-03-25T14:00:00Z').getTime());
  });

  it('should handle multi-day BUD (peptides)', () => {
    const reconTime = new Date('2026-03-25T08:00:00Z');
    const budExpiry = calculateBudExpiry(reconTime, 720); // 30 days
    const expected = new Date('2026-04-24T08:00:00Z');
    expect(budExpiry.getTime()).toBe(expected.getTime());
  });
});

describe('getTotalInventoryValue', () => {
  it('should return a positive number', () => {
    const value = getTotalInventoryValue();
    expect(value).toBeGreaterThan(0);
  });

  it('should sum currentStock * unitCost for all products', () => {
    const manual = products.reduce((sum, p) => sum + p.currentStock * p.unitCost, 0);
    expect(getTotalInventoryValue()).toBe(manual);
  });
});

describe('getTotalRetailValue', () => {
  it('should only include products with retail prices > 0', () => {
    const value = getTotalRetailValue();
    expect(value).toBeGreaterThan(0);
    // Supplies have $0 retail - verify this is excluded
    const suppliesRetail = products.filter((p) => p.category === 'supplies').reduce((s, p) => s + p.currentStock * p.retailPrice, 0);
    expect(suppliesRetail).toBe(0);
  });
});

describe('getReorderCount', () => {
  it('should return count of products at or below reorder point', () => {
    const count = getReorderCount();
    const manual = products.filter((p) => p.active && p.currentStock <= p.reorderPoint).length;
    expect(count).toBe(manual);
  });
});

describe('Category/Storage constants', () => {
  it('should have labels for all 8 categories', () => {
    expect(Object.keys(CATEGORY_LABELS).length).toBe(8);
  });

  it('should have colors for all 8 categories', () => {
    expect(Object.keys(CATEGORY_COLORS).length).toBe(8);
  });

  it('should have config for all stock statuses', () => {
    const statuses: StockStatus[] = ['full', 'adequate', 'low', 'critical', 'out'];
    for (const s of statuses) {
      expect(STOCK_STATUS_CONFIG[s]).toBeDefined();
      expect(STOCK_STATUS_CONFIG[s].label).toBeTruthy();
      expect(STOCK_STATUS_CONFIG[s].color).toBeTruthy();
    }
  });

  it('should have labels for all storage temps', () => {
    expect(STORAGE_LABELS.room).toBeTruthy();
    expect(STORAGE_LABELS.refrigerated).toBeTruthy();
    expect(STORAGE_LABELS.frozen).toBeTruthy();
  });
});
