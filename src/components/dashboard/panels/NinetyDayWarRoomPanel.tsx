'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, PhoneCall, Target, WalletCards, Zap } from 'lucide-react';
import {
  WAR_ROOM_BOOKING_DAYS,
  WAR_ROOM_HEADLINE,
  WAR_ROOM_HERO_PACKAGES,
  WAR_ROOM_PROBABILITIES,
} from '@/lib/dashboard/war-room';

export default function NinetyDayWarRoomPanel() {
  return (
    <div className="rounded-xl border border-rani-border bg-gradient-to-br from-rani-navy via-rani-navy to-[#13263b] p-5 text-white shadow-[0_18px_50px_rgba(15,29,44,0.18)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-body font-semibold uppercase tracking-[0.18em] text-rani-gold">
            <Zap className="h-3.5 w-3.5" />
            90-Day Revenue Sprint
          </div>
          <h2 className="mt-3 font-heading text-2xl text-white sm:text-3xl">
            {WAR_ROOM_HEADLINE.title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">
            {WAR_ROOM_HEADLINE.subtitle}
          </p>
        </div>

        <Link
          href="/dashboard/revenue"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-rani-gold px-4 py-2 text-sm font-body font-semibold text-rani-navy transition-transform hover:-translate-y-0.5"
        >
          Open War Room
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          {
            title: 'Spike Month Goal',
            value: '$100K',
            caption: 'Target one six-figure month in the next 90 days.',
          },
          {
            title: 'Hero Package Closes',
            value: '14',
            caption: 'Combined monthly close target across premium offers.',
          },
          {
            title: 'Financed Closes',
            value: '35%',
            caption: 'Target share of hero packages sold through monthly payments.',
          },
        ].map((metric) => (
          <div key={metric.title} className="rounded-xl border border-white/10 bg-white/6 p-4">
            <div className="text-[10px] font-body font-semibold uppercase tracking-[0.18em] text-white/58">
              {metric.title}
            </div>
            <div className="mt-2 font-heading text-3xl text-white">{metric.value}</div>
            <p className="mt-2 text-xs leading-5 text-white/65">{metric.caption}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-xl border border-white/10 bg-white/6 p-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-rani-gold" />
            <h3 className="text-sm font-body font-semibold uppercase tracking-wider text-white/88">
              Hero Packages
            </h3>
          </div>

          <div className="mt-4 space-y-3">
            {WAR_ROOM_HERO_PACKAGES.slice(0, 2).map((pkg, index) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="rounded-xl border border-white/8 bg-black/10 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-body text-base font-semibold text-white">{pkg.name}</h4>
                    <p className="mt-1 text-xs text-white/60">{pkg.idealFor}</p>
                  </div>
                  <div className="rounded-lg bg-rani-gold/12 px-3 py-1.5 text-right">
                    <div className="text-xs font-semibold text-rani-gold">{pkg.priceRange}</div>
                    <div className="text-[10px] text-white/70">{pkg.monthlyCloseTarget}</div>
                  </div>
                </div>
                <p className="mt-3 text-xs font-medium text-white/85">{pkg.closingAngle}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/6 p-4">
            <div className="flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-rani-gold" />
              <h3 className="text-sm font-body font-semibold uppercase tracking-wider text-white/88">
                Today&apos;s Focus
              </h3>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-white/75">
              <li>Respond to every new lead in under 5 minutes.</li>
              <li>Sell the full plan, not one-off treatments.</li>
              <li>Run one reactivation sprint before noon and one before close.</li>
              <li>Protect premium provider hours for the strongest offer of the week.</li>
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/6 p-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-rani-gold" />
              <h3 className="text-sm font-body font-semibold uppercase tracking-wider text-white/88">
                Booking Day Stack
              </h3>
            </div>
            <div className="mt-4 space-y-2">
              {WAR_ROOM_BOOKING_DAYS.slice(0, 3).map((day) => (
                <div key={day.name} className="rounded-lg border border-white/8 bg-black/10 px-3 py-2">
                  <div className="text-sm font-semibold text-white">{day.name}</div>
                  <div className="text-xs text-white/62">{day.objective}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/6 p-4">
            <div className="flex items-center gap-2">
              <WalletCards className="h-4 w-4 text-rani-gold" />
              <h3 className="text-sm font-body font-semibold uppercase tracking-wider text-white/88">
                Six-Figure Odds
              </h3>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {WAR_ROOM_PROBABILITIES.slice(2).map((scenario) => (
                <div key={scenario.scenario} className="flex items-start justify-between gap-3 rounded-lg border border-white/8 bg-black/10 px-3 py-2">
                  <div>
                    <div className="font-semibold text-white">{scenario.scenario}</div>
                    <div className="text-xs text-white/58">{scenario.note}</div>
                  </div>
                  <div className="whitespace-nowrap rounded-md bg-rani-gold/12 px-2 py-1 text-xs font-semibold text-rani-gold">
                    {scenario.probability}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
