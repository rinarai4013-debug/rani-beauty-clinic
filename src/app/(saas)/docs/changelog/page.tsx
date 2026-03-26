import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog - RaniOS Docs',
  description: 'API changelog and version history for the RaniOS SDK.',
};

const CHANGELOG_ENTRIES = [
  {
    version: '1.0.0',
    date: '2026-03-25',
    tag: 'Initial Release',
    tagColor: 'bg-green-100 text-green-700',
    changes: [
      { type: 'added', text: 'Clients API - list, get, churn risk, recommendations, at-risk' },
      { type: 'added', text: 'Appointments API - list, upcoming, no-show risk prediction' },
      { type: 'added', text: 'Revenue API - KPIs, trends, anomaly detection (5 methods)' },
      { type: 'added', text: 'Schedule API - daily schedule, optimization engine' },
      { type: 'added', text: 'Inventory API - alerts, waste analysis, reorder recommendations' },
      { type: 'added', text: 'Loyalty API - members, points, rewards, redemption' },
      { type: 'added', text: 'Referrals API - code generation, tracking, statistics' },
      { type: 'added', text: 'AI Endpoints - chat, 3-tier recommendations, intake analysis' },
      { type: 'added', text: 'Templates API - post-treatment, reactivation, pre-consult' },
      { type: 'added', text: 'Webhook support for 15 event types' },
      { type: 'added', text: 'API key management with 17 scopes and 6 presets' },
      { type: 'added', text: 'TypeScript SDK with full type exports' },
      { type: 'added', text: 'Automatic retry with exponential backoff and jitter' },
      { type: 'added', text: 'Client-side rate limiting' },
      { type: 'added', text: 'Multi-tenant support via X-Tenant-Id header' },
    ],
  },
  {
    version: '0.9.0-beta',
    date: '2026-03-10',
    tag: 'Beta',
    tagColor: 'bg-yellow-100 text-yellow-700',
    changes: [
      { type: 'added', text: 'Beta SDK with clients, revenue, and AI endpoints' },
      { type: 'added', text: 'API key authentication system' },
      { type: 'added', text: 'Basic rate limiting' },
      { type: 'note', text: 'Breaking changes expected before 1.0' },
    ],
  },
];

function ChangeTypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    added: 'bg-green-100 text-green-700',
    changed: 'bg-blue-100 text-blue-700',
    fixed: 'bg-orange-100 text-orange-700',
    removed: 'bg-red-100 text-red-700',
    deprecated: 'bg-yellow-100 text-yellow-700',
    note: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${styles[type] ?? styles.note}`}>
      {type}
    </span>
  );
}

export default function ChangelogPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-[#0F1D2C] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
        Changelog
      </h1>
      <p className="text-[#0F1D2C]/60 mb-8">API version history and release notes.</p>

      {/* Versioning policy */}
      <section className="mb-10 rounded-xl border border-[#C9A96E]/20 bg-white p-6">
        <h2 className="text-lg font-semibold text-[#0F1D2C] mb-3">Versioning Policy</h2>
        <ul className="space-y-2 text-sm text-[#0F1D2C]/70">
          <li>The API uses semantic versioning (MAJOR.MINOR.PATCH)</li>
          <li><strong>Major</strong> versions may include breaking changes and are communicated 90 days in advance</li>
          <li><strong>Minor</strong> versions add new endpoints or fields (backward-compatible)</li>
          <li><strong>Patch</strong> versions include bug fixes and performance improvements</li>
          <li>The current API version is <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">v1</code>, accessed via base URL</li>
          <li>Deprecated fields are marked in response headers and documented here</li>
        </ul>
      </section>

      {/* Changelog entries */}
      <div className="space-y-10">
        {CHANGELOG_ENTRIES.map((entry) => (
          <section key={entry.version} className="rounded-xl border border-[#C9A96E]/10 bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xl font-bold text-[#0F1D2C]">v{entry.version}</h2>
              <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${entry.tagColor}`}>
                {entry.tag}
              </span>
              <span className="text-sm text-[#0F1D2C]/50">{entry.date}</span>
            </div>
            <ul className="space-y-2">
              {entry.changes.map((change, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <ChangeTypeBadge type={change.type} />
                  <span className="text-[#0F1D2C]/70">{change.text}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Subscribe */}
      <section className="mt-10 rounded-xl border border-[#C9A96E]/20 bg-[#C9A96E]/5 p-6">
        <h2 className="text-lg font-semibold text-[#0F1D2C] mb-2">Stay Updated</h2>
        <p className="text-sm text-[#0F1D2C]/70">
          Subscribe to the <a href="#" className="text-[#C9A96E] hover:underline font-medium">RaniOS Developer Newsletter</a> for
          API updates, new features, and migration guides. Breaking changes are always communicated
          at least 90 days before they take effect.
        </p>
      </section>
    </div>
  );
}
