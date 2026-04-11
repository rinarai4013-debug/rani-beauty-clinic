'use client';

import { AGENT_COUNCIL, getCouncilSnapshot } from '@/lib/dashboard/agent-council';

const financeAgents = AGENT_COUNCIL.filter((agent) =>
  ['ceo-chief-of-staff', 'finance-strategist'].includes(agent.id),
);

export default function FinanceCouncilBoard() {
  const snapshot = getCouncilSnapshot();

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="rounded-xl border border-rani-border/30 bg-gradient-to-br from-rani-navy via-[#18233e] to-black px-5 py-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:px-6">
        <p className="text-xs font-body uppercase tracking-[0.22em] text-white/60">Crown Tier</p>
        <h1 className="mt-2 text-2xl font-heading sm:text-3xl">Finance and executive command</h1>
        <p className="mt-2 max-w-2xl text-sm font-body text-white/75 sm:text-base">
          The crown tier turns raw clinic activity into cash discipline, priority clarity, and executive decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {financeAgents.map((agent) => (
          <div key={agent.id} className="rounded-xl border border-rani-border/25 bg-white p-5 shadow-sm">
            <p className="text-[11px] font-body uppercase tracking-[0.18em] text-rani-muted">{agent.emoji} {agent.category}</p>
            <h2 className="mt-1 text-lg font-heading text-rani-navy">{agent.name}</h2>
            <p className="mt-2 text-sm font-body text-rani-muted">{agent.ownerValue}</p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {agent.scorecards.map((scorecard) => (
                <div key={scorecard.label} className="rounded-lg bg-rani-cream/40 px-3 py-3">
                  <p className="text-[11px] font-body uppercase tracking-[0.14em] text-rani-muted">{scorecard.label}</p>
                  <p className="mt-1 text-sm font-heading text-rani-navy">{scorecard.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-rani-border/25 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-heading font-semibold text-rani-navy">Critical financial moves</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-3">
          {snapshot.criticalMoves.slice(0, 3).map((move) => (
            <div key={move.id} className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-3">
              <p className="text-sm font-heading text-rani-navy">{move.title}</p>
              <p className="mt-1 text-xs font-body text-rani-muted">{move.impact}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
