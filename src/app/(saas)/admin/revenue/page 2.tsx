'use client';

const MRR_HISTORY = [
  { month: 'Oct', mrr: 18200, newMrr: 2400, expansion: 800, contraction: 200, churn: 400 },
  { month: 'Nov', mrr: 22800, newMrr: 3200, expansion: 1200, contraction: 300, churn: 500 },
  { month: 'Dec', mrr: 27400, newMrr: 3800, expansion: 1600, contraction: 400, churn: 600 },
  { month: 'Jan', mrr: 33200, newMrr: 4600, expansion: 2000, contraction: 500, churn: 300 },
  { month: 'Feb', mrr: 38600, newMrr: 4200, expansion: 1800, contraction: 400, churn: 200 },
  { month: 'Mar', mrr: 42800, newMrr: 3400, expansion: 1400, contraction: 300, churn: 300 },
];

const SEGMENT_DATA = [
  { segment: 'Enterprise', customers: 5, mrr: 4995, pctTotal: 12, avgMrr: 999, churn: 0 },
  { segment: 'Professional', customers: 24, mrr: 11976, pctTotal: 28, avgMrr: 499, churn: 2.1 },
  { segment: 'Starter', customers: 18, mrr: 3582, pctTotal: 8, avgMrr: 199, churn: 5.6 },
];

const CAC_CHANNELS = [
  { channel: 'Organic Search', spend: 0, leads: 340, customers: 18, cac: 0, roi: 999 },
  { channel: 'Google Ads', spend: 4200, leads: 180, customers: 8, cac: 525, roi: 640 },
  { channel: 'LinkedIn', spend: 2800, leads: 95, customers: 5, cac: 560, roi: 580 },
  { channel: 'Referrals', spend: 2400, leads: 47, customers: 12, cac: 200, roi: 1890 },
  { channel: 'Content/SEO', spend: 1500, leads: 120, customers: 4, cac: 375, roi: 910 },
];

const COHORTS = [
  { month: 'Oct 25', signups: 12, retention: [100, 92, 83, 75, 75, 67] },
  { month: 'Nov 25', signups: 15, retention: [100, 87, 80, 73, 67, null] },
  { month: 'Dec 25', signups: 18, retention: [100, 89, 83, 78, null, null] },
  { month: 'Jan 26', signups: 22, retention: [100, 91, 86, null, null, null] },
  { month: 'Feb 26', signups: 20, retention: [100, 90, null, null, null, null] },
  { month: 'Mar 26', signups: 16, retention: [100, null, null, null, null, null] },
];

export default function RevenueDashboard() {
  const currentMRR = 42800;
  const arr = currentMRR * 12;
  const nrr = 118;
  const quickRatio = 3.8;
  const ltv = 7184;
  const cac = 420;
  const ltvCac = (ltv / cac).toFixed(1);
  const payback = (cac / (currentMRR / 47)).toFixed(1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">SaaS Revenue Metrics</h1>
        <p className="text-sm text-gray-500 mt-1">MRR, ARR, retention, cohorts, and unit economics</p>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'MRR', value: `$${(currentMRR / 1000).toFixed(1)}K`, sub: '+$4.2K this month' },
          { label: 'ARR', value: `$${(arr / 1000).toFixed(0)}K`, sub: 'Annualized' },
          { label: 'NRR', value: `${nrr}%`, sub: '>100% = expanding' },
          { label: 'Quick Ratio', value: String(quickRatio), sub: '>4 = excellent' },
          { label: 'LTV:CAC', value: `${ltvCac}x`, sub: '>3x = healthy' },
          { label: 'Payback', value: `${payback}mo`, sub: '<12mo = good' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{kpi.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{kpi.value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* MRR Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-sm font-bold text-gray-900 mb-4">MRR Trend</h2>
        <div className="flex items-end gap-2 h-48">
          {MRR_HISTORY.map((m) => {
            const height = (m.mrr / 45000) * 100;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-gray-700">${(m.mrr / 1000).toFixed(1)}K</span>
                <div className="w-full relative" style={{ height: `${height}%` }}>
                  <div className="absolute inset-0 bg-[#0F1D2C] rounded-t-lg" />
                </div>
                <span className="text-xs text-gray-500">{m.month}</span>
              </div>
            );
          })}
        </div>
        {/* MRR Breakdown Legend */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-4 gap-4">
          {[
            { label: 'New MRR', value: '$3,400', color: 'bg-emerald-500' },
            { label: 'Expansion', value: '$1,400', color: 'bg-blue-500' },
            { label: 'Contraction', value: '-$300', color: 'bg-amber-500' },
            { label: 'Churn', value: '-$300', color: 'bg-red-500' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-xs text-gray-500">{item.label}: <strong>{item.value}</strong></span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue by Segment */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Revenue by Segment</h2>
          <div className="space-y-3">
            {SEGMENT_DATA.map((seg) => (
              <div key={seg.segment} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900">{seg.segment}</span>
                  <span className="text-sm font-bold text-gray-900">${seg.mrr.toLocaleString()}/mo</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{seg.customers} customers</span>
                  <span>Avg: ${seg.avgMrr}/mo</span>
                  <span>Churn: {seg.churn}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CAC by Channel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">CAC by Channel</h2>
          <div className="space-y-3">
            {CAC_CHANNELS.map((ch) => (
              <div key={ch.channel} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{ch.channel}</p>
                  <p className="text-xs text-gray-500">{ch.leads} leads, {ch.customers} customers</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">
                    {ch.cac === 0 ? 'Free' : `$${ch.cac}`}
                  </p>
                  <p className="text-xs text-emerald-600">{ch.roi > 500 ? '999' : ch.roi}% ROI</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cohort Retention */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Cohort Retention</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Cohort</th>
                <th className="text-center text-xs font-medium text-gray-500 px-3 py-2">Signups</th>
                {[0, 1, 2, 3, 4, 5].map((m) => (
                  <th key={m} className="text-center text-xs font-medium text-gray-500 px-3 py-2">Mo {m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COHORTS.map((cohort) => (
                <tr key={cohort.month}>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900">{cohort.month}</td>
                  <td className="px-3 py-2 text-sm text-center text-gray-600">{cohort.signups}</td>
                  {cohort.retention.map((r, i) => (
                    <td key={i} className="px-3 py-2 text-center">
                      {r !== null ? (
                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                          r >= 85 ? 'bg-emerald-100 text-emerald-700' :
                          r >= 70 ? 'bg-blue-100 text-blue-700' :
                          r >= 50 ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {r}%
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">--</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
