'use client';

import { useState, useCallback } from 'react';
import { Settings, Clock, Shield, Bell, Send, Save } from 'lucide-react';
import { UnsubscribeManager } from '@/components/dashboard/communications';
import { DashboardErrorBoundary, InlineError } from '@/components/dashboard/shared';
import { useCommunicationPreferences } from '@/hooks/useDashboardData';
import type { CommunicationPreferences } from '@/types/communications';

export default function PreferencesPage() {
  const { data, isLoading, error, mutate } = useCommunicationPreferences();

  const prefData = data as { preferences: CommunicationPreferences; unsubscribed: Array<{ clientId: string; clientName: string; email?: string; phone?: string; unsubscribedAt: string }>; resubscribeRequests: Array<{ clientId: string; requestedAt: string }> } | undefined;

  const [defaultChannel, setDefaultChannel] = useState(prefData?.preferences?.defaultChannel ?? 'sms');
  const [maxDaily, setMaxDaily] = useState(prefData?.preferences?.rateLimits?.maxMessagesPerDay ?? 3);
  const [maxPromoWeekly, setMaxPromoWeekly] = useState(prefData?.preferences?.rateLimits?.maxPromotionalPerWeek ?? 1);
  const [quietStart, setQuietStart] = useState(prefData?.preferences?.rateLimits?.quietHoursStart ?? 20);
  const [quietEnd, setQuietEnd] = useState(prefData?.preferences?.rateLimits?.quietHoursEnd ?? 9);
  const [autoReply, setAutoReply] = useState(prefData?.preferences?.autoReplyEnabled ?? false);
  const [autoReplyMsg, setAutoReplyMsg] = useState(
    prefData?.preferences?.autoReplyMessage ??
    'Thank you for reaching out to Rani Beauty Clinic! We will get back to you shortly.'
  );
  const [escalationEnabled, setEscalationEnabled] = useState(prefData?.preferences?.escalationEnabled ?? true);
  const [escalationTime, setEscalationTime] = useState(prefData?.preferences?.escalationTimeMinutes ?? 30);
  const [slaWarning, setSlaWarning] = useState(prefData?.preferences?.slaWarningMinutes ?? 45);
  const [slaCritical, setSlaCritical] = useState(prefData?.preferences?.slaCriticalMinutes ?? 120);
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await fetch('/api/dashboard/communications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          defaultChannel,
          rateLimits: {
            maxMessagesPerDay: maxDaily,
            maxPromotionalPerWeek: maxPromoWeekly,
            quietHoursStart: quietStart,
            quietHoursEnd: quietEnd,
            quietHoursTimezone: 'America/Los_Angeles',
          },
          autoReplyEnabled: autoReply,
          autoReplyMessage: autoReplyMsg,
          escalationEnabled,
          escalationTimeMinutes: escalationTime,
          slaWarningMinutes: slaWarning,
          slaCriticalMinutes: slaCritical,
        }),
      });
      mutate();
    } catch {
      // Error handling
    } finally {
      setSaving(false);
    }
  }, [
    defaultChannel, maxDaily, maxPromoWeekly, quietStart, quietEnd,
    autoReply, autoReplyMsg, escalationEnabled, escalationTime,
    slaWarning, slaCritical, mutate,
  ]);

  return (
    <DashboardErrorBoundary pageName="Communication Preferences">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Communication Settings
            </h1>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
              Configure global communication preferences, rate limits, and quiet hours
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rani-navy text-white text-xs font-body font-semibold
                       hover:bg-rani-navy-light disabled:opacity-50 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {error && <InlineError message="Failed to load preferences" onRetry={() => mutate()} />}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Default Channel */}
          <SettingsSection icon={Send} title="Default Channel">
            <div className="flex gap-2">
              {(['sms', 'email'] as const).map(ch => (
                <button
                  key={ch}
                  onClick={() => setDefaultChannel(ch)}
                  className={`px-4 py-2 rounded-lg border text-xs font-body font-medium uppercase transition-colors ${
                    defaultChannel === ch
                      ? 'border-rani-navy bg-rani-navy text-white'
                      : 'border-rani-border text-rani-text hover:bg-gray-50'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          </SettingsSection>

          {/* Rate Limits */}
          <SettingsSection icon={Shield} title="Rate Limits">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-body text-rani-text">Max messages per client/day</span>
                <input
                  type="number"
                  value={maxDaily}
                  onChange={(e) => setMaxDaily(Number(e.target.value))}
                  min={1}
                  max={10}
                  className="w-16 px-2 py-1 rounded-md border border-rani-border text-xs font-body text-center
                             focus:outline-none focus:ring-1 focus:ring-rani-gold/30"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-body text-rani-text">Max promotional per client/week</span>
                <input
                  type="number"
                  value={maxPromoWeekly}
                  onChange={(e) => setMaxPromoWeekly(Number(e.target.value))}
                  min={1}
                  max={5}
                  className="w-16 px-2 py-1 rounded-md border border-rani-border text-xs font-body text-center
                             focus:outline-none focus:ring-1 focus:ring-rani-gold/30"
                />
              </div>
            </div>
          </SettingsSection>

          {/* Quiet Hours */}
          <SettingsSection icon={Clock} title="Quiet Hours (PST)">
            <div className="flex items-center gap-3">
              <div>
                <label className="text-[10px] font-body text-rani-muted">No messages after</label>
                <select
                  value={quietStart}
                  onChange={(e) => setQuietStart(Number(e.target.value))}
                  className="block w-full mt-1 px-2 py-1.5 rounded-md border border-rani-border text-xs font-body
                             focus:ring-1 focus:ring-rani-gold/30"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{formatHour(i)}</option>
                  ))}
                </select>
              </div>
              <span className="text-xs font-body text-rani-muted mt-4">to</span>
              <div>
                <label className="text-[10px] font-body text-rani-muted">Resume at</label>
                <select
                  value={quietEnd}
                  onChange={(e) => setQuietEnd(Number(e.target.value))}
                  className="block w-full mt-1 px-2 py-1.5 rounded-md border border-rani-border text-xs font-body
                             focus:ring-1 focus:ring-rani-gold/30"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{formatHour(i)}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-[10px] font-body text-rani-muted mt-2">
              Messages sent during quiet hours will be queued until {formatHour(quietEnd)} PST
            </p>
          </SettingsSection>

          {/* Auto-Reply */}
          <SettingsSection icon={Bell} title="Auto-Reply">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={autoReply}
                onChange={(e) => setAutoReply(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-rani-border text-rani-navy focus:ring-rani-gold/30"
              />
              <span className="text-xs font-body text-rani-text">Enable auto-reply for new inbound messages</span>
            </label>
            {autoReply && (
              <textarea
                value={autoReplyMsg}
                onChange={(e) => setAutoReplyMsg(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-rani-border text-xs font-body
                           placeholder:text-rani-muted focus:outline-none focus:ring-1 focus:ring-rani-gold/30 resize-none"
              />
            )}
          </SettingsSection>

          {/* Escalation */}
          <SettingsSection icon={Shield} title="Escalation Rules">
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={escalationEnabled}
                onChange={(e) => setEscalationEnabled(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-rani-border text-rani-navy focus:ring-rani-gold/30"
              />
              <span className="text-xs font-body text-rani-text">Auto-escalate unanswered messages</span>
            </label>
            {escalationEnabled && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-body text-rani-text">Escalate after (minutes)</span>
                  <input
                    type="number"
                    value={escalationTime}
                    onChange={(e) => setEscalationTime(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-md border border-rani-border text-xs font-body text-center
                               focus:outline-none focus:ring-1 focus:ring-rani-gold/30"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-body text-rani-text">SLA warning (minutes)</span>
                  <input
                    type="number"
                    value={slaWarning}
                    onChange={(e) => setSlaWarning(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-md border border-rani-border text-xs font-body text-center
                               focus:outline-none focus:ring-1 focus:ring-rani-gold/30"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-body text-rani-text">SLA critical (minutes)</span>
                  <input
                    type="number"
                    value={slaCritical}
                    onChange={(e) => setSlaCritical(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-md border border-rani-border text-xs font-body text-center
                               focus:outline-none focus:ring-1 focus:ring-rani-gold/30"
                  />
                </div>
              </div>
            )}
          </SettingsSection>
        </div>

        {/* Unsubscribe Manager */}
        <UnsubscribeManager
          unsubscribedClients={prefData?.unsubscribed ?? []}
          resubscribeRequests={prefData?.resubscribeRequests ?? []}
          onResubscribe={async (clientId) => {
            await fetch('/api/dashboard/communications/preferences', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'resubscribe', clientId }),
            });
            mutate();
          }}
          onApproveResubscribe={async (clientId) => {
            await fetch('/api/dashboard/communications/preferences', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'approveResubscribe', clientId }),
            });
            mutate();
          }}
          onDenyResubscribe={async (clientId) => {
            await fetch('/api/dashboard/communications/preferences', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'denyResubscribe', clientId }),
            });
            mutate();
          }}
        />
      </div>
    </DashboardErrorBoundary>
  );
}

function SettingsSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Settings;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4">
      <h3 className="text-sm font-body font-semibold text-rani-navy mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-rani-gold" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function formatHour(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour < 12) return `${hour}:00 AM`;
  if (hour === 12) return '12:00 PM';
  return `${hour - 12}:00 PM`;
}
