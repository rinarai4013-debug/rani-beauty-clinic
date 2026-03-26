'use client';

import { useCallback } from 'react';
import { useDashboardData } from './useDashboardData';
import type { SWRConfiguration } from 'swr';

/* ─── Inventory SWR Hooks ─────────────────────────────────────────────
 *  All inventory-related data fetching hooks.
 *  Built on the existing useDashboardData pattern.
 * ──────────────────────────────────────────────────────────────────── */

// ── Overview / Dashboard Stats ────────────────────────────────────────

export function useInventoryOverview() {
  return useDashboardData('/inventory', {
    refreshInterval: 60000, // 1 min
  });
}

// ── Products ──────────────────────────────────────────────────────────

export function useProducts(params?: {
  category?: string;
  status?: string;
  search?: string;
}) {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  const qs = query.toString();

  return useDashboardData(`/inventory/products${qs ? `?${qs}` : ''}`, {
    refreshInterval: 60000,
  });
}

export function useProduct(productId: string | null) {
  return useDashboardData(productId ? `/inventory/products/${productId}` : null, {
    refreshInterval: 60000,
  });
}

// ── Purchase Orders ───────────────────────────────────────────────────

export function usePurchaseOrders(params?: {
  status?: string;
  supplier?: string;
}) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.supplier) query.set('supplier', params.supplier);
  const qs = query.toString();

  return useDashboardData(`/inventory/purchase-orders${qs ? `?${qs}` : ''}`, {
    refreshInterval: 60000,
  });
}

export function usePurchaseOrder(poId: string | null) {
  return useDashboardData(poId ? `/inventory/purchase-orders/${poId}` : null, {
    refreshInterval: 30000,
  });
}

// ── Receiving ─────────────────────────────────────────────────────────

export function useReceiving(poId: string | null) {
  return useDashboardData(poId ? `/inventory/receiving?poId=${poId}` : null, {
    refreshInterval: 30000,
  });
}

// ── Waste ─────────────────────────────────────────────────────────────

export function useWasteLog(params?: {
  startDate?: string;
  endDate?: string;
  category?: string;
}) {
  const query = new URLSearchParams();
  if (params?.startDate) query.set('startDate', params.startDate);
  if (params?.endDate) query.set('endDate', params.endDate);
  if (params?.category) query.set('category', params.category);
  const qs = query.toString();

  return useDashboardData(`/inventory/waste${qs ? `?${qs}` : ''}`, {
    refreshInterval: 120000, // 2 min
  });
}

// ── Suppliers ─────────────────────────────────────────────────────────

export function useSuppliers() {
  return useDashboardData('/inventory/suppliers', {
    refreshInterval: 300000, // 5 min
  });
}

export function useSupplierScorecard(supplierId: string | null) {
  return useDashboardData(supplierId ? `/inventory/suppliers/${supplierId}` : null, {
    refreshInterval: 300000,
  });
}

// ── Analytics ─────────────────────────────────────────────────────────

export function useInventoryAnalytics(params?: {
  range?: string;
  metric?: string;
}) {
  const query = new URLSearchParams();
  if (params?.range) query.set('range', params.range);
  if (params?.metric) query.set('metric', params.metric);
  const qs = query.toString();

  return useDashboardData(`/inventory/analytics${qs ? `?${qs}` : ''}`, {
    refreshInterval: 300000, // 5 min
  });
}

// ── Expiry Tracker ────────────────────────────────────────────────────

export function useExpiryTracker() {
  return useDashboardData('/inventory/products?expiring=true', {
    refreshInterval: 120000, // 2 min
  });
}

// ── Reorder Alerts ────────────────────────────────────────────────────

export function useReorderAlerts() {
  return useDashboardData('/inventory/products?reorder=true', {
    refreshInterval: 60000,
  });
}

// ── Mutation Helpers ──────────────────────────────────────────────────

export function useInventoryMutations() {
  const postData = useCallback(async (endpoint: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/dashboard/inventory${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Request failed (${res.status})`);
    }
    return res.json();
  }, []);

  const patchData = useCallback(async (endpoint: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/dashboard/inventory${endpoint}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Request failed (${res.status})`);
    }
    return res.json();
  }, []);

  return {
    // Product operations
    adjustStock: (productId: string, adjustment: number, reason: string) =>
      postData('/products', { action: 'adjust_stock', productId, adjustment, reason }),

    // Purchase order operations
    createPO: (data: Record<string, unknown>) =>
      postData('/purchase-orders', { action: 'create', ...data }),
    updatePOStatus: (poId: string, status: string) =>
      patchData(`/purchase-orders`, { action: 'update_status', poId, status }),

    // Receiving operations
    receiveStock: (data: Record<string, unknown>) =>
      postData('/receiving', data),

    // Waste operations
    logWaste: (data: Record<string, unknown>) =>
      postData('/waste', data),

    // Supplier operations
    updateSupplier: (supplierId: string, data: Record<string, unknown>) =>
      patchData('/suppliers', { supplierId, ...data }),
  };
}
