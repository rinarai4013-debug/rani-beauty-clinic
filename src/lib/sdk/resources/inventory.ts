/**
 * RaniOS SDK - Inventory Resource
 *
 * Access inventory levels, alerts, and reorder actions.
 */

import type { RaniOSClient, SDKPaginatedResponse, SDKResponse, SDKListParams } from '../client';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  quantityOnHand: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  supplier: string | null;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  updatedAt: string;
}

export interface InventoryAlert {
  id: string;
  itemId: string;
  itemName: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring' | 'high_usage';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  recommendedAction: string;
}

export interface InventoryListParams extends SDKListParams {
  category?: string;
  status?: string;
  supplier?: string;
}

export class InventoryResource {
  constructor(private readonly client: RaniOSClient) {}

  async list(params?: InventoryListParams): Promise<SDKPaginatedResponse<InventoryItem>> {
    return this.client.requestList<InventoryItem>('/inventory', params);
  }

  async get(itemId: string): Promise<SDKResponse<InventoryItem>> {
    return this.client.request<InventoryItem>(`/inventory/${itemId}`);
  }

  async getAlerts(): Promise<SDKResponse<InventoryAlert[]>> {
    return this.client.request<InventoryAlert[]>('/inventory/alerts');
  }
}
