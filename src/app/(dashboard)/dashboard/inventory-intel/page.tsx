'use client';

import { motion } from 'framer-motion';
import { Package, AlertTriangle, ShoppingCart, TrendingDown, Clock, AlertCircle, CheckCircle, ArrowDown, ArrowUp } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import { DashboardErrorBoundary, KPIRowSkeleton, PanelSkeleton, ChartSkeleton, TableSkeleton, SkeletonBar } from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import { InlineError } from '@/components/dashboard/shared';
import { useInventoryIntelligence } from '@/hooks/useDashboardData';
import type { InventoryIntelligence, InventoryAlert, ReorderRecommendation } from '@/lib/inventory/auto-manager';

interface InventoryResponse {
  success: boolean;
  data: InventoryIntelligence;
}

const ALERT_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  out_of_stock: { icon: AlertCircle, color: 'text-red-500' },
  low_stock: { icon: AlertTriangle, color: 'text-amber-500' },
  reorder_now: { icon: ShoppingCart, color: 'text-blue-500' },
  expiring_soon: { icon: Clock, color: 'text-amber-500' },
  expired: { icon: AlertCircle, color: 'text-red-500' },
  overstock: { icon: ArrowUp, color: 'text-purple-500' },
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  info: 'bg-blue-50 border-blue-200',
};

const URGENCY_STYLES: Record<string, string> = {
  immediate: 'bg-red-100 text-red-700',
  this_week: 'bg-amber-100 text-amber-700',
  next_order: 'bg-blue-100 text-blue-700',
  monitor: 'bg-gray-100 text-gray-600',
};

export default function InventoryIntelligencePage() {
  const { data: raw, isLoading, error, mutate } = useInventoryIntelligence() as { data: InventoryResponse | undefined; isLoading: boolean; error: unknown; mutate: () => void };
  const data = raw?.data;

  const alerts = data?.alerts || [];
  const reorders = data?.reorderRecommendations || [];
  const usage = data?.usageAnalysis || [];
  const waste = data?.wasteReport;
  const costOpts = data?.costOptimizations || [];
  const parAdjustments = data?.parLevelAdjustments || [];
  const inventoryScore = data?.inventoryScore || 0;
  const totalValue = data?.totalInventoryValue || 0;
  const monthlyConsumption = data?.monthlyConsumptionCost || 0;

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const immediateReorders = reorders.filter(r => r.urgency === 'immediate').length;
  const totalReorderCost = reorders.reduce((sum, r) => sum + r.estimatedCost, 0);

  const hasData = !isLoading && data;
  const isEmpty = hasData && alerts.length === 0 && reorders.length === 0 && usage.length === 0 && !waste && costOpts.length === 0 && parAdjustments.length === 0;

  return (
    <DashboardErrorBoundary pageName="Inventory Intelligence">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Inventory Intelligence</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">AI-powered stock management, reorder predictions, and waste reduction</p>
        </div>

        {/* Error / Loading / Empty State */}
        {error ? (
          <InlineError message="Failed to load inventory data" onRetry={() => mutate()} />
        ) : isLoading ? (
          <>
            <KPIRowSkeleton count={5} />
            <PanelSkeleton rows={4} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <PanelSkeleton rows={4} />
              <PanelSkeleton rows={4} />
            </div>
            <TableSkeleton rows={5} cols={6} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <PanelSkeleton rows={3} />
              <PanelSkeleton rows={3} />
            </div>
          </>
        ) : isEmpty ? (
          <DashboardEmptyState
            icon="package"
            title="No inventory data yet"
            description="Inventory intelligence will appear here once product and supply data is available in the system."
          />
        ) : (
          <>
            {/* Hero KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-6">
              <KPICard title="Inventory Health" value={inventoryScore} suffix="/100" icon="heart" size="hero" />
              <KPICard title="Total Value" value={totalValue} prefix="$" icon="package" />
              <KPICard title="Monthly Cost" value={monthlyConsumption} prefix="$" icon="dollar-sign" />
              <KPICard title="Critical Alerts" value={criticalAlerts} icon="alert-triangle" />
              <KPICard title="Reorder Cost" value={totalReorderCost} prefix="$" icon="shopping-cart" />
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                  Active Alerts ({alerts.length})
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {alerts.map((alert, i) => {
                    const info = ALERT_ICONS[alert.type] || { icon: AlertTriangle, color: 'text-gray-500' };
                    const Icon = info.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`p-3 rounded-lg border ${SEVERITY_STYLES[alert.severity] || 'bg-gray-50 border-gray-200'}`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${info.color}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-body font-semibold text-rani-navy truncate">{alert.message}</p>
                            <p className="text-[10px] font-body text-rani-muted mt-0.5 truncate">{alert.action}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${
                            alert.severity === 'critical' ? 'bg-red-200 text-red-800' :
                            alert.severity === 'warning' ? 'bg-amber-200 text-amber-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Reorder Recommendations */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                  Reorder Recommendations
                </h3>
                {reorders.length === 0 ? (
                  <DashboardEmptyState
                    icon="cart"
                    title="All stock levels optimal!"
                    description="No reorders needed right now."
                    compact
                  />
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {reorders.map((rec, i) => (
                      <motion.div
                        key={rec.itemId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="p-3 rounded-lg bg-rani-cream/30 border border-rani-border/50"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-body font-semibold text-rani-navy truncate">{rec.itemName}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 ${URGENCY_STYLES[rec.urgency]}`}>
                            {rec.urgency.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px] font-body text-rani-muted">
                          <span className="truncate">Current: {rec.currentStock} | Order: {rec.suggestedQuantity}</span>
                          <span className="font-semibold text-rani-navy flex-shrink-0">${rec.estimatedCost}</span>
                        </div>
                        <p className="text-[10px] font-body text-rani-muted mt-1 truncate">{rec.reason}</p>
                        <div className="flex justify-between text-[10px] font-body text-rani-muted mt-1">
                          <span className="truncate">Supplier: {rec.supplier}</span>
                          <span className="flex-shrink-0">{rec.daysUntilStockout} days until stockout</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Waste Report */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                  Waste Analysis
                </h3>
                {waste ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="flex-shrink-0">
                        <ProgressRing
                          value={100 - (waste.wastePercentage || 0)}
                          size={80}
                          strokeWidth={8}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xl sm:text-2xl font-heading text-rani-navy">${waste.totalWasteValue}</div>
                        <div className="text-xs font-body text-rani-muted truncate">Total waste value ({waste.wastePercentage}% of inventory)</div>
                      </div>
                    </div>

                    {waste.expiredItems.length > 0 && (
                      <div>
                        <h4 className="text-xs font-body font-semibold text-red-600 uppercase mb-2">Expired Items</h4>
                        {waste.expiredItems.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs font-body py-1">
                            <span className="text-rani-text truncate">{item.item} ({item.quantity} units)</span>
                            <span className="text-red-600 font-semibold flex-shrink-0">${item.value} waste</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {waste.nearExpiryItems.length > 0 && (
                      <div>
                        <h4 className="text-xs font-body font-semibold text-amber-600 uppercase mb-2">Expiring Soon</h4>
                        {waste.nearExpiryItems.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs font-body py-1">
                            <span className="text-rani-text truncate">{item.item} ({item.quantity} units)</span>
                            <span className="text-amber-600 font-semibold flex-shrink-0">{item.daysLeft} days left (${item.value})</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {waste.recommendations.length > 0 && (
                      <div className="p-3 rounded-lg bg-blue-50/50">
                        <h4 className="text-xs font-body font-semibold text-blue-700 uppercase mb-1">Recommendations</h4>
                        {waste.recommendations.map((rec, i) => (
                          <p key={i} className="text-xs font-body text-blue-600 mt-1">{rec}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <DashboardEmptyState
                    icon="package"
                    title="No waste data available"
                    description="Waste analysis will appear once inventory items have expiration tracking enabled."
                    compact
                  />
                )}
              </div>
            </div>

            {/* Usage Analysis */}
            {usage.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                  Usage Analysis
                </h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full text-sm font-body min-w-[500px]">
                    <thead>
                      <tr className="border-b border-rani-border">
                        <th className="text-left py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Item</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Daily Use</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Monthly Use</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Cost/Mo</th>
                        <th className="text-center py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Trend</th>
                        <th className="text-right py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Days Left</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usage.map((item, i) => (
                        <motion.tr
                          key={item.itemId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-rani-border/50 hover:bg-rani-cream/30"
                        >
                          <td className="py-3 px-3 font-medium text-rani-navy truncate max-w-[150px]">{item.itemName}</td>
                          <td className="py-3 px-3 text-right text-rani-text">{item.dailyUsageRate}</td>
                          <td className="py-3 px-3 text-right text-rani-text">{item.monthlyUsageRate}</td>
                          <td className="py-3 px-3 text-right font-semibold text-rani-navy">${item.costPerMonth}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              item.trend === 'increasing' ? 'bg-red-50 text-red-600' :
                              item.trend === 'decreasing' ? 'bg-green-50 text-green-600' :
                              'bg-gray-50 text-gray-600'
                            }`}>
                              {item.trend === 'increasing' ? '\u2191' : item.trend === 'decreasing' ? '\u2193' : '\u2192'} {item.trend}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`font-semibold ${
                              item.daysOfStockRemaining < 7 ? 'text-red-600' :
                              item.daysOfStockRemaining < 14 ? 'text-amber-600' :
                              'text-green-600'
                            }`}>
                              {item.daysOfStockRemaining === 999 ? '\u221E' : `${item.daysOfStockRemaining}d`}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Cost Optimizations & Par Level Adjustments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Cost Optimizations */}
              {costOpts.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                  <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                    Cost Savings Opportunities
                  </h3>
                  <div className="space-y-3">
                    {costOpts.map((opt, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-3 rounded-lg bg-green-50/50 border border-green-200"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-[10px] font-medium capitalize truncate">
                            {opt.type.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-heading text-green-600 flex-shrink-0">Save ${opt.savings}</span>
                        </div>
                        <p className="text-xs font-body text-rani-text">{opt.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Par Level Adjustments */}
              {parAdjustments.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-4 sm:p-5">
                  <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
                    Par Level Adjustments
                  </h3>
                  <div className="space-y-3">
                    {parAdjustments.map((adj, i) => (
                      <motion.div
                        key={adj.itemId}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="p-3 rounded-lg bg-rani-cream/30 border border-rani-border/50"
                      >
                        <div className="text-xs font-body font-semibold text-rani-navy mb-1 truncate">{adj.itemName}</div>
                        <div className="flex gap-4 text-[10px] font-body text-rani-muted">
                          <span>Current: {adj.currentMin}-{adj.currentMax}</span>
                          <span className="text-rani-gold font-semibold">{'\u2192'} Suggested: {adj.suggestedMin}-{adj.suggestedMax}</span>
                        </div>
                        <p className="text-[10px] font-body text-rani-muted mt-1 italic truncate">{adj.reason}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
