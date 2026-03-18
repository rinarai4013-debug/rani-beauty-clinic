'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, X, CheckCircle } from 'lucide-react';
import { useAlerts } from '@/hooks/useDashboardData';
import { PanelSkeleton } from '@/components/dashboard/shared';
import { InlineError } from '@/components/dashboard/shared';
import type { AlertItem } from '@/types/dashboard';

const SEVERITY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
  },
};

export default function AttentionPanel() {
  const { data, isLoading, error, mutate } = useAlerts();
  const alerts = ((data as { alerts?: AlertItem[] })?.alerts ?? []).filter(
    (a: AlertItem) => a.status === 'active'
  );

  if (isLoading) return <PanelSkeleton rows={3} />;

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <InlineError message="Failed to load alerts" onRetry={() => mutate()} />
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            Attention Needed
          </h3>
        </div>
        {alerts.length > 0 && (
          <span className="px-2 py-0.5 bg-amber-100 rounded-full text-xs font-body font-semibold text-amber-700">
            {alerts.length}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-sm font-body font-medium text-rani-text">All clear!</p>
          <p className="text-xs font-body text-rani-muted mt-1">No alerts require your attention right now.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {alerts.map((alert: AlertItem, i: number) => {
            const config = SEVERITY_CONFIG[alert.severity];
            const Icon = config.icon;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`${config.bg} ${config.border} border rounded-lg p-3`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.text}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-body font-medium text-rani-text">
                      {alert.message}
                    </p>
                    <p className="text-xs font-body text-rani-muted mt-1">
                      {alert.actionRecommended}
                    </p>
                  </div>
                  <button className="p-1 hover:bg-white/50 rounded text-rani-muted hover:text-rani-text transition-colors flex-shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
