'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  ChevronRight,
  LayoutGrid,
  List,
  Search,
  Zap,
  Target,
  Award,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMastermindSessions } from '@/hooks/useMastermindSessions';
import NewConsultationModal from '@/components/dashboard/mastermind/NewConsultationModal';
import type { MastermindPhase, MastermindSession } from '@/types/mastermind';

// ── PHASE CONFIG ──

const PHASE_CONFIG: Record<MastermindPhase, { label: string; color: string; bg: string; icon: typeof Sparkles }> = {
  intake: { label: 'Intake', color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)', icon: Clock },
  scanning: { label: 'Scanning', color: '#C9A96E', bg: 'rgba(201,169,110,0.15)', icon: Loader2 },
  scan_complete: { label: 'Scan Complete', color: '#C9A96E', bg: 'rgba(201,169,110,0.15)', icon: Sparkles },
  generating_plan: { label: 'Generating Plan', color: '#C9A96E', bg: 'rgba(201,169,110,0.15)', icon: Loader2 },
  plan_ready: { label: 'Plan Ready', color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', icon: Sparkles },
  provider_review: { label: 'In Review', color: '#D97706', bg: 'rgba(217,119,6,0.15)', icon: AlertCircle },
  approved: { label: 'Approved', color: '#059669', bg: 'rgba(5,150,105,0.15)', icon: CheckCircle2 },
  simulating: { label: 'Simulating', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)', icon: Loader2 },
  simulation_ready: { label: 'Simulation Ready', color: '#059669', bg: 'rgba(5,150,105,0.15)', icon: Sparkles },
  presenting: { label: 'Presenting', color: '#7C3AED', bg: 'rgba(124,58,237,0.15)', icon: Sparkles },
  completed: { label: 'Completed', color: '#059669', bg: 'rgba(5,150,105,0.15)', icon: CheckCircle2 },
};

const ACTIVE_PHASES: MastermindPhase[] = [
  'intake', 'scanning', 'scan_complete', 'generating_plan',
  'plan_ready', 'provider_review', 'approved', 'simulating',
  'simulation_ready', 'presenting',
];

// ── PACKAGE PRICES ──

const PACKAGE_PRICES: Record<string, number> = {
  Start: 1800,
  Transform: 4200,
  Elite: 7500,
};

// ── ANIMATED COUNTER ──

function AnimatedCounter({ value, prefix = '', suffix = '', duration = 1.5 }: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <span>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

// ── AURA SCORE GAUGE ──

function AuraScoreGauge({ score, size = 48 }: { score: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 80 ? '#059669' : score >= 60 ? '#C9A96E' : score >= 40 ? '#D97706' : '#EF4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(201,169,110,0.1)"
          strokeWidth={3}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-[family-name:var(--font-heading)] text-sm font-bold text-white">
          {score}
        </span>
      </div>
    </div>
  );
}

// ── TIME AGO HELPER ──

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── FLOATING PARTICLES ──

function FloatingParticles({ count = 20 }: { count?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 3 + 1,
            height: Math.random() * 3 + 1,
            background: `rgba(201, 169, 110, ${Math.random() * 0.3 + 0.1})`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30 - Math.random() * 40, 0],
            x: [0, (Math.random() - 0.5) * 20, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ── STAGGER ANIMATION VARIANTS ──

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ── MAIN PAGE ──

export default function MastermindQueuePage() {
  const { sessions, isLoading, mutate } = useMastermindSessions();
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleCreated = useCallback((sessionId: string) => {
    setShowNewModal(false);
    mutate();
    router.push(`/dashboard/mastermind/${sessionId}`);
  }, [mutate, router]);

  // ── Computed Stats ──

  const stats = useMemo(() => {
    const total = sessions.length;
    const active = sessions.filter(s => ACTIVE_PHASES.includes(s.phase)).length;
    const completed = sessions.filter(s => s.phase === 'completed').length;
    const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const revenue = sessions.reduce((sum, s) => {
      if (s.selectedPackageTier && PACKAGE_PRICES[s.selectedPackageTier]) {
        return sum + PACKAGE_PRICES[s.selectedPackageTier];
      }
      return sum;
    }, 0);

    return { total, active, completed, conversionRate, revenue };
  }, [sessions]);

  // ── Insights ──

  const insights = useMemo(() => {
    // Most common concern
    const concernCount: Record<string, number> = {};
    sessions.forEach(s => {
      s.auraScanResult?.detectedConcerns?.forEach(c => {
        const name = c.concern || c.id;
        concernCount[name] = (concernCount[name] || 0) + 1;
      });
    });
    const topConcernEntry = Object.entries(concernCount).sort((a, b) => b[1] - a[1])[0];
    const topConcern = topConcernEntry ? topConcernEntry[0] : null;

    // Average Aura Score
    const scores = sessions
      .map(s => s.auraScanResult?.auraScore?.overall)
      .filter((n): n is number => typeof n === 'number');
    const avgAura = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    // Top package tier
    const tierCount: Record<string, number> = {};
    sessions.forEach(s => {
      if (s.selectedPackageTier) {
        tierCount[s.selectedPackageTier] = (tierCount[s.selectedPackageTier] || 0) + 1;
      }
    });
    const topTierEntry = Object.entries(tierCount).sort((a, b) => b[1] - a[1])[0];
    const topPackage = topTierEntry ? topTierEntry[0] : null;

    // Average duration (created → completed)
    const completedSessions = sessions.filter(s => s.phase === 'completed');
    const durations = completedSessions.map(s => {
      const start = new Date(s.createdAt).getTime();
      const end = new Date(s.updatedAt).getTime();
      return end - start;
    }).filter(d => d > 0);
    const avgDurationMs = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null;
    let avgDuration: string | null = null;
    if (avgDurationMs) {
      const mins = Math.round(avgDurationMs / 60000);
      if (mins < 60) avgDuration = `${mins}m`;
      else if (mins < 1440) avgDuration = `${Math.round(mins / 60)}h`;
      else avgDuration = `${Math.round(mins / 1440)}d`;
    }

    return { topConcern, avgAura, topPackage, avgDuration };
  }, [sessions]);

  // ── Filtered Sessions ──

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(s =>
      (s.patientName || '').toLowerCase().includes(q) ||
      (s.patientEmail || '').toLowerCase().includes(q) ||
      PHASE_CONFIG[s.phase]?.label.toLowerCase().includes(q)
    );
  }, [sessions, searchQuery]);

  // ── RENDER ──

  return (
    <div className="min-h-screen bg-[#0A1628] relative overflow-hidden">
      {/* Global background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(201,169,110,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(201,169,110,0.04)_0%,transparent_50%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[radial-gradient(ellipse,rgba(201,169,110,0.06)_0%,transparent_70%)]" />
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .mastermind-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .mastermind-scroll::-webkit-scrollbar-track {
          background: rgba(15, 29, 44, 0.3);
          border-radius: 3px;
        }
        .mastermind-scroll::-webkit-scrollbar-thumb {
          background: rgba(201, 169, 110, 0.3);
          border-radius: 3px;
        }
        .mastermind-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(201, 169, 110, 0.5);
        }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        @keyframes pulse-gold {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201, 169, 110, 0.4); }
          50% { box-shadow: 0 0 20px 4px rgba(201, 169, 110, 0.15); }
        }

        .gold-shimmer-text {
          background: linear-gradient(
            90deg,
            #C9A96E 0%,
            #E8D5A8 25%,
            #F5E6C8 50%,
            #E8D5A8 75%,
            #C9A96E 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }

        .pulse-gold-btn {
          animation: pulse-gold 2.5s ease-in-out infinite;
        }

        .glass-card {
          background: rgba(15, 29, 44, 0.5);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(201, 169, 110, 0.1);
        }

        .glass-card-hover:hover {
          border-color: rgba(201, 169, 110, 0.3);
          box-shadow: 0 8px 32px rgba(201, 169, 110, 0.08), 0 0 0 1px rgba(201, 169, 110, 0.15);
        }

        .stat-glass {
          background: rgba(15, 29, 44, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(201, 169, 110, 0.08);
        }
      `}</style>

      <NewConsultationModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={handleCreated}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 mastermind-scroll">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* ━━━━━━━━━━━━ HEADER ━━━━━━━━━━━━ */}
          <motion.div variants={itemVariants} className="relative">
            <div className="relative rounded-3xl overflow-hidden">
              {/* Header background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0C1829] via-[#0F1D2C] to-[#142238]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(201,169,110,0.1)_0%,transparent_50%)]" />
              <FloatingParticles count={15} />

              <div className="relative px-6 sm:px-10 py-8 sm:py-10">
                {/* Title row */}
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C9A96E] to-[#A68B4B] flex items-center justify-center shadow-lg shadow-[#C9A96E]/20">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-[#C9A96E]/40 to-transparent" />
                    </div>
                    <h1 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl gold-shimmer-text mb-1">
                      AI Mastermind
                    </h1>
                    <p className="font-body text-sm text-white/40 tracking-wide uppercase">
                      Your AI-Powered Consultation Engine
                    </p>
                  </div>

                  <motion.button
                    onClick={() => setShowNewModal(true)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="pulse-gold-btn flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#C9A96E] to-[#B8944F] text-white font-body text-sm font-semibold shadow-lg shadow-[#C9A96E]/20 transition-all self-start sm:self-auto"
                  >
                    <Plus className="w-5 h-5" />
                    New Consultation
                  </motion.button>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { icon: Users, label: 'Total Consultations', value: stats.total, prefix: '', suffix: '' },
                    { icon: Activity, label: 'Active', value: stats.active, prefix: '', suffix: '' },
                    { icon: CheckCircle2, label: 'Completed', value: stats.completed, prefix: '', suffix: '' },
                    { icon: TrendingUp, label: 'Conversion Rate', value: stats.conversionRate, prefix: '', suffix: '%' },
                    { icon: DollarSign, label: 'Revenue Generated', value: stats.revenue, prefix: '$', suffix: '' },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        variants={itemVariants}
                        className="stat-glass rounded-2xl p-4 group hover:border-[#C9A96E]/20 transition-all duration-300"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center">
                            <Icon className="w-3.5 h-3.5 text-[#C9A96E]" />
                          </div>
                        </div>
                        <p className="font-[family-name:var(--font-heading)] text-2xl text-white mb-0.5">
                          <AnimatedCounter
                            value={stat.value}
                            prefix={stat.prefix}
                            suffix={stat.suffix}
                            duration={1.2 + i * 0.15}
                          />
                        </p>
                        <p className="font-body text-[10px] text-white/35 uppercase tracking-wider">
                          {stat.label}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ━━━━━━━━━━━━ TOOLBAR ━━━━━━━━━━━━ */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type="text"
                placeholder="Search patients, phases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/80 placeholder:text-white/20 font-body text-sm focus:outline-none focus:border-[#C9A96E]/30 focus:ring-1 focus:ring-[#C9A96E]/20 transition-all"
              />
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#C9A96E]/20 text-[#C9A96E]'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-[#C9A96E]/20 text-[#C9A96E]'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>
          </motion.div>

          {/* ━━━━━━━━━━━━ SESSION CONTENT ━━━━━━━━━━━━ */}
          {isLoading ? (
            <LoadingSkeleton viewMode={viewMode} />
          ) : filteredSessions.length === 0 && sessions.length === 0 ? (
            <EmptyState onStart={() => setShowNewModal(true)} />
          ) : filteredSessions.length === 0 ? (
            <motion.div variants={itemVariants} className="glass-card rounded-2xl p-12 text-center">
              <Search className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <p className="font-body text-sm text-white/40">
                No sessions match &ldquo;{searchQuery}&rdquo;
              </p>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <GridView sessions={filteredSessions} />
          ) : (
            <ListView sessions={filteredSessions} />
          )}

          {/* ━━━━━━━━━━━━ QUICK INSIGHTS ━━━━━━━━━━━━ */}
          {sessions.length > 0 && (
            <motion.div variants={itemVariants}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-[#C9A96E]/60" />
                <h2 className="font-body text-xs text-white/30 uppercase tracking-widest">
                  Quick Insights
                </h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Most Common Concern */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="w-8 h-8 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center mb-3">
                    <Target className="w-4 h-4 text-[#C9A96E]" />
                  </div>
                  <p className="font-body text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
                    Top Concern
                  </p>
                  {insights.topConcern ? (
                    <span className="inline-block px-3 py-1 rounded-full bg-[#C9A96E]/10 border border-[#C9A96E]/20 font-body text-xs text-[#C9A96E] capitalize">
                      {insights.topConcern.replace(/-/g, ' ')}
                    </span>
                  ) : (
                    <span className="font-body text-xs text-white/20">No data yet</span>
                  )}
                </div>

                {/* Average Aura Score */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="w-8 h-8 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center mb-3">
                    <Sparkles className="w-4 h-4 text-[#C9A96E]" />
                  </div>
                  <p className="font-body text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
                    Avg Aura Score
                  </p>
                  {insights.avgAura !== null ? (
                    <div className="flex items-center gap-2">
                      <AuraScoreGauge score={insights.avgAura} size={36} />
                      <span className="font-[family-name:var(--font-heading)] text-lg text-white">
                        {insights.avgAura}
                      </span>
                    </div>
                  ) : (
                    <span className="font-body text-xs text-white/20">No scans yet</span>
                  )}
                </div>

                {/* Top Package */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="w-8 h-8 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center mb-3">
                    <Award className="w-4 h-4 text-[#C9A96E]" />
                  </div>
                  <p className="font-body text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
                    Top Package
                  </p>
                  {insights.topPackage ? (
                    <span className="font-[family-name:var(--font-heading)] text-lg text-white">
                      {insights.topPackage}
                    </span>
                  ) : (
                    <span className="font-body text-xs text-white/20">No selections yet</span>
                  )}
                </div>

                {/* Avg Duration */}
                <div className="glass-card rounded-2xl p-5">
                  <div className="w-8 h-8 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center mb-3">
                    <Clock className="w-4 h-4 text-[#C9A96E]" />
                  </div>
                  <p className="font-body text-[10px] text-white/30 uppercase tracking-wider mb-1.5">
                    Avg Session Duration
                  </p>
                  {insights.avgDuration ? (
                    <span className="font-[family-name:var(--font-heading)] text-lg text-white">
                      {insights.avgDuration}
                    </span>
                  ) : (
                    <span className="font-body text-xs text-white/20">No completed</span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GRID VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function GridView({ sessions }: { sessions: MastermindSession[] }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      {sessions.map((session) => (
        <GridCard key={session.id} session={session} />
      ))}
    </motion.div>
  );
}

function GridCard({ session }: { session: MastermindSession }) {
  const phaseConfig = PHASE_CONFIG[session.phase] || PHASE_CONFIG.intake;
  const PhaseIcon = phaseConfig.icon;
  const auraScore = session.auraScanResult?.auraScore;
  const concerns = session.auraScanResult?.detectedConcerns?.slice(0, 3) || [];
  const treatments = session.mastermindPlan?.recommendations;
  const treatmentCount = treatments
    ? (treatments.primary?.length || 0) + (treatments.complementary?.length || 0) + (treatments.maintenance?.length || 0)
    : 0;

  return (
    <motion.div variants={itemVariants} initial="rest" whileHover="hover" animate="rest">
      <motion.div variants={cardHover}>
        <Link
          href={`/dashboard/mastermind/${session.id}`}
          className="block glass-card glass-card-hover rounded-2xl p-5 transition-all duration-300 group"
        >
          {/* Top: Name + Phase */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 mr-3">
              <h3 className="font-[family-name:var(--font-heading)] text-lg text-white truncate">
                {session.patientName || 'Unnamed Patient'}
              </h3>
              <p className="font-body text-xs text-white/30 mt-0.5">
                {timeAgo(session.createdAt)}
              </p>
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full shrink-0"
              style={{ backgroundColor: phaseConfig.bg, color: phaseConfig.color }}
            >
              <PhaseIcon className={`w-3 h-3 ${session.phase === 'scanning' || session.phase === 'generating_plan' || session.phase === 'simulating' ? 'animate-spin' : ''}`} />
              <span className="font-body text-[10px] font-semibold uppercase tracking-wide">
                {phaseConfig.label}
              </span>
            </div>
          </div>

          {/* Aura Score */}
          <div className="flex items-center gap-3 mb-4">
            {auraScore ? (
              <>
                <AuraScoreGauge score={auraScore.overall} size={44} />
                <div>
                  <p className="font-body text-[10px] text-white/30 uppercase tracking-wider">Aura Score</p>
                  <p className="font-[family-name:var(--font-heading)] text-sm text-white">
                    {auraScore.overall} <span className="text-[#C9A96E] text-xs">{auraScore.grade}</span>
                  </p>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03]">
                <Sparkles className="w-3.5 h-3.5 text-[#C9A96E]/30" />
                <span className="font-body text-xs text-white/25">Scan Pending</span>
              </div>
            )}
          </div>

          {/* Concerns */}
          {concerns.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {concerns.map((c, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] font-body text-[10px] text-white/40 capitalize"
                >
                  {(c.concern || c.id).replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          )}

          {/* Treatment count + Package */}
          <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-3">
              {treatmentCount > 0 && (
                <span className="font-body text-[10px] text-white/30">
                  <Zap className="w-3 h-3 text-[#C9A96E]/40 inline mr-1" />
                  {treatmentCount} treatments
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {session.selectedPackageTier && (
                <span className="px-2.5 py-1 rounded-lg bg-[#C9A96E]/10 border border-[#C9A96E]/20 font-body text-[10px] font-semibold text-[#C9A96E]">
                  {session.selectedPackageTier} &middot; ${PACKAGE_PRICES[session.selectedPackageTier]?.toLocaleString()}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-white/15 group-hover:text-[#C9A96E]/50 transition-colors" />
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LIST VIEW
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ListView({ sessions }: { sessions: MastermindSession[] }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="glass-card rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="hidden md:grid grid-cols-[2fr_1fr_0.8fr_1.5fr_1fr_1fr_40px] gap-4 px-5 py-3 border-b border-white/[0.04]">
        {['Patient', 'Phase', 'Aura', 'Concerns', 'Package', 'Date', ''].map((h) => (
          <p key={h} className="font-body text-[10px] text-white/25 uppercase tracking-widest">
            {h}
          </p>
        ))}
      </div>

      {/* Rows */}
      {sessions.map((session, i) => (
        <ListRow key={session.id} session={session} index={i} isLast={i === sessions.length - 1} />
      ))}
    </motion.div>
  );
}

function ListRow({ session, index, isLast }: { session: MastermindSession; index: number; isLast: boolean }) {
  const phaseConfig = PHASE_CONFIG[session.phase] || PHASE_CONFIG.intake;
  const PhaseIcon = phaseConfig.icon;
  const auraScore = session.auraScanResult?.auraScore;
  const concerns = session.auraScanResult?.detectedConcerns?.slice(0, 3) || [];

  return (
    <motion.div variants={itemVariants}>
      <Link
        href={`/dashboard/mastermind/${session.id}`}
        className={`grid grid-cols-1 md:grid-cols-[2fr_1fr_0.8fr_1.5fr_1fr_1fr_40px] gap-2 md:gap-4 items-center px-5 py-4 hover:bg-white/[0.02] transition-all group ${
          !isLast ? 'border-b border-white/[0.03]' : ''
        }`}
      >
        {/* Patient */}
        <div className="min-w-0">
          <p className="font-body text-sm font-medium text-white truncate">
            {session.patientName || 'Unnamed Patient'}
          </p>
          <p className="font-body text-xs text-white/25 truncate">{session.patientEmail || 'No email'}</p>
        </div>

        {/* Phase */}
        <div>
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ backgroundColor: phaseConfig.bg, color: phaseConfig.color }}
          >
            <PhaseIcon className={`w-3 h-3 ${session.phase === 'scanning' || session.phase === 'generating_plan' || session.phase === 'simulating' ? 'animate-spin' : ''}`} />
            <span className="font-body text-[10px] font-semibold">{phaseConfig.label}</span>
          </div>
        </div>

        {/* Aura */}
        <div>
          {auraScore ? (
            <div className="flex items-center gap-1.5">
              <AuraScoreGauge score={auraScore.overall} size={28} />
              <span className="font-body text-xs text-white/60">{auraScore.grade}</span>
            </div>
          ) : (
            <span className="font-body text-xs text-white/20">--</span>
          )}
        </div>

        {/* Concerns */}
        <div className="hidden md:flex flex-wrap gap-1">
          {concerns.length > 0 ? concerns.map((c, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full bg-white/[0.04] font-body text-[10px] text-white/35 capitalize"
            >
              {(c.concern || c.id).replace(/-/g, ' ')}
            </span>
          )) : (
            <span className="font-body text-xs text-white/15">--</span>
          )}
        </div>

        {/* Package */}
        <div>
          {session.selectedPackageTier ? (
            <span className="px-2 py-0.5 rounded-lg bg-[#C9A96E]/10 border border-[#C9A96E]/15 font-body text-[10px] font-semibold text-[#C9A96E]">
              {session.selectedPackageTier}
            </span>
          ) : (
            <span className="font-body text-xs text-white/15">--</span>
          )}
        </div>

        {/* Date */}
        <div>
          <span className="font-body text-xs text-white/30">
            {timeAgo(session.createdAt)}
          </span>
        </div>

        {/* Arrow */}
        <div className="hidden md:flex justify-end">
          <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-[#C9A96E]/50 transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LOADING SKELETON
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function LoadingSkeleton({ viewMode }: { viewMode: 'grid' | 'list' }) {
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-5 space-y-4 animate-pulse">
            <div className="flex justify-between">
              <div className="h-5 w-32 rounded-lg bg-white/[0.04]" />
              <div className="h-5 w-20 rounded-full bg-white/[0.04]" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/[0.04]" />
              <div className="space-y-1.5">
                <div className="h-3 w-16 rounded bg-white/[0.04]" />
                <div className="h-4 w-12 rounded bg-white/[0.04]" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="h-5 w-20 rounded-full bg-white/[0.04]" />
              <div className="h-5 w-16 rounded-full bg-white/[0.04]" />
            </div>
            <div className="h-px bg-white/[0.04]" />
            <div className="h-4 w-24 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-white/[0.03] animate-pulse">
          <div className="h-5 w-32 rounded bg-white/[0.04]" />
          <div className="h-5 w-20 rounded-full bg-white/[0.04]" />
          <div className="h-7 w-7 rounded-full bg-white/[0.04]" />
          <div className="flex gap-1.5 flex-1">
            <div className="h-4 w-16 rounded-full bg-white/[0.04]" />
            <div className="h-4 w-20 rounded-full bg-white/[0.04]" />
          </div>
          <div className="h-4 w-16 rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// EMPTY STATE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      variants={itemVariants}
      className="relative glass-card rounded-3xl overflow-hidden"
    >
      <FloatingParticles count={30} />

      <div className="relative z-10 flex flex-col items-center justify-center py-20 px-6 text-center">
        {/* Large gold icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#C9A96E]/20 to-[#C9A96E]/5 border border-[#C9A96E]/15 flex items-center justify-center mb-8 shadow-xl shadow-[#C9A96E]/5"
        >
          <Sparkles className="w-12 h-12 text-[#C9A96E]" />
        </motion.div>

        <h2 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl gold-shimmer-text mb-3">
          Your AI Mastermind Awaits
        </h2>
        <p className="font-body text-sm text-white/35 max-w-md mb-8 leading-relaxed">
          Start your first consultation and watch AI transform your practice.
          Every session delivers personalized treatment intelligence powered by Aura Skin Analysis.
        </p>

        <motion.button
          onClick={onStart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="pulse-gold-btn flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#C9A96E] to-[#B8944F] text-white font-body text-sm font-semibold shadow-xl shadow-[#C9A96E]/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          Start First Consultation
        </motion.button>
      </div>
    </motion.div>
  );
}
