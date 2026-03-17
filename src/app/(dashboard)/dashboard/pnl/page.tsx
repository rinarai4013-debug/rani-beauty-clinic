'use client';

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Shield, Activity } from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import { usePnL } from '@/hooks/useDashboardData';
import type { FinancialIntelligenceResult } from '@/lib/finance/pnl-engine';

interface PnLResponse {
  success: boolean;
  data: FinancialIntelligenceResult;
}

const PIE_COLORS = ['#F3D6BE', '#0F1D2C', '#C9A96E', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B'];

const HEALTH_LABELS: Record<string, { icon: React.ElementType; color: string }> = {
  profitability: { icon: DollarSign, color: 'text-green-600' },
  growth: { icon: TrendingUp, color: 'text-blue-600' },
  efficiency: { icon: BarChart2, color: 'text-amber-600' },
  stability: { icon: Shield, color: 'text-purple-600' },
  cashPosition: { icon: Activity, color: 'text-indigo-600' },
};

export default function PnLPage() {
  const { data: raw, isLoading } = usePnL() as { data: PnLResponse | undefined; isLoading: boolean };
  const data = raw?.data;

  const pnl = data?.pnl;
  const serviceMargins = data?.serviceMargins || [];
  const providerProfitability = data?.providerProfitability || [];
  const cashFlow = data?.cashFlowProjection || [];
  const healthScore = data?.healthScore;
  const insights = data?.insights || [];
  const kpis = data?.kpis;

  const revenueByCategory = pnl?.revenue?.byCategory || [];
  const opexByCategory = pnl?.operatingExpenses?.byCategory || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading text-rani-navy">P&L Intelligence</h1>
        <p className="text-sm font-body text-rani-muted mt-1">Automated profit & loss analysis with financial health scoring</p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <KPICard title="Total Revenue" value={kpis?.totalRevenue || 0} prefix="$" icon="dollar-sign" size="hero" />
        <KPICard title="Net Income" value={Math.abs(kpis?.netIncome || 0)} prefix={kpis?.netIncome && kpis.netIncome >= 0 ? '$' : '-$'} icon="dollar-sign" />
        <KPICard title="Gross Margin" value={kpis?.grossMargin || 0} suffix="%" icon="percent" />
        <KPICard title="Avg Daily Revenue" value={kpis?.avgDailyRevenue || 0} prefix="$" icon="dollar-sign" />
        <KPICard title="Financial Health" value={healthScore?.overall || 0} suffix="/100" icon="heart" />
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-rani-navy to-rani-navy-light rounded-xl p-6 text-white"
        >
          <h3 className="text-sm font-body font-semibold uppercase tracking-wider text-rani-gold mb-3">Financial Insights</h3>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <p key={i} className="text-sm font-body text-white/80 leading-relaxed">
                <span className="text-rani-gold mr-2">&#x2022;</span>{insight}
              </p>
            ))}
          </div>
        </motion.div>
      )}

      {/* Financial Health Score Breakdown */}
      {healthScore && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Financial Health Score
          </h3>
          <div className="flex items-center gap-8">
            <div className="flex-shrink-0">
              <ProgressRing value={healthScore.overall} size={120} strokeWidth={10} />
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(healthScore.components).map(([key, value]) => {
                const info = HEALTH_LABELS[key] || { icon: Activity, color: 'text-gray-600' };
                const Icon = info.icon;
                return (
                  <div key={key} className="text-center">
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${info.color}`} />
                    <div className="text-lg font-heading text-rani-navy">{value}</div>
                    <div className="text-[10px] font-body text-rani-muted uppercase tracking-wider">
                      {key === 'cashPosition' ? 'Cash' : key}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alerts & Recommendations */}
          {(healthScore.alerts.length > 0 || healthScore.recommendations.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {healthScore.alerts.length > 0 && (
                <div className="p-3 rounded-lg bg-red-50/50">
                  <h4 className="text-xs font-body font-semibold text-red-700 uppercase mb-2">Alerts</h4>
                  {healthScore.alerts.map((alert, i) => (
                    <p key={i} className="text-xs font-body text-red-600 mt-1">{alert}</p>
                  ))}
                </div>
              )}
              {healthScore.recommendations.length > 0 && (
                <div className="p-3 rounded-lg bg-blue-50/50">
                  <h4 className="text-xs font-body font-semibold text-blue-700 uppercase mb-2">Recommendations</h4>
                  {healthScore.recommendations.map((rec, i) => (
                    <p key={i} className="text-xs font-body text-blue-600 mt-1">{rec}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* P&L Statement */}
      {pnl && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Breakdown */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
              Revenue Breakdown
            </h3>
            <div className="space-y-4 mb-4">
              <div className="flex justify-between text-sm font-body">
                <span className="text-rani-text">Service Revenue</span>
                <span className="font-semibold text-rani-navy">${pnl.revenue.services.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-rani-text">Membership Revenue</span>
                <span className="font-semibold text-rani-navy">${pnl.revenue.memberships.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-body border-t border-rani-border pt-2">
                <span className="font-semibold text-rani-navy">Total Revenue</span>
                <span className="font-semibold text-rani-navy">${pnl.revenue.total.toLocaleString()}</span>
              </div>
            </div>
            {revenueByCategory.length > 0 && (
              <div className="space-y-2">
                {revenueByCategory.map((cat) => (
                  <div key={cat.category} className="flex items-center gap-3">
                    <span className="text-xs font-body text-rani-text w-28 truncate">{cat.category}</span>
                    <div className="flex-1">
                      <ProgressBar current={cat.percentage} target={100} showPercentage={false} height={6} colorMode="gold" />
                    </div>
                    <span className="text-xs font-body font-semibold text-rani-navy w-16 text-right">
                      ${cat.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
            <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
              Operating Expenses
            </h3>
            <div className="space-y-4 mb-4">
              <div className="flex justify-between text-sm font-body">
                <span className="text-rani-text">Cost of Services</span>
                <span className="font-semibold text-rani-navy">${pnl.costOfServices.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-body">
                <span className="text-rani-text">Operating Expenses</span>
                <span className="font-semibold text-rani-navy">${pnl.operatingExpenses.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-body border-t border-rani-border pt-2">
                <span className="font-semibold text-rani-navy">Net Income</span>
                <span className={`font-semibold ${pnl.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(pnl.netIncome).toLocaleString()}
                </span>
              </div>
            </div>
            {opexByCategory.length > 0 && (
              <div className="space-y-2">
                {opexByCategory.map((cat) => (
                  <div key={cat.category} className="flex items-center gap-3">
                    <span className="text-xs font-body text-rani-text w-28 truncate capitalize">{cat.category.replace('_', ' ')}</span>
                    <div className="flex-1">
                      <ProgressBar
                        current={pnl.operatingExpenses.total > 0 ? Math.round((cat.amount / pnl.operatingExpenses.total) * 100) : 0}
                        target={100}
                        showPercentage={false}
                        height={6}
                        colorMode="gold"
                      />
                    </div>
                    <span className="text-xs font-body font-semibold text-rani-navy w-16 text-right">
                      ${cat.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Service Margin Analysis */}
      {serviceMargins.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            Service Profitability Ranking
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-rani-border">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-rani-muted uppercase">#</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Service</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Revenue</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Margin</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Bookings</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Avg Ticket</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-rani-muted uppercase">$/Min</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-rani-muted uppercase">Profit/Booking</th>
                </tr>
              </thead>
              <tbody>
                {serviceMargins.map((svc, i) => (
                  <motion.tr
                    key={svc.service}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-rani-border/50 hover:bg-rani-cream/30"
                  >
                    <td className="py-3 px-3 text-rani-muted">{svc.rank}</td>
                    <td className="py-3 px-3 font-medium text-rani-navy">{svc.service}</td>
                    <td className="py-3 px-3 text-right text-rani-navy">${svc.revenue.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right">
                      <span className={`font-semibold ${svc.grossMargin >= 60 ? 'text-green-600' : svc.grossMargin >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                        {svc.grossMargin}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-rani-muted">{svc.bookings}</td>
                    <td className="py-3 px-3 text-right text-rani-navy">${svc.avgTicket}</td>
                    <td className="py-3 px-3 text-right text-rani-navy">${svc.revenuePerMinute}</td>
                    <td className="py-3 px-3 text-right font-semibold text-rani-navy">${svc.profitPerBooking}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cash Flow Projection */}
      {cashFlow.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-rani-border p-5">
          <h3 className="text-sm font-body font-semibold text-rani-navy uppercase tracking-wider mb-4">
            6-Month Cash Flow Projection
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlow}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #E5E7EB', fontSize: 12 }}
                  formatter={(v) => [`$${Number(v).toLocaleString()}`]}
                />
                <Bar dataKey="projectedRevenue" fill="#F3D6BE" radius={[4, 4, 0, 0]} name="Revenue" />
                <Bar dataKey="projectedExpenses" fill="#0F1D2C" radius={[4, 4, 0, 0]} name="Expenses" opacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* KPI Grid */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white/80 rounded-xl border border-rani-border p-4 text-center">
            <div className="text-xs font-body text-rani-muted uppercase">Avg Ticket</div>
            <div className="text-lg font-heading text-rani-navy mt-1">${kpis.avgTicketSize}</div>
          </div>
          <div className="bg-white/80 rounded-xl border border-rani-border p-4 text-center">
            <div className="text-xs font-body text-rani-muted uppercase">Net Margin</div>
            <div className="text-lg font-heading text-rani-navy mt-1">{kpis.netMargin}%</div>
          </div>
          <div className="bg-white/80 rounded-xl border border-rani-border p-4 text-center">
            <div className="text-xs font-body text-rani-muted uppercase">Membership %</div>
            <div className="text-lg font-heading text-rani-navy mt-1">{kpis.membershipRevenuePercent}%</div>
          </div>
          <div className="bg-white/80 rounded-xl border border-rani-border p-4 text-center">
            <div className="text-xs font-body text-rani-muted uppercase">Financing</div>
            <div className="text-lg font-heading text-rani-navy mt-1">{kpis.financingAdoptionRate}%</div>
          </div>
          <div className="bg-white/80 rounded-xl border border-rani-border p-4 text-center">
            <div className="text-xs font-body text-rani-muted uppercase">New Client %</div>
            <div className="text-lg font-heading text-rani-navy mt-1">{kpis.newClientRevenuePercent}%</div>
          </div>
          <div className="bg-white/80 rounded-xl border border-rani-border p-4 text-center">
            <div className="text-xs font-body text-rani-muted uppercase">Break-Even</div>
            <div className="text-lg font-heading text-rani-navy mt-1">${kpis.breakEvenDaily}/day</div>
          </div>
        </div>
      )}
    </div>
  );
}
