'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, DollarSign, Users, RefreshCw, Heart, Sun,
  ShoppingBag, BarChart3, BookOpen, ArrowRight,
  Clock, AlertTriangle, TrendingUp, Activity,
  ChevronRight, Flame, Target, UserPlus,
} from 'lucide-react';

/**
 * Operations Command Center
 *
 * Grid of command buttons, pipeline visualization, fires section,
 * revenue pulse, and quick action buttons.
 */

// Types
interface FireItem {
  patient: string;
  issue: string;
  urgency: 'critical' | 'high';
  minutes: number;
}

interface PipelineStageData {
  stage: string;
  label: string;
  count: number;
  overdueCount: number;
  monthlyRevenue: number;
}

interface MorningData {
  greeting: string;
  fires: { count: number; items: FireItem[] };
  pipeline: { total: number; byStage: Record<string, number>; mrr: number; overdueCount: number };
  revenuePulse: { mtdRevenue: number; monthlyTarget: number; percentToTarget: number; onTrack: boolean };
  refills: { dueToday: number; dueThisWeek: number; expectedRevenue: number };
  atRisk: { count: number; revenueAtStake: number };
  estimatedTaskTime: { formatted: string; totalMinutes: number };
  topPriorities: { rank: number; title: string; description: string; estimatedMinutes: number; type: string }[];
}

interface PipelineData {
  snapshot: { stages: PipelineStageData[]; mrr: number; totalPatients: number; activePatients: number };
  fires: { count: number; items: FireItem[] };
  moneyMoves: { count: number; totalRevenueOpportunity: number };
  summary: { totalActions: number; estimatedCompletionTime: string; totalRevenueOpportunity: number };
}

// Command definitions
const COMMANDS = [
  { id: 'morning', label: '/morning', description: 'Daily startup briefing', icon: Sun, color: 'from-amber-500 to-orange-500', method: 'GET', path: '/api/ops/morning' },
  { id: 'pipeline', label: '/pipeline', description: 'Full pipeline view', icon: Users, color: 'from-blue-500 to-indigo-500', method: 'GET', path: '/api/ops/pipeline' },
  { id: 'money', label: '/money', description: 'Revenue opportunities', icon: DollarSign, color: 'from-green-500 to-emerald-500', method: 'GET', path: '/api/ops/money' },
  { id: 'refills', label: '/refills', description: 'Refills due soon', icon: RefreshCw, color: 'from-violet-500 to-purple-500', method: 'GET', path: '/api/ops/refills' },
  { id: 'intake', label: '/intake', description: 'Process new patient', icon: UserPlus, color: 'from-cyan-500 to-blue-500', method: 'POST', path: '/api/ops/intake', hasPage: true },
  { id: 'followup', label: '/followup', description: 'Stage-based messages', icon: Heart, color: 'from-pink-500 to-rose-500', method: 'POST', path: '/api/ops/followup' },
  { id: 'winback', label: '/winback', description: 'Re-engage inactive', icon: Target, color: 'from-red-500 to-orange-500', method: 'POST', path: '/api/ops/winback' },
  { id: 'crosssell', label: '/crosssell', description: 'Upsell opportunities', icon: ShoppingBag, color: 'from-teal-500 to-green-500', method: 'POST', path: '/api/ops/crosssell' },
  { id: 'report', label: '/report', description: 'Weekly/monthly reports', icon: BarChart3, color: 'from-slate-500 to-gray-600', method: 'GET', path: '/api/ops/report?type=weekly' },
  { id: 'sop', label: '/sop', description: 'Standard procedures', icon: BookOpen, color: 'from-amber-600 to-yellow-500', method: 'GET', path: '/api/ops/sop' },
];

// Pipeline stage colors
const STAGE_COLORS: Record<string, string> = {
  PIPELINE_NEW: 'bg-blue-500',
  LABS_NEEDED: 'bg-indigo-500',
  GFE_PENDING: 'bg-violet-500',
  RX_APPROVED: 'bg-green-500',
  MED_SHIPPED: 'bg-teal-500',
  ACTIVE_FIRST_DOSE: 'bg-emerald-500',
  ACTIVE_WEEK_1: 'bg-emerald-400',
  ACTIVE_WEEK_2_3: 'bg-emerald-300',
  ACTIVE_MONTH_1: 'bg-green-400',
  REFILL_DUE: 'bg-amber-500',
  AT_RISK: 'bg-red-500',
  WIN_BACK: 'bg-red-400',
};

const STAGE_SHORT_LABELS: Record<string, string> = {
  PIPELINE_NEW: 'New',
  LABS_NEEDED: 'Labs',
  GFE_PENDING: 'GFE',
  RX_APPROVED: 'Rx OK',
  MED_SHIPPED: 'Shipped',
  ACTIVE_FIRST_DOSE: '1st Dose',
  ACTIVE_WEEK_1: 'Wk 1',
  ACTIVE_WEEK_2_3: 'Wk 2-3',
  ACTIVE_MONTH_1: 'Mo 1+',
  REFILL_DUE: 'Refill',
  AT_RISK: 'At Risk',
  WIN_BACK: 'Win Back',
};

export default function OpsCommandCenter() {
  const [morningData, setMorningData] = useState<MorningData | null>(null);
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [activeCommand, setActiveCommand] = useState<string | null>(null);
  const [commandResult, setCommandResult] = useState<Record<string, unknown> | null>(null);

  const runCommand = useCallback(async (command: typeof COMMANDS[number]) => {
    setLoading(command.id);
    setActiveCommand(command.id);
    try {
      const res = await fetch(command.path, {
        method: command.method,
        headers: { 'Content-Type': 'application/json' },
        ...(command.method === 'POST' ? { body: JSON.stringify({}) } : {}),
      });
      const data = await res.json();
      setCommandResult(data);

      if (command.id === 'morning' && data.success) {
        setMorningData(data.data);
      }
      if (command.id === 'pipeline' && data.success) {
        setPipelineData(data.data);
      }
    } catch (err) {
      setCommandResult({ error: 'Failed to execute command' });
    } finally {
      setLoading(null);
    }
  }, []);

  const loadMorning = useCallback(async () => {
    try {
      const res = await fetch('/api/ops/morning');
      const data = await res.json();
      if (data.success) setMorningData(data.data);
    } catch { /* handled by UI state */ }
  }, []);

  const loadPipeline = useCallback(async () => {
    try {
      const res = await fetch('/api/ops/pipeline');
      const data = await res.json();
      if (data.success) setPipelineData(data.data);
    } catch { /* handled by UI state */ }
  }, []);

  // Auto-load morning + pipeline on mount
  useState(() => {
    loadMorning();
    loadPipeline();
  });

  return (
    <div className="space-y-6 sm:space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-heading text-white">
          Operations Command Center
        </h1>
        <p className="text-xs sm:text-sm font-body text-gray-400 mt-1">
          Medical operations hub. Run commands to manage the GLP-1 pipeline.
        </p>
      </div>

      {/* Morning Greeting */}
      {morningData && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#0F1D2C] to-[#1a2d42] border border-[#C9A96E]/20 rounded-xl p-6"
        >
          <h2 className="text-lg font-heading text-[#C9A96E]">
            {morningData.greeting}
          </h2>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                ${morningData.revenuePulse.mtdRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">MTD Revenue</p>
              <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${morningData.revenuePulse.onTrack ? 'bg-green-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(morningData.revenuePulse.percentToTarget, 100)}%` }}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {morningData.fires.count}
              </p>
              <p className="text-xs text-gray-400">Fires</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {morningData.refills.dueThisWeek}
              </p>
              <p className="text-xs text-gray-400">Refills This Week</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {morningData.estimatedTaskTime.formatted}
              </p>
              <p className="text-xs text-gray-400">Est. Task Time</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Command Grid */}
      <div>
        <h3 className="text-sm font-body font-medium text-gray-400 uppercase tracking-wider mb-3">
          Commands
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {COMMANDS.map((cmd) => {
            const Icon = cmd.icon;
            const isLoading = loading === cmd.id;
            const isActive = activeCommand === cmd.id;

            return (
              <motion.button
                key={cmd.id}
                onClick={() => {
                  if (cmd.hasPage) {
                    window.location.href = `/dashboard/ops/${cmd.id}`;
                  } else {
                    runCommand(cmd);
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative p-4 rounded-xl border transition-all text-left
                  ${isActive
                    ? 'border-[#C9A96E]/50 bg-[#0F1D2C]'
                    : 'border-gray-700/50 bg-[#0F1D2C]/60 hover:border-gray-600'
                  }
                `}
              >
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cmd.color} flex items-center justify-center mb-2`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-mono font-bold text-white">{cmd.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{cmd.description}</p>
                {isLoading && (
                  <div className="absolute top-2 right-2">
                    <div className="w-4 h-4 border-2 border-[#C9A96E] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Pipeline Funnel Visualization */}
      {pipelineData && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-body font-medium text-gray-400 uppercase tracking-wider">
              Pipeline Funnel
            </h3>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{pipelineData.snapshot.totalPatients} patients</span>
              <span className="text-[#C9A96E]">${pipelineData.snapshot.mrr.toLocaleString()}/mo MRR</span>
            </div>
          </div>
          <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-4 overflow-x-auto">
            <div className="flex items-end gap-1 min-w-[600px]">
              {pipelineData.snapshot.stages.map((stage) => {
                const maxCount = Math.max(...pipelineData.snapshot.stages.map((s) => s.count), 1);
                const height = Math.max((stage.count / maxCount) * 120, 20);
                const color = STAGE_COLORS[stage.stage] || 'bg-gray-500';
                const shortLabel = STAGE_SHORT_LABELS[stage.stage] || stage.label;

                return (
                  <div key={stage.stage} className="flex-1 flex flex-col items-center">
                    <span className="text-xs font-bold text-white mb-1">{stage.count}</span>
                    <div
                      className={`w-full rounded-t-md ${color} ${stage.overdueCount > 0 ? 'ring-2 ring-red-500/50' : ''}`}
                      style={{ height: `${height}px` }}
                    />
                    <span className="text-[10px] text-gray-500 mt-1 text-center leading-tight">
                      {shortLabel}
                    </span>
                    {stage.overdueCount > 0 && (
                      <span className="text-[10px] text-red-400 font-medium">
                        {stage.overdueCount} late
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Two-Column: Fires + Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fires Section */}
        <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-heading font-medium text-white">
              Fires (Do Right Now)
            </h3>
            {morningData && morningData.fires.count > 0 && (
              <span className="ml-auto bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full font-medium">
                {morningData.fires.count}
              </span>
            )}
          </div>
          {morningData && morningData.fires.items.length > 0 ? (
            <div className="space-y-3">
              {morningData.fires.items.slice(0, 5).map((fire, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    fire.urgency === 'critical' ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'
                  }`}
                >
                  <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    fire.urgency === 'critical' ? 'text-red-400' : 'text-amber-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{fire.issue}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-xs text-gray-500">{fire.minutes} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No fires right now. Nice work.</p>
            </div>
          )}
        </div>

        {/* Revenue Pulse */}
        <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#C9A96E]" />
            <h3 className="text-sm font-heading font-medium text-white">
              Revenue Pulse
            </h3>
          </div>
          {morningData ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-2xl font-bold text-white">
                    ${morningData.revenuePulse.mtdRevenue.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-400">
                    / ${morningData.revenuePulse.monthlyTarget.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(morningData.revenuePulse.percentToTarget, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      morningData.revenuePulse.onTrack ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {morningData.revenuePulse.percentToTarget}% of monthly target
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-lg font-bold text-rani-gold-accessible">
                    ${morningData.pipeline.mrr.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">GLP-1 MRR</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-lg font-bold text-white">
                    ${morningData.refills.expectedRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Refills This Week</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-lg font-bold text-red-400">
                    {morningData.atRisk.count}
                  </p>
                  <p className="text-xs text-gray-500">At Risk</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-lg font-bold text-red-300">
                    ${morningData.atRisk.revenueAtStake.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Revenue at Stake</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Loading revenue data...</p>
            </div>
          )}
        </div>
      </div>

      {/* Top 3 Priorities */}
      {morningData && morningData.topPriorities.length > 0 && (
        <div>
          <h3 className="text-sm font-body font-medium text-gray-400 uppercase tracking-wider mb-3">
            Today&apos;s Top Priorities
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {morningData.topPriorities.map((priority) => {
              const typeColors: Record<string, string> = {
                fire: 'border-red-500/30 bg-red-500/5',
                money: 'border-green-500/30 bg-green-500/5',
                growth: 'border-blue-500/30 bg-blue-500/5',
                care: 'border-purple-500/30 bg-purple-500/5',
              };
              const typeIcons: Record<string, typeof Flame> = {
                fire: Flame,
                money: DollarSign,
                growth: TrendingUp,
                care: Heart,
              };
              const Icon = typeIcons[priority.type] || Zap;
              const colorClass = typeColors[priority.type] || 'border-gray-600/30 bg-gray-600/5';

              return (
                <motion.div
                  key={priority.rank}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: priority.rank * 0.1 }}
                  className={`border rounded-xl p-4 ${colorClass}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                      {priority.rank}
                    </span>
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-white">{priority.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{priority.description}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="w-3 h-3 text-gray-600" />
                    <span className="text-xs text-gray-600">{priority.estimatedMinutes} min</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-body font-medium text-gray-400 uppercase tracking-wider mb-3">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-2">
          <a
            href="/dashboard/ops/intake"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-lg text-sm text-[#C9A96E] hover:bg-[#C9A96E]/20 transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            New Intake
          </a>
          <a
            href="/dashboard/ops/pipeline"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-400 hover:bg-blue-500/20 transition"
          >
            <Users className="w-3.5 h-3.5" />
            View Pipeline
          </a>
          <button
            onClick={() => runCommand(COMMANDS.find((c) => c.id === 'refills')!)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/30 rounded-lg text-sm text-violet-400 hover:bg-violet-500/20 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check Refills
          </button>
          <button
            onClick={() => runCommand(COMMANDS.find((c) => c.id === 'money')!)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 hover:bg-green-500/20 transition"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Revenue Scan
          </button>
          <a
            href="/dashboard/medical"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 rounded-lg text-sm text-teal-400 hover:bg-teal-500/20 transition"
          >
            <Activity className="w-3.5 h-3.5" />
            Medical Dashboard
          </a>
        </div>
      </div>

      {/* Command Output Panel */}
      <AnimatePresence>
        {commandResult && activeCommand && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-[#C9A96E]">
                  /{activeCommand}
                </span>
                <span className="text-xs text-gray-500">output</span>
              </div>
              <button
                onClick={() => { setCommandResult(null); setActiveCommand(null); }}
                className="text-xs text-gray-500 hover:text-white transition"
              >
                Close
              </button>
            </div>
            <div className="p-4 max-h-[500px] overflow-y-auto">
              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                {JSON.stringify(commandResult, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
