import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quickstart - RaniOS Docs',
  description: 'Get started with the RaniOS SDK in under 5 minutes.',
};

export default function QuickstartPage() {
  return (
    <div className="prose-docs">
      <h1 className="text-3xl font-bold text-[#0F1D2C] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
        Quickstart
      </h1>
      <p className="text-[#0F1D2C]/60 mb-8">Get your first API call working in under 5 minutes.</p>

      {/* Step 1 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A96E] text-sm font-bold text-white">1</span>
          Install the SDK
        </h2>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto mb-2">
{`npm install @ranios/sdk`}
        </pre>
        <p className="text-sm text-[#0F1D2C]/60">Or with yarn/pnpm:</p>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`yarn add @ranios/sdk
pnpm add @ranios/sdk`}
        </pre>
      </section>

      {/* Step 2 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A96E] text-sm font-bold text-white">2</span>
          Get Your API Key
        </h2>
        <p className="text-sm text-[#0F1D2C]/70 mb-3">
          Navigate to <strong>Dashboard &gt; Settings &gt; API Keys</strong> and create a new key.
          Copy the key immediately - it is only shown once.
        </p>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`# Store your key in .env.local
RANIOS_API_KEY=rani_live_a1b2c3d4e5f6...
RANIOS_TENANT_ID=my-clinic`}
        </pre>
      </section>

      {/* Step 3 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A96E] text-sm font-bold text-white">3</span>
          Initialize the Client
        </h2>
        <div className="mb-3">
          <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 mb-2">TypeScript</span>
          <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`import { RaniOSClient } from '@ranios/sdk';

const ranios = new RaniOSClient({
  apiKey: process.env.RANIOS_API_KEY!,
  tenantId: process.env.RANIOS_TENANT_ID!,
});`}
          </pre>
        </div>
      </section>

      {/* Step 4 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A96E] text-sm font-bold text-white">4</span>
          Make Your First Call
        </h2>
        <div className="mb-3">
          <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 mb-2">TypeScript</span>
          <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`// Fetch revenue KPIs
const { data: kpis } = await ranios.revenue.getKPIs({ range: '30d' });

console.log(\`MTD Revenue: $\${kpis.mtd}\`);
console.log(\`Target: $\${kpis.target}\`);
console.log(\`Top Service: \${kpis.topService.name}\`);`}
          </pre>
        </div>
        <div>
          <span className="inline-block rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 mb-2">cURL</span>
          <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`curl -X GET "https://api.ranios.com/v1/revenue/kpis?range=30d" \\
  -H "Authorization: Bearer rani_live_a1b2c3d4..." \\
  -H "X-Tenant-Id: my-clinic" \\
  -H "Content-Type: application/json"`}
          </pre>
        </div>
      </section>

      {/* Step 5 */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#C9A96E] text-sm font-bold text-white">5</span>
          Explore More
        </h2>
        <div className="mb-3">
          <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 mb-2">TypeScript</span>
          <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`// Get at-risk clients
const { data: atRisk } = await ranios.clients.getAtRisk({
  urgency: 'immediate',
});
console.log(\`\${atRisk.length} clients need immediate attention\`);

// Check today's schedule
const { data: schedule } = await ranios.schedule.getToday();
console.log(\`\${schedule.summary.totalAppointments} appointments today\`);

// AI-powered treatment recommendations
const { data: recs } = await ranios.ai.recommend({
  concerns: ['fine lines', 'uneven tone'],
  goals: ['anti-aging'],
  budget: 'moderate',
});
recs.plans.forEach(plan => {
  console.log(\`\${plan.tier}: \${plan.name} - $\${plan.totalPrice}\`);
});

// Get no-show risk for today
const { data: noShowRisks } = await ranios.appointments.getNoShowRisk();
const highRisk = noShowRisks.filter(r => r.level === 'high');
console.log(\`\${highRisk.length} high no-show risk appointments\`);`}
          </pre>
        </div>
      </section>

      {/* Error handling */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Error Handling</h2>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`import {
  RaniOSClient,
  RateLimitError,
  AuthenticationError,
  NotFoundError,
} from '@ranios/sdk';

try {
  const { data } = await ranios.clients.get('rec_abc123');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Invalid API key - check your credentials');
  } else if (error instanceof RateLimitError) {
    console.error(\`Rate limited. Retry after \${error.retryAfter}s\`);
  } else if (error instanceof NotFoundError) {
    console.error('Client not found');
  }
}`}
        </pre>
      </section>

      {/* Next steps */}
      <section className="rounded-xl border border-[#C9A96E]/20 bg-white p-6">
        <h2 className="text-lg font-semibold text-[#0F1D2C] mb-3">Next Steps</h2>
        <ul className="space-y-2 text-sm text-[#0F1D2C]/70">
          <li>
            <a href="/docs/authentication" className="text-[#C9A96E] hover:underline font-medium">Authentication</a> - Learn about API key scopes and permissions
          </li>
          <li>
            <a href="/docs/clients" className="text-[#C9A96E] hover:underline font-medium">Clients API</a> - Full reference for client endpoints
          </li>
          <li>
            <a href="/docs/webhooks" className="text-[#C9A96E] hover:underline font-medium">Webhooks</a> - Set up real-time event notifications
          </li>
          <li>
            <a href="/docs/errors" className="text-[#C9A96E] hover:underline font-medium">Error Handling</a> - Complete error code reference
          </li>
        </ul>
      </section>
    </div>
  );
}
