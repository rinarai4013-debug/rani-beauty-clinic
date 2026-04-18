'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import type { SyncStatus as SyncStatusType } from '@/lib/integrations/quickbooks/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SyncStatus() {
  const [syncing, setSyncing] = useState(false);
  const [syncType, setSyncType] = useState<'incremental' | 'full'>('incremental');

  const { data: status, mutate } = useSWR<SyncStatusType>(
    '/api/integrations/quickbooks/sync?action=status',
    fetcher,
    { refreshInterval: 10000 },
  );

  const handleSync = useCallback(async (type: 'incremental' | 'full') => {
    setSyncing(true);
    setSyncType(type);
    try {
      const res = await fetch('/api/integrations/quickbooks/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: type }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Sync failed');
      await mutate();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  }, [mutate]);

  const formatTime = (iso: string | null) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-xl border border-[#C9A96E]/20 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#0F1D2C]">Sync Status</h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleSync('incremental')}
            disabled={syncing || status?.syncInProgress}
            className="rounded-lg bg-[#0F1D2C] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1a2d42] disabled:opacity-50"
          >
            {syncing && syncType === 'incremental' ? 'Syncing...' : 'Sync Now'}
          </button>
          <button
            onClick={() => handleSync('full')}
            disabled={syncing || status?.syncInProgress}
            className="rounded-lg border border-[#0F1D2C]/20 px-3 py-1.5 text-xs font-medium text-[#0F1D2C] transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {syncing && syncType === 'full' ? 'Reconciling...' : 'Full Reconciliation'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-[#F8F6F1] p-3">
          <p className="text-xs text-gray-500">Last Sync</p>
          <p className="mt-1 text-sm font-medium text-[#0F1D2C]">
            {formatTime(status?.lastSyncAt || null)}
          </p>
        </div>
        <div className="rounded-lg bg-[#F8F6F1] p-3">
          <p className="text-xs text-gray-500">Records Synced</p>
          <p className="mt-1 text-sm font-medium text-[#0F1D2C]">
            {status?.recordsSynced?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="rounded-lg bg-[#F8F6F1] p-3">
          <p className="text-xs text-gray-500">Errors</p>
          <p className={`mt-1 text-sm font-medium ${
            (status?.errors?.length || 0) > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {status?.errors?.length || 0}
          </p>
        </div>
      </div>

      {status?.syncInProgress && (
        <div className="mt-3 flex items-center gap-2 text-sm text-rani-gold-accessible">
          <div className="h-2 w-2 animate-pulse rounded-full bg-[#C9A96E]" />
          Sync in progress...
        </div>
      )}

      {status?.errors && status.errors.length > 0 && (
        <div className="mt-3 max-h-32 overflow-y-auto rounded-lg bg-red-50 p-3">
          {status.errors.slice(0, 5).map((err, i) => (
            <p key={i} className="text-xs text-red-600">
              {err.entity} {err.id}: {err.error}
            </p>
          ))}
          {status.errors.length > 5 && (
            <p className="mt-1 text-xs text-red-400">
              +{status.errors.length - 5} more errors
            </p>
          )}
        </div>
      )}
    </div>
  );
}
