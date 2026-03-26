'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Building2, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
  variant?: 'full' | 'compact';
}

export default function PlaidLinkButton({ onSuccess, variant = 'full' }: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  // Fetch link token
  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch('/api/dashboard/plaid/link-token', { method: 'POST' });
        if (!res.ok) throw new Error('Failed to get link token');
        const data = await res.json();
        setLinkToken(data.linkToken);
      } catch {
        // Silently fail - button will show loading state
      }
    }
    fetchToken();
  }, []);

  const handleSuccess = useCallback(
    async (publicToken: string, metadata: unknown) => {
      setLoading(true);
      try {
        const res = await fetch('/api/dashboard/plaid/exchange-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicToken, metadata }),
        });

        if (!res.ok) throw new Error('Token exchange failed');

        const data = await res.json();
        setConnected(true);
        toast.success(`${data.institutionName} connected! +100 XP`);
        onSuccess?.();
      } catch {
        toast.error('Failed to connect bank account');
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handleSuccess,
  });

  if (connected) {
    return (
      <div
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-rani-success/10 text-rani-success"
      >
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm font-body font-medium">Bank Connected</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={() => open()}
        disabled={!ready || loading}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rani-gold text-rani-navy text-xs font-body font-semibold hover:bg-rani-gold-light transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Building2 className="w-3 h-3" />
        )}
        Connect Bank
      </button>
    );
  }

  return (
    <button
      onClick={() => open()}
      disabled={!ready || loading}
      className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-rani-navy text-white font-body font-semibold text-sm hover:bg-rani-navy-light transition-all disabled:opacity-50 shadow-lg shadow-rani-navy/20"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Building2 className="w-5 h-5 text-rani-gold" />
      )}
      <span>Connect Business Bank</span>
    </button>
  );
}
