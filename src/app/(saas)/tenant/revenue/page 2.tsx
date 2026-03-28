/**
 * Tenant Dashboard — Revenue Page
 */

'use client';

import { useState } from 'react';
import { useTenantRevenue, useTenantRevenueTrend, useTenantRevenueAnomalies, useTenantPnL, useTenantCashFlow } from '@/hooks/useTenantDashboard';

export default function TenantRevenuePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'anomalies' | 'pnl' | 'cashflow'>('overview');
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const startDate = getStartDate(period);
  const endDate = new Date().toISOString();

  const { data: breakdown, isLoading } = useTenantRevenue(startDate, endDate);
  const { data: trend } = useTenantRevenueTrend(period === 'week' ? 7 : period === 'month' ? 30 : 90);
  const { data: anomalies } = useTenantRevenueAnomalies();
  const { data: pnl } = useTenantPnL(startDate, endDate);
  const { data: cashFlow } = useTenantCashFlow();

  const tabs = [
    { id: 'overview' as const, label: 'Overview' },
    { id: 'trends' as const, label: 'Trends' },
    { id: 'anomalies' as const, label: `Anomalies${anomalies?.anomalies?.length ? ` (${anomalies.anomalies.length})` : ''}` },
    { id: 'pnl' as const, label: 'P&L' },
    { id: 'cashflow' as const, label: 'Cash Flow' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Revenue</h2>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize ${period === p ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Total Revenue */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">${(breakdown?.total ?? 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Projected Month-End</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">${(trend?.projectedEndOfMonth ?? 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Growth Rate</p>
            <p className={`text-3xl font-bold mt-1 ${(trend?.growthRate ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(trend?.growthRate ?? 0) >= 0 ? '+' : ''}{trend?.growthRate ?? 0}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Revenue Health</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{anomalies?.healthScore ?? 100}/100</p>
          </div>
        </div>
      </div>

      {activeTab === 'overview' && breakdown && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Service */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue by Service</h3>
            <div className="space-y-3">
              {breakdown.byService.slice(0, 10).map((s) => (
                <div key={s.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm text-gray-900 truncate">{s.name}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${s.percentage}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 ml-3">${s.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Provider */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue by Provider</h3>
            <div className="space-y-3">
              {breakdown.byProvider.slice(0, 10).map((p) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-sm text-gray-900 truncate">{p.name}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${p.percentage}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 ml-3">${p.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Revenue */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Daily Revenue</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Day</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Revenue</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Txns</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {breakdown.byDay.slice(-14).map((d) => (
                    <tr key={d.date} className={d.isAnomaly ? 'bg-yellow-50' : ''}>
                      <td className="px-3 py-2 text-sm text-gray-900">{d.date}</td>
                      <td className="px-3 py-2 text-sm text-gray-500">{d.dayOfWeek}</td>
                      <td className="px-3 py-2 text-sm text-right font-medium text-gray-900">${d.revenue.toLocaleString()}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-600">{d.transactions}</td>
                      <td className="px-3 py-2 text-sm text-right text-gray-600">${d.avgTransaction.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trends' && trend && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Revenue Trend ({trend.period})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div><p className="text-xs text-gray-500">Best Day</p><p className="text-sm font-bold">${trend.bestDay.revenue.toLocaleString()}</p><p className="text-xs text-gray-400">{trend.bestDay.date}</p></div>
            <div><p className="text-xs text-gray-500">Worst Day</p><p className="text-sm font-bold">${trend.worstDay.revenue.toLocaleString()}</p><p className="text-xs text-gray-400">{trend.worstDay.date}</p></div>
            <div><p className="text-xs text-gray-500">Growth Rate</p><p className={`text-sm font-bold ${trend.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>{trend.growthRate}%</p></div>
            <div><p className="text-xs text-gray-500">Projected EOM</p><p className="text-sm font-bold">${trend.projectedEndOfMonth.toLocaleString()}</p></div>
          </div>
          <div className="text-sm text-gray-500">Revenue trend visualization would appear here (Recharts integration)</div>
        </div>
      )}

      {activeTab === 'anomalies' && anomalies && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-600">{anomalies.summary}</p>
          </div>
          {anomalies.anomalies.map((a, i) => (
            <div key={i} className={`rounded-xl border p-4 ${a.severity === 'critical' ? 'bg-red-50 border-red-200' : a.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-900">{a.date} - {a.type}</span>
                <span className={`text-xs font-bold ${a.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}`}>{a.severity}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{a.description}</p>
              <p className="text-xs text-gray-500 mt-1">Possible cause: {a.possibleCause}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'pnl' && pnl && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Profit & Loss Summary</h3>
          <div className="space-y-3">
            <PnLRow label="Revenue" amount={pnl.revenue.amount} bold />
            <PnLRow label="Cost of Goods" amount={-pnl.costOfGoods.amount} />
            <PnLRow label="Gross Profit" amount={pnl.grossProfit.amount} bold />
            <div className="border-t border-gray-200 pt-2">
              {pnl.operatingExpenses.map((e) => (
                <PnLRow key={e.name} label={`  ${e.name}`} amount={-e.amount} />
              ))}
            </div>
            <PnLRow label="Total Expenses" amount={-pnl.totalExpenses.amount} bold />
            <div className="border-t-2 border-gray-300 pt-2">
              <PnLRow label="Net Income" amount={pnl.netIncome.amount} bold highlight={pnl.netIncome.amount >= 0} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
              <div><p className="text-xs text-gray-500">Gross Margin</p><p className="text-sm font-bold">{pnl.margins.gross}%</p></div>
              <div><p className="text-xs text-gray-500">Operating Margin</p><p className="text-sm font-bold">{pnl.margins.operating}%</p></div>
              <div><p className="text-xs text-gray-500">Net Margin</p><p className="text-sm font-bold">{pnl.margins.net}%</p></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'cashflow' && cashFlow && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Cash Flow Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-500">Net Cash Flow</p>
              <p className={`text-2xl font-bold ${cashFlow.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>${cashFlow.netCashFlow.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Runway</p>
              <p className="text-2xl font-bold text-gray-900">{cashFlow.runway} months</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Projected Balance (3mo)</p>
              <p className="text-2xl font-bold text-gray-900">${cashFlow.projection[cashFlow.projection.length - 1]?.projectedBalance?.toLocaleString() ?? 0}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PnLRow({ label, amount, bold, highlight }: { label: string; amount: number; bold?: boolean; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'} ${highlight ? 'text-green-600' : amount < 0 ? 'text-red-600' : 'text-gray-900'}`}>
        {amount < 0 ? '-' : ''}${Math.abs(amount).toLocaleString()}
      </span>
    </div>
  );
}

function getStartDate(period: string): string {
  const now = new Date();
  switch (period) {
    case 'week': return new Date(now.getTime() - 7 * 86400000).toISOString();
    case 'month': return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    case 'quarter': return new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString();
    case 'year': return new Date(now.getFullYear(), 0, 1).toISOString();
    default: return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  }
}
