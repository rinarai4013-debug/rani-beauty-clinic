import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Appointments API - RaniOS Docs',
  description: 'API reference for appointments, upcoming schedules, and no-show risk prediction.',
};

export default function AppointmentsDocsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0F1D2C] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
        Appointments API
      </h1>
      <p className="text-[#0F1D2C]/60 mb-8">
        Query appointments, upcoming schedules, and no-show risk predictions.
      </p>
      <p className="text-sm text-[#0F1D2C]/50 mb-8">
        Required scope: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-[#C9A96E]">appointments:read</code>
      </p>

      {/* list */}
      <section className="mb-12 rounded-xl border border-[#C9A96E]/10 bg-white p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">GET</span>
          <code className="text-sm font-mono text-[#0F1D2C]">/v1/appointments</code>
        </div>
        <p className="text-sm text-[#0F1D2C]/70 mb-4">List appointments with filtering and pagination.</p>

        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/50 mb-2">Parameters</h4>
        <div className="overflow-x-auto rounded border border-gray-100 mb-4">
          <table className="w-full text-xs">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Param</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Description</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="px-3 py-1.5 font-mono">status</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">scheduled, confirmed, completed, cancelled, no_show</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">provider</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">Filter by provider name</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">service</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">Filter by service name</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">dateFrom</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">Start date (YYYY-MM-DD)</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">dateTo</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">End date (YYYY-MM-DD)</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">isConsult</td><td className="px-3 py-1.5">boolean</td><td className="px-3 py-1.5">Filter consult appointments only</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">clientId</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">Filter by client ID</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">page</td><td className="px-3 py-1.5">number</td><td className="px-3 py-1.5">Page number (default: 1)</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">pageSize</td><td className="px-3 py-1.5">number</td><td className="px-3 py-1.5">Results per page (default: 25)</td></tr>
            </tbody>
          </table>
        </div>

        <div className="mb-3">
          <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 mb-2">TypeScript</span>
          <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`const { data } = await ranios.appointments.list({
  status: 'scheduled',
  dateFrom: '2026-03-25',
  dateTo: '2026-03-31',
  provider: 'Dr. Mom',
});`}
          </pre>
        </div>
        <div>
          <span className="inline-block rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 mb-2">cURL</span>
          <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`curl "https://api.ranios.com/v1/appointments?status=scheduled&dateFrom=2026-03-25&dateTo=2026-03-31" \\
  -H "Authorization: Bearer rani_live_..." \\
  -H "X-Tenant-Id: my-clinic"`}
          </pre>
        </div>

        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/50 mt-4 mb-2">Response Schema</h4>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`{
  "data": [{
    "id": "apt_xyz789",
    "clientId": "rec_abc123",
    "clientName": "Jane Doe",
    "service": "Sofwave",
    "category": "skin-tightening",
    "provider": "Dr. Mom",
    "date": "2026-03-28",
    "time": "10:00 AM",
    "duration": 60,
    "status": "scheduled",
    "isConsult": false,
    "depositAmount": 500,
    "depositPaid": true,
    "estimatedRevenue": 2750,
    "source": "online"
  }]
}`}
        </pre>
      </section>

      {/* upcoming */}
      <section className="mb-12 rounded-xl border border-[#C9A96E]/10 bg-white p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">GET</span>
          <code className="text-sm font-mono text-[#0F1D2C]">/v1/appointments/upcoming</code>
        </div>
        <p className="text-sm text-[#0F1D2C]/70 mb-4">Get upcoming appointments for the next N days (default: 7). Optionally include no-show risk scores.</p>

        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/50 mb-2">Parameters</h4>
        <div className="overflow-x-auto rounded border border-gray-100 mb-4">
          <table className="w-full text-xs">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Param</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Description</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="px-3 py-1.5 font-mono">days</td><td className="px-3 py-1.5">number</td><td className="px-3 py-1.5">Number of days ahead (default: 7)</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">provider</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">Filter by provider</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">includeNoShowRisk</td><td className="px-3 py-1.5">boolean</td><td className="px-3 py-1.5">Attach no-show risk score to each appointment</td></tr>
            </tbody>
          </table>
        </div>

        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`const { data } = await ranios.appointments.getUpcoming({
  days: 7,
  includeNoShowRisk: true,
});

data.forEach(apt => {
  if (apt.noShowRisk?.level === 'high') {
    console.warn(\`High risk: \${apt.clientName} on \${apt.date}\`);
  }
});`}
        </pre>
      </section>

      {/* no-show risk */}
      <section className="mb-12 rounded-xl border border-[#C9A96E]/10 bg-white p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">GET</span>
          <code className="text-sm font-mono text-[#0F1D2C]">/v1/appointments/no-show-risk</code>
        </div>
        <p className="text-sm text-[#0F1D2C]/70 mb-4">
          Predict no-show risk for upcoming appointments. Uses 6-factor weighted model:
          history (35%), deposit (20%), lead time (15%), membership (10%), timing (10%), source (10%).
        </p>

        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto mb-4">
{`const { data } = await ranios.appointments.getNoShowRisk('2026-03-28');`}
        </pre>

        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`{
  "data": [{
    "appointmentId": "apt_xyz789",
    "clientId": "rec_abc123",
    "clientName": "Jane Doe",
    "service": "Sofwave",
    "date": "2026-03-28",
    "time": "10:00 AM",
    "score": 28,
    "level": "low",
    "factors": [
      { "name": "history", "weight": 0.35, "score": 10, "description": "0 no-shows in 24 visits" },
      { "name": "deposit", "weight": 0.2, "score": 5, "description": "$500 deposit paid" },
      { "name": "lead_time", "weight": 0.15, "score": 40, "description": "Booked 3 days ago" },
      { "name": "membership", "weight": 0.1, "score": 20, "description": "Active Gold member" },
      { "name": "timing", "weight": 0.1, "score": 50, "description": "Morning slot, weekday" },
      { "name": "source", "weight": 0.1, "score": 30, "description": "Booked online" }
    ],
    "suggestedActions": ["Standard confirmation SMS 24h before"]
  }]
}`}
        </pre>
      </section>
    </div>
  );
}
