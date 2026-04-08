'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight,
  Crown,
  Radar,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { AGENT_COUNCIL, getCouncilAgentsByTier, getCouncilSnapshot } from '@/lib/dashboard/agent-council';
import type { CouncilAgent, CouncilRecommendation, CouncilTier } from '@/types/agent-council';

const TIER_LABELS: Record<CouncilTier, { title: string; subtitle: string }> = {
  crown: { title: 'Crown Tier', subtitle: 'Executive synthesis and money clarity' },
  revenue: { title: 'Revenue Tier', subtitle: 'Demand, conversion, and retention engines' },
  protection: { title: 'Protection Tier', subtitle: 'Operations, compliance, and margin defense' },
  intelligence: { title: 'Intelligence Tier', subtitle: 'Signals and monitoring' },
};

const severityTone: Record<CouncilRecommendation['severity'], string> = {
  critical: 'bg-red-50 border-red-200 text-red-700',
  high: 'bg-amber-50 border-amber-200 text-amber-700',
  medium: 'bg-blue-50 border-blue-200 text-blue-700',
  low: 'bg-slate-50 border-slate-200 text-slate-600',
};

function AgentCard({ agent }: { agent: CouncilAgent }) {
  return (
    <div className="rounded-xl border border-rani-border/25 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-body uppercase tracking-[0.18em] text-rani-muted">
            {agent.emoji} {agent.category}
          </p>
          <h3 className="mt-1 text-sm font-heading text-rani-navy">{agent.name}</h3>
          <p className="mt-2 text-xs font-body text-rani-muted">{agent.summary}</p>
        </div>
        <span className="rounded-full bg-rani-gold/10 px-2.5 py-1 text-[11px] font-body font-semibold text-rani-gold">
          {agent.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        {agent.scorecards.slice(0, 2).map((scorecard) => (
          <div key={scorecard.label} className="rounded-lg bg-rani-cream/40 px-3 py-2">
            <p className="text-[11px] font-body uppercase tracking-[0.14em] text-rani-muted">{scorecard.label}</p>
            <p className="mt-1 text-sm font-heading text-rani-navy">{scorecard.value}</p>
            <p className="mt-1 text-xs font-body text-rani-muted">{scorecard.context}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {agent.linkedRoutes.slice(0, 2).map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="inline-flex items-center gap-1 rounded-full border border-rani-border/25 bg-white px-3 py-1.5 text-[11px] font-body font-medium text-rani-navy transition-colors hover:border-rani-gold/40 hover:text-rani-gold"
          >
            {route.label}
            <ArrowRight className="h-3 w-3" />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AgentCouncilCommandCenter() {
  const snapshot = getCouncilSnapshot();
  const crownAgents = getCouncilAgentsByTier('crown');
  const revenueAgents = getCouncilAgentsByTier('revenue');
  const protectionAgents = getCouncilAgentsByTier('protection');

  const tierGroups: Array<{ key: CouncilTier; agents: CouncilAgent[] }> = [
    { key: 'crown', agents: crownAgents },
    { key: 'revenue', agents: revenueAgents },
    { key: 'protection', agents: protectionAgents },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-rani-border/30 bg-gradient-to-br from-rani-navy via-[#172441] to-black px-5 py-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:px-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-body uppercase tracking-[0.22em] text-white/60">Rani Command Council</p>
            <h1 className="mt-2 text-2xl font-heading sm:text-3xl">{snapshot.headline}</h1>
            <p className="mt-2 text-sm font-body text-white/75 sm:text-base">{snapshot.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[11px] font-body uppercase tracking-[0.16em] text-white/55">Agents</p>
              <p className="mt-1 text-2xl font-heading text-white">{snapshot.totalAgents}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[11px] font-body uppercase tracking-[0.16em] text-white/55">Active build</p>
              <p className="mt-1 text-2xl font-heading text-white">{snapshot.realOrExtendedAgents}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[11px] font-body uppercase tracking-[0.16em] text-white/55">Critical moves</p>
              <p className="mt-1 text-2xl font-heading text-white">{snapshot.criticalMoves.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[11px] font-body uppercase tracking-[0.16em] text-white/55">Easy wins</p>
              <p className="mt-1 text-2xl font-heading text-white">{snapshot.easyWins.length}</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-rani-border/25 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rani-gold" />
              <h2 className="text-sm font-heading font-semibold text-rani-navy">Critical moves</h2>
            </div>
            <div className="mt-4 space-y-3">
              {snapshot.criticalMoves.map((item) => (
                <div key={item.id} className={`rounded-xl border px-4 py-3 ${severityTone[item.severity]}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-heading">{item.title}</p>
                      <p className="mt-1 text-xs font-body opacity-90">{item.description}</p>
                    </div>
                    <span className="whitespace-nowrap rounded-full bg-white/70 px-2 py-1 text-[10px] font-body font-semibold">
                      {item.owner}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-rani-border/25 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-rani-gold" />
              <h2 className="text-sm font-heading font-semibold text-rani-navy">Easy wins</h2>
            </div>
            <div className="mt-4 space-y-3">
              {snapshot.easyWins.map((item) => (
                <div key={item.id} className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                  <p className="text-sm font-heading text-rani-navy">{item.title}</p>
                  <p className="mt-1 text-xs font-body text-rani-muted">{item.impact}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-rani-border/25 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-rani-gold" />
            <h2 className="text-sm font-heading font-semibold text-rani-navy">Council map</h2>
          </div>
          <div className="mt-5 space-y-6">
            {tierGroups.map(({ key, agents }) => (
              <div key={key}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {key === 'crown' ? <Crown className="h-4 w-4 text-rani-gold" /> : <Sparkles className="h-4 w-4 text-rani-gold" />}
                    <div>
                      <h3 className="text-sm font-heading text-rani-navy">{TIER_LABELS[key].title}</h3>
                      <p className="text-xs font-body text-rani-muted">{TIER_LABELS[key].subtitle}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-rani-gold/10 px-2.5 py-1 text-[11px] font-body font-semibold text-rani-gold">
                    {agents.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {agents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-rani-border/25 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-heading font-semibold text-rani-navy">All agent routes</h2>
            <p className="text-xs font-body text-rani-muted">Every agent has a typed registry entry and a queryable dashboard route now.</p>
          </div>
          <span className="rounded-full bg-rani-navy px-3 py-1 text-[11px] font-body font-medium text-white">
            /api/dashboard/agents
          </span>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {AGENT_COUNCIL.map((agent) => (
            <div key={agent.id} className="rounded-lg border border-rani-border/20 bg-rani-cream/40 px-3 py-3">
              <p className="text-sm font-heading text-rani-navy">
                {agent.emoji} {agent.name}
              </p>
              <p className="mt-1 text-xs font-body text-rani-muted">{agent.apiPath}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
