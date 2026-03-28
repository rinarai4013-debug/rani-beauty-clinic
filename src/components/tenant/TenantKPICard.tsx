/**
 * Tenant KPI Card Component
 * Displays a single KPI metric with optional change indicator.
 */

'use client';

interface TenantKPICardProps {
  title: string;
  value: number;
  format: 'currency' | 'number' | 'percent';
  change?: number;
  subtitle?: string;
  alertThreshold?: number;
}

export function TenantKPICard({ title, value, format, change, subtitle, alertThreshold }: TenantKPICardProps) {
  const isAlert = alertThreshold !== undefined && value >= alertThreshold;

  const formatted = format === 'currency'
    ? `$${value.toLocaleString()}`
    : format === 'percent'
    ? `${value}%`
    : value.toLocaleString();

  return (
    <div className={`bg-white rounded-xl border p-5 ${isAlert ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
      <p className={`text-2xl font-bold mt-2 ${isAlert ? 'text-red-600' : 'text-gray-900'}`}>
        {formatted}
      </p>
      <div className="flex items-center gap-2 mt-1">
        {change !== undefined && change !== 0 && (
          <span className={`text-xs font-semibold ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
        {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
      </div>
    </div>
  );
}
