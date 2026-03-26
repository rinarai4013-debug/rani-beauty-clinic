'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, ShieldAlert, X, Activity, Bell, CheckCircle2 } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import { useAlerts } from '@/hooks/useDashboardData';
import { DashboardErrorBoundary, KPIRowSkeleton, PanelSkeleton, SkeletonBar, InlineError } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import type { AlertItem } from '@/types/dashboard';

interface AlertsResponse {
  alerts: AlertItem[];
}

const SEVERITY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; border: string; badge: string; label: string }> = {
  info: {
    icon: Info,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    label: 'Low',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Medium',
  },
  critical: {
    icon: ShieldAlert,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    label: 'Critical',
  },
};

const TYPE_LABELS: Record<string, string> = {
  booking_rate: 'Booking Rate',
  show_rate: 'Show Rate',
  close_rate: 'Close Rate',
  no_shows: 'No-Shows',
  revenue: 'Revenue',
  membership_churn: 'Membership Churn',
  negative_review: 'Negative Review',
  lead_volume: 'Lead Volume',
  provider_capacity: 'Provider Capacity',
  financing: 'Financing',
  system_error: 'System Error',
  follow_up: 'Follow-Up',
  custom: 'Custom',
};

export default function AlertsPage() {
  return (
    <DashboardErrorBoundary pageName="System Alerts">
      <AlertsContent />
    </DashboardErrorBoundary>
  );
}

function AlertsContent() {
  const { data: raw, isLoading, error, mutate } = useAlerts() as {
    data: AlertsResponse | undefined;
    isLoading: boolean;
    error: unknown;
    mutate: () => void;
  };

  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const alerts = (raw?.alerts || []).filter(a => !dismissedIds.has(a.id));

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;

  async function handleDismiss(alertId: string) {
    setDismissingIds(prev => new Set(prev).add(alertId));
    try {
      const res = await fetch(`/api/dashboard/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      });
      if (res.ok) {
        setDismissedIds(prev => new Set(prev).add(alertId));
        mutate();
      }
    } catch {
      // Silently fail - alert stays visible
    } finally {
      setDismissingIds(prev => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  }

  /* ─── Error State ──────────────────────────────────────────────── */
  if (error) {
    return <InlineError message="Failed to load system alerts" onRetry={() => mutate()} />;
  }

  /* ─── Loading State ─────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="animate-pulse space-y-2">
          <SkeletonBar className="h-7 w-40" />
          <SkeletonBar className="h-3 w-64" />
        </div>
        <KPIRowSkeleton count={4} />
        <PanelSkeleton rows={5} />
      </div>
    );
  }

  /* ─── Empty State ───────────────────────────────────────────────── */
  if (alerts.length === 0) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">System Alerts</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">Real-time operational alerts and threshold monitoring</p>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
          <KPICard title="Active Alerts" value={0} icon="bell" size="hero" />
          <KPICard title="Critical" value={0} icon="shield-alert" />
          <KPICard title="Warnings" value={0} icon="alert-triangle" />
          <KPICard title="Info" value={0} icon="info" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white text-center"
        >
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-200" />
          <h3 className="text-lg font-heading mb-1">All Clear</h3>
          <p className="text-sm font-body text-white/80">No active alerts. All systems operating within normal thresholds.</p>
        </motion.div>
      </div>
    );
  }

  // Sort: critical first, then warning, then info
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  const sortedAlerts = [...alerts].sort((a, b) => {
    return (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3);
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">System Alerts</h1>
        <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">Real-time operational alerts and threshold monitoring</p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
        <KPICard title="Active Alerts" value={alerts.length} icon="bell" size="hero" />
        <KPICard title="Critical" value={criticalCount} icon="shield-alert" />
        <KPICard title="Warnings" value={warningCount} icon="alert-triangle" />
        <KPICard title="Info" value={infoCount} icon="info" />
      </div>

      {/* Critical Banner */}
      {criticalCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-4 sm:p-5 text-white"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-red-200 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-body font-semibold">
                {criticalCount} Critical Alert{criticalCount > 1 ? 's' : ''} Require Attention
              </h3>
              <p className="text-xs font-body text-white/70 mt-0.5">
                Review and take action on critical alerts immediately.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Alert Cards */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {sortedAlerts.map((alert, i) => {
            const config = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
            const Icon = config.icon;
            const isDismissing = dismissingIds.has(alert.id);

            return (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0, padding: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-xl border p-4 sm:p-5 ${config.bg} ${config.border} transition-colors relative`}
              >
                {/* Dismiss Button */}
                <button
                  onClick={() => handleDismiss(alert.id)}
                  disabled={isDismissing}
                  className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-white/50 transition-colors disabled:opacity-50"
                  aria-label="Dismiss alert"
                >
                  <X className="w-4 h-4 text-rani-muted" />
                </button>

                <div className="flex items-start gap-3 pr-8">
                  {/* Severity Icon */}
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top Row: Type + Severity Badge */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-body font-semibold text-rani-navy">
                        {TYPE_LABELS[alert.type] || alert.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.badge}`}>
                        {config.label}
                      </span>
                    </div>

                    {/* Message */}
                    <p className="text-xs sm:text-sm font-body text-rani-text leading-relaxed mb-2">
                      {alert.message}
                    </p>

                    {/* Metric vs Threshold */}
                    {alert.metricName && (
                      <div className="flex items-center gap-4 mb-2 text-xs font-body flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3 h-3 text-rani-muted" />
                          <span className="text-rani-muted">{alert.metricName}:</span>
                          <span className="font-semibold text-rani-navy">
                            {typeof alert.metricValue === 'number'
                              ? alert.metricValue.toLocaleString(undefined, { maximumFractionDigits: 1 })
                              : ' - '}
                          </span>
                        </div>
                        {alert.thresholdValue !== undefined && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-rani-muted">Threshold:</span>
                            <span className="font-semibold text-rani-navy">
                              {alert.thresholdValue.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Recommended */}
                    {alert.actionRecommended && (
                      <div className="p-2.5 rounded-lg bg-white/60 border border-white/80">
                        <div className="flex items-start gap-2">
                          <Bell className="w-3 h-3 text-rani-gold flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[10px] font-body font-semibold text-rani-navy uppercase tracking-wider">Recommended Action</span>
                            <p className="text-xs font-body text-rani-text mt-0.5">{alert.actionRecommended}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className="text-[10px] font-body text-rani-muted mt-2">
                      {alert.createdAt
                        ? new Date(alert.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : ''}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
