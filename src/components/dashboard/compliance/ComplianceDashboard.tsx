'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2,
  Clock, FileWarning, Activity, Calendar, TrendingUp,
} from 'lucide-react';
import type { ComplianceScore, ComplianceDeadline } from '@/types/compliance';

// ── Score Ring ────────────────────────────────────────────────────────

function ScoreRing({ score, size = 160, status }: { score: number; size?: number; status: string }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const colorMap: Record<string, string> = {
    exemplary: '#10B981',
    compliant: '#C9A96E',
    at_risk: '#F59E0B',
    critical: '#EF4444',
  };

  const color = colorMap[status] || '#C9A96E';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#F3F4F6" strokeWidth="8"
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-rani-navy font-body">{score}</span>
        <span className="text-xs text-rani-muted font-body uppercase tracking-wider">
          {status.replace('_', ' ')}
        </span>
      </div>
    </div>
  );
}

// ── Category Card ────────────────────────────────────────────────────

function CategoryCard({
  label, score, issues, maxScore = 100,
}: {
  label: string; score: number; issues: number; maxScore?: number;
}) {
  const percentage = Math.round((score / maxScore) * 100);
  const color = percentage >= 90 ? 'bg-emerald-500' : percentage >= 75 ? 'bg-rani-gold' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = percentage >= 90 ? 'text-emerald-600' : percentage >= 75 ? 'text-rani-gold-accessible' : percentage >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 10px 40px rgba(15, 29, 44, 0.08)' }}
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-body font-semibold uppercase tracking-wider text-rani-muted">
          {label}
        </span>
        <span className={`text-sm font-body font-bold ${textColor}`}>{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>
      {issues > 0 && (
        <p className="text-[11px] font-body text-red-500 mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {issues} issue{issues !== 1 ? 's' : ''} found
        </p>
      )}
    </motion.div>
  );
}

// ── Deadline Item ────────────────────────────────────────────────────

function DeadlineItem({ deadline }: { deadline: ComplianceDeadline }) {
  const severityColors: Record<string, string> = {
    critical: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  const SeverityIcon = deadline.severity === 'critical' ? ShieldAlert
    : deadline.severity === 'warning' ? AlertTriangle
    : Clock;

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${severityColors[deadline.severity]}`}>
      <SeverityIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-body font-medium truncate">{deadline.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] font-body opacity-70">
            {deadline.daysUntilDue < 0
              ? `${Math.abs(deadline.daysUntilDue)} days overdue`
              : deadline.daysUntilDue === 0
                ? 'Due today'
                : `${deadline.daysUntilDue} days remaining`}
          </span>
          <span className="text-[11px] font-body opacity-50">|</span>
          <span className="text-[11px] font-body opacity-70">{deadline.category}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ───────────────────────────────────────────────────

interface ComplianceDashboardProps {
  complianceScore: ComplianceScore;
}

export default function ComplianceDashboard({ complianceScore }: ComplianceDashboardProps) {
  const { overall, categories, status, upcomingDeadlines, overdueItems } = complianceScore;

  const StatusIcon = status === 'exemplary' ? ShieldCheck
    : status === 'compliant' ? Shield
    : status === 'at_risk' ? AlertTriangle
    : ShieldAlert;

  const totalIssues = Object.values(categories).reduce((sum, c) => sum + c.issues, 0);

  return (
    <div className="space-y-6">
      {/* Hero Score */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-6">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <ScoreRing score={overall} status={status} />

          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
              <StatusIcon className="w-5 h-5 text-rani-gold-accessible" />
              <h2 className="text-lg font-body font-bold text-rani-navy">
                Compliance Score
              </h2>
            </div>
            <p className="text-sm font-body text-rani-muted max-w-md">
              {status === 'exemplary'
                ? 'Outstanding compliance across all regulatory areas.'
                : status === 'compliant'
                  ? 'Meeting compliance requirements with minor items to address.'
                  : status === 'at_risk'
                    ? 'Several compliance gaps require attention.'
                    : 'Critical compliance issues require immediate action.'}
            </p>

            <div className="flex items-center justify-center lg:justify-start gap-6 mt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-body text-rani-muted">
                  {8 - Object.values(categories).filter((c) => c.issues > 0).length} areas clear
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-body text-rani-muted">
                  {totalIssues} total issue{totalIssues !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-body text-rani-muted">
                  {upcomingDeadlines.length} upcoming deadline{upcomingDeadlines.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Object.entries(categories).map(([key, cat]) => (
          <CategoryCard key={key} label={cat.label} score={cat.score} issues={cat.issues} />
        ))}
      </div>

      {/* Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Items */}
        {overdueItems.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-red-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-body font-semibold uppercase tracking-wider text-red-700">
                Overdue Items ({overdueItems.length})
              </h3>
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {overdueItems.map((item) => (
                <DeadlineItem key={item.id} deadline={item} />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Deadlines */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-rani-gold-accessible" />
            <h3 className="text-sm font-body font-semibold uppercase tracking-wider text-rani-muted">
              Upcoming Deadlines ({upcomingDeadlines.length})
            </h3>
          </div>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm font-body text-rani-muted py-4 text-center">
              No upcoming deadlines
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {upcomingDeadlines.slice(0, 10).map((deadline) => (
                <DeadlineItem key={deadline.id} deadline={deadline} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
