'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Search, TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle,
  Plus, Minus, Filter, ArrowUp, ArrowDown, ChevronRight, Eye, MousePointer,
  BarChart3, Zap, Shield, XCircle, CheckCircle, Activity, Clock, Star,
  Crosshair, Ban,
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

type MatchType = 'exact' | 'phrase' | 'broad';
type CompetitionLevel = 'low' | 'medium' | 'high';
type KeywordStatus = 'active' | 'paused' | 'negative' | 'suggested' | 'competitor_gap';
type CategoryFilter = 'all' | 'glp1' | 'aesthetics' | 'wellness' | 'peptides' | 'geo' | 'brand' | 'competitor';
type IntentType = 'transactional' | 'commercial' | 'informational' | 'navigational';

interface KeywordEntry {
  id: string;
  term: string;
  matchType: MatchType;
  category: CategoryFilter;
  status: KeywordStatus;
  intentType: IntentType;
  intentScore: number;
  estimatedCPC: number;
  monthlyVolume: number;
  competition: CompetitionLevel;
  qualityScore: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cpa: number;
  roas: number;
  spend: number;
  avgPosition: number;
  serviceId?: string;
  landingPage?: string;
}

interface NegativeKeyword {
  id: string;
  term: string;
  matchType: MatchType;
  reason: string;
  dateAdded: string;
}

interface KeywordGap {
  term: string;
  estimatedVolume: number;
  estimatedCPC: number;
  competitorUsing: string;
  opportunity: 'high' | 'medium' | 'low';
}

interface KeywordOverview {
  totalKeywords: number;
  activeKeywords: number;
  pausedKeywords: number;
  negativeKeywords: number;
  avgQualityScore: number;
  avgCPC: number;
  avgCTR: number;
  totalSpend: number;
  totalConversions: number;
  avgCPA: number;
  competitorGaps: number;
  suggestedKeywords: number;
}

// ── MOCK DATA ──

const MOCK_OVERVIEW: KeywordOverview = {
  totalKeywords: 187,
  activeKeywords: 142,
  pausedKeywords: 12,
  negativeKeywords: 33,
  avgQualityScore: 7.4,
  avgCPC: 8.65,
  avgCTR: 5.2,
  totalSpend: 3842.50,
  totalConversions: 86,
  avgCPA: 44.68,
  competitorGaps: 15,
  suggestedKeywords: 28,
};

const MOCK_KEYWORDS: KeywordEntry[] = [
  {
    id: 'kw_001', term: 'semaglutide near me', matchType: 'exact', category: 'glp1', status: 'active',
    intentType: 'transactional', intentScore: 9, estimatedCPC: 18.50, monthlyVolume: 4400, competition: 'high',
    qualityScore: 9, impressions: 8200, clicks: 574, ctr: 7.0, conversions: 14, cpa: 32.10, roas: 4.8,
    spend: 449.40, avgPosition: 1.2, serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss',
  },
  {
    id: 'kw_002', term: 'semaglutide renton wa', matchType: 'exact', category: 'glp1', status: 'active',
    intentType: 'transactional', intentScore: 10, estimatedCPC: 14.20, monthlyVolume: 320, competition: 'medium',
    qualityScore: 10, impressions: 620, clicks: 56, ctr: 9.0, conversions: 8, cpa: 22.40, roas: 6.2,
    spend: 179.20, avgPosition: 1.0, serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss',
  },
  {
    id: 'kw_003', term: 'medical weight loss near me', matchType: 'exact', category: 'glp1', status: 'active',
    intentType: 'transactional', intentScore: 9, estimatedCPC: 16.80, monthlyVolume: 6600, competition: 'high',
    qualityScore: 8, impressions: 11400, clicks: 684, ctr: 6.0, conversions: 12, cpa: 42.50, roas: 3.6,
    spend: 510.00, avgPosition: 2.1, serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss',
  },
  {
    id: 'kw_004', term: 'botox near me', matchType: 'exact', category: 'aesthetics', status: 'active',
    intentType: 'transactional', intentScore: 9, estimatedCPC: 12.40, monthlyVolume: 14800, competition: 'high',
    qualityScore: 7, impressions: 9800, clicks: 490, ctr: 5.0, conversions: 8, cpa: 48.20, roas: 3.1,
    spend: 385.60, avgPosition: 2.8, serviceId: 'botox', landingPage: '/services/botox',
  },
  {
    id: 'kw_005', term: 'botox renton wa', matchType: 'exact', category: 'aesthetics', status: 'active',
    intentType: 'transactional', intentScore: 10, estimatedCPC: 10.80, monthlyVolume: 480, competition: 'medium',
    qualityScore: 9, impressions: 850, clicks: 68, ctr: 8.0, conversions: 6, cpa: 28.80, roas: 4.5,
    spend: 172.80, avgPosition: 1.3, serviceId: 'botox', landingPage: '/services/botox',
  },
  {
    id: 'kw_006', term: 'hydrafacial near me', matchType: 'exact', category: 'aesthetics', status: 'active',
    intentType: 'transactional', intentScore: 8, estimatedCPC: 8.60, monthlyVolume: 5400, competition: 'medium',
    qualityScore: 8, impressions: 6200, clicks: 372, ctr: 6.0, conversions: 7, cpa: 35.40, roas: 3.9,
    spend: 247.80, avgPosition: 1.8, serviceId: 'hydrafacial', landingPage: '/services/hydrafacial',
  },
  {
    id: 'kw_007', term: 'sofwave skin tightening', matchType: 'phrase', category: 'aesthetics', status: 'active',
    intentType: 'commercial', intentScore: 7, estimatedCPC: 9.20, monthlyVolume: 2200, competition: 'medium',
    qualityScore: 8, impressions: 4100, clicks: 205, ctr: 5.0, conversions: 4, cpa: 55.20, roas: 5.0,
    spend: 220.80, avgPosition: 2.0, serviceId: 'sofwave', landingPage: '/services/sofwave',
  },
  {
    id: 'kw_008', term: 'vitamin injections near me', matchType: 'exact', category: 'wellness', status: 'active',
    intentType: 'transactional', intentScore: 8, estimatedCPC: 6.40, monthlyVolume: 3800, competition: 'medium',
    qualityScore: 7, impressions: 5400, clicks: 270, ctr: 5.0, conversions: 5, cpa: 26.20, roas: 2.9,
    spend: 131.00, avgPosition: 2.2, serviceId: 'wellness', landingPage: '/services/wellness-injections',
  },
  {
    id: 'kw_009', term: 'peptide therapy near me', matchType: 'exact', category: 'peptides', status: 'active',
    intentType: 'transactional', intentScore: 8, estimatedCPC: 11.30, monthlyVolume: 1800, competition: 'medium',
    qualityScore: 7, impressions: 3200, clicks: 160, ctr: 5.0, conversions: 3, cpa: 52.10, roas: 3.4,
    spend: 156.30, avgPosition: 2.5, serviceId: 'peptides', landingPage: '/services/peptide-therapy',
  },
  {
    id: 'kw_010', term: 'medspa renton', matchType: 'exact', category: 'geo', status: 'active',
    intentType: 'navigational', intentScore: 7, estimatedCPC: 7.80, monthlyVolume: 720, competition: 'high',
    qualityScore: 8, impressions: 1400, clicks: 112, ctr: 8.0, conversions: 4, cpa: 38.40, roas: 3.2,
    spend: 153.60, avgPosition: 1.5, landingPage: '/',
  },
  {
    id: 'kw_011', term: 'rani beauty clinic', matchType: 'exact', category: 'brand', status: 'active',
    intentType: 'navigational', intentScore: 10, estimatedCPC: 2.10, monthlyVolume: 280, competition: 'low',
    qualityScore: 10, impressions: 520, clicks: 312, ctr: 60.0, conversions: 12, cpa: 4.20, roas: 18.5,
    spend: 50.40, avgPosition: 1.0, landingPage: '/',
  },
  {
    id: 'kw_012', term: 'semaglutide cost', matchType: 'phrase', category: 'glp1', status: 'active',
    intentType: 'commercial', intentScore: 7, estimatedCPC: 12.60, monthlyVolume: 8100, competition: 'high',
    qualityScore: 6, impressions: 14200, clicks: 568, ctr: 4.0, conversions: 5, cpa: 68.40, roas: 2.2,
    spend: 342.00, avgPosition: 3.4, serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss',
  },
  {
    id: 'kw_013', term: 'weight loss injections', matchType: 'broad', category: 'glp1', status: 'paused',
    intentType: 'informational', intentScore: 5, estimatedCPC: 14.80, monthlyVolume: 12000, competition: 'high',
    qualityScore: 5, impressions: 28000, clicks: 840, ctr: 3.0, conversions: 4, cpa: 92.50, roas: 1.4,
    spend: 370.00, avgPosition: 4.2, serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss',
  },
  {
    id: 'kw_014', term: 'laser hair removal bellevue', matchType: 'exact', category: 'geo', status: 'suggested',
    intentType: 'transactional', intentScore: 8, estimatedCPC: 9.40, monthlyVolume: 590, competition: 'medium',
    qualityScore: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, cpa: 0, roas: 0,
    spend: 0, avgPosition: 0, serviceId: 'laser_hair', landingPage: '/services/laser-hair-removal',
  },
  {
    id: 'kw_015', term: 'ozempic alternative near me', matchType: 'exact', category: 'competitor', status: 'competitor_gap',
    intentType: 'transactional', intentScore: 9, estimatedCPC: 16.20, monthlyVolume: 3400, competition: 'high',
    qualityScore: 0, impressions: 0, clicks: 0, ctr: 0, conversions: 0, cpa: 0, roas: 0,
    spend: 0, avgPosition: 0, serviceId: 'glp1', landingPage: '/services/glp-1-weight-loss',
  },
];

const MOCK_NEGATIVES: NegativeKeyword[] = [
  { id: 'neg_001', term: 'free', matchType: 'broad', reason: 'Attracts low-quality traffic', dateAdded: '2026-02-15' },
  { id: 'neg_002', term: 'cheap', matchType: 'broad', reason: 'Misaligned with luxury brand', dateAdded: '2026-02-15' },
  { id: 'neg_003', term: 'diy', matchType: 'broad', reason: 'Not service-seeking intent', dateAdded: '2026-02-15' },
  { id: 'neg_004', term: 'at home', matchType: 'phrase', reason: 'Not clinic visitors', dateAdded: '2026-02-15' },
  { id: 'neg_005', term: 'side effects lawsuit', matchType: 'phrase', reason: 'Legal intent, not purchase', dateAdded: '2026-02-20' },
  { id: 'neg_006', term: 'training course', matchType: 'phrase', reason: 'Provider training, not patients', dateAdded: '2026-02-20' },
  { id: 'neg_007', term: 'jobs hiring', matchType: 'phrase', reason: 'Employment searches', dateAdded: '2026-02-20' },
  { id: 'neg_008', term: 'salary', matchType: 'broad', reason: 'Employment searches', dateAdded: '2026-02-20' },
  { id: 'neg_009', term: 'reddit', matchType: 'broad', reason: 'Research intent, not purchase', dateAdded: '2026-03-01' },
  { id: 'neg_010', term: 'infusion', matchType: 'exact', reason: 'Rani does INJECTIONS only - critical brand rule', dateAdded: '2026-01-15' },
];

const MOCK_GAPS: KeywordGap[] = [
  { term: 'ozempic alternative near me', estimatedVolume: 3400, estimatedCPC: 16.20, competitorUsing: 'Seattle Weight Loss', opportunity: 'high' },
  { term: 'non surgical face lift renton', estimatedVolume: 210, estimatedCPC: 11.50, competitorUsing: 'Skinlogic Med Spa', opportunity: 'high' },
  { term: 'nad injection seattle', estimatedVolume: 480, estimatedCPC: 8.90, competitorUsing: 'The Wellness Drip', opportunity: 'medium' },
  { term: 'microneedling renton wa', estimatedVolume: 320, estimatedCPC: 7.40, competitorUsing: 'Skinlogic Med Spa', opportunity: 'medium' },
  { term: 'glp-1 weight loss bellevue', estimatedVolume: 440, estimatedCPC: 15.80, competitorUsing: 'Eastside Weight Loss', opportunity: 'high' },
];

// ── HELPERS ──

const formatNumber = (n: number) => n.toLocaleString();
const formatCurrency = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatPercent = (n: number) => `${n.toFixed(1)}%`;

const matchTypeColors: Record<MatchType, { label: string; color: string; bg: string }> = {
  exact: { label: '[exact]', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  phrase: { label: '"phrase"', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  broad: { label: 'broad', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
};

const statusColors: Record<KeywordStatus, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  paused: { label: 'Paused', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  negative: { label: 'Negative', color: 'text-red-400', bg: 'bg-red-400/10' },
  suggested: { label: 'Suggested', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  competitor_gap: { label: 'Gap', color: 'text-purple-400', bg: 'bg-purple-400/10' },
};

const competitionColors: Record<CompetitionLevel, string> = {
  low: 'text-emerald-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

const categoryLabels: Record<CategoryFilter, string> = {
  all: 'All Categories',
  glp1: 'GLP-1 / Weight Loss',
  aesthetics: 'Aesthetics',
  wellness: 'Wellness',
  peptides: 'Peptides',
  geo: 'Geo / Local',
  brand: 'Brand',
  competitor: 'Competitor',
};

const qsColor = (qs: number) => qs >= 8 ? 'text-emerald-400' : qs >= 6 ? 'text-yellow-400' : qs >= 1 ? 'text-red-400' : 'text-gray-500';

// ── COMPONENT ──

export default function KeywordsPage() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<KeywordStatus | 'all'>('all');
  const [matchFilter, setMatchFilter] = useState<MatchType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'conversions' | 'ctr' | 'cpa' | 'roas' | 'spend' | 'qualityScore' | 'monthlyVolume'>('conversions');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showNegatives, setShowNegatives] = useState(false);
  const [showGaps, setShowGaps] = useState(false);

  const filteredKeywords = useMemo(() => {
    let result = [...MOCK_KEYWORDS];

    if (categoryFilter !== 'all') {
      result = result.filter(k => k.category === categoryFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(k => k.status === statusFilter);
    }
    if (matchFilter !== 'all') {
      result = result.filter(k => k.matchType === matchFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(k => k.term.toLowerCase().includes(q));
    }

    result.sort((a, b) => {
      const mult = sortDir === 'desc' ? -1 : 1;
      return (a[sortBy] - b[sortBy]) * mult;
    });

    return result;
  }, [categoryFilter, statusFilter, matchFilter, searchQuery, sortBy, sortDir]);

  const overview = MOCK_OVERVIEW;

  const fadeIn = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06 } }),
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: typeof sortBy }) => {
    if (sortBy !== field) return <ArrowUp className="w-3 h-3 text-gray-600" />;
    return sortDir === 'desc'
      ? <ArrowDown className="w-3 h-3 text-[#C9A96E]" />
      : <ArrowUp className="w-3 h-3 text-[#C9A96E]" />;
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
              <Key className="w-7 h-7 text-[#C9A96E]" />
              Keyword Command Center
            </h1>
            <p className="text-gray-400 mt-1">Manage keywords, track performance, and find competitor gaps</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNegatives(!showNegatives)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors ${
                showNegatives ? 'bg-red-400/10 text-red-400 border-red-400/20' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
              }`}
            >
              <Ban className="w-4 h-4" />
              Negatives ({MOCK_NEGATIVES.length})
            </button>
            <button
              onClick={() => setShowGaps(!showGaps)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors ${
                showGaps ? 'bg-purple-400/10 text-purple-400 border-purple-400/20' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
              }`}
            >
              <Crosshair className="w-4 h-4" />
              Gaps ({MOCK_GAPS.length})
            </button>
            <button className="px-4 py-2 bg-[#C9A96E] text-[#0F1D2C] rounded-lg hover:bg-[#C9A96E]/90 transition-colors flex items-center gap-2 text-sm font-bold">
              <Plus className="w-4 h-4" />
              Add Keywords
            </button>
          </div>
        </motion.div>

        {/* ── KPI ROW ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Active Keywords', value: overview.activeKeywords.toString(), sub: `${overview.totalKeywords} total`, icon: Key, color: '#C9A96E' },
            { label: 'Avg Quality Score', value: `${overview.avgQualityScore}/10`, sub: 'Above average', icon: Star, color: '#34D399' },
            { label: 'Avg CPC', value: formatCurrency(overview.avgCPC), sub: 'Across all keywords', icon: DollarSign, color: '#60A5FA' },
            { label: 'Avg CTR', value: formatPercent(overview.avgCTR), sub: 'Search network', icon: MousePointer, color: '#FBBF24' },
            { label: 'Total Conversions', value: overview.totalConversions.toString(), sub: formatCurrency(overview.avgCPA) + ' avg CPA', icon: Target, color: '#A78BFA' },
            { label: 'Competitor Gaps', value: overview.competitorGaps.toString(), sub: `${overview.suggestedKeywords} suggested`, icon: Crosshair, color: '#F87171' },
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
                placeholder="Search keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#C9A96E]/40"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#C9A96E]/40"
            >
              {Object.entries(categoryLabels).map(([val, label]) => (
                <option key={val} value={val} className="bg-[#0F1D2C]">{label}</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as KeywordStatus | 'all')}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#C9A96E]/40"
            >
              <option value="all" className="bg-[#0F1D2C]">All Status</option>
              {Object.entries(statusColors).map(([val, cfg]) => (
                <option key={val} value={val} className="bg-[#0F1D2C]">{cfg.label}</option>
              ))}
            </select>

            <select
              value={matchFilter}
              onChange={(e) => setMatchFilter(e.target.value as MatchType | 'all')}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#C9A96E]/40"
            >
              <option value="all" className="bg-[#0F1D2C]">All Match Types</option>
              <option value="exact" className="bg-[#0F1D2C]">[Exact]</option>
              <option value="phrase" className="bg-[#0F1D2C]">&quot;Phrase&quot;</option>
              <option value="broad" className="bg-[#0F1D2C]">Broad</option>
            </select>
          </div>
        </motion.div>

        {/* ── KEYWORD TABLE ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0F1D2C]/60 border border-white/5 rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs text-gray-500 uppercase tracking-wide px-4 py-3 font-medium">Keyword</th>
                  <th className="text-center text-xs text-gray-500 uppercase tracking-wide px-3 py-3 font-medium">Match</th>
                  <th className="text-center text-xs text-gray-500 uppercase tracking-wide px-3 py-3 font-medium">Status</th>
                  <th className="text-center text-xs text-gray-500 uppercase tracking-wide px-3 py-3 font-medium cursor-pointer" onClick={() => toggleSort('qualityScore')}>
                    <span className="flex items-center justify-center gap-1">QS <SortIcon field="qualityScore" /></span>
                  </th>
                  <th className="text-right text-xs text-gray-500 uppercase tracking-wide px-3 py-3 font-medium cursor-pointer" onClick={() => toggleSort('monthlyVolume')}>
                    <span className="flex items-center justify-end gap-1">Volume <SortIcon field="monthlyVolume" /></span>
                  </th>
                  <th className="text-right text-xs text-gray-500 uppercase tracking-wide px-3 py-3 font-medium cursor-pointer" onClick={() => toggleSort('ctr')}>
                    <span className="flex items-center justify-end gap-1">CTR <SortIcon field="ctr" /></span>
                  </th>
                  <th className="text-right text-xs text-gray-500 uppercase tracking-wide px-3 py-3 font-medium cursor-pointer" onClick={() => toggleSort('conversions')}>
                    <span className="flex items-center justify-end gap-1">Conv <SortIcon field="conversions" /></span>
                  </th>
                  <th className="text-right text-xs text-gray-500 uppercase tracking-wide px-3 py-3 font-medium cursor-pointer" onClick={() => toggleSort('cpa')}>
                    <span className="flex items-center justify-end gap-1">CPA <SortIcon field="cpa" /></span>
                  </th>
                  <th className="text-right text-xs text-gray-500 uppercase tracking-wide px-3 py-3 font-medium cursor-pointer" onClick={() => toggleSort('roas')}>
                    <span className="flex items-center justify-end gap-1">ROAS <SortIcon field="roas" /></span>
                  </th>
                  <th className="text-right text-xs text-gray-500 uppercase tracking-wide px-3 py-3 font-medium cursor-pointer" onClick={() => toggleSort('spend')}>
                    <span className="flex items-center justify-end gap-1">Spend <SortIcon field="spend" /></span>
                  </th>
                  <th className="text-center text-xs text-gray-500 uppercase tracking-wide px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredKeywords.map((kw) => {
                  const mt = matchTypeColors[kw.matchType];
                  const st = statusColors[kw.status];

                  return (
                    <tr key={kw.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{kw.term}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-2">
                          <span className={`${kw.intentScore >= 8 ? 'text-emerald-400' : kw.intentScore >= 5 ? 'text-yellow-400' : 'text-gray-400'}`}>
                            Intent: {kw.intentScore}/10
                          </span>
                          <span>{competitionColors[kw.competition] === 'text-red-400' ? 'High' : kw.competition === 'medium' ? 'Med' : 'Low'} comp</span>
                          {kw.avgPosition > 0 && <span>Pos: {kw.avgPosition.toFixed(1)}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded ${mt.bg} ${mt.color}`}>{mt.label}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${st.bg} ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-sm font-semibold ${qsColor(kw.qualityScore)}`}>
                          {kw.qualityScore > 0 ? kw.qualityScore : '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-gray-300">{kw.monthlyVolume > 0 ? formatNumber(kw.monthlyVolume) : '-'}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={kw.ctr >= 5 ? 'text-emerald-400' : kw.ctr >= 3 ? 'text-gray-300' : 'text-red-400'}>
                          {kw.ctr > 0 ? formatPercent(kw.ctr) : '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-medium text-white">{kw.conversions > 0 ? kw.conversions : '-'}</td>
                      <td className="px-3 py-3 text-right">
                        <span className={kw.cpa > 0 ? (kw.cpa <= 40 ? 'text-emerald-400' : kw.cpa <= 55 ? 'text-yellow-400' : 'text-red-400') : 'text-gray-500'}>
                          {kw.cpa > 0 ? formatCurrency(kw.cpa) : '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className={kw.roas > 0 ? (kw.roas >= 3 ? 'text-emerald-400' : kw.roas >= 2 ? 'text-yellow-400' : 'text-red-400') : 'text-gray-500'}>
                          {kw.roas > 0 ? `${kw.roas.toFixed(1)}x` : '-'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-gray-300">{kw.spend > 0 ? formatCurrency(kw.spend) : '-'}</td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {kw.status === 'active' && (
                            <button className="p-1 rounded hover:bg-yellow-400/10 text-gray-500 hover:text-yellow-400 transition-colors" title="Pause">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {kw.status === 'paused' && (
                            <button className="p-1 rounded hover:bg-emerald-400/10 text-gray-500 hover:text-emerald-400 transition-colors" title="Activate">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {(kw.status === 'suggested' || kw.status === 'competitor_gap') && (
                            <button className="p-1 rounded hover:bg-emerald-400/10 text-gray-500 hover:text-emerald-400 transition-colors" title="Add">
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button className="p-1 rounded hover:bg-red-400/10 text-gray-500 hover:text-red-400 transition-colors" title="Add to negatives">
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredKeywords.length === 0 && (
            <div className="p-8 text-center">
              <DashboardEmptyState
                icon={<Key className="w-12 h-12 text-gray-600" />}
                title="No keywords match your filters"
                description="Try adjusting your search or filter criteria."
              />
            </div>
          )}
        </motion.div>

        {/* ── NEGATIVE KEYWORDS PANEL ── */}
        <AnimatePresence>
          {showNegatives && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#0F1D2C]/60 border border-red-400/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Ban className="w-5 h-5 text-red-400" />
                    Negative Keywords
                  </h2>
                  <button className="px-3 py-1.5 text-xs bg-red-400/10 text-red-400 rounded-lg border border-red-400/20 hover:bg-red-400/20 transition-colors flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    Add Negative
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {MOCK_NEGATIVES.map((neg) => (
                    <div key={neg.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${matchTypeColors[neg.matchType].bg} ${matchTypeColors[neg.matchType].color}`}>
                          {matchTypeColors[neg.matchType].label}
                        </span>
                        <span className="text-sm text-white">{neg.term}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">{neg.reason}</span>
                        <button className="p-1 rounded hover:bg-red-400/10 text-gray-500 hover:text-red-400 transition-colors" title="Remove">
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── COMPETITOR GAPS PANEL ── */}
        <AnimatePresence>
          {showGaps && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#0F1D2C]/60 border border-purple-400/20 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Crosshair className="w-5 h-5 text-purple-400" />
                    Competitor Keyword Gaps
                  </h2>
                  <span className="text-xs text-gray-500">Keywords competitors bid on that you don&apos;t</span>
                </div>

                <div className="space-y-2">
                  {MOCK_GAPS.map((gap, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{gap.term}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            gap.opportunity === 'high' ? 'bg-emerald-400/10 text-emerald-400' :
                            gap.opportunity === 'medium' ? 'bg-yellow-400/10 text-yellow-400' :
                            'bg-gray-400/10 text-gray-400'
                          }`}>
                            {gap.opportunity} opportunity
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                          <span>{formatNumber(gap.estimatedVolume)} vol/mo</span>
                          <span>~{formatCurrency(gap.estimatedCPC)} CPC</span>
                          <span>Used by: {gap.competitorUsing}</span>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 text-xs bg-purple-400/10 text-purple-400 rounded-lg border border-purple-400/20 hover:bg-purple-400/20 transition-colors flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        Add Keyword
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BID RECOMMENDATIONS ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#C9A96E]" />
            Bid Recommendations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Increase Bids',
                description: 'High-performing keywords with room to scale',
                color: 'emerald',
                keywords: MOCK_KEYWORDS.filter(k => k.roas >= 4 && k.avgPosition > 1.5).slice(0, 3),
                action: 'Position too low for ROAS potential',
              },
              {
                title: 'Decrease Bids',
                description: 'Keywords with poor CPA or low quality score',
                color: 'yellow',
                keywords: MOCK_KEYWORDS.filter(k => k.cpa > 55 || k.qualityScore < 6).slice(0, 3),
                action: 'CPA too high or quality score too low',
              },
              {
                title: 'Pause Candidates',
                description: 'Keywords burning budget without converting',
                color: 'red',
                keywords: MOCK_KEYWORDS.filter(k => k.status === 'paused' || (k.cpa > 80 && k.conversions <= 4)).slice(0, 3),
                action: 'High spend, minimal conversions',
              },
            ].map((group) => (
              <div key={group.title} className="bg-[#0F1D2C]/60 border border-white/5 rounded-xl p-4">
                <h3 className={`text-sm font-semibold text-${group.color}-400 mb-1`}>{group.title}</h3>
                <p className="text-[10px] text-gray-500 mb-3">{group.description}</p>
                <div className="space-y-2">
                  {group.keywords.map(kw => (
                    <div key={kw.id} className="bg-white/5 rounded-lg px-3 py-2">
                      <div className="text-xs font-medium text-white">{kw.term}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        CPA: {kw.cpa > 0 ? formatCurrency(kw.cpa) : 'N/A'} | ROAS: {kw.roas > 0 ? `${kw.roas.toFixed(1)}x` : 'N/A'} | QS: {kw.qualityScore > 0 ? kw.qualityScore : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-2 italic">{group.action}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardErrorBoundary>
  );
}
