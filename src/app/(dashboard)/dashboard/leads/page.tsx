'use client';

import { motion } from 'framer-motion';
import { ArrowRight, PhoneCall, Target, Zap } from 'lucide-react';
import LeadPipeline from '@/components/dashboard/marketing/LeadPipeline';
import LeadScoreCard from '@/components/dashboard/marketing/LeadScoreCard';
import {
  WAR_ROOM_DAILY_KPIS,
  WAR_ROOM_LEAD_ACTIONS,
  WAR_ROOM_LEAD_PIPELINE,
  WAR_ROOM_LEAD_SCORE_CARDS,
} from '@/lib/dashboard/war-room';

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function Page() {
  const leadCards = WAR_ROOM_LEAD_SCORE_CARDS.map(card => ({
    ...card,
    score: {
      ...card.score,
      factors: [...card.score.factors],
      recommendation: { ...card.score.recommendation },
    },
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div initial="hidden" animate="show" variants={fadeUp} className="rounded-xl border border-rani-border/30 bg-gradient-to-br from-rani-navy via-[#16233f] to-black px-5 py-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-body uppercase tracking-[0.22em] text-white/60">Leads War Room</p>
            <h1 className="mt-2 text-2xl font-heading sm:text-3xl">Speed-to-lead is the money.</h1>
            <p className="mt-2 max-w-2xl text-sm font-body text-white/75 sm:text-base">
              Treat this page like the front line: immediate call queue, financing-first consult offers, and zero dead air
              between inquiry and booked appointment.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[11px] font-body uppercase tracking-[0.18em] text-white/55">Hot leads</p>
              <p className="mt-1 text-2xl font-heading text-white">{WAR_ROOM_LEAD_PIPELINE.hotLeads}</p>
              <p className="text-xs font-body text-white/65">Work these first every day</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[11px] font-body uppercase tracking-[0.18em] text-white/55">Average score</p>
              <p className="mt-1 text-2xl font-heading text-white">{WAR_ROOM_LEAD_PIPELINE.avgScore}</p>
              <p className="text-xs font-body text-white/65">The pipeline can support premium offers</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-[11px] font-body uppercase tracking-[0.18em] text-white/55">Today&apos;s booking ask</p>
              <p className="mt-1 text-2xl font-heading text-white">8 consults</p>
              <p className="text-xs font-body text-white/65">Same-day action beats nurture drift</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <motion.div initial="hidden" animate="show" variants={fadeUp}>
          <LeadPipeline data={WAR_ROOM_LEAD_PIPELINE} />
        </motion.div>

        <motion.div initial="hidden" animate="show" variants={fadeUp} className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-heading font-semibold text-rani-navy">Today&apos;s lead actions</h2>
            <span className="rounded-full bg-rani-gold/10 px-2.5 py-1 text-[11px] font-body font-medium text-rani-gold">
              Daily operating brief
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {WAR_ROOM_LEAD_ACTIONS.map(action => (
              <div key={action.title} className="rounded-xl border border-rani-border/20 bg-rani-cream/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-heading text-rani-navy">{action.title}</p>
                    <p className="mt-1 text-xs font-body text-rani-muted">{action.impact}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-body font-medium text-rani-navy shadow-sm">
                    {action.target}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <PhoneCall className="h-4 w-4" />
              <p className="text-sm font-heading">Non-negotiable</p>
            </div>
            <p className="mt-2 text-sm font-body text-emerald-900/80">
              Any lead with immediate intent gets a live call attempt first, then SMS, then a consult-holding follow-up before the
              day ends.
            </p>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-heading text-rani-navy">Priority lead queue</h2>
              <p className="text-sm font-body text-rani-muted">These are the kinds of leads that should get owner-level urgency.</p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-rani-navy px-3 py-1 text-[11px] font-body font-medium text-white">
              <Zap className="h-3.5 w-3.5" />
              Package-first follow-up
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {leadCards.map(card => (
              <LeadScoreCard
                key={card.leadName}
                leadName={card.leadName}
                leadSource={card.leadSource}
                score={card.score}
                onAction={() => undefined}
              />
            ))}
          </div>
        </motion.div>

        <motion.div initial="hidden" animate="show" variants={fadeUp} className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-rani-gold" />
            <h2 className="text-sm font-heading font-semibold text-rani-navy">Daily scoreboard</h2>
          </div>
          <div className="mt-4 space-y-3">
            {WAR_ROOM_DAILY_KPIS.slice(0, 4).map(kpi => (
              <div key={kpi.label} className="rounded-xl border border-rani-border/20 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-body text-rani-text">{kpi.label}</p>
                  <span className="whitespace-nowrap rounded-full bg-rani-gold/10 px-2.5 py-1 text-[11px] font-body font-semibold text-rani-gold">
                    {kpi.target}
                  </span>
                </div>
                <p className="mt-2 text-xs font-body text-rani-muted">{kpi.whyItMatters}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-rani-border/20 bg-rani-cream/40 p-4">
            <p className="text-xs font-body uppercase tracking-[0.18em] text-rani-muted">Operator sequence</p>
            <ol className="mt-3 space-y-2">
              {[
                'Work all immediate and today leads before noon.',
                'Offer the consult, not more texting back and forth.',
                'Move high-intent leads into package or financing language quickly.',
              ].map(step => (
                <li key={step} className="flex items-start gap-2 text-sm font-body text-rani-text">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-rani-gold" />
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
