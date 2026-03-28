import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - RaniOS Docs',
  description: 'API key management, scopes, and authentication for the RaniOS SDK.',
};

const SCOPES_TABLE = [
  { scope: 'clients:read', description: 'View client profiles, churn risk, and recommendations' },
  { scope: 'clients:write', description: 'Create and update client records' },
  { scope: 'appointments:read', description: 'View appointments, no-show risk scores' },
  { scope: 'appointments:write', description: 'Create and modify appointments' },
  { scope: 'revenue:read', description: 'View revenue KPIs, trends, and anomalies' },
  { scope: 'schedule:read', description: 'View daily schedule and optimization data' },
  { scope: 'schedule:write', description: 'Trigger schedule optimization' },
  { scope: 'inventory:read', description: 'View inventory alerts and waste analysis' },
  { scope: 'inventory:write', description: 'Update inventory levels and reorder status' },
  { scope: 'loyalty:read', description: 'View loyalty member details and point balances' },
  { scope: 'loyalty:write', description: 'Award points and redeem rewards' },
  { scope: 'referrals:read', description: 'View referral statistics' },
  { scope: 'referrals:write', description: 'Generate referral codes and links' },
  { scope: 'ai:read', description: 'View AI-generated insights' },
  { scope: 'ai:write', description: 'Trigger AI chat, recommendations, and intake analysis' },
  { scope: 'templates:read', description: 'View and render communication templates' },
  { scope: 'webhooks:manage', description: 'Create, update, and delete webhook subscriptions' },
];

const PRESETS_TABLE = [
  { preset: 'readonly', description: 'Read-only access to all resources', scopes: 'All :read scopes' },
  { preset: 'full', description: 'Full access to all resources', scopes: 'All scopes' },
  { preset: 'dashboard', description: 'Dashboard integration', scopes: 'clients, appointments, revenue, schedule, inventory :read' },
  { preset: 'crm', description: 'CRM integration', scopes: 'clients, appointments, loyalty :read/:write' },
  { preset: 'ai', description: 'AI features only', scopes: 'ai :read/:write, clients:read, templates:read' },
  { preset: 'webhooks', description: 'Webhook management', scopes: 'webhooks:manage' },
];

export default function AuthenticationPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0F1D2C] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
        Authentication
      </h1>
      <p className="text-[#0F1D2C]/60 mb-8">API key management, scopes, and security best practices.</p>

      {/* Overview */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Overview</h2>
        <p className="text-sm text-[#0F1D2C]/70 mb-3 leading-relaxed">
          RaniOS uses API keys for authentication. Each key is scoped to a specific tenant and
          set of permissions. Keys follow the format <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">rani_{'{'}{'{'}env{'}'}{'}'}_{'{'}{'{'}32-hex-chars{'}'}{'}'}</code> where
          env is either <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">live</code> or <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">test</code>.
        </p>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`# Every request must include:
Authorization: Bearer rani_live_a1b2c3d4e5f6...
X-Tenant-Id: my-clinic
Content-Type: application/json`}
        </pre>
      </section>

      {/* Creating keys */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Creating API Keys</h2>
        <div className="mb-4">
          <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 mb-2">TypeScript</span>
          <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`import { generateAPIKey, SCOPE_PRESETS } from '@ranios/sdk';

// Create a key with a preset
const { key, record } = generateAPIKey({
  name: 'Production Dashboard',
  tenantId: 'my-clinic',
  environment: 'live',
  scopes: SCOPE_PRESETS.dashboard,
  createdBy: 'admin',
});

console.log(key); // rani_live_a1b2c3d4... (save this!)
console.log(record.id); // key_abc123...`}
          </pre>
        </div>
        <div>
          <span className="inline-block rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 mb-2">cURL</span>
          <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`curl -X POST "https://api.ranios.com/v1/sdk/keys" \\
  -H "Authorization: Bearer <session-token>" \\
  -H "X-Tenant-Id: my-clinic" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Production Dashboard",
    "environment": "live",
    "preset": "dashboard"
  }'`}
          </pre>
        </div>
      </section>

      {/* Response schema */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Create Key Response</h2>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`{
  "data": {
    "key": "rani_live_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    "id": "key_9f8e7d6c5b4a3210",
    "name": "Production Dashboard",
    "keyPrefix": "rani_live_a1b2",
    "environment": "live",
    "scopes": [
      "clients:read",
      "appointments:read",
      "revenue:read",
      "schedule:read",
      "inventory:read"
    ],
    "createdAt": "2026-03-25T10:00:00.000Z",
    "expiresAt": null
  },
  "message": "API key created. Save this key securely."
}`}
        </pre>
      </section>

      {/* Scopes table */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Available Scopes</h2>
        <div className="overflow-x-auto rounded-lg border border-[#C9A96E]/10">
          <table className="w-full text-sm">
            <thead className="bg-[#0F1D2C]/5">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#0F1D2C]">Scope</th>
                <th className="px-4 py-3 text-left font-semibold text-[#0F1D2C]">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A96E]/10">
              {SCOPES_TABLE.map((row) => (
                <tr key={row.scope}>
                  <td className="px-4 py-2.5">
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-[#C9A96E]">{row.scope}</code>
                  </td>
                  <td className="px-4 py-2.5 text-[#0F1D2C]/70">{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Presets */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Scope Presets</h2>
        <p className="text-sm text-[#0F1D2C]/70 mb-3">
          Use presets for common integration patterns instead of listing individual scopes.
        </p>
        <div className="overflow-x-auto rounded-lg border border-[#C9A96E]/10">
          <table className="w-full text-sm">
            <thead className="bg-[#0F1D2C]/5">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#0F1D2C]">Preset</th>
                <th className="px-4 py-3 text-left font-semibold text-[#0F1D2C]">Use Case</th>
                <th className="px-4 py-3 text-left font-semibold text-[#0F1D2C]">Scopes Included</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C9A96E]/10">
              {PRESETS_TABLE.map((row) => (
                <tr key={row.preset}>
                  <td className="px-4 py-2.5">
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">{row.preset}</code>
                  </td>
                  <td className="px-4 py-2.5 text-[#0F1D2C]/70">{row.description}</td>
                  <td className="px-4 py-2.5 text-[#0F1D2C]/70">{row.scopes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Key validation */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#0F1D2C] mb-3">Validating Keys</h2>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`import { validateAPIKey, hasScope } from '@ranios/sdk';

const result = validateAPIKey(apiKey, storedKeys);

if (!result.valid) {
  console.error(result.reason);
  // "API key not found" | "API key has been revoked" | "API key has expired"
}

// Check scope
if (result.record && hasScope(result.record, 'clients:read')) {
  // Proceed with client data access
}`}
        </pre>
      </section>

      {/* Security */}
      <section className="rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-3">Security Best Practices</h2>
        <ul className="space-y-2 text-sm text-red-700">
          <li>Never expose API keys in client-side code or version control</li>
          <li>Use environment variables for key storage</li>
          <li>Use the minimum required scopes (principle of least privilege)</li>
          <li>Use test keys (<code className="rounded bg-red-100 px-1 text-xs font-mono">rani_test_</code>) during development</li>
          <li>Rotate keys regularly and revoke unused keys</li>
          <li>Set expiration dates on keys when possible</li>
          <li>Monitor key usage via the dashboard for anomalies</li>
        </ul>
      </section>
    </div>
  );
}
