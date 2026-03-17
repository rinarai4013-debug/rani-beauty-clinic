'use client';

import { motion } from 'framer-motion';
import { Target, DollarSign, TrendingUp, AlertTriangle, Eye, MousePointer, Users, Zap, ArrowUp, ArrowDown } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import { useMetaAdsOptimizer } from '@/hooks/useDashboardData';
import type { MetaAdsIntelligence } from '@/lib/ads/meta-ads-manager';

interface MetaAdsResponse {
  success: boolean;
  data: MetaAdsIntelligence;
}

const PERFORMANCE_COLORS: Record<string, string> = {
  excellent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  good: 'bg-green-50 text-green-700 border-green-200',
  average: 'bg-amber-50 text-amber-700 border-amber-200',
  poor: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-500/20 text-red-300',
  medium: 'bg-amber-500/20 text-amber-300',
  low: 'bg-green-500/20 text-green-300',
};

export default function MetaAdsAIPage() {
  const { data: raw, isLoading } = useMetaAdsOptimizer() as { data: MetaAdsResponse | undefined; isLoading: boolean };
  const data = raw?.data;

  const summary = data?.performanceSummary;
  const campaigns = data?.campaignAnalysis || [];
  const optimizations = data?.optimizations || [];
  const adCopy = data?.adCopyVariants || [];
  const budgetRecs = data?.budgetRecommendations || [];
  const audiences = data?.audienceInsights || [];
  const fatigue = data?.creativeFatigue || [];
  const funnel = data?.funnelAnalysis || [];
  const adScore = data?.adScore || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading text-rani-navy">Meta Ads AI Manager</h1>
        <p className="text-sm font-body text-rani-muted mt-1">AI-powered campaign optimization, budget allocation, and ad copy generation</p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <KPICard title="Ad Score" value={adScore} suffix="/100" icon="zap" size="hero" />
        <KPICard title="Total Spent" value={summary?.totalSpent || 0} prefix="$" icon="dollar-sign" />
        <KPICard title="Revenue" value={summary?.totalRevenue || 0} prefix="$" icon="trending-up" />
        <KPICard title="ROAS" value={summary?.overallROAS || 0} suffix="x" icon="target" />
        <KPICard title="CPA" value={summary?.overallCPA || 0} prefix="$" icon="dollar-sign" />
      </div>

      {/* Performance Summary */}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-rani-navy to-rani-navy-light rounded-xl p-6 text-white"
        >
          <h3 className="text-sm font-body font-semibold uppercase tracking-wider text-rani-gold mb-4">
            Performance Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] font-body text-white/40 uppercase">Total Leads</p>
              <p className="text-xl font-heading text-white">{summary.totalLeads}</p>
              <p className="text-[10px] font-body text-white/60">CPL: ${summary.overallCPL.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-body text-white/40 uppercase">Conversions</p>
              <p className="text-xl font-heading text-white">{summary.totalConversions}</p>
              <p className="text-[10px] font-body text-white/60">CPA: ${summary.overallCPA.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-body text-white/40 uppercase">Avg CTR</p>
              <p className="text-xl font-heading text-white">{summary.avgCTR.toFixed(2)}%</p>
            </div>
            <div>
              <p className="text-[10px] font-body text-white/40 uppercase">Budget Used</p>
              <p className="text-xl font-heading text-white">{summary.budgetUtilization.toFixed(0)}%</p>
              <ProgressBar current={summary.budgetUtilization} target={100} showPercentage={false} height={4} colorMode="gold" />
            </div>
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-body text-white/40">ROAS vs Target:</span>
              <span className={`text-sm font-semibold ${summary.vsTarget.roasVsTarget >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {summary.vsTarget.roasVsTarget >= 0 ? '+' : ''}{summary.vsTarget.roasVsTarget.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-body text-white/40">CPA vs Target:</span>
              <span className={`text-sm font-semibold ${summary.vsTarget.cpaVsTarget <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {summary.vsTarget.cpaVsTarget >= 0 ? '+' : ''}{summary.vsTarget.cpaVsTarget.toFixed(0)}%
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Campaign Analysis + Optimizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Performance */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Campaign Performance
          </h3>
          <div className="space-y-3">
            {campaigns.map((camp, i) => (
              <motion.div
                key={camp.campaignId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-lg bg-rani-cream/30 border border-rani-border/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-body font-semibold text-rani-navy">{camp.campaignName}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${PERFORMANCE_COLORS[camp.performance]}`}>
                    {camp.performance}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs font-body">
                  <div>
                    <p className="text-rani-muted text-[10px]">Spent</p>
                    <p className="font-semibold text-rani-navy">${camp.spent.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-rani-muted text-[10px]">Revenue</p>
                    <p className="font-semibold text-green-600">${camp.revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-rani-muted text-[10px]">ROAS</p>
                    <p className="font-semibold text-rani-navy">{camp.roas.toFixed(2)}x</p>
                  </div>
                  <div>
                    <p className="text-rani-muted text-[10px]">Leads</p>
                    <p className="font-semibold text-rani-navy">{camp.leads}</p>
                  </div>
                </div>
                <p className="text-[10px] font-body text-rani-muted mt-2 italic">{camp.recommendation}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Optimizations */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            AI Optimization Actions ({optimizations.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {optimizations.map((opt, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-3 rounded-lg bg-rani-cream/30 border border-rani-border/50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${PRIORITY_COLORS[opt.priority]}`}>
                    {opt.priority.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-body text-rani-muted uppercase">{opt.type.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-xs font-body text-rani-text">{opt.description}</p>
                <p className="text-[10px] font-body text-green-600 mt-1">{opt.expectedImpact}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Ad Copy Variants */}
      {adCopy.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            AI-Generated Ad Copy Variants
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adCopy.map((copy, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-lg bg-rani-cream/30 border border-rani-border/50 hover:border-rani-gold/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-body font-semibold text-rani-gold uppercase">{copy.forService}</span>
                  <span className="text-[10px] font-body text-rani-muted">{copy.angle}</span>
                </div>
                <p className="text-sm font-body font-semibold text-rani-navy mb-1">{copy.headline}</p>
                <p className="text-xs font-body text-rani-text line-clamp-3">{copy.primaryText}</p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-rani-border/30">
                  <span className="text-[10px] font-body text-rani-muted">{copy.callToAction}</span>
                  <span className="text-[10px] font-body font-semibold text-green-600">Est CTR: {copy.estimatedCTR}%</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Recommendations */}
        {budgetRecs.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
              Budget Recommendations
            </h3>
            <div className="space-y-3">
              {budgetRecs.map((rec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-lg bg-rani-cream/30 border border-rani-border/50"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-body font-semibold text-rani-navy">{rec.campaignName}</span>
                    <div className="flex items-center gap-1">
                      {rec.change > 0 ? (
                        <ArrowUp className="w-3 h-3 text-green-500" />
                      ) : (
                        <ArrowDown className="w-3 h-3 text-red-500" />
                      )}
                      <span className={`text-xs font-semibold ${rec.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {rec.change > 0 ? '+' : ''}{rec.change}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] font-body text-rani-muted">
                    <span>${rec.currentBudget} → ${rec.recommendedBudget}</span>
                    <span>Proj ROAS: {rec.expectedROAS.toFixed(1)}x</span>
                  </div>
                  <p className="text-[10px] font-body text-rani-muted mt-1 italic">{rec.reason}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Funnel Analysis */}
        {funnel.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
              Full Funnel Analysis
            </h3>
            <div className="space-y-2">
              {funnel.map((step, i) => {
                const isLast = i === funnel.length - 1;
                return (
                  <motion.div
                    key={step.stage}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-rani-gold/10 flex items-center justify-center text-sm font-heading text-rani-gold">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-body font-semibold text-rani-navy capitalize">{step.stage}</span>
                          <span className="text-sm font-heading text-rani-navy">{step.count.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-body text-rani-muted">
                          <span>Cost/action: ${step.costPerAction.toFixed(2)}</span>
                          {!isLast && <span>→ {step.conversionRate.toFixed(1)}% convert</span>}
                        </div>
                      </div>
                    </div>
                    {!isLast && (
                      <div className="ml-4 border-l-2 border-rani-border/30 h-4" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Audience Insights + Creative Fatigue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {audiences.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
              Audience Insights
            </h3>
            <div className="space-y-3">
              {audiences.map((aud, i) => (
                <motion.div
                  key={aud.segment}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-lg bg-rani-cream/30 border border-rani-border/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-rani-gold" />
                      <span className="text-xs font-body font-semibold text-rani-navy">{aud.segment}</span>
                    </div>
                    <span className="text-[10px] font-body text-rani-muted">{aud.size}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] font-body text-rani-muted">Performance</span>
                    <span className="text-xs font-semibold text-rani-navy">{aud.performance}/100</span>
                  </div>
                  <ProgressBar current={aud.performance} target={100} showPercentage={false} height={4} colorMode="gold" />
                  <p className="text-[10px] font-body text-rani-muted mt-2 italic">{aud.recommendation}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {fatigue.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
              Creative Fatigue Alerts
            </h3>
            <div className="space-y-3">
              {fatigue.map((alert, i) => (
                <motion.div
                  key={alert.adId}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-lg bg-red-50/50 border border-red-200/50"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <span className="text-xs font-body font-semibold text-rani-navy">{alert.adName}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px] font-body">
                    <div>
                      <span className="text-rani-muted">Frequency</span>
                      <p className="font-semibold text-red-600">{alert.frequency.toFixed(1)}x</p>
                    </div>
                    <div>
                      <span className="text-rani-muted">CTR Drop</span>
                      <p className="font-semibold text-red-600">-{alert.ctrDecline}%</p>
                    </div>
                    <div>
                      <span className="text-rani-muted">Days Running</span>
                      <p className="font-semibold text-rani-navy">{alert.daysRunning}</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-body text-red-600 mt-1">{alert.action}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
