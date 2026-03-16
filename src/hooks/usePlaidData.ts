'use client';

import { useDashboardData } from './useDashboardData';
import type {
  PlaidAccount,
  PlaidTransaction,
  PlaidConnectionState,
  BankFeedSummary,
  PlaidSyncResult,
  ReconciliationMatch,
} from '@/types/plaid';

// Connection + accounts
export function usePlaidConnection() {
  return useDashboardData<{
    accounts: PlaidAccount[];
    connection: PlaidConnectionState;
  }>('/plaid/accounts', {
    refreshInterval: 300000, // 5min
  });
}

// Just accounts (alias)
export function usePlaidAccounts() {
  return useDashboardData<{
    accounts: PlaidAccount[];
    connection: PlaidConnectionState;
  }>('/plaid/accounts', {
    refreshInterval: 300000,
  });
}

// Transaction list with filters
export function usePlaidTransactions(params: {
  page?: number;
  limit?: number;
  status?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
} = {}) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== ''
  );
  const queryString = new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)])
  ).toString();

  return useDashboardData<{
    transactions: PlaidTransaction[];
    total: number;
    page: number;
    hasMore: boolean;
  }>(`/plaid/transactions${queryString ? `?${queryString}` : ''}`, {
    refreshInterval: 60000,
  });
}

// Bank feed summary for finance page
export function useBankFeedSummary(range: string = 'mtd') {
  return useDashboardData<BankFeedSummary>(
    `/plaid/summary?range=${range}`,
    { refreshInterval: 60000 }
  );
}

// Reconciliation matches
export function useReconciliationMatches() {
  return useDashboardData<{ matches: ReconciliationMatch[] }>(
    '/plaid/transactions/matches',
    { refreshInterval: 120000 }
  );
}

// Mutation: trigger sync
export async function triggerPlaidSync(): Promise<PlaidSyncResult> {
  const res = await fetch('/api/dashboard/plaid/transactions/sync', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Sync failed');
  return res.json();
}

// Mutation: reconcile a transaction
export async function reconcileTransaction(
  transactionId: string,
  payload:
    | { entryId: string; entryType: string }
    | { action: 'exclude' }
    | { category: string }
): Promise<{ success: boolean }> {
  const res = await fetch(
    `/api/dashboard/plaid/transactions/${transactionId}/reconcile`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error('Reconciliation failed');
  return res.json();
}

// Mutation: disconnect bank
export async function disconnectBank(): Promise<{ success: boolean }> {
  const res = await fetch('/api/dashboard/plaid/disconnect', {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Disconnect failed');
  return res.json();
}
