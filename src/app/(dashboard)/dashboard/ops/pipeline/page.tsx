'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Clock, DollarSign, AlertTriangle,
  ChevronRight, ArrowLeft, RefreshCw, TrendingUp,
  Activity, Zap, User, ChevronDown, ExternalLink,
} from 'lucide-react';

/**
 * Medical Pipeline Dashboard
 *
 * Kanban-style board with stages, patient cards with SLA indicators,
 * revenue per stage, pipeline velocity metrics, and overdue alert badges.
 */

interface PatientCard {
  name: string;
  daysInStage: number;
  slaMax: number;
  status: 'green' | 'yellow' | 'red';
  medication: string;
  monthlyValue: number;
}

interface StageData {
  stage: string;
  label: string;
  count: number;
  overdueCount: number;
  monthlyRevenue: number;
  patients: PatientCard[];
}

interface PipelineData {
  snapshot: {
    stages: StageData[];
    totalPatients: number;
    activePatients: number;
    pipelinePatients: number;
    atRiskPatients: number;
    mrr: number;
    estimatedAnnualRevenue: number;
  };
  fires: { count: number; items: { patient: string; issue: string; urgency: string; minutes: number }[] };
  moneyMoves: { count: number; totalRevenueOpportunity: number; items: { patient: string; action: string; revenueImpact: number }[] };
  checkIns: { count: number; items: { patient: string; action: string }[] };
  summary: { totalActions: number; estimatedCompletionTime: string; totalRevenueOpportunity: number; totalMinutes: number };
}

// Stage groupings for the kanban
const STAGE_GROUPS = [
  {
    id: 'pipeline',
    label: 'Pipeline',
    color: 'blue',
    stages: ['PIPELINE_NEW', 'LABS_NEEDED', 'GFE_PENDING', 'RX_APPROVED', 'MED_SHIPPED'],
  },
  {
    id: 'active',
    label: 'Active',
    color: 'green',
    stages: ['ACTIVE_FIRST_DOSE', 'ACTIVE_WEEK_1', 'ACTIVE_WEEK_2_3', 'ACTIVE_MONTH_1'],
  },
  {
    id: 'retention',
    label: 'Retention',
    color: 'amber',
    stages: ['REFILL_DUE'],
  },
  {
    id: 'risk',
    label: 'At Risk',
    color: 'red',
    stages: ['AT_RISK', 'WIN_BACK'],
  },
];

const STAGE_COLORS: Record<string, string> = {
  PIPELINE_NEW: 'border-blue-500/40',
  LABS_NEEDED: 'border-indigo-500/40',
  GFE_PENDING: 'border-violet-500/40',
  RX_APPROVED: 'border-green-500/40',
  MED_SHIPPED: 'border-teal-500/40',
  ACTIVE_FIRST_DOSE: 'border-emerald-500/40',
  ACTIVE_WEEK_1: 'border-emerald-400/40',
  ACTIVE_WEEK_2_3: 'border-emerald-300/40',
  ACTIVE_MONTH_1: 'border-green-400/40',
  REFILL_DUE: 'border-amber-500/40',
  AT_RISK: 'border-red-500/40',
  WIN_BACK: 'border-red-400/40',
};

const STATUS_COLORS: Record<string, string> = {
  green: 'bg-green-500',
  yellow: 'bg-amber-500',
  red: 'bg-red-500',
};

export default function PipelineDashboard() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const loadPipeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ops/pipeline');
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || 'Failed to load pipeline');
    } catch {
      setError('Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPipeline();
  }, [loadPipeline]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <a href="/dashboard/ops" className="p-2 rounded-lg bg-gray-800/50">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </a>
          <div>
            <h1 className="text-xl font-heading text-white">Medical Pipeline</h1>
            <p className="text-xs text-gray-400">Loading pipeline data...</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-4 h-64 animate-pulse">
              <div className="h-4 bg-gray-800 rounded w-24 mb-4" />
              <div className="space-y-3">
                <div className="h-16 bg-gray-800/50 rounded" />
                <div className="h-16 bg-gray-800/50 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <a href="/dashboard/ops" className="p-2 rounded-lg bg-gray-800/50">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </a>
          <h1 className="text-xl font-heading text-white">Medical Pipeline</h1>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-400">{error || 'No data available'}</p>
          <button onClick={loadPipeline} className="mt-3 text-xs text-[#C9A96E] hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  const { snapshot, fires, moneyMoves, checkIns, summary } = data;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/dashboard/ops" className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition">
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </a>
          <div>
            <h1 className="text-xl sm:text-2xl font-heading text-white">Medical Pipeline</h1>
            <p className="text-xs text-gray-400">GLP-1 patient pipeline with SLA tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded text-xs transition ${viewMode === 'kanban' ? 'bg-[#C9A96E] text-[#0F1D2C]' : 'text-gray-400'}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-xs transition ${viewMode === 'list' ? 'bg-[#C9A96E] text-[#0F1D2C]' : 'text-gray-400'}`}
            >
              List
            </button>
          </div>
          <button onClick={loadPipeline} className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 transition">
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-white">{snapshot.totalPatients}</p>
          <p className="text-[10px] text-gray-500">Total Patients</p>
        </div>
        <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-green-400">{snapshot.activePatients}</p>
          <p className="text-[10px] text-gray-500">Active</p>
        </div>
        <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-blue-400">{snapshot.pipelinePatients}</p>
          <p className="text-[10px] text-gray-500">In Pipeline</p>
        </div>
        <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-red-400">{snapshot.atRiskPatients}</p>
          <p className="text-[10px] text-gray-500">At Risk</p>
        </div>
        <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-[#C9A96E]">${snapshot.mrr.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500">MRR</p>
        </div>
        <div className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-white">{summary.estimatedCompletionTime}</p>
          <p className="text-[10px] text-gray-500">Task Time</p>
        </div>
      </div>

      {/* Velocity Metrics Bar */}
      <div className="flex items-center gap-4 bg-[#0F1D2C]/60 border border-gray-700/30 rounded-lg px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <Zap className="w-3.5 h-3.5 text-red-400" />
          <span className="text-gray-400">{fires.count} fires</span>
        </div>
        <div className="w-px h-4 bg-gray-700" />
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <DollarSign className="w-3.5 h-3.5 text-green-400" />
          <span className="text-gray-400">${moneyMoves.totalRevenueOpportunity.toLocaleString()} opportunity</span>
        </div>
        <div className="w-px h-4 bg-gray-700" />
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-gray-400">{summary.totalActions} actions</span>
        </div>
        <div className="w-px h-4 bg-gray-700" />
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <TrendingUp className="w-3.5 h-3.5 text-[#C9A96E]" />
          <span className="text-gray-400">${snapshot.estimatedAnnualRevenue.toLocaleString()}/yr projected</span>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' ? (
        <div className="overflow-x-auto">
          <div className="flex gap-3 min-w-[900px] pb-4">
            {snapshot.stages.map((stage) => {
              const borderColor = STAGE_COLORS[stage.stage] || 'border-gray-600/40';
              const isExpanded = expandedStage === stage.stage;

              return (
                <div
                  key={stage.stage}
                  className={`flex-1 min-w-[200px] bg-[#0F1D2C] border ${borderColor} rounded-xl overflow-hidden`}
                >
                  {/* Stage Header */}
                  <div className="px-3 py-2 border-b border-gray-800/50">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium text-white">{stage.label}</h4>
                      <div className="flex items-center gap-1">
                        <span className="bg-gray-800 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {stage.count}
                        </span>
                        {stage.overdueCount > 0 && (
                          <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {stage.overdueCount} late
                          </span>
                        )}
                      </div>
                    </div>
                    {stage.monthlyRevenue > 0 && (
                      <p className="text-[10px] text-[#C9A96E] mt-0.5">${stage.monthlyRevenue.toLocaleString()}/mo</p>
                    )}
                  </div>

                  {/* Patient Cards */}
                  <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto">
                    {stage.patients.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-[10px] text-gray-600">No patients</p>
                      </div>
                    ) : (
                      stage.patients.map((patient, idx) => (
                        <motion.div
                          key={`${stage.stage}-${idx}`}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-gray-800/30 border border-gray-700/30 rounded-lg p-2.5 hover:border-gray-600/50 transition cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[patient.status]}`} />
                              <span className="text-xs text-white font-medium truncate max-w-[120px]">
                                {patient.name}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-600" />
                              <span className={`text-[10px] ${
                                patient.status === 'red' ? 'text-red-400' : patient.status === 'yellow' ? 'text-amber-400' : 'text-gray-500'
                              }`}>
                                {patient.daysInStage}d / {patient.slaMax}d
                              </span>
                            </div>
                            {patient.monthlyValue > 0 && (
                              <span className="text-[10px] text-[#C9A96E]">${patient.monthlyValue}/mo</span>
                            )}
                          </div>
                          {patient.medication && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-gray-700/50 rounded text-[10px] text-gray-400">
                              {patient.medication}
                            </span>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {snapshot.stages.map((stage) => {
            if (stage.count === 0) return null;
            const isExpanded = expandedStage === stage.stage;

            return (
              <div key={stage.stage} className="bg-[#0F1D2C] border border-gray-700/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedStage(isExpanded ? null : stage.stage)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-800/20 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">{stage.label}</span>
                    <span className="bg-gray-800 text-white text-xs px-2 py-0.5 rounded-full">{stage.count}</span>
                    {stage.overdueCount > 0 && (
                      <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded-full">
                        {stage.overdueCount} overdue
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {stage.monthlyRevenue > 0 && (
                      <span className="text-xs text-[#C9A96E]">${stage.monthlyRevenue.toLocaleString()}/mo</span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-800"
                    >
                      <div className="divide-y divide-gray-800/50">
                        {stage.patients.map((patient, idx) => (
                          <div key={idx} className="px-4 py-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[patient.status]}`} />
                              <div>
                                <p className="text-sm text-white">{patient.name}</p>
                                <p className="text-[10px] text-gray-500">
                                  {patient.medication || 'No medication'} | {patient.daysInStage}d in stage (SLA: {patient.slaMax}d)
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {patient.monthlyValue > 0 && (
                                <span className="text-xs text-[#C9A96E]">${patient.monthlyValue}/mo</span>
                              )}
                              {patient.status === 'red' && (
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom: Fires + Money Moves + Check-ins */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Fires */}
        <div className="bg-[#0F1D2C] border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-red-400" />
            <h3 className="text-xs font-medium text-white uppercase tracking-wider">Fires</h3>
            <span className="ml-auto text-[10px] text-red-400 font-medium">{fires.count}</span>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {fires.items.slice(0, 5).map((fire, i) => (
              <div key={i} className="p-2 bg-red-500/5 rounded-lg">
                <p className="text-xs text-white">{fire.issue}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{fire.minutes} min</p>
              </div>
            ))}
            {fires.count === 0 && <p className="text-xs text-gray-600 text-center py-4">All clear</p>}
          </div>
        </div>

        {/* Money Moves */}
        <div className="bg-[#0F1D2C] border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-green-400" />
            <h3 className="text-xs font-medium text-white uppercase tracking-wider">Money Moves</h3>
            <span className="ml-auto text-[10px] text-green-400 font-medium">
              ${moneyMoves.totalRevenueOpportunity.toLocaleString()}
            </span>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {moneyMoves.items.slice(0, 5).map((move, i) => (
              <div key={i} className="p-2 bg-green-500/5 rounded-lg flex items-center justify-between">
                <p className="text-xs text-white flex-1">{move.action}</p>
                <span className="text-[10px] text-[#C9A96E] ml-2">${move.revenueImpact.toLocaleString()}</span>
              </div>
            ))}
            {moneyMoves.count === 0 && <p className="text-xs text-gray-600 text-center py-4">No opportunities right now</p>}
          </div>
        </div>

        {/* Check-ins */}
        <div className="bg-[#0F1D2C] border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-medium text-white uppercase tracking-wider">Check-ins</h3>
            <span className="ml-auto text-[10px] text-blue-400 font-medium">{checkIns.count}</span>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {checkIns.items.slice(0, 5).map((item, i) => (
              <div key={i} className="p-2 bg-blue-500/5 rounded-lg">
                <p className="text-xs text-white">{item.action}</p>
              </div>
            ))}
            {checkIns.count === 0 && <p className="text-xs text-gray-600 text-center py-4">No check-ins due</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
