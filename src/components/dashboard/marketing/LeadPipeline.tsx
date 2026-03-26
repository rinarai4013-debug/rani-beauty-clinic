'use client';

import { motion } from 'framer-motion';
import { Users, TrendingUp, Zap, Clock } from 'lucide-react';
import type { LeadGrade } from '@/lib/marketing/lead-scoring';

interface PipelineData {
  total: number;
  byGrade: Record<LeadGrade, number>;
  byUrgency: Record<string, number>;
  avgScore: number;
  hotLeads: number;
  autoAssigned: number;
}

const GRADE_CONFIG: Record<LeadGrade, { label: string; color: string; bgColor: string }> = {
  A: { label: 'Hot', color: 'bg-emerald-500', bgColor: 'bg-emerald-50' },
  B: { label: 'Warm', color: 'bg-amber-500', bgColor: 'bg-amber-50' },
  C: { label: 'Cool', color: 'bg-slate-400', bgColor: 'bg-slate-50' },
  D: { label: 'Cold', color: 'bg-red-400', bgColor: 'bg-red-50' },
};

interface LeadPipelineProps {
  data: PipelineData;
  loading?: boolean;
}

export default function LeadPipeline({ data, loading }: LeadPipelineProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-rani-border/30 bg-white p-5 animate-pulse">
        <div className="h-5 w-36 bg-rani-cream rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-rani-cream rounded" />
          ))}
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...Object.values(data.byGrade), 1);

  return (
    <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-sm font-semibold text-rani-navy flex items-center gap-2">
          <Users className="w-4 h-4" />
          Lead Pipeline
        </h3>
        <span className="text-xs font-body text-rani-muted">{data.total} leads</span>
      </div>

      {/* Grade bars */}
      <div className="space-y-3 mb-5">
        {(['A', 'B', 'C', 'D'] as LeadGrade[]).map(grade => {
          const config = GRADE_CONFIG[grade];
          const count = data.byGrade[grade] || 0;
          const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={grade}>
              <div className="flex items-center justify-between text-xs font-body mb-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold font-heading text-white ${config.color}`}>
                    {grade}
                  </span>
                  <span className="text-rani-navy font-medium">{config.label}</span>
                </div>
                <span className="text-rani-muted">{count}</span>
              </div>
              <div className="h-2.5 rounded-full bg-rani-cream overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: 0.1 * (['A', 'B', 'C', 'D'].indexOf(grade)) }}
                  className={`h-full rounded-full ${config.color}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-rani-border/20">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-rani-muted mb-0.5">
            <TrendingUp className="w-3 h-3" />
            <span className="text-[10px] font-body">Avg Score</span>
          </div>
          <span className="text-sm font-heading font-bold text-rani-navy">{data.avgScore}</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-rani-muted mb-0.5">
            <Zap className="w-3 h-3" />
            <span className="text-[10px] font-body">Hot Leads</span>
          </div>
          <span className="text-sm font-heading font-bold text-emerald-600">{data.hotLeads}</span>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-rani-muted mb-0.5">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] font-body">Auto-Assign</span>
          </div>
          <span className="text-sm font-heading font-bold text-rani-navy">{data.autoAssigned}</span>
        </div>
      </div>
    </div>
  );
}
