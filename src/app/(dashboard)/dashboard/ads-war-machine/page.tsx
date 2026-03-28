'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Target, DollarSign, TrendingUp, AlertTriangle, Zap, ArrowUp, ArrowDown,
  Gauge, Shield, BarChart3, Radio, RefreshCw, Crosshair, Play, Pause,
  Activity, Flame, Eye, MousePointer, Users, Clock, ChevronRight,
} from 'lucide-react';
import KPICard from '@/components/dashboard/cards/KPICard';
import ProgressBar from '@/components/dashboard/charts/ProgressBar';
import ProgressRing from '@/components/dashboard/charts/ProgressRing';
import {
  DashboardErrorBoundary,
  KPIRowSkeleton,
  PanelSkeleton,
  SkeletonBar,
} from '@/components/dashboard/shared';
import DashboardEmptyState from '@/components/dashboard/shared/DashboardEmptyState';
import { InlineError } from '@/components/dashboard/shared';

// ── MOCK DATA TYPES ──

interface AdsWarMachineData {
  overview: {
    totalSpent: number;
    totalRevenue: number;
    overallROAS: number;
    overallCPA: number;
    totalLeads: number;
    totalConversions: number;
    budgetUtilization: number;
    adScore: number;
  };
  platformSplit: {
    meta: { spent: number; revenue: number; roas: number; cpa: number; leads: number };
    google: { spent: number; revenue: number; roas: number; cpa: number; leads: number };
  };
  campaigns: {
    id: string;
    name: string;
    platform: 'meta' | 'google';
    status: 'active' | 'paused' | 'killed';
    spent: number;
    revenue: number;
    roas: number;
    cpa: number;
    performance: 'top' | 'good' | 'average' | 'poor' | 'critical';
  }[];
  autoScaler: {
    healthScore: number;
    activeRules: number;
    recentActions: { action: string; campaign: string; time: string }[];
    killSwitchActive: boolean;
  };
  demandEngine: {
    demandScore: number;
    activeSignals: number;
    topSignal: string;
    emergencyCampaigns: number;
  };
  creativeHealth: {
    totalCreatives: number;
    fatigued: number;
    avgRelevanceScore: number;
    refreshNeeded: number;
  };
  compliance: {
    totalChecked: number;
    compliant: number;
    warnings: number;
    violations: number;
  };
}

// ── MOCK DATA ──

const MOCK_DATA: AdsWarMachineData = {
  overview: {
    totalSpent: 4250,
    totalRevenue: 14875,
    overallROAS: 3.5,
    overallCPA: 85,
    totalLeads: 147,
    totalConversions: 50,
    budgetUtilization: 72,
    adScore: 78,
  },
  platformSplit: {
    meta: { spent: 2550, revenue: 9180, roas: 3.6, cpa: 78, leads: 92 },
    google: { spent: 1700, revenue: 5695, roas: 3.35, cpa: 94, leads: 55 },
  },
  campaigns: [
    { id: '1', name: 'GLP-1 Weight Loss - Meta', platform: 'meta', status: 'active', spent: 850, revenue: 4250, roas: 5.0, cpa: 71, performance: 'top' },
    { id: '2', name: 'Botox Renton - Google', platform: 'google', status: 'active', spent: 620, revenue: 2480, roas: 4.0, cpa: 62, performance: 'top' },
    { id: '3', name: 'HydraFacial - Meta', platform: 'meta', status: 'active', spent: 380, revenue: 1140, roas: 3.0, cpa: 95, performance: 'good' },
    { id: '4', name: 'Wellness Injections - Meta', platform: 'meta', status: 'active', spent: 520, revenue: 1560, roas: 3.0, cpa: 87, performance: 'good' },
    { id: '5', name: 'Sofwave - Google', platform: 'google', status: 'active', spent: 450, revenue: 1350, roas: 3.0, cpa: 112, performance: 'average' },
    { id: '6', name: 'Laser Hair - Meta', platform: 'meta', status: 'active', spent: 400, revenue: 1200, roas: 3.0, cpa: 100, performance: 'average' },
    { id: '7', name: 'Peptides - Google', platform: 'google', status: 'paused', spent: 280, revenue: 420, roas: 1.5, cpa: 140, performance: 'poor' },
    { id: '8', name: 'Brand Awareness - Meta', platform: 'meta', status: 'active', spent: 350, revenue: 875, roas: 2.5, cpa: 116, performance: 'average' },
  ],
  autoScaler: {
    healthScore: 74,
    activeRules: 8,
    recentActions: [
      { action: 'Scaled up 20%', campaign: 'GLP-1 Weight Loss', time: '2h ago' },
      { action: 'Creative refresh triggered', campaign: 'Wellness Injections', time: '6h ago' },
      { action: 'Scaled down 15%', campaign: 'Peptides', time: '1d ago' },
    ],
    killSwitchActive: false,
  },
  demandEngine: {
    demandScore: 68,
    activeSignals: 5,
    topSignal: 'Revenue gap: 12% behind monthly target',
    emergencyCampaigns: 0,
  },
  creativeHealth: {
    totalCreatives: 32,
    fatigued: 4,
    avgRelevanceScore: 7.2,
    refreshNeeded: 6,
  },
  compliance: {
    totalChecked: 32,
    compliant: 28,
    warnings: 3,
    violations: 1,
  },
};

// ── HELPERS ──

const PERF_COLORS: Record<string, string> = {
  top: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  good: 'bg-green-50 text-green-700 border-green-200',
  average: 'bg-amber-50 text-amber-700 border-amber-200',
  poor: 'bg-orange-50 text-orange-700 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
};

const PLATFORM_COLORS: Record<string, string> = {
  meta: 'bg-blue-100 text-blue-700',
  google: 'bg-green-100 text-green-700',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  killed: 'bg-red-100 text-red-700',
};

function formatCurrency(n: number): string {
  return `$${n.toLocaleString()}`;
}

// ── COMPONENT ──

export default function AdsWarMachinePage() {
  const [isLoading] = useState(false);
  const data = MOCK_DATA;
  const o = data.overview;

  return (
    <DashboardErrorBoundary pageName="Ads War Machine">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-rani-navy flex items-center gap-2">
              <Flame className="w-6 h-6 text-amber-500" />
              Ads War Machine
            </h1>
            <p className="text-xs sm:text-sm font-body text-rani-muted mt-1">
              Cross-platform ad performance, auto-scaling, demand signals, and creative management
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/dashboard/ads-war-machine/creatives" className="px-3 py-2 text-xs font-body rounded-lg bg-rani-navy/5 text-rani-navy hover:bg-rani-navy/10 transition-colors flex items-center gap-1">
              Creatives <ChevronRight className="w-3 h-3" />
            </a>
            <a href="/dashboard/ads-war-machine/keywords" className="px-3 py-2 text-xs font-body rounded-lg bg-rani-navy/5 text-rani-navy hover:bg-rani-navy/10 transition-colors flex items-center gap-1">
              Keywords <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {isLoading ? (
          <>
            <KPIRowSkeleton count={5} />
            <PanelSkeleton rows={4} />
          </>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              <KPICard title="Total Spent" value={formatCurrency(o.totalSpent)} icon={<DollarSign className="w-4 h-4" />} trend={`${o.budgetUtilization}% of budget`} />
              <KPICard title="Revenue" value={formatCurrency(o.totalRevenue)} icon={<TrendingUp className="w-4 h-4" />} trend={`${o.overallROAS}x ROAS`} trendUp />
              <KPICard title="ROAS" value={`${o.overallROAS}x`} icon={<Target className="w-4 h-4" />} trend="vs 3.0x target" trendUp={o.overallROAS >= 3.0} />
              <KPICard title="CPA" value={`$${o.overallCPA}`} icon={<Crosshair className="w-4 h-4" />} trend="vs $100 target" trendUp={o.overallCPA <= 100} />
              <KPICard title="Leads" value={`${o.totalLeads}`} icon={<Users className="w-4 h-4" />} trend={`${o.totalConversions} bookings`} />
              <KPICard title="Ad Score" value={`${o.adScore}/100`} icon={<Gauge className="w-4 h-4" />} trend={o.adScore >= 70 ? 'Healthy' : 'Needs work'} trendUp={o.adScore >= 70} />
            </div>

            {/* Platform Split + Budget */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Meta */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-rani-navy/10 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-700 font-bold text-xs">M</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-heading text-rani-navy">Meta Ads</h3>
                    <p className="text-xs text-rani-muted">{formatCurrency(data.platformSplit.meta.spent)} spent</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs font-body">
                  <div className="flex justify-between"><span className="text-rani-muted">Revenue</span><span className="text-rani-navy font-semibold">{formatCurrency(data.platformSplit.meta.revenue)}</span></div>
                  <div className="flex justify-between"><span className="text-rani-muted">ROAS</span><span className="text-rani-navy font-semibold">{data.platformSplit.meta.roas}x</span></div>
                  <div className="flex justify-between"><span className="text-rani-muted">CPA</span><span className="text-rani-navy font-semibold">${data.platformSplit.meta.cpa}</span></div>
                  <div className="flex justify-between"><span className="text-rani-muted">Leads</span><span className="text-rani-navy font-semibold">{data.platformSplit.meta.leads}</span></div>
                </div>
              </motion.div>

              {/* Google */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white border border-rani-navy/10 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-700 font-bold text-xs">G</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-heading text-rani-navy">Google Ads</h3>
                    <p className="text-xs text-rani-muted">{formatCurrency(data.platformSplit.google.spent)} spent</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs font-body">
                  <div className="flex justify-between"><span className="text-rani-muted">Revenue</span><span className="text-rani-navy font-semibold">{formatCurrency(data.platformSplit.google.revenue)}</span></div>
                  <div className="flex justify-between"><span className="text-rani-muted">ROAS</span><span className="text-rani-navy font-semibold">{data.platformSplit.google.roas}x</span></div>
                  <div className="flex justify-between"><span className="text-rani-muted">CPA</span><span className="text-rani-navy font-semibold">${data.platformSplit.google.cpa}</span></div>
                  <div className="flex justify-between"><span className="text-rani-muted">Leads</span><span className="text-rani-navy font-semibold">{data.platformSplit.google.leads}</span></div>
                </div>
              </motion.div>

              {/* Budget Gauge */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white border border-rani-navy/10 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center">
                <h3 className="text-sm font-heading text-rani-navy mb-3">Budget Utilization</h3>
                <ProgressRing value={o.budgetUtilization} size={100} strokeWidth={10} color={o.budgetUtilization > 90 ? '#ef4444' : o.budgetUtilization > 70 ? '#C9A96E' : '#0F1D2C'} />
                <p className="text-xs text-rani-muted mt-2 font-body">{formatCurrency(o.totalSpent)} of {formatCurrency(Math.round(o.totalSpent / (o.budgetUtilization / 100)))} monthly</p>
              </motion.div>
            </div>

            {/* Active Campaigns */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white border border-rani-navy/10 rounded-xl p-4 sm:p-6">
              <h2 className="text-sm sm:text-base font-heading text-rani-navy mb-4">Active Campaigns</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-body">
                  <thead>
                    <tr className="border-b border-rani-navy/10 text-rani-muted">
                      <th className="text-left py-2 pr-4">Campaign</th>
                      <th className="text-left py-2 px-3">Platform</th>
                      <th className="text-left py-2 px-3">Status</th>
                      <th className="text-right py-2 px-3">Spent</th>
                      <th className="text-right py-2 px-3">Revenue</th>
                      <th className="text-right py-2 px-3">ROAS</th>
                      <th className="text-right py-2 px-3">CPA</th>
                      <th className="text-left py-2 pl-3">Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map(c => (
                      <tr key={c.id} className="border-b border-rani-navy/5 hover:bg-rani-navy/[0.02] transition-colors">
                        <td className="py-2.5 pr-4 text-rani-navy font-medium">{c.name}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${PLATFORM_COLORS[c.platform]}`}>
                            {c.platform === 'meta' ? 'Meta' : 'Google'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[c.status]}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-rani-muted">{formatCurrency(c.spent)}</td>
                        <td className="py-2.5 px-3 text-right text-rani-navy font-medium">{formatCurrency(c.revenue)}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={c.roas >= 3.0 ? 'text-emerald-600' : c.roas >= 2.0 ? 'text-amber-600' : 'text-red-600'}>
                            {c.roas}x
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={c.cpa <= 100 ? 'text-emerald-600' : c.cpa <= 150 ? 'text-amber-600' : 'text-red-600'}>
                            ${c.cpa}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${PERF_COLORS[c.performance]}`}>
                            {c.performance}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Auto-Scaler + Demand Engine + Creative Health + Compliance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Auto-Scaler */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white border border-rani-navy/10 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-rani-gold" />
                  <h3 className="text-sm font-heading text-rani-navy">Auto-Scaler</h3>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <ProgressRing value={data.autoScaler.healthScore} size={48} strokeWidth={5} color={data.autoScaler.healthScore >= 70 ? '#10b981' : '#f59e0b'} />
                  <div>
                    <p className="text-lg font-heading text-rani-navy">{data.autoScaler.healthScore}/100</p>
                    <p className="text-[10px] text-rani-muted">{data.autoScaler.activeRules} active rules</p>
                  </div>
                </div>
                {data.autoScaler.killSwitchActive && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">
                    <p className="text-[10px] text-red-700 font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Kill Switch Active</p>
                  </div>
                )}
                <div className="space-y-1.5">
                  {data.autoScaler.recentActions.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-[10px]">
                      <Clock className="w-3 h-3 text-rani-muted mt-0.5 shrink-0" />
                      <div>
                        <span className="text-rani-navy">{a.action}</span>
                        <span className="text-rani-muted"> - {a.campaign} ({a.time})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Demand Engine */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white border border-rani-navy/10 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Radio className="w-4 h-4 text-rani-gold" />
                  <h3 className="text-sm font-heading text-rani-navy">Demand Engine</h3>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <ProgressRing value={data.demandEngine.demandScore} size={48} strokeWidth={5} color={data.demandEngine.demandScore >= 70 ? '#ef4444' : data.demandEngine.demandScore >= 50 ? '#f59e0b' : '#10b981'} />
                  <div>
                    <p className="text-lg font-heading text-rani-navy">{data.demandEngine.demandScore}/100</p>
                    <p className="text-[10px] text-rani-muted">{data.demandEngine.activeSignals} active signals</p>
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
                  <p className="text-[10px] text-amber-700">{data.demandEngine.topSignal}</p>
                </div>
                {data.demandEngine.emergencyCampaigns > 0 && (
                  <p className="text-[10px] text-red-600 font-semibold">{data.demandEngine.emergencyCampaigns} emergency campaign(s) recommended</p>
                )}
              </motion.div>

              {/* Creative Health */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white border border-rani-navy/10 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-rani-gold" />
                  <h3 className="text-sm font-heading text-rani-navy">Creative Health</h3>
                </div>
                <div className="space-y-2.5 text-xs font-body">
                  <div className="flex justify-between"><span className="text-rani-muted">Total Creatives</span><span className="text-rani-navy font-semibold">{data.creativeHealth.totalCreatives}</span></div>
                  <div className="flex justify-between">
                    <span className="text-rani-muted">Fatigued</span>
                    <span className={data.creativeHealth.fatigued > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                      {data.creativeHealth.fatigued}
                    </span>
                  </div>
                  <div className="flex justify-between"><span className="text-rani-muted">Avg Relevance</span><span className="text-rani-navy font-semibold">{data.creativeHealth.avgRelevanceScore}/10</span></div>
                  <div className="flex justify-between">
                    <span className="text-rani-muted">Refresh Needed</span>
                    <span className={data.creativeHealth.refreshNeeded > 5 ? 'text-amber-600 font-semibold' : 'text-rani-navy font-semibold'}>
                      {data.creativeHealth.refreshNeeded}
                    </span>
                  </div>
                </div>
                <a href="/dashboard/ads-war-machine/creatives" className="block mt-3 text-[10px] text-rani-gold hover:text-rani-gold/80 font-semibold">
                  Manage Creatives &rarr;
                </a>
              </motion.div>

              {/* Compliance */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-white border border-rani-navy/10 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-rani-gold" />
                  <h3 className="text-sm font-heading text-rani-navy">Compliance</h3>
                </div>
                <div className="space-y-2.5 text-xs font-body">
                  <div className="flex justify-between"><span className="text-rani-muted">Total Checked</span><span className="text-rani-navy font-semibold">{data.compliance.totalChecked}</span></div>
                  <div className="flex justify-between">
                    <span className="text-rani-muted">Compliant</span>
                    <span className="text-emerald-600 font-semibold">{data.compliance.compliant}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-rani-muted">Warnings</span>
                    <span className={data.compliance.warnings > 0 ? 'text-amber-600 font-semibold' : 'text-rani-navy font-semibold'}>{data.compliance.warnings}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-rani-muted">Violations</span>
                    <span className={data.compliance.violations > 0 ? 'text-red-600 font-semibold' : 'text-emerald-600 font-semibold'}>{data.compliance.violations}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <ProgressBar value={Math.round((data.compliance.compliant / data.compliance.totalChecked) * 100)} color={data.compliance.violations > 0 ? '#f59e0b' : '#10b981'} />
                  <p className="text-[10px] text-rani-muted mt-1">{Math.round((data.compliance.compliant / data.compliance.totalChecked) * 100)}% compliance rate</p>
                </div>
              </motion.div>
            </div>

            {/* Quick Launch */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white border border-rani-navy/10 rounded-xl p-4 sm:p-6">
              <h2 className="text-sm sm:text-base font-heading text-rani-navy mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button className="p-3 rounded-lg bg-rani-navy/5 hover:bg-rani-navy/10 transition-colors text-left">
                  <Zap className="w-4 h-4 text-rani-gold mb-1.5" />
                  <p className="text-xs font-heading text-rani-navy">Launch Campaign</p>
                  <p className="text-[10px] text-rani-muted">New Meta or Google campaign</p>
                </button>
                <button className="p-3 rounded-lg bg-rani-navy/5 hover:bg-rani-navy/10 transition-colors text-left">
                  <RefreshCw className="w-4 h-4 text-rani-gold mb-1.5" />
                  <p className="text-xs font-heading text-rani-navy">Refresh Creatives</p>
                  <p className="text-[10px] text-rani-muted">Generate new ad variants</p>
                </button>
                <button className="p-3 rounded-lg bg-rani-navy/5 hover:bg-rani-navy/10 transition-colors text-left">
                  <BarChart3 className="w-4 h-4 text-rani-gold mb-1.5" />
                  <p className="text-xs font-heading text-rani-navy">Run Report</p>
                  <p className="text-[10px] text-rani-muted">Cross-platform analytics</p>
                </button>
                <button className="p-3 rounded-lg bg-rani-navy/5 hover:bg-rani-navy/10 transition-colors text-left">
                  <Target className="w-4 h-4 text-rani-gold mb-1.5" />
                  <p className="text-xs font-heading text-rani-navy">Competitor Scan</p>
                  <p className="text-[10px] text-rani-muted">Competitive intelligence</p>
                </button>
              </div>
            </motion.div>

            {/* Revenue Attribution */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="bg-white border border-rani-navy/10 rounded-xl p-4 sm:p-6">
              <h2 className="text-sm sm:text-base font-heading text-rani-navy mb-4">Revenue Attribution</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-50">
                  <p className="text-lg font-heading text-blue-700">{formatCurrency(data.platformSplit.meta.revenue)}</p>
                  <p className="text-xs text-blue-600 mt-1">Meta Ads Revenue</p>
                  <p className="text-[10px] text-blue-500 mt-0.5">{Math.round((data.platformSplit.meta.revenue / o.totalRevenue) * 100)}% of total</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-50">
                  <p className="text-lg font-heading text-green-700">{formatCurrency(data.platformSplit.google.revenue)}</p>
                  <p className="text-xs text-green-600 mt-1">Google Ads Revenue</p>
                  <p className="text-[10px] text-green-500 mt-0.5">{Math.round((data.platformSplit.google.revenue / o.totalRevenue) * 100)}% of total</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-rani-navy/5">
                  <p className="text-lg font-heading text-rani-navy">{formatCurrency(o.totalRevenue)}</p>
                  <p className="text-xs text-rani-muted mt-1">Total Ad Revenue</p>
                  <p className="text-[10px] text-rani-muted mt-0.5">{o.overallROAS}x return on ad spend</p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </DashboardErrorBoundary>
  );
}
