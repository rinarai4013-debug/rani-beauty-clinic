'use client';

import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Package, Zap, Tag, Star, Gift } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
import { usePricingAnalysis } from '@/hooks/useDashboardData';
import { DashboardErrorBoundary, KPIRowSkeleton, PanelSkeleton, TableSkeleton, SkeletonBar } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import type { DynamicPricingResult, PricingRecommendation, PackageRecommendation, PromotionalStrategy } from '@/lib/pricing/dynamic-engine';

interface PricingResponse {
  success: boolean;
  data: DynamicPricingResult;
}

const STRATEGY_LABELS: Record<string, { label: string; color: string }> = {
  demand_premium: { label: 'Demand Premium', color: 'bg-green-50 text-green-700' },
  capacity_fill: { label: 'Capacity Fill', color: 'bg-blue-50 text-blue-700' },
  margin_optimization: { label: 'Margin Boost', color: 'bg-amber-50 text-amber-700' },
  competitive_adjustment: { label: 'Market Adjust', color: 'bg-purple-50 text-purple-700' },
  membership_incentive: { label: 'Member Incentive', color: 'bg-indigo-50 text-indigo-700' },
  seasonal: { label: 'Seasonal', color: 'bg-pink-50 text-pink-700' },
};

const PROMO_ICONS: Record<string, React.ElementType> = {
  flash_sale: Zap,
  off_peak: Tag,
  new_client: Star,
  membership_upsell: Gift,
  seasonal: TrendingUp,
  bundle: Package,
};

export default function PricingIntelligencePage() {
  return (
    <DashboardErrorBoundary pageName="Pricing Intelligence">
      <PricingIntelligenceContent />
    </DashboardErrorBoundary>
  );
}

function PricingIntelligenceContent() {
  const { data: raw, isLoading } = usePricingAnalysis() as { data: PricingResponse | undefined; isLoading: boolean };
  const data = raw?.data;

  const recommendations = data?.priceRecommendations || [];
  const packages = data?.packages || [];
  const promotions = data?.promotions || [];
  const insights = data?.insights || [];
  const healthScore = data?.overallHealthScore || 0;
  const projectedImpact = data?.projectedRevenueImpact || 0;

  const increaseCount = recommendations.filter(r => r.priceChange > 0).length;
  const decreaseCount = recommendations.filter(r => r.priceChange < 0).length;

  /* ─── Loading State ─────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="animate-pulse space-y-2">
          <SkeletonBar className="h-7 w-48" />
          <SkeletonBar className="h-3 w-72" />
        </div>
        <KPIRowSkeleton count={4} />
        <PanelSkeleton rows={3} />
        <TableSkeleton rows={5} cols={7} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <PanelSkeleton rows={4} />
          <PanelSkeleton rows={4} />
        </div>
        <PanelSkeleton rows={4} />
      </div>
    );
  }

  /* ─── Empty State ───────────────────────────────────────────────── */
  if (!data) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Pricing Intelligence</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">AI-powered pricing, packages, and promotional strategies</p>
        </div>
        <DashboardEmptyState
          icon="dollar"
          title="No Pricing Data Available"
          description="Pricing intelligence will appear here once there is enough transaction and service data to analyze."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Pricing Intelligence</h1>
        <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">AI-powered pricing, packages, and promotional strategies</p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
        <KPICard title="Pricing Health" value={healthScore} suffix="/100" icon="heart" size="hero" />
        <KPICard title="Revenue Impact" value={Math.abs(projectedImpact)} prefix={projectedImpact >= 0 ? '+$' : '-$'} suffix="/mo" icon="dollar-sign" />
        <KPICard title="Price Increases" value={increaseCount} icon="trending-up" />
        <KPICard title="Active Packages" value={packages.length} icon="package" />
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-rani-navy to-rani-navy-light rounded-xl p-4 sm:p-6 text-white"
        >
          <h3 className="text-xs sm:text-sm font-body font-semibold uppercase tracking-wider text-rani-gold mb-3">AI Insights</h3>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <p key={i} className="text-xs sm:text-sm font-body text-white/80 leading-relaxed">
                <span className="text-rani-gold mr-2">&#x2022;</span>{insight}
              </p>
            ))}
          </div>
        </motion.div>
      )}

      {/* Price Recommendations */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
          Price Recommendations
        </h3>
        {recommendations.length === 0 ? (
          <DashboardEmptyState
            icon="trending"
            title="All prices are optimally set"
            description="No adjustments needed at this time."
            compact
          />
        ) : (
          <div className="overflow-x-auto -mx-4 sm:-mx-5 px-4 sm:px-5">
            <table className="w-full text-xs sm:text-sm font-body">
              <thead>
                <tr className="border-b border-rani-border">
                  <th className="text-left py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase">Service</th>
                  <th className="text-left py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase hidden sm:table-cell">Strategy</th>
                  <th className="text-right py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase">Current</th>
                  <th className="text-right py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase">Suggested</th>
                  <th className="text-right py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase">Change</th>
                  <th className="text-center py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase hidden md:table-cell">Confidence</th>
                  <th className="text-right py-2 px-2 sm:px-3 text-xs font-semibold text-rani-muted uppercase hidden sm:table-cell">Impact/Mo</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((rec, i) => {
                  const strategyInfo = STRATEGY_LABELS[rec.strategy] || { label: rec.strategy, color: 'bg-gray-50 text-gray-600' };
                  return (
                    <motion.tr
                      key={rec.service}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-rani-border/50 hover:bg-rani-cream/30"
                    >
                      <td className="py-3 px-2 sm:px-3 font-medium text-rani-navy truncate max-w-[120px] sm:max-w-none">{rec.service}</td>
                      <td className="py-3 px-2 sm:px-3 hidden sm:table-cell">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${strategyInfo.color}`}>
                          {strategyInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-right text-rani-muted">${rec.currentPrice}</td>
                      <td className="py-3 px-2 sm:px-3 text-right font-semibold text-rani-navy">${rec.suggestedPrice}</td>
                      <td className="py-3 px-2 sm:px-3 text-right">
                        <span className={`flex items-center justify-end gap-1 font-semibold ${rec.priceChange > 0 ? 'text-green-600' : 'text-blue-600'}`}>
                          {rec.priceChange > 0 ? <ArrowUpRight className="w-3 h-3 flex-shrink-0" /> : <ArrowDownRight className="w-3 h-3 flex-shrink-0" />}
                          {rec.priceChange > 0 ? '+' : ''}{rec.priceChange.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-2 sm:px-3 hidden md:table-cell">
                        <div className="flex justify-center">
                          <ProgressBar current={rec.confidence} target={100} showPercentage={false} height={6} colorMode="gold" />
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:px-3 text-right font-semibold text-rani-navy hidden sm:table-cell">
                        {rec.estimatedRevenueImpact >= 0 ? '+' : ''}${rec.estimatedRevenueImpact.toLocaleString()}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Smart Packages */}
      <div>
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
          Smart Package Recommendations
        </h3>
        {packages.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
            <DashboardEmptyState
              icon="package"
              title="No Package Recommendations"
              description="Package suggestions will appear once there is enough service usage data."
              compact
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {packages.map((pkg, i) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5 hover:border-rani-gold/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm sm:text-base font-heading text-rani-navy truncate">{pkg.name}</h4>
                    <p className="text-xs font-body text-rani-muted mt-0.5 truncate">{pkg.targetSegment}</p>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-body font-semibold flex-shrink-0">
                    {pkg.margin}% margin
                  </span>
                </div>
                <div className="space-y-1 mb-3">
                  {pkg.services.map((svc, j) => (
                    <div key={j} className="flex justify-between text-xs sm:text-sm font-body gap-2">
                      <span className="text-rani-text truncate">{svc.service}</span>
                      <span className="text-rani-muted line-through flex-shrink-0">${svc.regularPrice}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-rani-border/50 gap-2">
                  <div className="min-w-0">
                    <span className="text-base sm:text-lg font-heading text-rani-navy">${pkg.packagePrice}</span>
                    <span className="text-[10px] sm:text-xs font-body text-rani-muted ml-2">Save ${pkg.savings} ({pkg.savingsPercent}% off)</span>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs font-body text-rani-muted mt-2 italic">{pkg.rationale}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Promotional Strategies */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
          Promotional Strategies
        </h3>
        {promotions.length === 0 ? (
          <DashboardEmptyState
            icon="megaphone"
            title="No Promotional Strategies"
            description="Promotional recommendations will appear based on demand patterns and capacity data."
            compact
          />
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {promotions.map((promo, i) => {
              const Icon = PROMO_ICONS[promo.type] || Tag;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-rani-cream/30 hover:bg-rani-cream/50 transition-colors"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-rani-gold/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-rani-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-body font-semibold text-rani-navy truncate">{promo.title}</h4>
                      {promo.discount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-medium flex-shrink-0">
                          {promo.discount}% OFF
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs font-body text-rani-muted mt-1">{promo.description}</p>
                    <div className="flex items-center gap-3 sm:gap-4 mt-2 text-[10px] sm:text-xs font-body text-rani-muted flex-wrap">
                      <span>Valid: {promo.validFor}</span>
                      <span>Expected lift: +{promo.expectedLift}%</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
