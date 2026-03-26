import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Clients API - RaniOS Docs',
  description: 'Full API reference for client profiles, churn risk, treatment recommendations, and at-risk segments.',
};

export default function ClientsDocsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0F1D2C] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
        Clients API
      </h1>
      <p className="text-[#0F1D2C]/60 mb-8">
        Access client profiles, churn risk predictions, AI treatment recommendations, and at-risk segments.
      </p>
      <p className="text-sm text-[#0F1D2C]/50 mb-8">
        Required scope: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-[#C9A96E]">clients:read</code>
      </p>

      {/* list */}
      <section className="mb-12 rounded-xl border border-[#C9A96E]/10 bg-white p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">GET</span>
          <code className="text-sm font-mono text-[#0F1D2C]">/v1/clients</code>
        </div>
        <p className="text-sm text-[#0F1D2C]/70 mb-4">List clients with filtering, pagination, and sorting.</p>

        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/50 mb-2">Parameters</h4>
        <div className="overflow-x-auto rounded border border-gray-100 mb-4">
          <table className="w-full text-xs">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Param</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Description</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="px-3 py-1.5 font-mono">status</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">lead, booked, active, lapsed, churned, vip</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">segment</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">new, regular, vip, at_risk</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">search</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">Search by name, email, or phone</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">membershipStatus</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">none, active, cancelled, expired</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">minLTV</td><td className="px-3 py-1.5">number</td><td className="px-3 py-1.5">Minimum lifetime value filter</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">page</td><td className="px-3 py-1.5">number</td><td className="px-3 py-1.5">Page number (default: 1)</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">pageSize</td><td className="px-3 py-1.5">number</td><td className="px-3 py-1.5">Results per page (default: 25, max: 100)</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">sortBy</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">name, ltv, lastVisitDate, createdAt</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">sortOrder</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">asc or desc</td></tr>
            </tbody>
          </table>
        </div>

        <div className="mb-3">
          <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 mb-2">TypeScript</span>
          <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`const { data, pagination } = await ranios.clients.list({
  status: 'active',
  segment: 'vip',
  sortBy: 'ltv',
  sortOrder: 'desc',
  page: 1,
  pageSize: 25,
});`}
          </pre>
        </div>
        <div>
          <span className="inline-block rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 mb-2">cURL</span>
          <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`curl "https://api.ranios.com/v1/clients?status=active&segment=vip&sortBy=ltv&sortOrder=desc" \\
  -H "Authorization: Bearer rani_live_..." \\
  -H "X-Tenant-Id: my-clinic"`}
          </pre>
        </div>

        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/50 mt-4 mb-2">Response Schema</h4>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`{
  "data": [{
    "id": "rec_abc123",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+12065551234",
    "status": "active",
    "segment": "vip",
    "ltv": 8500,
    "totalVisits": 24,
    "lastVisitDate": "2026-03-20",
    "membershipStatus": "active",
    "membershipTier": "Gold",
    "averageTicket": 354,
    "rebookRate": 0.85,
    "tags": ["hydrafacial-lover", "referral-source"],
    "createdAt": "2025-06-15T...",
    "updatedAt": "2026-03-20T..."
  }],
  "pagination": {
    "page": 1, "pageSize": 25, "total": 142,
    "totalPages": 6, "hasMore": true
  }
}`}
        </pre>
      </section>

      {/* get */}
      <section className="mb-12 rounded-xl border border-[#C9A96E]/10 bg-white p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">GET</span>
          <code className="text-sm font-mono text-[#0F1D2C]">/v1/clients/:id</code>
        </div>
        <p className="text-sm text-[#0F1D2C]/70 mb-4">Get a single client with full 360-degree profile. Pass <code className="text-xs font-mono bg-gray-100 px-1 rounded">?full=true</code> to include linked appointments, transactions, memberships, messages, and reviews.</p>

        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`const { data } = await ranios.clients.get('rec_abc123', { full: true });

// data.appointments - appointment history
// data.transactions - payment history
// data.memberships - membership records
// data.messages - SMS/email history
// data.reviews - review history`}
        </pre>
      </section>

      {/* churn risk */}
      <section className="mb-12 rounded-xl border border-[#C9A96E]/10 bg-white p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">GET</span>
          <code className="text-sm font-mono text-[#0F1D2C]">/v1/clients/:id/churn</code>
        </div>
        <p className="text-sm text-[#0F1D2C]/70 mb-4">
          Get churn risk prediction. Uses 5-factor weighted model:
          recency (40%), frequency (20%), monetary (15%), membership (15%), engagement (10%).
        </p>

        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto mb-4">
{`const { data } = await ranios.clients.getChurnRisk('rec_abc123');`}
        </pre>

        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`{
  "data": {
    "clientId": "rec_abc123",
    "score": 72,
    "level": "high",
    "factors": [
      { "name": "recency", "weight": 0.4, "score": 85, "description": "Last visit 47 days ago" },
      { "name": "frequency", "weight": 0.2, "score": 60, "description": "Visits declining" },
      { "name": "monetary", "weight": 0.15, "score": 45, "description": "LTV above average" },
      { "name": "membership", "weight": 0.15, "score": 90, "description": "No active membership" },
      { "name": "engagement", "weight": 0.1, "score": 70, "description": "Low SMS response rate" }
    ],
    "daysSinceLastVisit": 47,
    "predictedChurnDate": "2026-04-15",
    "suggestedActions": [
      "Send reactivation SMS with 15% loyalty discount",
      "Schedule courtesy call from provider",
      "Offer complimentary HydraFacial addon"
    ]
  }
}`}
        </pre>
      </section>

      {/* recommendations */}
      <section className="mb-12 rounded-xl border border-[#C9A96E]/10 bg-white p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">GET</span>
          <code className="text-sm font-mono text-[#0F1D2C]">/v1/clients/:id/recommend</code>
        </div>
        <p className="text-sm text-[#0F1D2C]/70 mb-4">
          AI-powered next-best-treatment recommendations. Uses 5 strategies: pathway continuation,
          category gaps, goal-based, timing/overdue, and membership upsell.
        </p>

        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto mb-4">
{`const { data } = await ranios.clients.getRecommendations('rec_abc123', {
  limit: 5,
});`}
        </pre>

        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`{
  "data": [
    {
      "service": "Sofwave",
      "category": "skin-tightening",
      "strategy": "pathway",
      "confidence": 0.92,
      "reason": "Next step in anti-aging pathway after RF Microneedling",
      "estimatedPrice": 2750,
      "priority": "high"
    },
    {
      "service": "VI Peel",
      "category": "chemical-peel",
      "strategy": "timing",
      "confidence": 0.78,
      "reason": "Last peel was 4 months ago - due for maintenance",
      "estimatedPrice": 395,
      "priority": "medium"
    }
  ]
}`}
        </pre>
      </section>

      {/* at-risk */}
      <section className="mb-12 rounded-xl border border-[#C9A96E]/10 bg-white p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">GET</span>
          <code className="text-sm font-mono text-[#0F1D2C]">/v1/clients/at-risk</code>
        </div>
        <p className="text-sm text-[#0F1D2C]/70 mb-4">
          Get all at-risk clients ranked by urgency with churn scores and reactivation templates.
        </p>

        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/50 mb-2">Parameters</h4>
        <div className="overflow-x-auto rounded border border-gray-100 mb-4">
          <table className="w-full text-xs">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Param</th><th className="px-3 py-2 text-left">Type</th><th className="px-3 py-2 text-left">Description</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="px-3 py-1.5 font-mono">urgency</td><td className="px-3 py-1.5">string</td><td className="px-3 py-1.5">immediate, this_week, this_month</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">limit</td><td className="px-3 py-1.5">number</td><td className="px-3 py-1.5">Max results (default: 50)</td></tr>
            </tbody>
          </table>
        </div>

        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`const { data } = await ranios.clients.getAtRisk({ urgency: 'immediate' });

// Each item contains:
// - client: { id, name, email, phone, status, ltv }
// - churnRisk: { score, level, factors, suggestedActions }
// - urgency: "immediate" | "this_week" | "this_month"
// - reactivationTemplate: template name for auto-outreach`}
        </pre>
      </section>
    </div>
  );
}
