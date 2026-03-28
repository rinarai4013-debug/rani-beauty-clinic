import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RaniOS Developer Documentation',
  description: 'Build integrations with the RaniOS medspa operations platform. TypeScript SDK, REST API, webhooks, and AI endpoints.',
};

const FEATURE_CARDS = [
  {
    title: 'Clients API',
    description: 'Access client profiles, churn risk predictions, treatment recommendations, and at-risk segments.',
    href: '/docs/clients',
    icon: 'C',
  },
  {
    title: 'Appointments API',
    description: 'Query appointments, upcoming schedules, and no-show risk scores for proactive management.',
    href: '/docs/appointments',
    icon: 'A',
  },
  {
    title: 'Revenue API',
    description: 'KPI dashboards, trend analysis, and anomaly detection across 5 detection methods.',
    href: '/docs/revenue',
    icon: 'R',
  },
  {
    title: 'AI Endpoints',
    description: 'Claude-powered chat, 3-tier treatment recommendations, and intake intelligence analysis.',
    href: '/docs/ai',
    icon: 'AI',
  },
  {
    title: 'Webhooks',
    description: 'Real-time event notifications for appointments, clients, revenue, and more.',
    href: '/docs/webhooks',
    icon: 'W',
  },
  {
    title: 'Error Handling',
    description: 'Typed errors, retry logic, and comprehensive error code reference.',
    href: '/docs/errors',
    icon: 'E',
  },
];

export default function DocsLandingPage() {
  return (
    <div>
      {/* Hero */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[#0F1D2C] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
          RaniOS Developer Documentation
        </h1>
        <p className="text-lg text-[#0F1D2C]/70 leading-relaxed max-w-2xl">
          Build powerful integrations with the RaniOS medspa operations platform.
          Access client intelligence, revenue analytics, AI-powered recommendations,
          and automated communication workflows through our TypeScript SDK or REST API.
        </p>
      </div>

      {/* Quick install */}
      <div className="mb-12 rounded-xl border border-[#C9A96E]/20 bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#0F1D2C]/50 mb-4">
          Quick Install
        </h2>
        <pre className="rounded-lg bg-[#0F1D2C] p-4 text-sm text-gray-200 font-mono overflow-x-auto">
{`npm install @ranios/sdk

# or
yarn add @ranios/sdk`}
        </pre>
        <div className="mt-4 flex gap-3">
          <Link
            href="/docs/quickstart"
            className="rounded-lg bg-[#C9A96E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#C9A96E]/90 transition"
          >
            5-Minute Quickstart
          </Link>
          <Link
            href="/docs/authentication"
            className="rounded-lg border border-[#0F1D2C]/20 px-5 py-2.5 text-sm font-semibold text-[#0F1D2C] hover:bg-[#0F1D2C]/5 transition"
          >
            Get API Key
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <h2 className="text-2xl font-bold text-[#0F1D2C] mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
        API Reference
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURE_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-[#C9A96E]/10 bg-white p-6 transition hover:border-[#C9A96E]/30 hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#C9A96E]/10 text-sm font-bold text-[#C9A96E]">
              {card.icon}
            </div>
            <h3 className="mb-2 text-lg font-semibold text-[#0F1D2C] group-hover:text-[#C9A96E] transition">
              {card.title}
            </h3>
            <p className="text-sm text-[#0F1D2C]/60 leading-relaxed">
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      {/* SDK highlights */}
      <div className="mt-12 rounded-xl border border-[#C9A96E]/20 bg-white p-6">
        <h2 className="text-xl font-bold text-[#0F1D2C] mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
          SDK Highlights
        </h2>
        <ul className="space-y-3 text-sm text-[#0F1D2C]/70">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-green-100 text-center text-xs font-bold text-green-700 leading-5">1</span>
            <span><strong className="text-[#0F1D2C]">Full TypeScript support</strong> - Every response type is exported for end-to-end type safety.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-green-100 text-center text-xs font-bold text-green-700 leading-5">2</span>
            <span><strong className="text-[#0F1D2C]">Automatic retry</strong> - Exponential backoff with jitter on transient errors (5xx, timeouts).</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-green-100 text-center text-xs font-bold text-green-700 leading-5">3</span>
            <span><strong className="text-[#0F1D2C]">Client-side rate limiting</strong> - SDK tracks rate limits from response headers to avoid 429s.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-green-100 text-center text-xs font-bold text-green-700 leading-5">4</span>
            <span><strong className="text-[#0F1D2C]">Typed errors</strong> - Catch specific error classes (AuthenticationError, RateLimitError, etc.).</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-green-100 text-center text-xs font-bold text-green-700 leading-5">5</span>
            <span><strong className="text-[#0F1D2C]">Multi-tenant</strong> - Each client is scoped to a tenant ID for data isolation.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
