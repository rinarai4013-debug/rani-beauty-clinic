'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Volume2, VolumeX, Bell, Shield, Database, Palette, Building2, RefreshCw } from 'lucide-react';
import { FormToggle } from '@/components/dashboard/forms';
import PlaidLinkButton from '@/components/dashboard/plaid/PlaidLinkButton';
import { DashboardErrorBoundary } from '@/components/dashboard/shared';
import { usePlaidConnection, triggerPlaidSync, disconnectBank } from '@/hooks/usePlaidData';
import toast from 'react-hot-toast';

const SETTINGS_KEY = 'rani-dashboard-settings';

interface UserInfo {
  username: string;
  role: string;
  displayName: string;
}

function loadSettings() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSettings(settings: Record<string, unknown>) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

export default function SettingsPage() {
  const router = useRouter();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(30);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [celebrationsEnabled, setCelebrationsEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = loadSettings();
    if (saved) {
      if (saved.soundEnabled !== undefined) setSoundEnabled(saved.soundEnabled);
      if (saved.soundVolume !== undefined) setSoundVolume(saved.soundVolume);
      if (saved.notificationsEnabled !== undefined) setNotificationsEnabled(saved.notificationsEnabled);
      if (saved.celebrationsEnabled !== undefined) setCelebrationsEnabled(saved.celebrationsEnabled);
      if (saved.compactMode !== undefined) setCompactMode(saved.compactMode);
    }
  }, []);

  // Persist settings to localStorage on change
  useEffect(() => {
    saveSettings({ soundEnabled, soundVolume, notificationsEnabled, celebrationsEnabled, compactMode });
  }, [soundEnabled, soundVolume, notificationsEnabled, celebrationsEnabled, compactMode]);

  // Fetch user info from session
  useEffect(() => {
    fetch('/api/dashboard/auth/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.user) setUserInfo(data.user); })
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/dashboard/auth/logout', { method: 'POST' });
    } catch { /* ignore */ }
    document.cookie = 'rani-session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/dashboard/login');
  };

  const { data: connectionData, mutate: mutateConnection } = usePlaidConnection();
  const isConnected = connectionData?.connection?.isConnected ?? false;
  const connection = connectionData?.connection;

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

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await triggerPlaidSync();
      toast.success(`Synced: ${result.added} new transactions`);
      mutateConnection();
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect bank? Transaction history will be cleared.')) return;
    setDisconnecting(true);
    try {
      await disconnectBank();
      toast.success('Bank disconnected');
      mutateConnection();
    } catch {
      toast.error('Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  };

  const card = 'bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-6';

  return (
    <DashboardErrorBoundary pageName="Settings">
      <div className="space-y-6 sm:space-y-8 max-w-3xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Settings</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">Customize your dashboard experience</p>
        </div>

        {/* Sound Settings */}
        <div className={card}>
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            {soundEnabled ? <Volume2 className="w-5 h-5 text-rani-gold" /> : <VolumeX className="w-5 h-5 text-rani-muted" />}
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">Sound & Audio</h3>
          </div>
          <div className="space-y-4">
            <FormToggle checked={soundEnabled} onChange={setSoundEnabled} label="Sound Effects" description="Play sounds for bookings, payments, achievements, and milestones" />
            {soundEnabled && (
              <div className="pl-4 space-y-3">
                <div>
                  <label className="text-sm font-body font-medium text-rani-navy block mb-2">Volume: {soundVolume}%</label>
                  <input type="range" min="0" max="100" value={soundVolume} onChange={e => setSoundVolume(parseInt(e.target.value))} className="w-full accent-rani-gold" />
                </div>
              </div>
            )}
            <FormToggle checked={celebrationsEnabled} onChange={setCelebrationsEnabled} label="Celebration Animations" description="Show confetti and glow effects for achievements and milestones" />
          </div>
        </div>

        {/* Bank Connection */}
        <div className={card}>
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <Building2 className="w-5 h-5 text-rani-gold" />
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">Bank Connection</h3>
          </div>
          {isConnected ? (
            <div className="space-y-4">
              <div className="space-y-3 text-sm font-body">
                {[
                  { label: 'Institution', value: connection?.institutionName || 'Unknown' },
                  { label: 'Accounts', value: `${connection?.accountCount ?? 0} connected` },
                  { label: 'Last Sync', value: formatRelativeTime(connection?.lastSync ?? null) },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-2 border-b border-rani-border/50">
                    <span className="text-rani-muted">{row.label}</span>
                    <span className="text-rani-navy font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleSync} disabled={syncing} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-body font-medium text-rani-navy bg-rani-gold hover:bg-rani-gold-light rounded-lg transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? 'Syncing...' : 'Sync Now'}
                </button>
                <button onClick={handleDisconnect} disabled={disconnecting} className="px-4 py-2 text-sm font-body font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50">
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-rani-muted mb-4">Connect your business bank account to auto-import transactions</p>
              <PlaidLinkButton variant="full" onSuccess={() => mutateConnection()} />
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className={card}>
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <Bell className="w-5 h-5 text-rani-gold" />
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">Notifications</h3>
          </div>
          <FormToggle checked={notificationsEnabled} onChange={setNotificationsEnabled} label="Alert Notifications" description="Show attention panel alerts for no-shows, low reviews, and follow-ups" />
        </div>

        {/* Display */}
        <div className={card}>
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <Palette className="w-5 h-5 text-rani-gold" />
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">Display</h3>
          </div>
          <FormToggle checked={compactMode} onChange={setCompactMode} label="Compact Mode" description="Reduce spacing and card sizes for more data density" />
        </div>

        {/* System Info */}
        <div className={card}>
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <Database className="w-5 h-5 text-rani-gold" />
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">System</h3>
          </div>
          <div className="space-y-3 text-sm font-body">
            {[
              { label: 'Version', value: 'RaniOS v1.0.0-beta' },
              { label: 'Data Source', value: 'Airtable + Mangomint + Plaid' },
              { label: 'Cache TTL', value: '60s (standard)' },
            ].map(row => (
              <div key={row.label} className="flex justify-between py-2 border-b border-rani-border/50">
                <span className="text-rani-muted">{row.label}</span>
                <span className="text-rani-navy font-medium">{row.value}</span>
              </div>
            ))}
            <div className="flex justify-between py-2">
              <span className="text-rani-muted">Environment</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">Development</span>
            </div>
          </div>
        </div>

        {/* Auth Info */}
        <div className={card}>
          <div className="flex items-center gap-3 mb-4 sm:mb-5">
            <Shield className="w-5 h-5 text-rani-gold" />
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">Account</h3>
          </div>
          <div className="space-y-3 text-sm font-body">
            <div className="flex justify-between py-2 border-b border-rani-border/50">
              <span className="text-rani-muted">Logged in as</span>
              <span className="text-rani-navy font-medium">{userInfo ? `${userInfo.displayName} (${userInfo.role.toUpperCase()})` : '...'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-rani-border/50">
              <span className="text-rani-muted">Role</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-rani-gold/10 text-rani-gold">{userInfo?.role?.toUpperCase() ?? '...'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-rani-muted">Session</span>
              <span className="text-rani-navy font-medium">Active (24h)</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-4 px-4 py-2 text-sm font-body font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
}
