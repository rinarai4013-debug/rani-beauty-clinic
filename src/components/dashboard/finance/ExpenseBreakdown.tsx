'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ExpenseBreakdownReport } from '@/lib/integrations/quickbooks/reports';
import type { ClinicExpenseCategory } from '@/lib/integrations/quickbooks/types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const CATEGORY_COLORS: Record<ClinicExpenseCategory, string> = {
  rent: '#3B82F6',
  supplies: '#EF4444',
  payroll: '#8B5CF6',
  marketing: '#F59E0B',
  insurance: '#10B981',
  equipment: '#6366F1',
  utilities: '#EC4899',
  professional_services: '#14B8A6',
};

const CATEGORY_LABELS: Record<ClinicExpenseCategory, string> = {
  rent: 'Rent & Lease',
  supplies: 'Supplies & Products',
  payroll: 'Payroll',
  marketing: 'Marketing',
  insurance: 'Insurance',
  equipment: 'Equipment',
  utilities: 'Utilities',
  professional_services: 'Professional Services',
};

export default function ExpenseBreakdown() {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');
  const [selectedCategory, setSelectedCategory] = useState<ClinicExpenseCategory | null>(null);

  const { data, error, isLoading } = useSWR<ExpenseBreakdownReport>(
    `/api/integrations/quickbooks/reports?report=expenses&period=${period}`,
    fetcher,
    { refreshInterval: 300000 },
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  const handlePieClick = (entry: unknown) => {
    if (!entry || typeof entry !== 'object' || !('category' in entry)) return;
    const category = (entry as { category?: ClinicExpenseCategory }).category;
    if (!category) return;
    setSelectedCategory((prev) => (prev === category ? null : category));
  };

  const tooltipFormatter = (value: unknown) => {
    if (typeof value === 'number') return formatCurrency(value);
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return formatCurrency(parsed);
    }
    return formatCurrency(0);
  };

  const chartData = data
    ? Object.entries(data.byCategory)
        .filter(([, v]) => v.amount > 0)
        .map(([key, value]) => ({
          name: CATEGORY_LABELS[key as ClinicExpenseCategory] || key,
          value: value.amount,
          percentage: value.percentage,
          category: key as ClinicExpenseCategory,
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  return (
    <div className="rounded-xl border border-[#C9A96E]/20 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#0F1D2C]">Expense Breakdown</h3>
        <div className="flex gap-2">
          {(['monthly', 'quarterly', 'annual'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                period === p
                  ? 'bg-[#0F1D2C] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {data && (
        <div className="mb-4 text-center">
          <p className="text-2xl font-bold text-[#0F1D2C]">{formatCurrency(data.totalExpenses)}</p>
          <p className="text-xs text-gray-500">Total Expenses</p>
        </div>
      )}

      <div className="flex gap-6">
        {/* Pie Chart */}
        <div className="h-64 flex-1">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              Loading...
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm text-red-500">
              Failed to load expenses
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-400">
              No expense data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={handlePieClick}
                  style={{ cursor: 'pointer' }}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={CATEGORY_COLORS[entry.category]}
                      opacity={selectedCategory && selectedCategory !== entry.category ? 0.3 : 1}
                      stroke={selectedCategory === entry.category ? '#0F1D2C' : 'none'}
                      strokeWidth={selectedCategory === entry.category ? 2 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={tooltipFormatter as never}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend / Breakdown List */}
        <div className="flex-1 space-y-2">
          {chartData.map(item => (
            <button
              key={item.category}
              onClick={() => setSelectedCategory(
                selectedCategory === item.category ? null : item.category,
              )}
              className={`flex w-full items-center justify-between rounded-lg p-2 text-left transition-colors ${
                selectedCategory === item.category ? 'bg-[#F8F6F1]' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
                />
                <span className="text-xs text-gray-700">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-[#0F1D2C]">
                  {formatCurrency(item.value)}
                </span>
                <span className="ml-2 text-xs text-gray-400">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Top Vendors */}
      {data?.topVendors && data.topVendors.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Top Vendors
          </h4>
          <div className="space-y-1">
            {data.topVendors.slice(0, 5).map((vendor, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="text-gray-700">{vendor.vendor}</span>
                <span className="font-medium text-[#0F1D2C]">{formatCurrency(vendor.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
