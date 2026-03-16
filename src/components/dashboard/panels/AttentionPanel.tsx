'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, X, ChevronRight } from 'lucide-react';
import { useAlerts } from '@/hooks/useDashboardData';
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

// Mock alerts - replace with useAlerts() hook
const MOCK_ALERTS: AlertItem[] = [
  {
    id: '1',
    type: 'lead_volume',
    severity: 'warning',
    message: '3 leads unanswered for 2+ hours',
    actionRecommended: 'Check lead queue and respond immediately',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'show_rate',
    severity: 'info',
    message: 'Show rate at 75% this week (target: 85%)',
    actionRecommended: 'Review reminder messages and confirmation process',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
];

export default function AttentionPanel() {
  const alerts = MOCK_ALERTS; // Replace with real data

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            Attention Needed
          </h3>
        </div>
        <span className="px-2 py-0.5 bg-amber-100 rounded-full text-xs font-body font-semibold text-amber-700">
          {alerts.length}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm font-body text-rani-muted">All clear! The orchestra is in tune.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert, i) => {
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
                  <button className="p-1 hover:bg-white/50 rounded text-rani-muted hover:text-rani-text transition-colors">
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
