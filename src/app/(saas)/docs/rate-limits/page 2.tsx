import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rate Limits - RaniOS Docs',
  description: 'Rate limiting policies and best practices for the RaniOS API.',
};

const TIER_LIMITS = [
  { tier: 'Starter', ratePerMin: 30, dailyLimit: '10,000', burstLimit: 10 },
  { tier: 'Professional', ratePerMin: 60, dailyLimit: '50,000', burstLimit: 20 },
  { tier: 'Enterprise', ratePerMin: 120, dailyLimit: 'Unlimited', burstLimit: 40 },
];

const ENDPOINT_LIMITS = [
  { endpoint: 'GET /clients', limit: '60/min', note: 'Standard' },
  { endpoint: 'GET /clients/:id/churn', limit: '30/min', note: 'Compute-intensive' },
  { endpoint: 'GET /appointments', limit: '60/min', note: 'Standard' },
  { endpoint: 'GET /revenue/kpis', limit: '30/min', note: 'Aggregation query' },
  { endpoint: 'GET /revenue/anomalies', limit: '10/min', note: 'Heavy computation' },
  { endpoint: 'POST /ai/chat', limit: '10/min', note: 'AI endpoint' },
  { endpoint: 'POST /ai/recommend', limit: '10/min', note: 'AI endpoint' },
  { endpoint: 'POST /ai/intake', limit: '5/min', note: 'AI endpoint, heavy' },
  { endpoint: 'POST /templates/*', limit: '30/min', note: 'Template rendering' },
  { endpoint: 'GET /schedule/optimize', limit: '10/min', note: 'Compute-intensive' },
];

export default function RateLimitsDocsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0F1D2C] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
        Rate Limits
      </h1>
      <p className="text-[#0F1D2C]/60 mb-8">Understanding and working within API rate limits.</p>

      {/* Overview */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Overview</h2>
        <p className="text-sm text-[#0F1D2C]/70 mb-3 leading-relaxed">
          Rate limits protect the platform and ensure fair usage across all tenants.
          Limits are applied per API key and vary by subscription tier and endpoint type.
        </p>
      </section>

      {/* Tier limits */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Limits by Tier</h2>
        <div className="overflow-x-auto rounded-lg border border-[#C9A96E]/10">
          <table className="w-full text-sm">
            <thead className="bg-[#0F1D2C]/5">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Tier</th>
                <th className="px-4 py-3 text-left font-semibold">Requests/Min</th>
                <th className="px-4 py-3 text-left font-semibold">Daily Limit</th>
                <th className="px-4 py-3 text-left font-semibold">Burst</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A96E]/10">
              {TIER_LIMITS.map((row) => (
                <tr key={row.tier}>
                  <td className="px-4 py-2.5 font-medium">{row.tier}</td>
                  <td className="px-4 py-2.5">{row.ratePerMin}</td>
                  <td className="px-4 py-2.5">{row.dailyLimit}</td>
                  <td className="px-4 py-2.5">{row.burstLimit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Endpoint limits */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Per-Endpoint Limits</h2>
        <p className="text-sm text-[#0F1D2C]/70 mb-3">
          Some endpoints have lower limits due to computation cost:
        </p>
        <div className="overflow-x-auto rounded-lg border border-[#C9A96E]/10">
          <table className="w-full text-xs">
            <thead className="bg-[#0F1D2C]/5">
              <tr>
                <th className="px-3 py-3 text-left font-semibold">Endpoint</th>
                <th className="px-3 py-3 text-left font-semibold">Limit</th>
                <th className="px-3 py-3 text-left font-semibold">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A96E]/10">
              {ENDPOINT_LIMITS.map((row) => (
                <tr key={row.endpoint}>
                  <td className="px-3 py-2 font-mono text-[#C9A96E]">{row.endpoint}</td>
                  <td className="px-3 py-2">{row.limit}</td>
                  <td className="px-3 py-2 text-[#0F1D2C]/60">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Response headers */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Rate Limit Headers</h2>
        <p className="text-sm text-[#0F1D2C]/70 mb-3">Every response includes these headers:</p>
        <div className="overflow-x-auto rounded border border-gray-100 mb-4">
          <table className="w-full text-xs">
            <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">Header</th><th className="px-3 py-2 text-left">Description</th></tr></thead>
            <tbody className="divide-y">
              <tr><td className="px-3 py-1.5 font-mono">X-RateLimit-Limit</td><td className="px-3 py-1.5">Maximum requests per window</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">X-RateLimit-Remaining</td><td className="px-3 py-1.5">Requests remaining in current window</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">X-RateLimit-Reset</td><td className="px-3 py-1.5">Seconds until the rate limit window resets</td></tr>
              <tr><td className="px-3 py-1.5 font-mono">Retry-After</td><td className="px-3 py-1.5">Seconds to wait before retrying (only on 429)</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SDK handling */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">SDK Auto-Handling</h2>
        <p className="text-sm text-[#0F1D2C]/70 mb-3">
          The SDK automatically tracks rate limits and queues requests when limits are reached:
        </p>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`const ranios = new RaniOSClient({
  apiKey: '...',
  tenantId: '...',
});

// The SDK tracks rate limit headers from responses
// and automatically waits when limits are reached

// Check current rate limit state
const state = ranios.getRateLimitState();
console.log(\`Remaining: \${state.remaining}/\${state.limit}\`);
console.log(\`Resets at: \${new Date(state.resetAt).toISOString()}\`);

// Multiple concurrent requests are queued automatically
const results = await Promise.all([
  ranios.clients.list({ page: 1 }),
  ranios.clients.list({ page: 2 }),
  ranios.clients.list({ page: 3 }),
  ranios.revenue.getKPIs(),
  ranios.appointments.getUpcoming(),
]);
// SDK ensures these don't exceed rate limits`}
        </pre>
      </section>

      {/* Best practices */}
      <section className="rounded-xl border border-[#C9A96E]/20 bg-white p-6">
        <h2 className="text-lg font-semibold text-[#0F1D2C] mb-3">Best Practices</h2>
        <ul className="space-y-2 text-sm text-[#0F1D2C]/70">
          <li><strong>Cache responses</strong> - KPI and analytics data does not change second-to-second. Cache for 30-60 seconds.</li>
          <li><strong>Use webhooks</strong> - Instead of polling for changes, subscribe to webhook events.</li>
          <li><strong>Batch requests</strong> - Use list endpoints with pagination rather than individual GET calls.</li>
          <li><strong>Respect Retry-After</strong> - When you receive a 429, wait the specified duration.</li>
          <li><strong>Use test keys</strong> - Test environments have separate rate limits so development does not affect production.</li>
          <li><strong>Monitor usage</strong> - Check the dashboard for API usage trends and adjust your integration accordingly.</li>
        </ul>
      </section>
    </div>
  );
}
