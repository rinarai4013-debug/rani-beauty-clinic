'use client';

import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import ChartWrapper, { ChartLegend } from '@/components/dashboard/shared/ChartWrapper';
import { CATEGORY_LABELS, CATEGORY_COLORS, type ProductCategory } from '@/data/inventory/products';

/* ─── UsageAnalytics ──────────────────────────────────────────────────
 *  Product usage trends, cost per treatment, and provider usage
 *  comparison using Recharts.
 * ──────────────────────────────────────────────────────────────────── */

// Sample data for charts
const monthlyUsageData = [
  { month: 'Oct', neurotoxins: 42, fillers: 28, vitamins: 65, glp1: 35, skincare: 18, cost: 18500 },
  { month: 'Nov', neurotoxins: 48, fillers: 32, vitamins: 72, glp1: 42, skincare: 22, cost: 21200 },
  { month: 'Dec', neurotoxins: 38, fillers: 25, vitamins: 58, glp1: 38, skincare: 15, cost: 16800 },
  { month: 'Jan', neurotoxins: 52, fillers: 35, vitamins: 78, glp1: 48, skincare: 25, cost: 24100 },
  { month: 'Feb', neurotoxins: 55, fillers: 38, vitamins: 82, glp1: 52, skincare: 28, cost: 26500 },
  { month: 'Mar', neurotoxins: 50, fillers: 34, vitamins: 75, glp1: 55, skincare: 24, cost: 24800 },
];

const costPerTreatment = [
  { treatment: 'Botox', productCost: 39.60, totalRevenue: 350, margin: 88.7 },
  { treatment: 'Filler', productCost: 225, totalRevenue: 700, margin: 67.9 },
  { treatment: 'GLP-1', productCost: 120, totalRevenue: 399, margin: 69.9 },
  { treatment: 'NAD+', productCost: 85, totalRevenue: 250, margin: 66.0 },
  { treatment: 'B12', productCost: 18, totalRevenue: 35, margin: 48.6 },
  { treatment: 'HydraFacial', productCost: 52, totalRevenue: 275, margin: 81.1 },
  { treatment: 'VI Peel', productCost: 85, totalRevenue: 395, margin: 78.5 },
  { treatment: 'PRX-T33', productCost: 75, totalRevenue: 495, margin: 84.8 },
];

const providerUsage = [
  { provider: 'Mom', botox: 180, filler: 45, glp1: 30, wellness: 55 },
  { provider: 'Rina', botox: 120, filler: 65, glp1: 42, wellness: 38 },
];

const categoryBreakdown = Object.entries(CATEGORY_LABELS).map(([key, label]) => ({
  name: label,
  value: Math.floor(Math.random() * 30 + 10),
  color: CATEGORY_COLORS[key as ProductCategory],
}));

interface UsageAnalyticsProps {
  loading?: boolean;
}

export default function UsageAnalytics({ loading = false }: UsageAnalyticsProps) {
  const [range, setRange] = useState('6m');

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Usage Trends */}
      <ChartWrapper
        title="Product Usage Trends"
        subtitle="Units consumed per category"
        chartType="bar"
        height="h-64 sm:h-72"
        loading={loading}
        dateRanges={[
          { label: '3M', value: '3m' },
          { label: '6M', value: '6m' },
          { label: '1Y', value: '1y' },
        ]}
        activeRange={range}
        onRangeChange={setRange}
        headerActions={
          <ChartLegend
            items={[
              { label: 'Neurotoxins', color: '#7C3AED' },
              { label: 'Fillers', color: '#EC4899' },
              { label: 'Vitamins', color: '#10B981' },
              { label: 'GLP-1', color: '#F59E0B' },
            ]}
          />
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyUsageData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E0DC" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B8680' }} />
            <YAxis tick={{ fontSize: 11, fill: '#8B8680' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E2E0DC',
                borderRadius: '8px',
                fontSize: 12,
              }}
            />
            <Bar dataKey="neurotoxins" fill="#7C3AED" radius={[2, 2, 0, 0]} />
            <Bar dataKey="fillers" fill="#EC4899" radius={[2, 2, 0, 0]} />
            <Bar dataKey="vitamins" fill="#10B981" radius={[2, 2, 0, 0]} />
            <Bar dataKey="glp1" fill="#F59E0B" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Cost per Treatment */}
        <ChartWrapper
          title="Cost per Treatment"
          subtitle="Product cost vs revenue and margin"
          chartType="bar"
          height="h-56 sm:h-64"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={costPerTreatment} layout="vertical" barCategoryGap="15%">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E0DC" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#8B8680' }} tickFormatter={(v) => `$${v}`} />
              <YAxis dataKey="treatment" type="category" width={80} tick={{ fontSize: 10, fill: '#8B8680' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E2E0DC',
                  borderRadius: '8px',
                  fontSize: 11,
                }}
                formatter={(value: number, name: string) =>
                  [`$${value.toFixed(2)}`, name === 'productCost' ? 'Product Cost' : 'Revenue']
                }
              />
              <Bar dataKey="productCost" fill="#EF4444" radius={[0, 2, 2, 0]} name="Product Cost" />
              <Bar dataKey="totalRevenue" fill="#10B981" radius={[0, 2, 2, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>

        {/* Provider Usage */}
        <ChartWrapper
          title="Provider Usage Comparison"
          subtitle="Units used per provider this month"
          chartType="bar"
          height="h-56 sm:h-64"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={providerUsage} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E0DC" />
              <XAxis dataKey="provider" tick={{ fontSize: 11, fill: '#8B8680' }} />
              <YAxis tick={{ fontSize: 11, fill: '#8B8680' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E2E0DC',
                  borderRadius: '8px',
                  fontSize: 11,
                }}
              />
              <Bar dataKey="botox" fill="#7C3AED" name="Botox" radius={[2, 2, 0, 0]} />
              <Bar dataKey="filler" fill="#EC4899" name="Filler" radius={[2, 2, 0, 0]} />
              <Bar dataKey="glp1" fill="#F59E0B" name="GLP-1" radius={[2, 2, 0, 0]} />
              <Bar dataKey="wellness" fill="#10B981" name="Wellness" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrapper>
      </div>

      {/* Monthly Spend Trend */}
      <ChartWrapper
        title="Monthly Inventory Spend"
        subtitle="Total product costs over time"
        chartType="line"
        height="h-48 sm:h-56"
        loading={loading}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={monthlyUsageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E0DC" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8B8680' }} />
            <YAxis tick={{ fontSize: 11, fill: '#8B8680' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E2E0DC',
                borderRadius: '8px',
                fontSize: 12,
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spend']}
            />
            <Line
              type="monotone"
              dataKey="cost"
              stroke="#C9A96E"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#C9A96E' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  );
}
