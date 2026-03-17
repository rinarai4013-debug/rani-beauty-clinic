'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Shield, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useNoShowRisk } from '@/hooks/useDashboardData';

interface NoShowItem {
  appointmentId: string;
  clientName: string;
  service: string;
  time: string;
  provider: string;
  score: number;
  level: 'low' | 'moderate' | 'high';
  factors: string[];
}

const RISK_CONFIG = {
  high: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-700',
    icon: ShieldAlert,
    label: 'HIGH RISK',
  },
  moderate: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    icon: AlertTriangle,
    label: 'MODERATE',
  },
  low: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-700',
    icon: ShieldCheck,
    label: 'LOW',
  },
};

export default function NoShowRiskPanel() {
  const { data, isLoading } = useNoShowRisk();
  const items = (data as { appointments?: NoShowItem[] })?.appointments || [];

  // Only show moderate and high risk
  const riskyAppointments = items.filter(a => a.level !== 'low');
  const highCount = items.filter(a => a.level === 'high').length;

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-20 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (riskyAppointments.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            No-Show Risk
          </h3>
          <span className="flex items-center gap-1.5 text-xs font-body text-green-600">
            <Shield className="w-3.5 h-3.5" />
            All Clear
          </span>
        </div>
        <p className="text-sm font-body text-rani-muted">All appointments look good today.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
          No-Show Risk
        </h3>
        {highCount > 0 && (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-body font-semibold">
            <ShieldAlert className="w-3 h-3" />
            {highCount} High Risk
          </span>
        )}
      </div>

      <div className="space-y-2">
        {riskyAppointments.slice(0, 6).map((apt, i) => {
          const config = RISK_CONFIG[apt.level];
          const RiskIcon = config.icon;
          return (
            <motion.div
              key={apt.appointmentId || i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-lg border ${config.bg} ${config.border}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.badge}`}>
                <RiskIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-body font-medium text-rani-navy">{apt.clientName}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-body font-semibold ${config.badge}`}>
                    {apt.score}%
                  </span>
                </div>
                <p className="text-xs font-body text-rani-muted truncate">
                  {apt.time} &middot; {apt.service} &middot; {apt.provider}
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-body text-rani-muted">
                  {apt.factors?.[0] || ''}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
