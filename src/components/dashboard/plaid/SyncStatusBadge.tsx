'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { triggerPlaidSync } from '@/hooks/usePlaidData';
import toast from 'react-hot-toast';

interface SyncStatusBadgeProps {
  lastSync: string | null;
  onSyncComplete?: () => void;
}

export default function SyncStatusBadge({ lastSync, onSyncComplete }: SyncStatusBadgeProps) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    setError(false);
    try {
      const result = await triggerPlaidSync();
      toast.success(`Synced: ${result.added} new transactions`);
      onSyncComplete?.();
    } catch {
      setError(true);
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const formatRelativeTime = (iso: string | null) => {
    if (!iso) return 'Never';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-rani-border text-xs font-body hover:bg-rani-cream transition-colors disabled:opacity-60"
    >
      {syncing ? (
        <>
          <RefreshCw className="w-3 h-3 text-rani-gold animate-spin" />
          <span className="text-rani-muted">Syncing...</span>
        </>
      ) : error ? (
        <>
          <AlertCircle className="w-3 h-3 text-red-500" />
          <span className="text-red-500">Error</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="w-3 h-3 text-rani-success" />
          <span className="text-rani-muted">Synced {formatRelativeTime(lastSync)}</span>
        </>
      )}
    </button>
  );
}
