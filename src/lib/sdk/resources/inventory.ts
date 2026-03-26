/**
 * RaniOS SDK - Inventory Resource
 *
 * Access inventory alerts, reorder recommendations, and waste analysis.
 */

import type { RaniOSClient, SDKResponse } from '../client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface InventoryAlert {
  id: string;
  productName: string;
  productId: string;
  type: 'low_stock' | 'expired' | 'expiring_soon' | 'overstock' | 'reorder_needed';
  severity: 'info' | 'warning' | 'critical';
  currentQuantity: number;
  reorderPoint: number;
  parLevel: number;
  message: string;
  suggestedAction: string;
  estimatedCost: number;
  daysUntilStockout: number | null;
}

export interface WasteAnalysis {
  totalWasteCost: number;
  wasteRate: number;
  byProduct: {
    productName: string;
    unitsWasted: number;
    costImpact: number;
    reason: 'expired' | 'damaged' | 'overstock' | 'recall';
    expirationDate: string | null;
  }[];
  byCategory: {
    category: string;
    wasteCost: number;
    wasteRate: number;
  }[];
  trends: {
    month: string;
    wasteCost: number;
    wasteRate: number;
  }[];
  recommendations: string[];
}

export interface InventoryIntelligence {
  alerts: InventoryAlert[];
  waste: WasteAnalysis;
  summary: {
    totalProducts: number;
    lowStockCount: number;
    expiringCount: number;
    totalInventoryValue: number;
    monthlyUsageCost: number;
    reorderCostPending: number;
  };
  reorderRecommendations: {
    productName: string;
    currentQuantity: number;
    recommendedOrder: number;
    estimatedCost: number;
    preferredSupplier: string;
    leadTimeDays: number;
    urgency: 'immediate' | 'this_week' | 'this_month';
  }[];
}

// ─── Resource ───────────────────────────────────────────────────────────────

export class InventoryResource {
  constructor(private readonly client: RaniOSClient) {}

  /**
   * Get inventory alerts including low stock, expiring, and reorder notifications.
   *
   * @example
   * ```ts
   * const { data } = await client.inventory.getAlerts();
   * const critical = data.filter(a => a.severity === 'critical');
   * console.log(`${critical.length} critical inventory alerts`);
   * ```
   */
  async getAlerts(
    options?: { severity?: 'info' | 'warning' | 'critical'; type?: string },
  ): Promise<SDKResponse<InventoryAlert[]>> {
    return this.client.request<InventoryAlert[]>('/inventory/alerts', {
      params: { severity: options?.severity, type: options?.type },
    });
  }

  /**
   * Get waste analysis including cost impact, trends, and recommendations.
   *
   * @example
   * ```ts
   * const { data } = await client.inventory.getWaste();
   * console.log(`Total waste cost: $${data.totalWasteCost}`);
   * console.log(`Waste rate: ${data.wasteRate}%`);
   * ```
   */
  async getWaste(): Promise<SDKResponse<WasteAnalysis>> {
    return this.client.request<WasteAnalysis>('/inventory/waste');
  }

  /**
   * Get full inventory intelligence with alerts, waste, reorder recommendations,
   * and inventory summary.
   *
   * @example
   * ```ts
   * const { data } = await client.inventory.getIntelligence();
   * console.log(`Inventory value: $${data.summary.totalInventoryValue}`);
   * data.reorderRecommendations.forEach(r => {
   *   console.log(`Reorder ${r.productName}: ${r.recommendedOrder} units ($${r.estimatedCost})`);
   * });
   * ```
   */
  async getIntelligence(): Promise<SDKResponse<InventoryIntelligence>> {
    return this.client.request<InventoryIntelligence>('/inventory');
  }
}
