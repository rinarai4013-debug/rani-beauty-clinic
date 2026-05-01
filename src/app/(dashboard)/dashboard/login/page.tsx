'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const RESTORE_SESSION_KEY = 'restoreSession';

export default function DashboardLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [nextPath, setNextPath] = useState('/dashboard');
  const [restoreSession, setRestoreSession] = useState('');

  useEffect(() => {
    const encodedNext = searchParams.get('next');
    const encodedRestore = searchParams.get(RESTORE_SESSION_KEY);
    if (encodedNext) {
      try {
        setNextPath(decodeURIComponent(encodedNext));
      } catch {
        setNextPath(encodedNext);
      }
    }
    if (encodedRestore) {
      try {
        setRestoreSession(decodeURIComponent(encodedRestore));
      } catch {
        setRestoreSession(encodedRestore);
      }
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/dashboard/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        if (restoreSession) {
          router.push(`/dashboard/mastermind/${restoreSession}`);
        } else {
          router.push(nextPath);
        }
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F1D2C]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-[#C9A96E] tracking-[0.3em] uppercase text-xs font-medium mb-2">
            Rani Beauty Clinic
          </p>
          <h1 className="text-white text-2xl font-light tracking-wide">
            Operations Dashboard
          </h1>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-white/60 text-xs tracking-widest uppercase mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#C9A96E] transition-colors"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label className="block text-white/60 text-xs tracking-widest uppercase mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#C9A96E] transition-colors"
                placeholder="Enter password"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A96E] hover:bg-[#b8975e] disabled:opacity-50 text-[#0F1D2C] font-semibold py-3 rounded-lg tracking-wide transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/20 text-xs mt-6">
          RaniOS v2 · Secure Internal Access
        </p>
      </div>
    </div>
  );
}
