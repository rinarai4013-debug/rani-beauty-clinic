'use client';

import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, Users, Lightbulb } from 'lucide-react';
import { DashboardErrorBoundary, InlineError, PanelSkeleton, KPIRowSkeleton } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import PricingMatrix from '@/components/dashboard/finance/PricingMatrix';
import { usePricingIntelligence } from '@/hooks/useDashboardData';
import type { PricingIntelligenceResult } from '@/lib/finance/pricing-intelligence';

interface PricingResponse {
  success: boolean;
  data: PricingIntelligenceResult;
}

export default function PricingIntelPage() {
  return (
    <DashboardErrorBoundary pageName="Pricing Intelligence">
      <PricingContent />
    </DashboardErrorBoundary>
  );
}

function PricingContent() {
  const { data: raw, isLoading, error, mutate } = usePricingIntelligence() as {
    data: PricingResponse | undefined; isLoading: boolean; error: unknown; mutate: () => void;
  };
  const data = raw?.data;

  if (error) return <InlineError message="Failed to load pricing data" onRetry={() => mutate()} />;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <KPIRowSkeleton count={3} />
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
    );
  }

  if (!data) {
    return <DashboardEmptyState icon="dollar" title="Pricing intelligence not available" description="Add service and competitor data to enable pricing optimization." />;
  }

  const { serviceAnalysis, competitorComparison, bundleRecommendations, membershipAnalysis, acquisitionAnalysis, providerPricing, overallInsights } = data;

  const totalUplift = serviceAnalysis.reduce((s, sa) => s + Math.max(0, sa.potentialUplift), 0);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Pricing Intelligence</h1>
        <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">Competitor analysis, elasticity modeling, and optimization</p>
      </div>

      {/* Overall insights */}
      {overallInsights.length > 0 && (
        <div className="space-y-2">
          {overallInsights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                insight.category === 'opportunity' ? 'border-green-200 bg-green-50' :
                insight.category === 'risk' ? 'border-red-200 bg-red-50' :
                'border-blue-200 bg-blue-50'
              }`}
            >
              <Lightbulb className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                insight.category === 'opportunity' ? 'text-green-600' :
                insight.category === 'risk' ? 'text-red-500' : 'text-blue-500'
              }`} />
              <div>
                <p className="text-sm font-body font-medium text-rani-navy">{insight.title}</p>
                <p className="text-xs font-body text-rani-muted mt-0.5">{insight.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs text-rani-muted font-body">Revenue Uplift Potential</span>
          </div>
          <p className="text-lg font-heading font-semibold text-green-600">+${totalUplift.toLocaleString()}/mo</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-rani-gold" />
            <span className="text-xs text-rani-muted font-body">Competitors Tracked</span>
          </div>
          <p className="text-lg font-heading font-semibold text-rani-navy">{competitorComparison.totalCompetitors}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-rani-gold" />
            <span className="text-xs text-rani-muted font-body">LTV:CAC Ratio</span>
          </div>
          <p className="text-lg font-heading font-semibold text-rani-navy">{acquisitionAnalysis.ltvCacRatio}x</p>
          <p className="text-[10px] text-rani-muted font-body">Best: {acquisitionAnalysis.bestChannel}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-4 bg-white rounded-xl border border-gray-200">
          <span className="text-xs text-rani-muted font-body">Avg Acquisition Cost</span>
          <p className="text-lg font-heading font-semibold text-rani-navy">${acquisitionAnalysis.avgCAC}</p>
          <p className="text-[10px] text-rani-muted font-body">{acquisitionAnalysis.paybackMonths > 0 ? `${acquisitionAnalysis.paybackMonths}mo payback` : ''}</p>
        </motion.div>
      </div>

      {/* Pricing matrix */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">Service Pricing vs Market</h3>
        <PricingMatrix services={serviceAnalysis} competitorComparison={competitorComparison} />
      </div>

      {/* Bundle recommendations */}
      {bundleRecommendations.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">Bundle Recommendations</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {bundleRecommendations.map((bundle, i) => (
              <motion.div
                key={bundle.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-xl border border-gray-200 hover:border-rani-gold/40 transition-colors"
              >
                <h4 className="text-sm font-heading font-semibold text-rani-navy mb-2">{bundle.name}</h4>
                <div className="space-y-1 mb-3">
                  {bundle.services.map(s => (
                    <div key={s.service} className="flex justify-between text-xs font-body">
                      <span className="text-rani-muted">{s.service}</span>
                      <span>
                        <span className="line-through text-rani-muted mr-1">${s.regularPrice}</span>
                        <span className="font-semibold text-rani-navy">${s.bundlePrice}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs font-body text-green-600 font-medium">{bundle.discount}% off</span>
                  <span className="text-sm font-heading font-semibold text-rani-gold">${bundle.bundlePrice}</span>
                </div>
                <p className="text-[10px] text-rani-muted font-body mt-2">{bundle.rationale}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Membership analysis + Provider pricing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {membershipAnalysis.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">Membership Economics</h3>
            <div className="space-y-3">
              {membershipAnalysis.map(m => (
                <div key={m.tier} className="p-3 rounded-lg bg-rani-cream/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-body font-medium text-rani-navy">{m.tier}</span>
                    <span className="text-sm font-heading font-semibold text-rani-gold">${m.monthlyPrice}/mo</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                      <p className="text-[10px] text-rani-muted font-body">LTV</p>
                      <p className="text-xs font-body font-semibold text-rani-navy">${m.avgLTV.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-rani-muted font-body">Profit/Mo</p>
                      <p className={`text-xs font-body font-semibold ${m.profitPerMember >= 0 ? 'text-green-600' : 'text-red-500'}`}>${m.profitPerMember}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-rani-muted font-body">Members</p>
                      <p className="text-xs font-body font-semibold text-rani-navy">{m.memberCount}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-rani-muted font-body">{m.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {providerPricing.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">Provider Utilization & Pricing</h3>
            <div className="space-y-3">
              {providerPricing.map(p => (
                <div key={p.provider} className="p-3 rounded-lg bg-rani-cream/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-body font-medium text-rani-navy">{p.provider}</span>
                    <span className="text-xs font-body text-rani-muted">{Math.round(p.utilizationRate * 100)}% utilized</span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-body text-rani-muted">${p.currentRevenuePerHour}/hr</span>
                    <span className="text-[10px] text-rani-muted">target: ${p.targetRevenuePerHour}/hr</span>
                  </div>
                  <p className="text-[10px] text-rani-muted font-body">{p.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
