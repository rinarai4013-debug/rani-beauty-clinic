'use client';

import { motion } from 'framer-motion';
import { CalendarRange, CreditCard, ShieldCheck, Target } from 'lucide-react';
import {
  WAR_ROOM_CONSULT_CLOSE_SYSTEM,
  WAR_ROOM_HERO_PACKAGES,
} from '@/lib/dashboard/war-room';

export default function Page() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-rani-border/30 bg-gradient-to-br from-rani-navy via-[#1c2747] to-black px-5 py-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-body uppercase tracking-[0.22em] text-white/60">Consult Close System</p>
            <h1 className="mt-2 text-2xl font-heading sm:text-3xl">{WAR_ROOM_CONSULT_CLOSE_SYSTEM.headline}</h1>
            <p className="mt-2 text-sm font-body text-white/75 sm:text-base">
              This is the script, pacing, and package posture for turning consult volume into real premium revenue.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {WAR_ROOM_CONSULT_CLOSE_SYSTEM.consultTargets.map(target => (
              <div key={target.label} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-[11px] font-body uppercase tracking-[0.14em] text-white/55">{target.label}</p>
                <p className="mt-1 text-xl font-heading text-white">{target.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-rani-gold" />
            <h2 className="text-sm font-heading font-semibold text-rani-navy">Core principles</h2>
          </div>
          <div className="mt-4 space-y-3">
            {WAR_ROOM_CONSULT_CLOSE_SYSTEM.principles.map(principle => (
              <div key={principle} className="rounded-xl border border-rani-border/20 bg-rani-cream/40 p-3 text-sm font-body text-rani-text">
                {principle}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-rani-gold" />
            <h2 className="text-sm font-heading font-semibold text-rani-navy">Hero-package close map</h2>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            {WAR_ROOM_HERO_PACKAGES.map(pkg => (
              <div key={pkg.name} className="rounded-xl border border-rani-border/20 bg-white p-4 shadow-sm">
                <p className="text-sm font-heading text-rani-navy">{pkg.name}</p>
                <p className="mt-1 text-lg font-heading text-rani-gold">{pkg.priceRange}</p>
                <p className="mt-1 text-xs font-body text-rani-muted">{pkg.idealFor}</p>
                <div className="mt-3 space-y-2">
                  {pkg.components.map(component => (
                    <div key={component} className="rounded-lg bg-rani-cream/40 px-2.5 py-2 text-xs font-body text-rani-text">
                      {component}
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t border-rani-border/20 pt-3">
                  <p className="text-[11px] font-body uppercase tracking-[0.16em] text-rani-muted">Close target</p>
                  <p className="mt-1 text-sm font-body text-rani-text">{pkg.monthlyCloseTarget}</p>
                  <p className="mt-2 text-xs font-body text-rani-muted">{pkg.closingAngle}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-rani-gold" />
          <h2 className="text-sm font-heading font-semibold text-rani-navy">Consult script blocks</h2>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          {WAR_ROOM_CONSULT_CLOSE_SYSTEM.scriptBlocks.map(block => (
            <div key={block.title} className="rounded-xl border border-rani-border/20 bg-rani-cream/40 p-4">
              <p className="text-xs font-body uppercase tracking-[0.18em] text-rani-muted">{block.title}</p>
              <p className="mt-2 text-sm font-body text-rani-text">{block.copy}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          <h2 className="text-sm font-heading font-semibold">Ethical close guardrail</h2>
        </div>
        <p className="mt-3 text-sm font-body text-emerald-900/80">
          Present the best clinically appropriate full plan, explain financing clearly, and never use urgency to push a patient into a package that is not right for them.
        </p>
      </motion.div>
    </div>
  );
}
