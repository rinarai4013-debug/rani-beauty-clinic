'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, Filter, RefreshCw } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import { LeadScoreCard, LeadPipeline } from '@/components/dashboard/marketing';
import { DashboardErrorBoundary, PanelSkeleton } from '@/components/dashboard/shared';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { LeadScore, LeadGrade } from '@/lib/marketing/lead-scoring';

interface LeadScoringData {
  leads: {
    id: string;
    name: string;
    source: string;
    score: LeadScore;
  }[];
  pipeline: {
    total: number;
    byGrade: Record<LeadGrade, number>;
    byUrgency: Record<string, number>;
    avgScore: number;
    hotLeads: number;
    autoAssigned: number;
  };
  sourceQuality: { source: string; quality: number; leads: number; conversions: number }[];
  calibration: {
    gradeConversionRates: Record<LeadGrade, number>;
    modelAccuracy: number;
  };
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function LeadScoringPage() {
  const { data, isLoading, retry } = useDashboardData<LeadScoringData>('/marketing/leads', {
    refreshInterval: 60000,
  });
  const [gradeFilter, setGradeFilter] = useState<LeadGrade | 'all'>('all');

  const filteredLeads = (data?.leads || []).filter(
    lead => gradeFilter === 'all' || lead.score.grade === gradeFilter
  );

  return (
    <DashboardErrorBoundary pageName="Lead Scoring">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 sm:space-y-8">
        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Lead Scoring Dashboard</h1>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
              Multi-factor scoring with auto-assignment for hot leads
            </p>
          </div>
          <button onClick={retry} className="p-2 rounded-lg border border-rani-border/30 hover:bg-rani-cream transition-colors">
            <RefreshCw className="w-4 h-4 text-rani-muted" />
          </button>
        </motion.div>

        {/* KPI Row */}
        <motion.div variants={item}>
          {isLoading ? (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-rani-cream rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
              <KPICard title="Total Leads" value={data?.pipeline?.total ?? 0} icon="users" />
              <KPICard
                title="Hot Leads (A)"
                value={data?.pipeline?.hotLeads ?? 0}
                trend={{ value: 0, direction: 'flat', label: 'need immediate action' }}
              />
              <KPICard title="Avg Score" value={data?.pipeline?.avgScore ?? 0} suffix="/100" />
              <KPICard
                title="Model Accuracy"
                value={data?.calibration?.modelAccuracy ?? 0}
                suffix="%"
                trend={{ value: 0, direction: 'flat', label: 'prediction accuracy' }}
              />
            </div>
          )}
        </motion.div>

        {/* Pipeline + Conversion Rates */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LeadPipeline data={data?.pipeline || { total: 0, byGrade: { A: 0, B: 0, C: 0, D: 0 }, byUrgency: {}, avgScore: 0, hotLeads: 0, autoAssigned: 0 }} loading={isLoading} />

          {/* Grade conversion rates */}
          <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
            <h3 className="font-heading text-sm font-semibold text-rani-navy mb-4">Conversion by Grade</h3>
            {isLoading ? <PanelSkeleton /> : (
              <div className="space-y-3">
                {(['A', 'B', 'C', 'D'] as LeadGrade[]).map(grade => {
                  const rate = data?.calibration?.gradeConversionRates?.[grade] ?? 0;
                  return (
                    <div key={grade}>
                      <div className="flex justify-between text-xs font-body mb-1">
                        <span className="text-rani-navy font-medium">Grade {grade}</span>
                        <span className="text-rani-muted">{rate.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-rani-cream overflow-hidden">
                        <div className={`h-full rounded-full ${
                          grade === 'A' ? 'bg-emerald-500' : grade === 'B' ? 'bg-amber-500' : grade === 'C' ? 'bg-slate-400' : 'bg-red-400'
                        }`} style={{ width: `${Math.min(100, rate)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Source quality */}
          <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
            <h3 className="font-heading text-sm font-semibold text-rani-navy mb-4">Source Quality</h3>
            {isLoading ? <PanelSkeleton /> : (
              <div className="space-y-2">
                {(data?.sourceQuality || []).slice(0, 8).map(src => (
                  <div key={src.source} className="flex items-center justify-between py-1 border-b border-rani-border/10 last:border-0">
                    <span className="text-xs font-body text-rani-navy capitalize">{src.source.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-body text-rani-muted">{src.leads} leads</span>
                      <span className={`text-xs font-heading font-bold ${src.quality >= 80 ? 'text-emerald-600' : src.quality >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                        {src.quality}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Filter + Lead Cards */}
        <motion.div variants={item}>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-rani-muted" />
            <span className="text-xs font-body text-rani-muted">Filter:</span>
            {(['all', 'A', 'B', 'C', 'D'] as const).map(grade => (
              <button
                key={grade}
                onClick={() => setGradeFilter(grade)}
                className={`px-3 py-1 rounded-lg text-xs font-body transition-all ${
                  gradeFilter === grade ? 'bg-rani-navy text-white' : 'bg-rani-cream text-rani-muted hover:text-rani-navy'
                }`}
              >
                {grade === 'all' ? 'All' : `Grade ${grade}`}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-rani-cream rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeads.map(lead => (
                <LeadScoreCard
                  key={lead.id}
                  leadName={lead.name}
                  leadSource={lead.source}
                  score={lead.score}
                />
              ))}
              {filteredLeads.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Target className="w-8 h-8 text-rani-muted mx-auto mb-2" />
                  <p className="text-sm font-body text-rani-muted">No leads found for this filter</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardErrorBoundary>
  );
}
