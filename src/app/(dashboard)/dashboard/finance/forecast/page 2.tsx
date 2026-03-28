'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart2, Target } from 'lucide-react';
import { DashboardErrorBoundary, InlineError, PanelSkeleton, ChartSkeleton, KPIRowSkeleton } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import ForecastChart from '@/components/dashboard/finance/ForecastChart';
import ScenarioSlider from '@/components/dashboard/finance/ScenarioSlider';
import { useRevenueForecast } from '@/hooks/useDashboardData';
import { runScenario, type ScenarioType, type MonthlyProjection, type ScenarioResult } from '@/lib/finance/forecasting';

interface ForecastResponse {
  success: boolean;
  data: {
    projections: MonthlyProjection[];
    trend: { direction: string; monthlyGrowthRate: number; annualizedGrowthRate: number; rSquared: number };
    seasonality: { peakMonth: number; troughMonth: number; seasonalStrength: number };
    providerForecasts: { provider: string; projectedMonthlyRevenue: number; trend: string; growthRate: number }[];
    categoryForecasts: { category: string; projectedMonthlyRevenue: number; shareOfTotal: number; trend: string }[];
    confidenceIntervals: { month: string; p10: number; p25: number; p50: number; p75: number; p90: number }[];
  };
}

const MONTH_NAMES = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TREND_ICON = {
  growing: TrendingUp,
  declining: TrendingDown,
  stable: Minus,
};

export default function ForecastPage() {
  return (
    <DashboardErrorBoundary pageName="Revenue Forecast">
      <ForecastContent />
    </DashboardErrorBoundary>
  );
}

function ForecastContent() {
  const { data: raw, isLoading, error, mutate } = useRevenueForecast(12) as {
    data: ForecastResponse | undefined; isLoading: boolean; error: unknown; mutate: () => void;
  };
  const data = raw?.data;
  const [scenarioResult, setScenarioResult] = useState<ScenarioResult | null>(null);

  const handleScenarioChange = useCallback((type: ScenarioType, params: Record<string, number>) => {
    if (!data?.projections) return;
    const avgRevenue = data.projections.length > 0
      ? data.projections.reduce((s, p) => s + p.expected, 0) / data.projections.length
      : 50000;
    const result = runScenario(data.projections, { type, params }, avgRevenue);
    setScenarioResult(result);
  }, [data?.projections]);

  if (error) return <InlineError message="Failed to load forecast data" onRetry={() => mutate()} />;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <KPIRowSkeleton count={4} />
        <ChartSkeleton height={350} />
        <PanelSkeleton />
      </div>
    );
  }

  if (!data) {
    return <DashboardEmptyState icon="chart" title="No forecast data available" description="Revenue forecasting requires at least 3 months of historical data." />;
  }

  const { projections, trend, seasonality, providerForecasts, categoryForecasts, confidenceIntervals } = data;
  const TrendIcon = TREND_ICON[trend.direction as keyof typeof TREND_ICON] ?? Minus;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Revenue Forecast</h1>
        <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">12-month projections with scenario planning</p>
      </div>

      {/* Trend KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <TrendIcon className={`w-4 h-4 ${trend.direction === 'growing' ? 'text-green-600' : trend.direction === 'declining' ? 'text-red-500' : 'text-gray-400'}`} />
            <span className="text-xs text-rani-muted font-body">Monthly Growth</span>
          </div>
          <p className="text-lg font-heading font-semibold text-rani-navy">{trend.monthlyGrowthRate}%</p>
          <p className="text-[10px] text-rani-muted font-body capitalize">{trend.direction} trend (R²={trend.rSquared})</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-rani-gold" />
            <span className="text-xs text-rani-muted font-body">Annualized Growth</span>
          </div>
          <p className="text-lg font-heading font-semibold text-rani-navy">{trend.annualizedGrowthRate}%</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-green-600" />
            <span className="text-xs text-rani-muted font-body">Peak Month</span>
          </div>
          <p className="text-lg font-heading font-semibold text-rani-navy">{MONTH_NAMES[seasonality.peakMonth]}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-4 bg-white rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-red-400" />
            <span className="text-xs text-rani-muted font-body">Slow Month</span>
          </div>
          <p className="text-lg font-heading font-semibold text-rani-navy">{MONTH_NAMES[seasonality.troughMonth]}</p>
        </motion.div>
      </div>

      {/* Forecast chart */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
        <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">12-Month Revenue Projection</h3>
        <ForecastChart projections={projections} confidenceIntervals={confidenceIntervals} />
      </div>

      {/* Scenario planner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">What-If Scenarios</h3>
          <ScenarioSlider onScenarioChange={handleScenarioChange} />
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">Scenario Impact</h3>
          {scenarioResult ? (
            <div className="space-y-4">
              <p className="text-sm font-body text-rani-navy font-medium">{scenarioResult.label}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-rani-cream/50">
                  <p className="text-[10px] text-rani-muted font-body">Incremental Revenue</p>
                  <p className={`text-lg font-heading font-semibold ${scenarioResult.incrementalRevenue >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {scenarioResult.incrementalRevenue >= 0 ? '+' : ''}${scenarioResult.incrementalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-rani-cream/50">
                  <p className="text-[10px] text-rani-muted font-body">ROI</p>
                  <p className="text-lg font-heading font-semibold text-rani-navy">{scenarioResult.roi}%</p>
                </div>
                <div className="p-3 rounded-lg bg-rani-cream/50">
                  <p className="text-[10px] text-rani-muted font-body">Payback</p>
                  <p className="text-lg font-heading font-semibold text-rani-navy">
                    {scenarioResult.paybackMonths >= 0 ? `${scenarioResult.paybackMonths} mo` : 'N/A'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-rani-cream/50">
                  <p className="text-[10px] text-rani-muted font-body">Projected Total</p>
                  <p className="text-lg font-heading font-semibold text-rani-navy">${scenarioResult.projectedRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-rani-muted font-body">
              Adjust scenario sliders to see projected impact
            </div>
          )}
        </div>
      </div>

      {/* Provider + Category forecasts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {providerForecasts.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">Provider Projections</h3>
            <div className="space-y-3">
              {providerForecasts.map(p => {
                const PIcon = TREND_ICON[p.trend as keyof typeof TREND_ICON] ?? Minus;
                return (
                  <div key={p.provider} className="flex items-center justify-between p-3 rounded-lg bg-rani-cream/30">
                    <div>
                      <p className="text-sm font-body font-medium text-rani-navy">{p.provider}</p>
                      <p className="text-[10px] text-rani-muted font-body capitalize flex items-center gap-1">
                        <PIcon className="w-3 h-3" /> {p.trend} ({p.growthRate > 0 ? '+' : ''}{p.growthRate}%)
                      </p>
                    </div>
                    <p className="text-sm font-heading font-semibold text-rani-navy">${p.projectedMonthlyRevenue.toLocaleString()}/mo</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {categoryForecasts.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">Category Growth</h3>
            <div className="space-y-3">
              {categoryForecasts.map(c => (
                <div key={c.category} className="flex items-center justify-between p-3 rounded-lg bg-rani-cream/30">
                  <div>
                    <p className="text-sm font-body font-medium text-rani-navy">{c.category}</p>
                    <p className="text-[10px] text-rani-muted font-body">{c.shareOfTotal}% of total</p>
                  </div>
                  <p className="text-sm font-heading font-semibold text-rani-navy">${c.projectedMonthlyRevenue.toLocaleString()}/mo</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
