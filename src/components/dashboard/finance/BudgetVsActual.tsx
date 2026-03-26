'use client';

import useSWR from 'swr';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { ClinicBudget, ClinicExpenseCategory } from '@/lib/integrations/quickbooks/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

type BudgetRow = ClinicBudget & { variance: number; variancePercent: number };

const CATEGORY_LABELS: Record<ClinicExpenseCategory, string> = {
  rent: 'Rent',
  supplies: 'Supplies',
  payroll: 'Payroll',
  marketing: 'Marketing',
  insurance: 'Insurance',
  equipment: 'Equipment',
  utilities: 'Utilities',
  professional_services: 'Prof. Services',
};

export default function BudgetVsActual() {
  const { data, error, isLoading } = useSWR<BudgetRow[]>(
    '/api/integrations/quickbooks/reports?report=budget&months=6',
    fetcher,
    { refreshInterval: 300000 },
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const formatMonth = (month: string) => {
    const [year, m] = month.split('-');
    const date = new Date(parseInt(year), parseInt(m) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // Monthly revenue chart data
  const revenueChartData = data?.map(row => ({
    month: formatMonth(row.month),
    target: row.revenueTarget,
    actual: row.actualRevenue,
  })) || [];

  // Current month category breakdown
  const currentMonth = data?.[data.length - 1];
  const categoryData = currentMonth
    ? (Object.entries(currentMonth.categories) as [ClinicExpenseCategory, { budgeted: number; actual: number }][])
        .filter(([, v]) => v.budgeted > 0 || v.actual > 0)
        .map(([key, value]) => ({
          name: CATEGORY_LABELS[key],
          budgeted: value.budgeted,
          actual: value.actual,
          variance: value.budgeted - value.actual,
          overBudget: value.actual > value.budgeted,
        }))
    : [];

  return (
    <div className="rounded-xl border border-[#C9A96E]/20 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-[#0F1D2C]">Budget vs Actual</h3>

      {/* Revenue Target Chart */}
      <div className="mb-6">
        <h4 className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
          Monthly Revenue vs Target
        </h4>
        <div className="h-48">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Loading budget data...
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm text-red-500">
              Failed to load budget data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="target" name="Target" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual" fill="#C9A96E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Category Budget Breakdown */}
      {currentMonth && (
        <>
          <h4 className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Current Month Expense Budget ({formatMonth(currentMonth.month)})
          </h4>

          <div className="space-y-3">
            {categoryData.map(cat => {
              const percentage = cat.budgeted > 0 ? (cat.actual / cat.budgeted) * 100 : 0;
              return (
                <div key={cat.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-700">{cat.name}</span>
                    <div className="flex gap-3">
                      <span className="text-gray-400">
                        Budget: {formatCurrency(cat.budgeted)}
                      </span>
                      <span className={cat.overBudget ? 'text-red-600 font-medium' : 'text-green-600 font-medium'}>
                        Actual: {formatCurrency(cat.actual)}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                        percentage > 100 ? 'bg-red-400' :
                        percentage > 80 ? 'bg-amber-400' : 'bg-green-400'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                    {percentage > 100 && (
                      <div
                        className="absolute top-0 h-full rounded-r-full bg-red-600/30"
                        style={{ left: '100%', width: `${Math.min(percentage - 100, 50)}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Variance Summary */}
          <div className="mt-4 rounded-lg bg-[#F8F6F1] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Total Budget Variance</span>
              <span className={`text-sm font-bold ${
                currentMonth.variance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {currentMonth.variance >= 0 ? 'Under by ' : 'Over by '}
                {formatCurrency(Math.abs(currentMonth.variance))}
                {' '}
                ({Math.abs(currentMonth.variancePercent).toFixed(1)}%)
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
