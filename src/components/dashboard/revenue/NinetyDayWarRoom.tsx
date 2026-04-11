'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Crosshair,
  Megaphone,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  WalletCards,
} from 'lucide-react';
import {
  WAR_ROOM_90_DAY_CADENCE,
  WAR_ROOM_BOOKING_DAYS,
  WAR_ROOM_DAILY_KPIS,
  WAR_ROOM_GUARDRAILS,
  WAR_ROOM_HEADLINE,
  WAR_ROOM_HERO_PACKAGES,
  WAR_ROOM_OPERATOR_CADENCE,
  WAR_ROOM_PROBABILITIES,
  WAR_ROOM_SERVICE_LINES,
  WAR_ROOM_SPIKE_MATH,
} from '@/lib/dashboard/war-room';

const cardMotion = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.35 },
};

export default function NinetyDayWarRoom() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="overflow-hidden rounded-2xl border border-rani-border bg-gradient-to-br from-rani-navy via-rani-navy to-[#13263b] p-6 text-white shadow-[0_20px_60px_rgba(15,29,44,0.12)] sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-body font-semibold uppercase tracking-[0.18em] text-rani-gold">
              <Sparkles className="h-3.5 w-3.5" />
              Premium Revenue System
            </div>
            <h1 className="mt-4 font-heading text-3xl text-white sm:text-4xl">
              {WAR_ROOM_HEADLINE.title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/72 sm:text-base">
              {WAR_ROOM_HEADLINE.subtitle}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-white/6 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/54">Primary Outcome</div>
                <div className="mt-2 font-heading text-3xl text-white">{WAR_ROOM_HEADLINE.targetMonth}</div>
                <div className="mt-1 text-xs text-white/60">One engineered spike month, not wishful thinking.</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/6 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/54">Window</div>
                <div className="mt-2 font-heading text-3xl text-white">{WAR_ROOM_HEADLINE.targetWindow}</div>
                <div className="mt-1 text-xs text-white/60">Run it like a sales war room, not a content calendar.</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/6 p-4">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/54">Operating Thesis</div>
                <div className="mt-2 font-heading text-xl text-white">{WAR_ROOM_HEADLINE.strategy}</div>
                <div className="mt-1 text-xs text-white/60">Every lever must point to booked consults and high-ticket closes.</div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/6 p-5">
            <div className="flex items-center gap-2">
              <BadgeDollarSign className="h-4 w-4 text-rani-gold" />
              <h2 className="text-sm font-body font-semibold uppercase tracking-wider text-white/88">
                Six-Figure Math
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {WAR_ROOM_SPIKE_MATH.map((path) => (
                <div key={path.label} className="rounded-xl border border-white/8 bg-black/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">{path.label}</div>
                      <div className="mt-2 font-heading text-2xl text-white">{path.value}</div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-rani-gold" />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/62">{path.caption}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div {...cardMotion} className="rounded-xl border border-rani-border bg-white/80 p-5 backdrop-blur-sm sm:p-6">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-rani-gold" />
            <h2 className="text-sm font-body font-semibold uppercase tracking-wider text-rani-navy">
              Hero Packages
            </h2>
          </div>
          <div className="mt-5 grid gap-4">
            {WAR_ROOM_HERO_PACKAGES.map((pkg) => (
              <div key={pkg.name} className="rounded-xl border border-rani-border bg-rani-cream/35 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="font-body text-xl font-bold text-rani-navy">{pkg.name}</h3>
                    <p className="mt-1 text-sm text-rani-muted">{pkg.idealFor}</p>
                  </div>
                  <div className="rounded-xl bg-rani-navy px-4 py-3 text-right text-white">
                    <div className="text-sm font-semibold text-rani-gold">{pkg.priceRange}</div>
                    <div className="mt-1 text-xs text-white/70">{pkg.monthlyCloseTarget}</div>
                    <div className="mt-1 text-xs text-white/70">{pkg.revenueRange}</div>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr]">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rani-muted">Included stack</div>
                    <ul className="mt-2 space-y-1.5 text-sm text-rani-text">
                      {pkg.components.map((component) => (
                        <li key={component} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-rani-gold" />
                          <span>{component}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-rani-gold/20 bg-white p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-rani-muted">
                      Closing angle
                    </div>
                    <p className="mt-2 text-sm leading-6 text-rani-text">{pkg.closingAngle}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...cardMotion} className="space-y-4">
          <div className="rounded-xl border border-rani-border bg-white/80 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <WalletCards className="h-4 w-4 text-rani-gold" />
              <h2 className="text-sm font-body font-semibold uppercase tracking-wider text-rani-navy">
                Probability Map
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {WAR_ROOM_PROBABILITIES.map((item) => (
                <div key={item.scenario} className="rounded-xl border border-rani-border bg-rani-cream/35 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-body text-sm font-semibold text-rani-navy">{item.scenario}</div>
                      <div className="mt-1 text-xs leading-5 text-rani-muted">{item.note}</div>
                    </div>
                    <div className="rounded-md bg-rani-gold/12 px-2 py-1 text-xs font-semibold text-rani-navy">
                      {item.probability}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-rani-border bg-white/80 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-rani-gold" />
              <h2 className="text-sm font-body font-semibold uppercase tracking-wider text-rani-navy">
                Booking-Day Compression
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {WAR_ROOM_BOOKING_DAYS.map((item) => (
                <div key={item.name} className="rounded-lg border border-rani-border bg-rani-cream/35 px-4 py-3">
                  <div className="font-body text-sm font-semibold text-rani-navy">{item.name}</div>
                  <div className="mt-1 text-xs leading-5 text-rani-muted">{item.objective}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <motion.div {...cardMotion} className="rounded-xl border border-rani-border bg-white/80 p-5 backdrop-blur-sm sm:p-6">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-rani-gold" />
            <h2 className="text-sm font-body font-semibold uppercase tracking-wider text-rani-navy">
              Service-Line Stack to Reach $100K
            </h2>
          </div>
          <div className="mt-5 grid gap-3">
            {WAR_ROOM_SERVICE_LINES.map((line) => (
              <div key={line.name} className="grid gap-3 rounded-xl border border-rani-border bg-rani-cream/35 p-4 md:grid-cols-[160px_1fr] md:items-start">
                <div>
                  <div className="text-sm font-semibold text-rani-navy">{line.name}</div>
                  <div className="mt-1 font-heading text-2xl text-rani-navy">{line.monthlyTarget}</div>
                </div>
                <p className="text-sm leading-6 text-rani-text">{line.objective}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...cardMotion} className="rounded-xl border border-rani-border bg-white/80 p-5 backdrop-blur-sm sm:p-6">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-rani-gold" />
            <h2 className="text-sm font-body font-semibold uppercase tracking-wider text-rani-navy">
              Daily KPI Scoreboard
            </h2>
          </div>
          <div className="mt-5 grid gap-3">
            {WAR_ROOM_DAILY_KPIS.map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-rani-border bg-rani-cream/35 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm font-semibold text-rani-navy">{kpi.label}</div>
                  <div className="rounded-md bg-rani-navy px-2.5 py-1 text-xs font-semibold text-rani-gold">
                    {kpi.target}
                  </div>
                </div>
                <p className="mt-2 text-sm leading-6 text-rani-muted">{kpi.whyItMatters}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.div {...cardMotion} className="rounded-xl border border-rani-border bg-white/80 p-5 backdrop-blur-sm sm:p-6">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-rani-gold" />
            <h2 className="text-sm font-body font-semibold uppercase tracking-wider text-rani-navy">
              90-Day Execution Cadence
            </h2>
          </div>
          <div className="mt-5 grid gap-4">
            {WAR_ROOM_90_DAY_CADENCE.map((phase) => (
              <div key={phase.label} className="rounded-xl border border-rani-border bg-rani-cream/35 p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <div className="font-body text-lg font-bold text-rani-navy">{phase.label}</div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-rani-muted">{phase.focus}</div>
                </div>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-rani-text">
                  {phase.actions.map((action) => (
                    <li key={action} className="flex items-start gap-2">
                      <ArrowRight className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-rani-gold" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div {...cardMotion} className="space-y-4">
          <div className="rounded-xl border border-rani-border bg-white/80 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-rani-gold" />
              <h2 className="text-sm font-body font-semibold uppercase tracking-wider text-rani-navy">
                Operator Cadence
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {[
                ['Morning', WAR_ROOM_OPERATOR_CADENCE.morning],
                ['Midday', WAR_ROOM_OPERATOR_CADENCE.midday],
                ['End of Day', WAR_ROOM_OPERATOR_CADENCE.endOfDay],
              ].map(([label, actions]) => (
                <div key={label} className="rounded-xl border border-rani-border bg-rani-cream/35 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-rani-muted">{label}</div>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-rani-text">
                    {(actions as string[]).map((action) => (
                      <li key={action} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-rani-gold" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-rani-border bg-white/80 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-rani-gold" />
              <h2 className="text-sm font-body font-semibold uppercase tracking-wider text-rani-navy">
                Ethical Guardrails
              </h2>
            </div>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-rani-text">
              {WAR_ROOM_GUARDRAILS.map((rule) => (
                <li key={rule} className="flex items-start gap-2 rounded-lg border border-rani-border bg-rani-cream/35 px-3 py-2">
                  <ShieldCheck className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-rani-gold" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
