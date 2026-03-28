'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Target, GitBranch, Calendar, Star, Search, Users,
  TrendingUp, DollarSign, Zap, BarChart3, ArrowRight,
} from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import { DashboardErrorBoundary, StatCardRow, PanelSkeleton } from '@/components/dashboard/shared';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';

interface MarketingOverviewData {
  kpis: {
    totalLeads: number;
    leadsTrend: number;
    conversionRate: number;
    conversionTrend: number;
    adSpend: number;
    adSpendTrend: number;
    roas: number;
    roasTrend: number;
    organicTraffic: number;
    avgReviewRating: number;
  };
  channelBreakdown: {
    channel: string;
    leads: number;
    conversions: number;
    revenue: number;
    spend: number;
  }[];
  recentLeads: {
    name: string;
    source: string;
    score: number;
    grade: string;
    date: string;
  }[];
  upcomingContent: {
    title: string;
    type: string;
    date: string;
    channel: string;
  }[];
}

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const NAV_SECTIONS = [
  { href: '/dashboard/marketing/leads', icon: Target, label: 'Lead Scoring', desc: 'Pipeline & scoring dashboard' },
  { href: '/dashboard/marketing/attribution', icon: GitBranch, label: 'Attribution', desc: 'Multi-touch channel analysis' },
  { href: '/dashboard/marketing/content', icon: Calendar, label: 'Content', desc: 'Calendar & performance' },
  { href: '/dashboard/marketing/reviews', icon: Star, label: 'Reviews', desc: 'Review management & NPS' },
  { href: '/dashboard/marketing/seo', icon: Search, label: 'SEO', desc: 'Rankings & technical health' },
];

export default function MarketingOverviewPage() {
  const { data, isLoading } = useDashboardData<MarketingOverviewData>('/marketing', {
    refreshInterval: 120000,
  });

  return (
    <DashboardErrorBoundary pageName="Marketing Intelligence">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-6 sm:space-y-8"
      >
        {/* Header */}
        <motion.div variants={item}>
          <h1 className="text-xl sm:text-2xl font-heading text-rani-navy">Marketing Intelligence</h1>
          <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
            Channel performance, lead pipeline, and content strategy
          </p>
        </motion.div>

        {/* KPI Row */}
        <motion.div variants={item}>
          {isLoading ? (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6 animate-pulse">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-rani-cream rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-6">
              <KPICard
                title="Total Leads"
                value={data?.kpis?.totalLeads ?? 0}
                icon="users"
                trend={{ value: data?.kpis?.leadsTrend ?? 0, direction: (data?.kpis?.leadsTrend ?? 0) > 0 ? 'up' : 'down', label: 'vs last week' }}
              />
              <KPICard
                title="Conversion Rate"
                value={data?.kpis?.conversionRate ?? 0}
                suffix="%"
                icon="target"
                trend={{ value: data?.kpis?.conversionTrend ?? 0, direction: (data?.kpis?.conversionTrend ?? 0) > 0 ? 'up' : 'down', label: 'vs last month' }}
              />
              <KPICard
                title="Ad Spend"
                value={data?.kpis?.adSpend ?? 0}
                prefix="$"
                icon="dollar-sign"
                trend={{ value: data?.kpis?.adSpendTrend ?? 0, direction: (data?.kpis?.adSpendTrend ?? 0) > 0 ? 'up' : 'down', label: 'MTD' }}
              />
              <KPICard
                title="ROAS"
                value={data?.kpis?.roas ?? 0}
                suffix="x"
                icon="target"
                trend={{ value: data?.kpis?.roasTrend ?? 0, direction: (data?.kpis?.roasTrend ?? 0) > 0 ? 'up' : 'down', label: 'vs last month' }}
              />
            </div>
          )}
        </motion.div>

        {/* Section navigation */}
        <motion.div variants={item}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {NAV_SECTIONS.map(section => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group rounded-xl border border-rani-border/30 bg-white p-4 hover:shadow-md hover:border-rani-gold/30 transition-all"
                >
                  <Icon className="w-5 h-5 text-rani-gold mb-2" />
                  <h3 className="text-sm font-heading font-semibold text-rani-navy group-hover:text-rani-gold transition-colors">
                    {section.label}
                  </h3>
                  <p className="text-[10px] font-body text-rani-muted mt-0.5">{section.desc}</p>
                  <ArrowRight className="w-3.5 h-3.5 text-rani-muted group-hover:text-rani-gold mt-2 transition-colors" />
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Channel Performance + Recent Leads */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Channel table */}
          <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
            <h3 className="font-heading text-sm font-semibold text-rani-navy flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4" />
              Channel Performance
            </h3>
            {isLoading ? (
              <PanelSkeleton />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-body">
                  <thead>
                    <tr className="text-rani-muted border-b border-rani-border/20">
                      <th className="text-left py-2">Channel</th>
                      <th className="text-right py-2">Leads</th>
                      <th className="text-right py-2">Conv.</th>
                      <th className="text-right py-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.channelBreakdown || []).map(ch => (
                      <tr key={ch.channel} className="border-b border-rani-border/10">
                        <td className="py-2 text-rani-navy font-medium capitalize">{ch.channel.replace(/_/g, ' ')}</td>
                        <td className="text-right py-2 text-rani-navy">{ch.leads}</td>
                        <td className="text-right py-2 text-rani-navy">{ch.conversions}</td>
                        <td className="text-right py-2 text-rani-navy font-semibold">{formatCurrency(ch.revenue, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent leads */}
          <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
            <h3 className="font-heading text-sm font-semibold text-rani-navy flex items-center gap-2 mb-4">
              <Users className="w-4 h-4" />
              Recent Leads
            </h3>
            {isLoading ? (
              <PanelSkeleton />
            ) : (
              <div className="space-y-2">
                {(data?.recentLeads || []).slice(0, 8).map((lead, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-rani-border/10 last:border-0">
                    <div>
                      <span className="text-xs font-body text-rani-navy font-medium">{lead.name}</span>
                      <span className="text-[10px] font-body text-rani-muted ml-2 capitalize">{lead.source.replace(/_/g, ' ')}</span>
                    </div>
                    <span className={`inline-flex items-center justify-center w-6 h-5 rounded text-[10px] font-bold font-heading text-white ${
                      lead.grade === 'A' ? 'bg-emerald-500' :
                      lead.grade === 'B' ? 'bg-amber-500' :
                      lead.grade === 'C' ? 'bg-slate-400' :
                      'bg-red-400'
                    }`}>
                      {lead.grade}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Upcoming Content */}
        <motion.div variants={item}>
          <div className="rounded-xl border border-rani-border/30 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-sm font-semibold text-rani-navy flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Upcoming Content
              </h3>
              <Link href="/dashboard/marketing/content" className="text-xs font-body text-rani-gold hover:text-rani-navy transition-colors flex items-center gap-1">
                View Calendar <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {isLoading ? (
              <PanelSkeleton />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(data?.upcomingContent || []).slice(0, 4).map((content, i) => (
                  <div key={i} className="border border-rani-border/20 rounded-lg p-3">
                    <p className="text-xs font-body text-rani-navy font-medium line-clamp-1">{content.title}</p>
                    <p className="text-[10px] font-body text-rani-muted mt-0.5 capitalize">
                      {content.type.replace(/_/g, ' ')} &middot; {content.channel}
                    </p>
                    <p className="text-[10px] font-body text-rani-gold mt-1">{content.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </DashboardErrorBoundary>
  );
}
