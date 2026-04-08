'use client';

import Link from 'next/link';
import { AGENT_COUNCIL } from '@/lib/dashboard/agent-council';

const marketingAgents = AGENT_COUNCIL.filter((agent) =>
  ['general-google', 'meta-commander', 'website-colonel', 'seo-queen'].includes(agent.id),
);

export default function MarketingCouncilBoard() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="rounded-xl border border-rani-border/30 bg-gradient-to-br from-rani-navy via-[#18233e] to-black px-5 py-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:px-6">
        <p className="text-xs font-body uppercase tracking-[0.22em] text-white/60">Revenue Tier</p>
        <h1 className="mt-2 text-2xl font-heading sm:text-3xl">Demand council</h1>
        <p className="mt-2 max-w-2xl text-sm font-body text-white/75 sm:text-base">
          Google, Meta, website, and SEO now live as one operator layer instead of four disconnected ideas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {marketingAgents.map((agent) => (
          <div key={agent.id} className="rounded-xl border border-rani-border/25 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-body uppercase tracking-[0.18em] text-rani-muted">{agent.emoji} {agent.category}</p>
                <h2 className="mt-1 text-lg font-heading text-rani-navy">{agent.name}</h2>
                <p className="mt-2 text-sm font-body text-rani-muted">{agent.mission}</p>
              </div>
              <span className="rounded-full bg-rani-gold/10 px-2.5 py-1 text-[11px] font-body font-semibold text-rani-gold">
                {agent.status}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {agent.scorecards.map((scorecard) => (
                <div key={scorecard.label} className="rounded-lg bg-rani-cream/40 px-3 py-3">
                  <p className="text-[11px] font-body uppercase tracking-[0.14em] text-rani-muted">{scorecard.label}</p>
                  <p className="mt-1 text-sm font-heading text-rani-navy">{scorecard.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {agent.recommendations.slice(0, 2).map((recommendation) => (
                <div key={recommendation.id} className="rounded-xl border border-rani-border/20 bg-white px-4 py-3">
                  <p className="text-sm font-heading text-rani-navy">{recommendation.title}</p>
                  <p className="mt-1 text-xs font-body text-rani-muted">{recommendation.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {agent.linkedRoutes.map((route) => (
                <Link
                  key={route.href}
                  href={route.href}
                  className="rounded-full border border-rani-border/25 bg-white px-3 py-1.5 text-[11px] font-body font-medium text-rani-navy transition-colors hover:border-rani-gold/40 hover:text-rani-gold"
                >
                  {route.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
