import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Revenue API - RaniOS Docs',
  description: 'Revenue KPIs, trend analysis, and anomaly detection API reference.',
};

export default function RevenueDocsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0F1D2C] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
        Revenue API
      </h1>
      <p className="text-[#0F1D2C]/60 mb-8">KPIs, trend analysis, and anomaly detection with 5 detection methods.</p>
      <p className="text-sm text-[#0F1D2C]/50 mb-8">
        Required scope: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-[#C9A96E]">revenue:read</code>
      </p>

      {/* KPIs */}
      <section className="mb-12 rounded-xl border border-[#C9A96E]/10 bg-white p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">GET</span>
          <code className="text-sm font-mono text-[#0F1D2C]">/v1/revenue/kpis</code>
        </div>
        <p className="text-sm text-[#0F1D2C]/70 mb-4">Revenue KPIs including daily, weekly, monthly totals, targets, projections, and breakdowns.</p>

        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/50 mb-2">Parameters</h4>
        <div className="overflow-x-auto rounded border border-gray-100 mb-4">
          <table className="w-full text-xs">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Param</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Description</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="px-3 py-1.5 font-mono">range</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">7d, 30d, 90d, mtd, ytd (default: 30d)</td></tr>
            </tbody>
          </table>
        </div>

        <div className="mb-3">
          <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 mb-2">TypeScript</span>
          <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`const { data } = await ranios.revenue.getKPIs({ range: '30d' });

console.log(\`MTD: $\${data.mtd} / $\${data.target}\`);
console.log(\`Projected: $\${data.projectedMonth}\`);
console.log(\`Top Service: \${data.topService.name}\`);`}
          </pre>
        </div>
        <div>
          <span className="inline-block rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 mb-2">cURL</span>
          <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`curl "https://api.ranios.com/v1/revenue/kpis?range=30d" \\
  -H "Authorization: Bearer rani_live_..." \\
  -H "X-Tenant-Id: my-clinic"`}
          </pre>
        </div>

        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/50 mt-4 mb-2">Response Schema</h4>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`{
  "data": {
    "today": 4250,
    "wtd": 18900,
    "mtd": 67500,
    "ytd": 245000,
    "target": 80000,
    "projectedMonth": 78200,
    "avgDaily": 2700,
    "avgTicket": 425,
    "topService": { "name": "Sofwave", "revenue": 22000, "count": 8 },
    "topProvider": { "name": "Dr. Mom", "revenue": 45000, "count": 95 },
    "byCategory": [
      { "category": "skin-tightening", "revenue": 22000, "percentage": 32.6 },
      { "category": "injectables", "revenue": 18500, "percentage": 27.4 }
    ],
    "byPaymentMethod": [
      { "method": "credit_card", "amount": 45000, "count": 85 },
      { "method": "financing", "amount": 22500, "count": 12 }
    ],
    "comparisonPeriod": {
      "mtdLastMonth": 62000,
      "mtdChange": 5500,
      "mtdChangePercent": 8.9
    }
  }
}`}
        </pre>
      </section>

      {/* Trends */}
      <section className="mb-12 rounded-xl border border-[#C9A96E]/10 bg-white p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">GET</span>
          <code className="text-sm font-mono text-[#0F1D2C]">/v1/revenue/trends</code>
        </div>
        <p className="text-sm text-[#0F1D2C]/70 mb-4">Revenue trend data over time with daily breakdowns and summary statistics.</p>

        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/50 mb-2">Parameters</h4>
        <div className="overflow-x-auto rounded border border-gray-100 mb-4">
          <table className="w-full text-xs">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Param</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Description</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="px-3 py-1.5 font-mono">days</td><td className="px-3 py-1.5">number</td><td className="px-3 py-1.5">Number of days (default: 30)</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">groupBy</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">day, week, month</td></tr>
            </tbody>
          </table>
        </div>

        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`const { data } = await ranios.revenue.getTrends({ days: 30 });

console.log(\`Trend: \${data.summary.trend} (\${data.summary.trendPercent}%)\`);
console.log(\`Best day: \${data.summary.bestDay.date} - $\${data.summary.bestDay.revenue}\`);`}
        </pre>
      </section>

      {/* Anomalies */}
      <section className="mb-12 rounded-xl border border-[#C9A96E]/10 bg-white p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">GET</span>
          <code className="text-sm font-mono text-[#0F1D2C]">/v1/revenue/anomalies</code>
        </div>
        <p className="text-sm text-[#0F1D2C]/70 mb-4">
          Revenue anomaly detection using 5 methods: target deviation, rolling average,
          day-of-week pattern, provider imbalance, and financing spike.
        </p>

        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto mb-4">
{`const { data } = await ranios.revenue.getAnomalies();

console.log(\`Health Score: \${data.healthScore}/100\`);
console.log(\`Projected Month End: $\${data.projectedMonthEnd}\`);

data.anomalies
  .filter(a => a.severity === 'critical')
  .forEach(a => console.warn(\`CRITICAL: \${a.message}\`));`}
        </pre>

        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`{
  "data": {
    "anomalies": [{
      "id": "anom_001",
      "type": "target_deviation",
      "severity": "warning",
      "message": "MTD revenue is 15.6% below target pace",
      "value": 67500,
      "expected": 80000,
      "deviation": -15.6,
      "date": "2026-03-25"
    }],
    "healthScore": 72,
    "summary": "Revenue trending below target with 1 warning anomaly detected.",
    "projectedMonthEnd": 78200,
    "detectionMethods": [
      { "method": "target_deviation", "status": "warning", "detail": "-15.6% from target" },
      { "method": "rolling_avg", "status": "normal", "detail": "Within 1 std dev" },
      { "method": "dow_pattern", "status": "normal", "detail": "Consistent with weekday patterns" },
      { "method": "provider_imbalance", "status": "normal", "detail": "Balanced across providers" },
      { "method": "financing_spike", "status": "normal", "detail": "Financing ratio stable at 18%" }
    ]
  }
}`}
        </pre>
      </section>
    </div>
  );
}
