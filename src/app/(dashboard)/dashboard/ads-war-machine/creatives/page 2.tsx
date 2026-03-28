'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Paintbrush, Image, Video, Layers, TrendingUp, TrendingDown, AlertTriangle,
  RefreshCw, Filter, Search, Eye, MousePointer, DollarSign, Clock, Star,
  Sparkles, Copy, BarChart3, Zap, Play, Pause, ChevronRight, ArrowUp,
  ArrowDown, CheckCircle, XCircle, Activity, Target,
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

// ── TYPES ──

type CreativeStatus = 'active' | 'paused' | 'fatigued' | 'testing' | 'winner' | 'retired';
type CreativeFormat = 'single_image' | 'carousel' | 'video' | 'story' | 'collection' | 'reels';
type Platform = 'meta' | 'google' | 'both';
type ServiceFilter = 'all' | 'glp1' | 'botox' | 'hydrafacial' | 'sofwave' | 'wellness' | 'laser_hair' | 'peptides';

interface Creative {
  id: string;
  name: string;
  format: CreativeFormat;
  platform: Platform;
  service: string;
  serviceId: ServiceFilter;
  status: CreativeStatus;
  headline: string;
  description: string;
  cta: string;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
  roas: number;
  spend: number;
  revenue: number;
  relevanceScore: number;
  frequencyScore: number;
  daysActive: number;
  lastRefreshed: string;
  abTestGroup?: 'A' | 'B';
  abTestWinner?: boolean;
}

interface ABTest {
  id: string;
  name: string;
  service: string;
  status: 'running' | 'complete' | 'paused';
  variantA: { name: string; ctr: number; cpa: number; conversions: number };
  variantB: { name: string; ctr: number; cpa: number; conversions: number };
  winner?: 'A' | 'B';
  confidence: number;
  daysRunning: number;
  startDate: string;
}

interface CreativeHealth {
  totalCreatives: number;
  activeCreatives: number;
  fatiguedCreatives: number;
  avgRelevanceScore: number;
  avgCTR: number;
  avgCPA: number;
  topPerformer: string;
  refreshNeeded: number;
  abTestsRunning: number;
  winnersThisMonth: number;
}

// ── MOCK DATA ──

const MOCK_HEALTH: CreativeHealth = {
  totalCreatives: 48,
  activeCreatives: 32,
  fatiguedCreatives: 5,
  avgRelevanceScore: 7.8,
  avgCTR: 3.42,
  avgCPA: 42.50,
  topPerformer: 'GLP-1 Transformation Stories',
  refreshNeeded: 8,
  abTestsRunning: 4,
  winnersThisMonth: 6,
};

const MOCK_CREATIVES: Creative[] = [
  {
    id: 'cr_001', name: 'GLP-1 Transformation Stories', format: 'carousel', platform: 'meta',
    service: 'GLP-1 Weight Loss', serviceId: 'glp1', status: 'active',
    headline: 'Your Weight Loss Journey Starts Here', description: 'Medical weight loss with semaglutide injections. Clinician-supervised programs in Renton, WA.', cta: 'Book Free Consultation',
    impressions: 45200, clicks: 1808, ctr: 4.0, conversions: 38, cpa: 35.50, roas: 4.2, spend: 1349, revenue: 5665.80, relevanceScore: 8.5, frequencyScore: 2.1, daysActive: 14, lastRefreshed: '2026-03-12',
  },
  {
    id: 'cr_002', name: 'Botox Confidence Boost', format: 'single_image', platform: 'meta',
    service: 'Botox', serviceId: 'botox', status: 'active',
    headline: 'Refresh Your Look in 15 Minutes', description: 'Expert Botox injections at Rani Beauty Clinic. Natural results, experienced providers.', cta: 'See Availability',
    impressions: 32100, clicks: 1124, ctr: 3.5, conversions: 22, cpa: 41.20, roas: 3.8, spend: 906.40, revenue: 3444.32, relevanceScore: 7.9, frequencyScore: 2.8, daysActive: 21, lastRefreshed: '2026-03-05',
  },
  {
    id: 'cr_003', name: 'HydraFacial Glow Up', format: 'video', platform: 'meta',
    service: 'HydraFacial', serviceId: 'hydrafacial', status: 'active',
    headline: 'The Facial That Actually Works', description: 'Deep cleanse, extract, and hydrate in one session. See visible results immediately.', cta: 'Book Your Glow',
    impressions: 28400, clicks: 1136, ctr: 4.0, conversions: 19, cpa: 38.90, roas: 3.5, spend: 739.10, revenue: 2586.85, relevanceScore: 8.2, frequencyScore: 1.9, daysActive: 10, lastRefreshed: '2026-03-16',
  },
  {
    id: 'cr_004', name: 'Sofwave Skin Tightening', format: 'carousel', platform: 'meta',
    service: 'Sofwave', serviceId: 'sofwave', status: 'winner',
    headline: 'Lift Without Surgery', description: 'FDA-cleared Sofwave technology. One session, visible tightening. No downtime.', cta: 'Learn More',
    impressions: 18900, clicks: 680, ctr: 3.6, conversions: 11, cpa: 52.30, roas: 5.1, spend: 575.30, revenue: 2934.03, relevanceScore: 8.0, frequencyScore: 1.5, daysActive: 18, lastRefreshed: '2026-03-08',
  },
  {
    id: 'cr_005', name: 'Wellness Injection Menu', format: 'single_image', platform: 'meta',
    service: 'Wellness Injections', serviceId: 'wellness', status: 'active',
    headline: 'Energy, Immunity, Recovery', description: 'Vitamin D3, B12, Glutathione, NAD+ injections. Walk-ins welcome at Renton clinic.', cta: 'View Menu',
    impressions: 15200, clicks: 456, ctr: 3.0, conversions: 8, cpa: 28.75, roas: 2.8, spend: 230.00, revenue: 644.00, relevanceScore: 7.2, frequencyScore: 3.1, daysActive: 28, lastRefreshed: '2026-02-26',
  },
  {
    id: 'cr_006', name: 'GLP-1 Results Spotlight', format: 'reels', platform: 'meta',
    service: 'GLP-1 Weight Loss', serviceId: 'glp1', status: 'testing',
    headline: 'Real Results. Real People.', description: 'See what medical weight loss can do. Semaglutide injection programs starting at $399/mo.', cta: 'Start Your Journey',
    impressions: 8400, clicks: 378, ctr: 4.5, conversions: 7, cpa: 32.10, roas: 4.8, spend: 224.70, revenue: 1078.56, relevanceScore: 8.8, frequencyScore: 1.2, daysActive: 5, lastRefreshed: '2026-03-21', abTestGroup: 'A',
  },
  {
    id: 'cr_007', name: 'GLP-1 Clinical Authority', format: 'reels', platform: 'meta',
    service: 'GLP-1 Weight Loss', serviceId: 'glp1', status: 'testing',
    headline: 'Doctor-Supervised Weight Loss', description: 'Clinician-monitored semaglutide injections. Personalized dosing, ongoing support.', cta: 'Get Started',
    impressions: 8200, clicks: 328, ctr: 4.0, conversions: 5, cpa: 38.40, roas: 3.9, spend: 192.00, revenue: 748.80, relevanceScore: 8.1, frequencyScore: 1.2, daysActive: 5, lastRefreshed: '2026-03-21', abTestGroup: 'B',
  },
  {
    id: 'cr_008', name: 'Laser Hair Removal Spring', format: 'story', platform: 'meta',
    service: 'Laser Hair Removal', serviceId: 'laser_hair', status: 'fatigued',
    headline: 'Summer-Ready Skin Starts Now', description: 'Professional laser hair removal. Safe for all skin types. Package pricing available.', cta: 'Book Package',
    impressions: 42000, clicks: 840, ctr: 2.0, conversions: 9, cpa: 58.90, roas: 1.8, spend: 530.10, revenue: 954.18, relevanceScore: 5.2, frequencyScore: 4.8, daysActive: 35, lastRefreshed: '2026-02-19',
  },
  {
    id: 'cr_009', name: 'Peptide Therapy Intro', format: 'single_image', platform: 'meta',
    service: 'Peptide Therapy', serviceId: 'peptides', status: 'active',
    headline: 'Next-Level Recovery and Performance', description: 'BPC-157, CJC/Ipamorelin peptide injections. Physician-supervised protocols in Renton.', cta: 'Learn About Peptides',
    impressions: 11800, clicks: 413, ctr: 3.5, conversions: 6, cpa: 44.20, roas: 3.2, spend: 265.20, revenue: 848.64, relevanceScore: 7.5, frequencyScore: 2.0, daysActive: 12, lastRefreshed: '2026-03-14',
  },
  {
    id: 'cr_010', name: 'Botox Education Series', format: 'carousel', platform: 'meta',
    service: 'Botox', serviceId: 'botox', status: 'paused',
    headline: 'What to Expect from Botox', description: 'Everything you need to know about injectable treatments. Expert Q&A from our providers.', cta: 'Read More',
    impressions: 21500, clicks: 538, ctr: 2.5, conversions: 8, cpa: 55.60, roas: 2.1, spend: 444.80, revenue: 934.08, relevanceScore: 6.4, frequencyScore: 3.6, daysActive: 30, lastRefreshed: '2026-02-24',
  },
  {
    id: 'cr_011', name: 'Google RSA - GLP-1 Main', format: 'single_image', platform: 'google',
    service: 'GLP-1 Weight Loss', serviceId: 'glp1', status: 'active',
    headline: 'Semaglutide Injections Renton WA', description: 'Medical weight loss programs from $399/mo. Clinician-supervised. Book your consultation today.', cta: 'Schedule Now',
    impressions: 22400, clicks: 1344, ctr: 6.0, conversions: 28, cpa: 38.20, roas: 3.9, spend: 1069.60, revenue: 4171.44, relevanceScore: 8.4, frequencyScore: 1.0, daysActive: 30, lastRefreshed: '2026-02-26',
  },
  {
    id: 'cr_012', name: 'Google RSA - Botox Local', format: 'single_image', platform: 'google',
    service: 'Botox', serviceId: 'botox', status: 'active',
    headline: 'Botox Near Me - Renton WA', description: 'Top-rated Botox provider. Natural results, competitive pricing. Walk-ins welcome.', cta: 'Book Today',
    impressions: 18600, clicks: 930, ctr: 5.0, conversions: 15, cpa: 46.80, roas: 3.2, spend: 702.00, revenue: 2246.40, relevanceScore: 7.6, frequencyScore: 1.0, daysActive: 30, lastRefreshed: '2026-02-26',
  },
];

const MOCK_AB_TESTS: ABTest[] = [
  {
    id: 'ab_001', name: 'GLP-1 Reels: Transformation vs Clinical', service: 'GLP-1 Weight Loss',
    status: 'running',
    variantA: { name: 'Results Spotlight', ctr: 4.5, cpa: 32.10, conversions: 7 },
    variantB: { name: 'Clinical Authority', ctr: 4.0, cpa: 38.40, conversions: 5 },
    confidence: 72, daysRunning: 5, startDate: '2026-03-21',
  },
  {
    id: 'ab_002', name: 'Botox CTA: See Availability vs Book Now', service: 'Botox',
    status: 'running',
    variantA: { name: 'See Availability', ctr: 3.5, cpa: 41.20, conversions: 22 },
    variantB: { name: 'Book Now', ctr: 3.2, cpa: 44.80, conversions: 18 },
    confidence: 68, daysRunning: 8, startDate: '2026-03-18',
  },
  {
    id: 'ab_003', name: 'HydraFacial: Video vs Carousel', service: 'HydraFacial',
    status: 'complete',
    variantA: { name: 'Video Walkthrough', ctr: 4.0, cpa: 38.90, conversions: 19 },
    variantB: { name: 'Step-by-Step Carousel', ctr: 3.1, cpa: 48.20, conversions: 12 },
    winner: 'A', confidence: 94, daysRunning: 14, startDate: '2026-03-06',
  },
  {
    id: 'ab_004', name: 'Wellness: Energy vs Immunity Hook', service: 'Wellness Injections',
    status: 'running',
    variantA: { name: 'Energy Focus', ctr: 3.0, cpa: 28.75, conversions: 8 },
    variantB: { name: 'Immunity Focus', ctr: 2.6, cpa: 33.10, conversions: 6 },
    confidence: 58, daysRunning: 4, startDate: '2026-03-22',
  },
];

// ── HELPERS ──

const formatNumber = (n: number) => n.toLocaleString();
const formatCurrency = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatPercent = (n: number) => `${n.toFixed(1)}%`;

const statusConfig: Record<CreativeStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  paused: { label: 'Paused', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  fatigued: { label: 'Fatigued', color: 'text-red-400', bg: 'bg-red-400/10' },
  testing: { label: 'A/B Testing', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  winner: { label: 'Winner', color: 'text-[#C9A96E]', bg: 'bg-[#C9A96E]/10' },
  retired: { label: 'Retired', color: 'text-gray-400', bg: 'bg-gray-400/10' },
};

const formatIcons: Record<CreativeFormat, typeof Image> = {
  single_image: Image,
  carousel: Layers,
  video: Video,
  story: Sparkles,
  collection: Copy,
  reels: Play,
};

const serviceLabels: Record<ServiceFilter, string> = {
  all: 'All Services',
  glp1: 'GLP-1 Weight Loss',
  botox: 'Botox',
  hydrafacial: 'HydraFacial',
  sofwave: 'Sofwave',
  wellness: 'Wellness Injections',
  laser_hair: 'Laser Hair Removal',
  peptides: 'Peptide Therapy',
};

// ── COMPONENT ──

export default function CreativesPage() {
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>('all');
  const [statusFilter, setStatusFilter] = useState<CreativeStatus | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'roas' | 'ctr' | 'cpa' | 'spend' | 'relevanceScore'>('roas');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedCreative, setSelectedCreative] = useState<Creative | null>(null);

  const filteredCreatives = useMemo(() => {
    let result = [...MOCK_CREATIVES];

    if (serviceFilter !== 'all') {
      result = result.filter(c => c.serviceId === serviceFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }
    if (platformFilter !== 'all') {
      result = result.filter(c => c.platform === platformFilter || c.platform === 'both');
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.headline.toLowerCase().includes(q) ||
        c.service.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const mult = sortDir === 'desc' ? -1 : 1;
      return (a[sortBy] - b[sortBy]) * mult;
    });

    return result;
  }, [serviceFilter, statusFilter, platformFilter, searchQuery, sortBy, sortDir]);

  const health = MOCK_HEALTH;

  const fadeIn = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06 } }),
  };

  return (
    <DashboardErrorBoundary>
      <div className="space-y-6">
        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Paintbrush className="w-7 h-7 text-[#C9A96E]" />
              Creative Command Center
            </h1>
            <p className="text-gray-400 mt-1">Manage, test, and optimize all ad creatives across platforms</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 bg-[#C9A96E]/10 text-[#C9A96E] rounded-lg border border-[#C9A96E]/20 hover:bg-[#C9A96E]/20 transition-colors flex items-center gap-2 text-sm font-medium">
              <RefreshCw className="w-4 h-4" />
              Refresh All
            </button>
            <button className="px-4 py-2 bg-[#C9A96E] text-[#0F1D2C] rounded-lg hover:bg-[#C9A96E]/90 transition-colors flex items-center gap-2 text-sm font-bold">
              <Sparkles className="w-4 h-4" />
              Generate New Creative
            </button>
          </div>
        </motion.div>

        {/* ── KPI ROW ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total Creatives', value: health.totalCreatives.toString(), sub: `${health.activeCreatives} active`, icon: Layers, color: '#C9A96E' },
            { label: 'Avg CTR', value: formatPercent(health.avgCTR), sub: '+0.3% vs last week', icon: MousePointer, color: '#34D399' },
            { label: 'Avg CPA', value: formatCurrency(health.avgCPA), sub: '-$2.10 vs last week', icon: DollarSign, color: '#60A5FA' },
            { label: 'Avg Relevance', value: `${health.avgRelevanceScore}/10`, sub: 'Above benchmark', icon: Star, color: '#FBBF24' },
            { label: 'Fatigued', value: health.fatiguedCreatives.toString(), sub: `${health.refreshNeeded} need refresh`, icon: AlertTriangle, color: '#F87171' },
            { label: 'A/B Winners', value: health.winnersThisMonth.toString(), sub: `${health.abTestsRunning} tests running`, icon: Target, color: '#A78BFA' },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="bg-[#0F1D2C]/60 border border-white/5 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
                <span className="text-xs text-gray-400 uppercase tracking-wide">{kpi.label}</span>
              </div>
              <div className="text-xl font-bold text-white">{kpi.value}</div>
              <div className="text-xs text-gray-500 mt-1">{kpi.sub}</div>
            </motion.div>
          ))}
        </div>

        {/* ── FILTERS ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0F1D2C]/40 border border-white/5 rounded-xl p-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search creatives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E]/40"
              />
            </div>

            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value as ServiceFilter)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#C9A96E]/40"
            >
              {Object.entries(serviceLabels).map(([val, label]) => (
                <option key={val} value={val} className="bg-[#0F1D2C]">{label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as CreativeStatus | 'all')}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#C9A96E]/40"
            >
              <option value="all" className="bg-[#0F1D2C]">All Status</option>
              {Object.entries(statusConfig).map(([val, cfg]) => (
                <option key={val} value={val} className="bg-[#0F1D2C]">{cfg.label}</option>
              ))}
            </select>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as Platform | 'all')}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#C9A96E]/40"
            >
              <option value="all" className="bg-[#0F1D2C]">All Platforms</option>
              <option value="meta" className="bg-[#0F1D2C]">Meta</option>
              <option value="google" className="bg-[#0F1D2C]">Google</option>
            </select>

            <select
              value={`${sortBy}-${sortDir}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split('-');
                setSortBy(field as typeof sortBy);
                setSortDir(dir as 'asc' | 'desc');
              }}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#C9A96E]/40"
            >
              <option value="roas-desc" className="bg-[#0F1D2C]">Best ROAS</option>
              <option value="ctr-desc" className="bg-[#0F1D2C]">Best CTR</option>
              <option value="cpa-asc" className="bg-[#0F1D2C]">Lowest CPA</option>
              <option value="spend-desc" className="bg-[#0F1D2C]">Highest Spend</option>
              <option value="relevanceScore-desc" className="bg-[#0F1D2C]">Highest Relevance</option>
            </select>
          </div>
        </motion.div>

        {/* ── CREATIVE CARDS GRID ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredCreatives.map((creative, i) => {
              const FormatIcon = formatIcons[creative.format] || Image;
              const status = statusConfig[creative.status];

              return (
                <motion.div
                  key={creative.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedCreative(creative)}
                  className="bg-[#0F1D2C]/60 border border-white/5 rounded-xl p-5 hover:border-[#C9A96E]/30 transition-all cursor-pointer group"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="p-1.5 rounded-lg bg-white/5">
                        <FormatIcon className="w-4 h-4 text-[#C9A96E]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-white truncate">{creative.name}</h3>
                        <p className="text-xs text-gray-500">{creative.service}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                  </div>

                  {/* Preview snippet */}
                  <div className="bg-white/5 rounded-lg p-3 mb-3">
                    <p className="text-xs font-medium text-[#C9A96E] mb-1">{creative.headline}</p>
                    <p className="text-xs text-gray-400 line-clamp-2">{creative.description}</p>
                    <p className="text-xs text-blue-400 mt-1">{creative.cta}</p>
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[
                      { label: 'CTR', value: formatPercent(creative.ctr), good: creative.ctr >= 3.0 },
                      { label: 'CPA', value: formatCurrency(creative.cpa), good: creative.cpa <= 45 },
                      { label: 'ROAS', value: `${creative.roas.toFixed(1)}x`, good: creative.roas >= 3.0 },
                      { label: 'Conv', value: creative.conversions.toString(), good: creative.conversions >= 10 },
                    ].map(m => (
                      <div key={m.label} className="text-center">
                        <div className="text-[10px] text-gray-500 uppercase">{m.label}</div>
                        <div className={`text-xs font-semibold ${m.good ? 'text-emerald-400' : 'text-gray-300'}`}>{m.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Relevance + Fatigue bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-500">Relevance</span>
                      <span className={creative.relevanceScore >= 7 ? 'text-emerald-400' : creative.relevanceScore >= 5 ? 'text-yellow-400' : 'text-red-400'}>
                        {creative.relevanceScore}/10
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          creative.relevanceScore >= 7 ? 'bg-emerald-400' :
                          creative.relevanceScore >= 5 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${creative.relevanceScore * 10}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-500">Frequency</span>
                      <span className={creative.frequencyScore <= 3 ? 'text-emerald-400' : creative.frequencyScore <= 4 ? 'text-yellow-400' : 'text-red-400'}>
                        {creative.frequencyScore.toFixed(1)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          creative.frequencyScore <= 3 ? 'bg-emerald-400' :
                          creative.frequencyScore <= 4 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${Math.min(creative.frequencyScore / 6 * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                      <Clock className="w-3 h-3" />
                      {creative.daysActive}d active
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                      {creative.platform === 'meta' ? 'Meta' : creative.platform === 'google' ? 'Google' : 'Both'}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500">
                      <DollarSign className="w-3 h-3" />
                      {formatCurrency(creative.spend)}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredCreatives.length === 0 && (
          <DashboardEmptyState
            icon={<Paintbrush className="w-12 h-12 text-gray-600" />}
            title="No creatives match your filters"
            description="Try adjusting your search or filter criteria."
          />
        )}

        {/* ── A/B TESTS SECTION ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[#C9A96E]" />
            A/B Tests
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_AB_TESTS.map((test) => (
              <div
                key={test.id}
                className="bg-[#0F1D2C]/60 border border-white/5 rounded-xl p-5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{test.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{test.service}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    test.status === 'running' ? 'bg-blue-400/10 text-blue-400' :
                    test.status === 'complete' ? 'bg-emerald-400/10 text-emerald-400' :
                    'bg-yellow-400/10 text-yellow-400'
                  }`}>
                    {test.status === 'running' ? 'Running' : test.status === 'complete' ? 'Complete' : 'Paused'}
                  </span>
                </div>

                {/* Variant comparison */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {(['variantA', 'variantB'] as const).map((key, vi) => {
                    const variant = test[key];
                    const isWinner = test.winner === (vi === 0 ? 'A' : 'B');
                    return (
                      <div
                        key={key}
                        className={`rounded-lg p-3 border ${
                          isWinner ? 'bg-[#C9A96E]/10 border-[#C9A96E]/30' : 'bg-white/5 border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className={`text-xs font-bold ${isWinner ? 'text-[#C9A96E]' : 'text-gray-400'}`}>
                            {vi === 0 ? 'A' : 'B'}
                          </span>
                          <span className="text-xs text-gray-300 truncate">{variant.name}</span>
                          {isWinner && <Star className="w-3 h-3 text-[#C9A96E] ml-auto flex-shrink-0" />}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">CTR</span>
                            <span className="text-gray-300">{formatPercent(variant.ctr)}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">CPA</span>
                            <span className="text-gray-300">{formatCurrency(variant.cpa)}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-gray-500">Conversions</span>
                            <span className="text-gray-300">{variant.conversions}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Confidence bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500">Statistical Confidence</span>
                    <span className={test.confidence >= 95 ? 'text-emerald-400' : test.confidence >= 80 ? 'text-yellow-400' : 'text-gray-400'}>
                      {test.confidence}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        test.confidence >= 95 ? 'bg-emerald-400' :
                        test.confidence >= 80 ? 'bg-yellow-400' : 'bg-blue-400'
                      }`}
                      style={{ width: `${test.confidence}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                    <span>{test.daysRunning} days running</span>
                    <span>{test.confidence >= 95 ? 'Statistically significant' : `Need ${95 - test.confidence}% more confidence`}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── FATIGUE ALERTS ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Creative Fatigue Alerts
          </h2>

          <div className="bg-[#0F1D2C]/60 border border-white/5 rounded-xl overflow-hidden">
            {MOCK_CREATIVES.filter(c => c.status === 'fatigued' || c.frequencyScore > 3.5).map((creative) => (
              <div
                key={creative.id}
                className="flex items-center justify-between p-4 border-b border-white/5 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${creative.status === 'fatigued' ? 'bg-red-400/10' : 'bg-yellow-400/10'}`}>
                    <AlertTriangle className={`w-4 h-4 ${creative.status === 'fatigued' ? 'text-red-400' : 'text-yellow-400'}`} />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white">{creative.name}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span>Frequency: {creative.frequencyScore.toFixed(1)}</span>
                      <span>Relevance: {creative.relevanceScore}/10</span>
                      <span>{creative.daysActive} days active</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 text-xs bg-[#C9A96E]/10 text-[#C9A96E] rounded-lg border border-[#C9A96E]/20 hover:bg-[#C9A96E]/20 transition-colors flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    Auto-Refresh
                  </button>
                  <button className="px-3 py-1.5 text-xs bg-white/5 text-gray-400 rounded-lg border border-white/10 hover:bg-white/10 transition-colors flex items-center gap-1">
                    <Pause className="w-3 h-3" />
                    Pause
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── CREATIVE DETAIL MODAL ── */}
        <AnimatePresence>
          {selectedCreative && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedCreative(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-[#0F1D2C] border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedCreative.name}</h2>
                    <p className="text-sm text-gray-400">{selectedCreative.service}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCreative(null)}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                {/* Ad preview */}
                <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/5">
                  <p className="text-sm font-semibold text-[#C9A96E] mb-1">{selectedCreative.headline}</p>
                  <p className="text-sm text-gray-300 mb-2">{selectedCreative.description}</p>
                  <p className="text-sm text-blue-400 font-medium">{selectedCreative.cta}</p>
                </div>

                {/* Full metrics */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: 'Impressions', value: formatNumber(selectedCreative.impressions) },
                    { label: 'Clicks', value: formatNumber(selectedCreative.clicks) },
                    { label: 'CTR', value: formatPercent(selectedCreative.ctr) },
                    { label: 'Conversions', value: selectedCreative.conversions.toString() },
                    { label: 'CPA', value: formatCurrency(selectedCreative.cpa) },
                    { label: 'ROAS', value: `${selectedCreative.roas.toFixed(1)}x` },
                    { label: 'Total Spend', value: formatCurrency(selectedCreative.spend) },
                    { label: 'Revenue', value: formatCurrency(selectedCreative.revenue) },
                  ].map(m => (
                    <div key={m.label} className="bg-white/5 rounded-lg p-3">
                      <div className="text-[10px] text-gray-500 uppercase">{m.label}</div>
                      <div className="text-sm font-semibold text-white mt-0.5">{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Health indicators */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Relevance Score</span>
                    <span className="text-white font-medium">{selectedCreative.relevanceScore}/10</span>
                  </div>
                  <ProgressBar
                    value={selectedCreative.relevanceScore * 10}
                    color={selectedCreative.relevanceScore >= 7 ? '#34D399' : selectedCreative.relevanceScore >= 5 ? '#FBBF24' : '#F87171'}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Frequency Score</span>
                    <span className="text-white font-medium">{selectedCreative.frequencyScore.toFixed(1)}</span>
                  </div>
                  <ProgressBar
                    value={Math.min(selectedCreative.frequencyScore / 6 * 100, 100)}
                    color={selectedCreative.frequencyScore <= 3 ? '#34D399' : selectedCreative.frequencyScore <= 4 ? '#FBBF24' : '#F87171'}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button className="flex-1 px-4 py-2 bg-[#C9A96E] text-[#0F1D2C] rounded-lg text-sm font-bold hover:bg-[#C9A96E]/90 transition-colors flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Generate Variant
                  </button>
                  <button className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg text-sm border border-white/10 hover:bg-white/10 transition-colors">
                    {selectedCreative.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                  <button className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm border border-red-500/20 hover:bg-red-500/20 transition-colors">
                    Retire
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardErrorBoundary>
  );
}
