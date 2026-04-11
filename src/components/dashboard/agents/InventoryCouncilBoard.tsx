'use client';

import Link from 'next/link';
import { getCouncilAgent } from '@/lib/dashboard/agent-council';

export default function InventoryCouncilBoard() {
  const agent = getCouncilAgent('inventory-oracle');

  if (!agent) return null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="rounded-xl border border-rani-border/30 bg-gradient-to-br from-rani-navy via-[#18233e] to-black px-5 py-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:px-6">
        <p className="text-xs font-body uppercase tracking-[0.22em] text-white/60">Protection Tier</p>
        <h1 className="mt-2 text-2xl font-heading sm:text-3xl">{agent.emoji} {agent.name}</h1>
        <p className="mt-2 max-w-2xl text-sm font-body text-white/75 sm:text-base">{agent.mission}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="rounded-xl border border-rani-border/25 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-heading font-semibold text-rani-navy">Inventory intelligence</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {agent.scorecards.map((scorecard) => (
              <div key={scorecard.label} className="rounded-lg bg-rani-cream/40 px-3 py-3">
                <p className="text-[11px] font-body uppercase tracking-[0.14em] text-rani-muted">{scorecard.label}</p>
                <p className="mt-1 text-sm font-heading text-rani-navy">{scorecard.value}</p>
                <p className="mt-1 text-xs font-body text-rani-muted">{scorecard.context}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {agent.recommendations.map((recommendation) => (
              <div key={recommendation.id} className="rounded-xl border border-rani-border/20 bg-white px-4 py-3">
                <p className="text-sm font-heading text-rani-navy">{recommendation.title}</p>
                <p className="mt-1 text-xs font-body text-rani-muted">{recommendation.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-rani-border/25 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-heading font-semibold text-rani-navy">Connected routes</h2>
          <div className="mt-4 space-y-3">
            {agent.linkedRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="block rounded-xl border border-rani-border/20 bg-rani-cream/40 px-4 py-3 transition-colors hover:border-rani-gold/40"
              >
                <p className="text-sm font-heading text-rani-navy">{route.label}</p>
                <p className="mt-1 text-xs font-body text-rani-muted">{route.href}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
