'use client';

import { motion } from 'framer-motion';
import { Shield, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { TechnicalSEOHealth } from '@/lib/marketing/seo-monitor';

interface SEOHealthScoreProps {
  health: TechnicalSEOHealth;
  loading?: boolean;
}

export default function SEOHealthScore({ health, loading }: SEOHealthScoreProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-rani-border/30 bg-white p-5 animate-pulse">
        <div className="h-5 w-36 bg-rani-cream rounded mb-4" />
        <div className="h-32 bg-rani-cream rounded" />
      </div>
    );
  }

  const scoreColor = health.overallScore >= 80 ? 'text-emerald-600' :
    health.overallScore >= 60 ? 'text-amber-600' : 'text-red-500';

  const ringColor = health.overallScore >= 80 ? 'stroke-emerald-500' :
    health.overallScore >= 60 ? 'stroke-amber-500' : 'stroke-red-500';

  const circumference = 2 * Math.PI * 45;
  const dashOffset = circumference - (health.overallScore / 100) * circumference;

  return (
    <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
      <h3 className="font-heading text-sm font-semibold text-rani-navy flex items-center gap-2 mb-4">
        <Shield className="w-4 h-4" />
        Technical SEO Health
      </h3>

      <div className="flex items-center gap-6">
        {/* Score ring */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#F8F6F1" strokeWidth="8" />
            <motion.circle
              cx="50" cy="50" r="45" fill="none"
              className={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
              strokeDasharray={circumference}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-xl font-heading font-bold ${scoreColor}`}>{health.overallScore}</span>
            <span className="text-[10px] font-body text-rani-muted">/100</span>
          </div>
        </div>

        {/* Status counts */}
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-body text-rani-navy">{health.passed} passed</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-body text-rani-navy">{health.warnings} warnings</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-body text-rani-navy">{health.criticalIssues} critical</span>
          </div>
        </div>
      </div>

      {/* Critical issues list */}
      {health.criticalIssues > 0 && (
        <div className="mt-4 pt-3 border-t border-rani-border/20">
          <p className="text-[10px] font-body text-red-500 font-medium mb-1">Critical Issues:</p>
          {health.checks.filter(c => c.status === 'fail').slice(0, 3).map(check => (
            <p key={check.name} className="text-[11px] font-body text-rani-muted mb-0.5">
              &bull; {check.name}: {check.detail}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
