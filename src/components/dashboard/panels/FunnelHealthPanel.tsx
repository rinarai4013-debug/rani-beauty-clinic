'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, CheckCircle, XCircle, AlertTriangle, ChevronDown, RefreshCw } from 'lucide-react';
import { useFunnelHealth } from '@/hooks/useDashboardData';

interface FunnelStep {
  step: number;
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  count?: number;
  value?: number;
}

interface FunnelHealthData {
  steps: FunnelStep[];
  overallHealth: number;
  brokenSteps: string[];
  summary: string;
  n8nWebhooks: { url: string; reachable: boolean }[];
}

function getHealthColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getHealthBg(score: number): string {
  if (score >= 80) return 'bg-green-50 border-green-200';
  if (score >= 60) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

function getHealthRingColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#f59e0b';
  return '#ef4444';
}

const STATUS_CONFIG = {
  pass: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Pass' },
  fail: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Fail' },
  warn: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Warn' },
};

export default function FunnelHealthPanel() {
  const { data, isLoading, mutate } = useFunnelHealth();
  const healthData = data as FunnelHealthData | undefined;
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await mutate();
    setRefreshing(false);
  };

  if (isLoading && !healthData) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-36" />
          <div className="h-16 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-rani-gold-accessible" />
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
              Funnel Health
            </h3>
          </div>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-rani-muted" />
          </button>
        </div>
        <p className="text-xs font-body text-rani-muted mt-3">Click refresh to run health checks</p>
      </div>
    );
  }

  const { overallHealth, steps, summary, brokenSteps, n8nWebhooks } = healthData;
  const circumference = 2 * Math.PI * 30;
  const strokeDashoffset = circumference - (overallHealth / 100) * circumference;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-rani-gold-accessible" />
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider">
            Funnel Health
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {brokenSteps.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-body font-semibold">
              {brokenSteps.length} Broken
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-rani-muted ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Score + Summary */}
      <div className="flex items-center gap-4 mb-3">
        <div className="relative flex-shrink-0">
          <svg width="68" height="68" viewBox="0 0 68 68">
            <circle cx="34" cy="34" r="30" fill="none" stroke="#e5e7eb" strokeWidth="5" />
            <motion.circle
              cx="34" cy="34" r="30"
              fill="none"
              stroke={getHealthRingColor(overallHealth)}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              transform="rotate(-90 34 34)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-lg font-heading ${getHealthColor(overallHealth)}`}>{overallHealth}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-body text-rani-muted leading-relaxed line-clamp-2">{summary}</p>
        </div>
      </div>

      {/* Expand/Collapse Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${getHealthBg(overallHealth)}`}
      >
        <span className="text-xs font-body font-medium text-rani-navy">
          {steps.filter(s => s.status === 'pass').length}/{steps.length} steps passing
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-rani-muted transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded Step Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 mt-3">
              {steps.map((step) => {
                const config = STATUS_CONFIG[step.status];
                const StepIcon = config.icon;
                return (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: step.step * 0.04 }}
                    className={`flex items-start gap-2 p-2 rounded-lg border ${config.bg} ${config.border}`}
                  >
                    <StepIcon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-body font-semibold text-rani-navy">
                          {step.step}. {step.name}
                        </span>
                        <span className={`text-[9px] font-body font-bold uppercase ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-[10px] font-body text-rani-muted mt-0.5 leading-relaxed">
                        {step.message}
                      </p>
                    </div>
                  </motion.div>
                );
              })}

              {/* n8n Webhook Status */}
              {n8nWebhooks.length > 0 && (
                <div className="pt-2 mt-2 border-t border-gray-100">
                  <p className="text-[10px] font-body text-rani-muted uppercase tracking-wider mb-1.5">
                    n8n Webhooks
                  </p>
                  {n8nWebhooks.map((wh) => {
                    const shortUrl = wh.url.split('/webhook/')[1] || wh.url;
                    return (
                      <div key={wh.url} className="flex items-center gap-1.5 py-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${wh.reachable ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-[10px] font-body text-rani-muted truncate">
                          /{shortUrl}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
