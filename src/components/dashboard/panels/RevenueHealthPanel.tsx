'use client';

import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { useRevenueAnomalies } from '@/hooks/useDashboardData';

interface Anomaly {
  type: 'target_deviation' | 'rolling_average' | 'day_of_week' | 'provider_imbalance' | 'financing_spike';
  severity: 'warning' | 'critical' | 'info';
  message: string;
  metric: string;
  actual: number;
  expected: number;
  deviation: number;
}

interface AnomalyData {
  anomalies: Anomaly[];
  healthScore: number;
  summary: string;
  projectedMonthEnd: number;
}

const SEVERITY_CONFIG = {
  critical: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: AlertCircle,
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: AlertCircle,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: TrendingUp,
  },
};

function getHealthColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function getHealthRingColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function getHealthLabel(score: number): string {
  if (score >= 80) return 'Healthy';
  if (score >= 60) return 'Moderate';
  if (score >= 40) return 'Concerning';
  return 'Critical';
}

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export default function RevenueHealthPanel() {
  const { data, isLoading } = useRevenueAnomalies();
  const anomalyData = data as AnomalyData | undefined;

  const healthScore = anomalyData?.healthScore ?? 100;
  const anomalies = anomalyData?.anomalies || [];
  const projected = anomalyData?.projectedMonthEnd ?? 0;
  const activeAnomalies = anomalies.filter(a => a.severity !== 'info');

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-40" />
          <div className="h-24 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 38;
  const strokeDashoffset = circumference - (healthScore / 100) * circumference;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-rani-gold" />
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            Revenue Health
          </h3>
        </div>
        {activeAnomalies.length > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-body font-semibold">
            {activeAnomalies.length} Alert{activeAnomalies.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Health Score Ring + Projection */}
      <div className="flex items-center gap-6 mb-4">
        {/* Score Ring */}
        <div className="relative flex-shrink-0">
          <svg width="88" height="88" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="38" fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <motion.circle
              cx="44" cy="44" r="38"
              fill="none"
              stroke={getHealthRingColor(healthScore)}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              transform="rotate(-90 44 44)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-heading ${getHealthColor(healthScore)}`}>{healthScore}</span>
            <span className="text-[9px] font-body text-rani-muted uppercase">{getHealthLabel(healthScore)}</span>
          </div>
        </div>

        {/* Projected Month-End */}
        <div className="flex-1">
          <div className="mb-2">
            <p className="text-[10px] font-body text-rani-muted uppercase">Month-End Projection</p>
            <p className="text-2xl font-heading text-rani-navy">{formatCurrency(projected)}</p>
          </div>
          {anomalyData?.summary && (
            <p className="text-xs font-body text-rani-muted leading-relaxed line-clamp-2">
              {anomalyData.summary}
            </p>
          )}
        </div>
      </div>

      {/* Anomalies */}
      {activeAnomalies.length > 0 ? (
        <div className="space-y-2">
          {activeAnomalies.slice(0, 4).map((anomaly, i) => {
            const config = SEVERITY_CONFIG[anomaly.severity];
            const AnomalyIcon = config.icon;
            const isNegative = anomaly.deviation < 0;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${config.bg} ${config.border}`}
              >
                <AnomalyIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${config.text}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-body font-medium text-rani-navy">{anomaly.message}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-body text-rani-muted">{anomaly.metric}</span>
                    <span className={`flex items-center gap-0.5 text-[10px] font-body font-semibold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                      {isNegative ? <TrendingDown className="w-2.5 h-2.5" /> : <TrendingUp className="w-2.5 h-2.5" />}
                      {Math.abs(anomaly.deviation).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <p className="text-xs font-body text-green-700">Revenue tracking healthy. No anomalies detected.</p>
        </div>
      )}
    </div>
  );
}
