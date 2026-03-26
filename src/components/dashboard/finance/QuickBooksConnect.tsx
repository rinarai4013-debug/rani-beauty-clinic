'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';

interface ConnectionStatus {
  connected: boolean;
  realmId: string | null;
  environment: 'sandbox' | 'production';
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
}

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function QuickBooksConnect() {
  const [disconnecting, setDisconnecting] = useState(false);

  const { data: status, error, mutate } = useSWR<ConnectionStatus>(
    '/api/integrations/quickbooks/auth?action=status',
    fetcher,
    { refreshInterval: 60000 },
  );

  const handleConnect = useCallback(() => {
    window.location.href = '/api/integrations/quickbooks/auth?action=connect';
  }, []);

  const handleDisconnect = useCallback(async () => {
    setDisconnecting(true);
    try {
      await fetch('/api/integrations/quickbooks/auth?action=disconnect');
      await mutate();
    } catch (err) {
      console.error('Disconnect failed:', err);
    } finally {
      setDisconnecting(false);
    }
  }, [mutate]);

  const isLoading = !status && !error;

  return (
    <div className="rounded-xl border border-[#C9A96E]/20 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* QuickBooks logo placeholder */}
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#2CA01C]/10">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#2CA01C" />
              <path d="M16 12c0 2.21-1.79 4-4 4H9v-2h3c1.1 0 2-.9 2-2s-.9-2-2-2H9V8h3c2.21 0 4 1.79 4 4z" fill="white" />
              <path d="M11 8H8v8h3V8z" fill="white" opacity="0.7" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-[#0F1D2C]">QuickBooks Online</h3>
            <p className="text-sm text-gray-500">
              {isLoading
                ? 'Checking connection...'
                : status?.connected
                  ? `Connected${status.environment === 'sandbox' ? ' (Sandbox)' : ''}`
                  : 'Not connected'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className={`h-2.5 w-2.5 rounded-full ${
            status?.connected ? 'bg-green-500' : 'bg-gray-300'
          }`} />

          {status?.connected ? (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              {disconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="rounded-lg bg-[#2CA01C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#248017] disabled:opacity-50"
            >
              Connect QuickBooks
            </button>
          )}
        </div>
      </div>

      {status?.connected && (
        <div className="mt-4 flex gap-4 text-xs text-gray-400">
          <span>Realm: {status.realmId}</span>
          {status.accessTokenExpiresAt && (
            <span>Token expires: {new Date(status.accessTokenExpiresAt).toLocaleDateString()}</span>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          Failed to check connection status. Please try again.
        </div>
      )}
    </div>
  );
}
