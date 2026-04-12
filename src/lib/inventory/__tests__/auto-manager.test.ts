import { describe, it, expect } from 'vitest';
import { analyzeInventory, type InventoryInput } from '../auto-manager';

function buildInput(overrides: Partial<InventoryInput> = {}): InventoryInput {
  return {
    items: [
      {
        id: 'inv1',
        name: 'Juvederm Ultra XC',
        category: 'injectables',
        currentStock: 5,
        unit: 'syringes',
        unitCost: 200,
        minStock: 3,
        maxStock: 20,
        supplier: 'Allergan',
        leadTimeDays: 5,
      },
      {
        id: 'inv2',
        name: 'HydraFacial Serum',
        category: 'facial_supplies',
        currentStock: 2,
        unit: 'units',
        unitCost: 85,
        minStock: 5,
        maxStock: 15,
        supplier: 'HydraFacial',
        leadTimeDays: 3,
        expirationDate: '2026-06-15',
      },
    ],
    appointments: [
      { date: '2026-04-10', service: 'HydraFacial', itemsUsed: [{ itemId: 'inv2', quantity: 1 }] },
    ],
    suppliers: [
      { name: 'Allergan', items: ['inv1'], avgLeadDays: 5, minOrderAmount: 500, reliability: 95 },
      { name: 'HydraFacial', items: ['inv2'], avgLeadDays: 3, minOrderAmount: 250, reliability: 98 },
    ],
    orderHistory: [],
    ...overrides,
  };
}

describe('analyzeInventory', () => {
  it('returns all expected result keys', () => {
    const result = analyzeInventory(buildInput());
    expect(result).toHaveProperty('alerts');
    expect(result).toHaveProperty('reorderRecommendations');
    expect(result).toHaveProperty('usageAnalysis');
    expect(result).toHaveProperty('wasteReport');
    expect(result).toHaveProperty('inventoryScore');
  });

  it('flags items below minStock as alerts', () => {
    const { alerts } = analyzeInventory(buildInput());
    // HydraFacial Serum: stock 2, minStock 5 → should be flagged
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('generates reorder recommendations for low-stock items', () => {
    const { reorderRecommendations } = analyzeInventory(buildInput());
    expect(reorderRecommendations.length).toBeGreaterThan(0);
  });

  it('produces inventoryScore between 0 and 100', () => {
    const { inventoryScore } = analyzeInventory(buildInput());
    expect(inventoryScore).toBeGreaterThanOrEqual(0);
    expect(inventoryScore).toBeLessThanOrEqual(100);
  });

  it('includes usage analysis', () => {
    const { usageAnalysis } = analyzeInventory(buildInput());
    expect(usageAnalysis).toBeDefined();
  });

  it('includes waste report', () => {
    const { wasteReport } = analyzeInventory(buildInput());
    expect(wasteReport).toBeDefined();
  });

  it('handles empty items array', () => {
    const result = analyzeInventory(buildInput({ items: [] }));
    expect(result.alerts).toHaveLength(0);
    expect(result.reorderRecommendations).toHaveLength(0);
  });
});
