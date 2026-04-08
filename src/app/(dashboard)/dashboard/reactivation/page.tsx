'use client';

import { motion } from 'framer-motion';
import { Phone, RefreshCcw, Sparkles } from 'lucide-react';
import OverdueClientsTable from '@/components/dashboard/revenue-optimizer/OverdueClientsTable';
import WinBackCampaignCard from '@/components/dashboard/revenue-optimizer/WinBackCampaignCard';
import {
  WAR_ROOM_OVERDUE_CLIENTS,
  WAR_ROOM_REACTIVATION_CAMPAIGNS,
} from '@/lib/dashboard/war-room';

const totalRecovery = WAR_ROOM_REACTIVATION_CAMPAIGNS.reduce((sum, campaign) => sum + campaign.totalEstimatedRecovery, 0);
const totalClients = WAR_ROOM_REACTIVATION_CAMPAIGNS.reduce((sum, campaign) => sum + campaign.clients.length, 0);

export default function Page() {
  const campaigns = WAR_ROOM_REACTIVATION_CAMPAIGNS.map(campaign => ({
    ...campaign,
    clients: campaign.clients.map(client => ({ ...client })),
    campaign: { ...campaign.campaign },
  }));

  const overdueClients = WAR_ROOM_OVERDUE_CLIENTS.map(client => ({ ...client }));

  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-rani-border/30 bg-gradient-to-br from-rani-cream via-white to-white px-5 py-6 shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-body uppercase tracking-[0.22em] text-rani-muted">Reactivation Engine</p>
            <h1 className="mt-2 text-2xl font-heading text-rani-navy sm:text-3xl">Old leads are the fastest money in the building.</h1>
            <p className="mt-2 text-sm font-body text-rani-muted sm:text-base">
              This page is for getting dormant demand back on the calendar with urgency, real offers, and provider-ready booking windows.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-rani-border/20 bg-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-body uppercase tracking-[0.18em] text-rani-muted">Recoverable revenue</p>
              <p className="mt-1 text-2xl font-heading text-rani-navy">${totalRecovery.toLocaleString()}</p>
              <p className="text-xs font-body text-rani-muted">Across active win-back campaigns</p>
            </div>
            <div className="rounded-xl border border-rani-border/20 bg-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-body uppercase tracking-[0.18em] text-rani-muted">Clients in play</p>
              <p className="mt-1 text-2xl font-heading text-rani-navy">{totalClients}</p>
              <p className="text-xs font-body text-rani-muted">High-intent and overdue opportunities</p>
            </div>
            <div className="rounded-xl border border-rani-border/20 bg-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-body uppercase tracking-[0.18em] text-rani-muted">Daily ask</p>
              <p className="mt-1 text-2xl font-heading text-rani-navy">$500-$1.5K</p>
              <p className="text-xs font-body text-rani-muted">Reactivation revenue every day</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {campaigns.map(campaign => (
          <WinBackCampaignCard key={campaign.tier} campaign={campaign} onLaunch={() => undefined} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-heading text-rani-navy">Overdue client queue</h2>
              <p className="text-sm font-body text-rani-muted">These patients should have outreach ownership before the day ends.</p>
            </div>
            <span className="rounded-full bg-rani-gold/10 px-3 py-1 text-[11px] font-body font-semibold text-rani-gold">
              Priority booking list
            </span>
          </div>
          <div className="mt-4">
            <OverdueClientsTable clients={overdueClients} onContact={() => undefined} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-4 w-4 text-rani-gold" />
              <h2 className="text-sm font-heading font-semibold text-rani-navy">Daily reactivation rhythm</h2>
            </div>
            <div className="mt-4 space-y-3">
              {[
                '11 AM SMS burst to 30-day and 60-day lapse lists',
                '2 PM phone push for 90-day VIP and overdue package patients',
                '4 PM provider handoff for anyone needing a credibility close',
              ].map(item => (
                <div key={item} className="rounded-xl border border-rani-border/20 bg-rani-cream/40 p-3 text-sm font-body text-rani-text">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-700">
              <Sparkles className="h-4 w-4" />
              <h2 className="text-sm font-heading font-semibold">Best leverage offer</h2>
            </div>
            <p className="mt-3 text-sm font-body text-emerald-900/80">
              Priority scheduling, a treatment credit, or a financing-based package path will usually outperform random discounting for reactivation.
            </p>
          </div>

          <div className="rounded-xl border border-rani-border/30 bg-rani-navy p-5 text-white shadow-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-rani-gold" />
              <h2 className="text-sm font-heading font-semibold">Operator note</h2>
            </div>
            <p className="mt-3 text-sm font-body text-white/80">
              If a client has spent real money before, do not bury them in nurture. Put a human on it and give them the clearest next-step booking window possible.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
